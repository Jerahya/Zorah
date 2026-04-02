use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::RngCore;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{Read, Write},
    net::TcpListener,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;


pub const CLIENT_ID: &str = env!("GOOGLE_CLIENT_ID");
pub const CLIENT_SECRET: &str = env!("GOOGLE_CLIENT_SECRET");

const SCOPES: &str = "https://www.googleapis.com/auth/drive.appdata email profile";

// ── Types ─────────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct StoredTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: u64, // Unix seconds
    pub email: String,
}

pub struct GoogleAuthState(pub Mutex<Option<StoredTokens>>);

// ── Token persistence ─────────────────────────────────────────────────────────

fn token_path() -> PathBuf {
    std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .join("zorah.gauth")
}

pub fn load_tokens() -> Option<StoredTokens> {
    fs::read_to_string(token_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn save_tokens(tokens: &StoredTokens) -> Result<(), String> {
    fs::write(
        token_path(),
        serde_json::to_string(tokens).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())
}

pub fn delete_tokens() {
    let _ = fs::remove_file(token_path());
}

// ── OAuth callback server ─────────────────────────────────────────────────────

/// Blocking — accepts one request, writes a success page, returns (code, state).
fn wait_for_callback(listener: TcpListener) -> Result<(String, String), String> {
    let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;

    let mut buf = [0u8; 4096];
    let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);

    let html = concat!(
        "<!DOCTYPE html><html><head><title>Zorah</title></head>",
        "<body style=\"font-family:system-ui,sans-serif;display:flex;align-items:center;",
        "justify-content:center;height:100vh;margin:0;background:#0f1117;color:#e8eaf0\">",
        "<div style=\"text-align:center\">",
        "<h2 style=\"color:#6c63ff\">&#10003; Signed in successfully</h2>",
        "<p>You can close this tab and return to Zorah.</p>",
        "</div></body></html>"
    );
    let _ = stream.write_all(
        format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            html.len(),
            html
        )
        .as_bytes(),
    );

    // Parse code + state from "GET /?code=...&state=... HTTP/1.1"
    let path = request
        .lines()
        .next()
        .unwrap_or("")
        .split_whitespace()
        .nth(1)
        .unwrap_or("");

    let url = reqwest::Url::parse(&format!("http://localhost{}", path))
        .map_err(|e| e.to_string())?;

    let mut code = String::new();
    let mut state = String::new();
    let mut error = String::new();

    for (k, v) in url.query_pairs() {
        match k.as_ref() {
            "code"  => code  = v.into_owned(),
            "state" => state = v.into_owned(),
            "error" => error = v.into_owned(),
            _       => {}
        }
    }

    if !error.is_empty() {
        return Err(format!("Authorization denied: {}", error));
    }
    if code.is_empty() {
        return Err("No authorization code received from Google.".to_string());
    }

    Ok((code, state))
}

// ── Google API helpers ────────────────────────────────────────────────────────

async fn exchange_code(
    client: &Client,
    code: &str,
    verifier: &str,
    redirect_uri: &str,
) -> Result<(String, String, u64), String> {
    let res: serde_json::Value = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id",     CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("code",          code),
            ("code_verifier", verifier),
            ("grant_type",    "authorization_code"),
            ("redirect_uri",  redirect_uri),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(err) = res["error"].as_str() {
        return Err(format!(
            "Token exchange failed: {} — {}",
            err,
            res["error_description"].as_str().unwrap_or("")
        ));
    }

    let access_token = res["access_token"]
        .as_str()
        .ok_or("Missing access_token")?
        .to_string();
    let refresh_token = res["refresh_token"]
        .as_str()
        .ok_or("Missing refresh_token — make sure access_type=offline and prompt=consent")?
        .to_string();
    let expires_in = res["expires_in"].as_u64().unwrap_or(3600);
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + expires_in;

    Ok((access_token, refresh_token, expires_at))
}

async fn fetch_email(client: &Client, access_token: &str) -> Result<String, String> {
    let res: serde_json::Value = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    res["email"]
        .as_str()
        .ok_or_else(|| "Could not retrieve Google account email.".to_string())
        .map(|s| s.to_string())
}

// ── Tauri commands ────────────────────────────────────────────────────────────

/// Starts the full OAuth 2.0 PKCE flow. Opens the browser, waits for the
/// redirect, exchanges the code, and stores the tokens. Returns the email.
#[tauri::command]
pub async fn google_auth_start(app: AppHandle) -> Result<String, String> {
    // PKCE: code verifier + SHA-256 challenge
    let mut vbytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut vbytes);
    let code_verifier = URL_SAFE_NO_PAD.encode(vbytes);
    let code_challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(code_verifier.as_bytes()));

    // CSRF state
    let mut sbytes = [0u8; 16];
    rand::rngs::OsRng.fill_bytes(&mut sbytes);
    let csrf_state = URL_SAFE_NO_PAD.encode(sbytes);

    // Bind to a random local port for the redirect
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://localhost:{}", port);

    // Build the Google authorization URL
    let mut auth_url =
        reqwest::Url::parse("https://accounts.google.com/o/oauth2/v2/auth").unwrap();
    auth_url
        .query_pairs_mut()
        .append_pair("client_id",            CLIENT_ID)
        .append_pair("redirect_uri",          &redirect_uri)
        .append_pair("response_type",         "code")
        .append_pair("scope",                 SCOPES)
        .append_pair("code_challenge",        &code_challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("state",                 &csrf_state)
        .append_pair("access_type",           "offline")
        .append_pair("prompt",                "consent");

    app.opener()
        .open_url(auth_url.as_str(), None::<&str>)
        .map_err(|e| e.to_string())?;

    // Wait up to 2 minutes for the browser redirect
    let expected = csrf_state.clone();
    let (code, received_state) = tokio::time::timeout(
        Duration::from_secs(120),
        tokio::task::spawn_blocking(move || wait_for_callback(listener)),
    )
    .await
    .map_err(|_| "Sign-in timed out. Please try again.".to_string())?
    .map_err(|e| format!("Internal error: {}", e))?
    ?;

    if received_state != expected {
        return Err("Security check failed (state mismatch). Please try again.".to_string());
    }

    let client = Client::new();
    let (access_token, refresh_token, expires_at) =
        exchange_code(&client, &code, &code_verifier, &redirect_uri).await?;
    let email = fetch_email(&client, &access_token).await?;

    let tokens = StoredTokens {
        access_token,
        refresh_token,
        expires_at,
        email: email.clone(),
    };

    save_tokens(&tokens)?;
    *app.state::<GoogleAuthState>()
        .0
        .lock()
        .map_err(|e| e.to_string())? = Some(tokens);

    Ok(email)
}

/// Returns the connected Google account email, or None if not connected.
#[tauri::command]
pub fn google_auth_status(app: AppHandle) -> Option<String> {
    app.state::<GoogleAuthState>()
        .0
        .lock()
        .ok()?
        .as_ref()
        .map(|t| t.email.clone())
}

/// Removes stored tokens and signs out.
#[tauri::command]
pub fn google_logout(app: AppHandle) -> Result<(), String> {
    delete_tokens();
    *app.state::<GoogleAuthState>()
        .0
        .lock()
        .map_err(|e| e.to_string())? = None;
    Ok(())
}

// ── Drive sync ────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct SyncResult {
    pub action: String,  // "uploaded" | "downloaded" | "in_sync"
    pub message: String,
}

/// Refresh the access token if it expires within 60 seconds.
async fn refresh_if_needed(client: &Client, tokens: &mut StoredTokens) -> Result<(), String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    if now + 60 < tokens.expires_at {
        return Ok(());
    }
    let res: serde_json::Value = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id",     CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("refresh_token", tokens.refresh_token.as_str()),
            ("grant_type",    "refresh_token"),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    if let Some(err) = res["error"].as_str() {
        return Err(format!("Token refresh failed: {}", err));
    }
    tokens.access_token = res["access_token"]
        .as_str().ok_or("Missing access_token")?.to_string();
    let expires_in = res["expires_in"].as_u64().unwrap_or(3600);
    tokens.expires_at = now + expires_in;
    save_tokens(tokens)?;
    Ok(())
}

/// Find the vault file in Drive appDataFolder. Returns (file_id, stored_revision).
async fn drive_find(
    client: &Client,
    token: &str,
    filename: &str,
) -> Result<Option<(String, u64)>, String> {
    let res: serde_json::Value = client
        .get("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(token)
        .query(&[
            ("spaces", "appDataFolder"),
            ("q",      &format!("name='{}'", filename)),
            ("fields", "files(id,properties)"),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    if let Some(err) = res["error"]["message"].as_str() {
        return Err(format!("Drive list failed: {}", err));
    }

    let files = res["files"].as_array().ok_or("Invalid Drive response")?;
    if files.is_empty() {
        return Ok(None);
    }
    let file = &files[0];
    let file_id  = file["id"].as_str().ok_or("Missing file id")?.to_string();
    let revision = file["properties"]["revision"]
        .as_str()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);
    Ok(Some((file_id, revision)))
}

fn build_multipart(metadata_json: &str, data: &[u8]) -> Vec<u8> {
    const B: &str = "ZorahBoundary";
    let mut body = Vec::new();
    body.extend_from_slice(format!("--{B}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n").as_bytes());
    body.extend_from_slice(metadata_json.as_bytes());
    body.extend_from_slice(format!("\r\n--{B}\r\nContent-Type: application/octet-stream\r\n\r\n").as_bytes());
    body.extend_from_slice(data);
    body.extend_from_slice(format!("\r\n--{B}--\r\n").as_bytes());
    body
}

/// Create a new file in appDataFolder. Returns the new file_id.
async fn drive_create(
    client: &Client,
    token: &str,
    filename: &str,
    data: &[u8],
    revision: u64,
) -> Result<String, String> {
    let meta = format!(
        r#"{{"name":"{filename}","parents":["appDataFolder"],"properties":{{"revision":"{revision}"}}}}"#
    );
    let body = build_multipart(&meta, data);
    let res: serde_json::Value = client
        .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id")
        .bearer_auth(token)
        .header("Content-Type", "multipart/related; boundary=ZorahBoundary")
        .body(body)
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    if let Some(err) = res["error"]["message"].as_str() {
        return Err(format!("Drive create failed: {}", err));
    }
    Ok(res["id"].as_str().ok_or("Missing file id in response")?.to_string())
}

/// Update an existing Drive file's content and revision property.
async fn drive_update(
    client: &Client,
    token: &str,
    file_id: &str,
    data: &[u8],
    revision: u64,
) -> Result<(), String> {
    let meta = format!(r#"{{"properties":{{"revision":"{revision}"}}}}"#);
    let body = build_multipart(&meta, data);
    let res: serde_json::Value = client
        .patch(&format!(
            "https://www.googleapis.com/upload/drive/v3/files/{file_id}?uploadType=multipart"
        ))
        .bearer_auth(token)
        .header("Content-Type", "multipart/related; boundary=ZorahBoundary")
        .body(body)
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    if let Some(err) = res["error"]["message"].as_str() {
        return Err(format!("Drive update failed: {}", err));
    }
    Ok(())
}

/// Download file bytes from Drive.
async fn drive_download(client: &Client, token: &str, file_id: &str) -> Result<Vec<u8>, String> {
    let bytes = client
        .get(&format!(
            "https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
        ))
        .bearer_auth(token)
        .send().await.map_err(|e| e.to_string())?
        .bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

/// Syncs the local vault with Google Drive using the revision counter.
/// - Drive revision higher  → download (Drive wins)
/// - Local revision higher  → upload   (local wins)
/// - Equal                  → no-op
#[tauri::command]
pub async fn google_drive_sync(app: AppHandle, vault_id: String) -> Result<SyncResult, String> {
    // Get + refresh tokens
    let mut tokens = app
        .state::<GoogleAuthState>()
        .0.lock().map_err(|e| e.to_string())?
        .clone()
        .ok_or("Not signed in to Google.")?;

    let client = Client::new();
    refresh_if_needed(&client, &mut tokens).await?;
    *app.state::<GoogleAuthState>().0.lock().map_err(|e| e.to_string())? = Some(tokens.clone());

    let token    = &tokens.access_token;
    let filename = format!("zorah-{vault_id}.vault");

    // Read local vault — revision is in the unencrypted header, no password needed
    let local_path  = crate::vault::vault_path(&app);
    let local_bytes = fs::read(&local_path)
        .map_err(|e| format!("Cannot read local vault: {e}"))?;
    let local_enc = crate::crypto::EncryptedVault::from_bytes(&local_bytes)?;
    let local_rev = local_enc.revision;

    match drive_find(&client, token, &filename).await? {
        None => {
            // First sync ever — push local vault to Drive
            drive_create(&client, token, &filename, &local_bytes, local_rev).await?;
            Ok(SyncResult {
                action:  "uploaded".to_string(),
                message: format!("Vault uploaded to Google Drive (revision {local_rev})."),
            })
        }
        Some((file_id, drive_rev)) => {
            if drive_rev > local_rev {
                let remote_bytes = drive_download(&client, token, &file_id).await?;
                fs::write(&local_path, &remote_bytes)
                    .map_err(|e| format!("Failed to write local vault: {e}"))?;
                Ok(SyncResult {
                    action:  "downloaded".to_string(),
                    message: format!(
                        "Vault downloaded from Google Drive (r{local_rev} → r{drive_rev}). Re-lock and unlock to apply."
                    ),
                })
            } else if local_rev > drive_rev {
                drive_update(&client, token, &file_id, &local_bytes, local_rev).await?;
                Ok(SyncResult {
                    action:  "uploaded".to_string(),
                    message: format!("Google Drive updated (r{drive_rev} → r{local_rev})."),
                })
            } else {
                Ok(SyncResult {
                    action:  "in_sync".to_string(),
                    message: format!("Already in sync (revision {local_rev})."),
                })
            }
        }
    }
}
