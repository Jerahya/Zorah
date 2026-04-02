use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

use serde::{Deserialize, Serialize};

use crate::crypto::{decrypt_vault, encrypt_vault, EncryptedVault};

/// Bump this when the vault file format changes in a breaking way.
pub const VAULT_SCHEMA_VERSION: u32 = 1;

#[derive(Serialize, Deserialize, Clone)]
pub struct CustomField {
    pub key: String,
    pub value: String,
    #[serde(default)]
    pub secret: bool,
    #[serde(default)]
    pub field_type: String,
}

fn default_icon_type() -> String { "default".to_string() }

#[derive(Serialize, Deserialize, Clone)]
pub struct Credential {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub created_at: String,
    #[serde(default)]
    pub updated_at: String,
    #[serde(default)]
    pub custom_fields: Vec<CustomField>,
    #[serde(default = "default_icon_type")]
    pub icon_type: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct VaultMetadata {
    pub last_modified: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct VaultSettings {
    #[serde(default = "default_toggle_shortcut")]
    pub toggle_shortcut: String,
}

fn default_toggle_shortcut() -> String {
    "Alt+Shift+P".to_string()
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self { toggle_shortcut: default_toggle_shortcut() }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Vault {
    pub version: u32,
    pub credentials: Vec<Credential>,
    pub metadata: VaultMetadata,
    #[serde(default)]
    pub settings: VaultSettings,
}

fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Format as a simple ISO-8601 UTC string: YYYY-MM-DDTHH:MM:SSZ
    let s = secs;
    let sec = s % 60;
    let min = (s / 60) % 60;
    let hour = (s / 3600) % 24;
    let days = s / 86400;
    // Days since epoch to date (Gregorian)
    let (year, month, day) = days_to_ymd(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hour, min, sec
    )
}

fn days_to_ymd(mut days: u64) -> (u64, u64, u64) {
    // Gregorian calendar calculation from days since 1970-01-01
    let mut year = 1970u64;
    loop {
        let dy = if is_leap(year) { 366 } else { 365 };
        if days < dy {
            break;
        }
        days -= dy;
        year += 1;
    }
    let months = if is_leap(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut month = 1u64;
    for &dm in &months {
        if days < dm {
            break;
        }
        days -= dm;
        month += 1;
    }
    (year, month, days + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

pub fn vault_path(_app: &tauri::AppHandle) -> PathBuf {
    std::env::current_exe()
        .expect("failed to resolve executable path")
        .parent()
        .expect("failed to resolve executable directory")
        .join("zorah.vault")
}

pub fn load_vault(app: &tauri::AppHandle, password: &str) -> Result<Vault, String> {
    let path = vault_path(app);

    if !path.exists() {
        return Ok(Vault {
            version: VAULT_SCHEMA_VERSION,
            credentials: vec![],
            metadata: VaultMetadata {
                last_modified: now_iso(),
            },
            settings: VaultSettings::default(),
        });
    }

    let data = fs::read(&path).map_err(|e| e.to_string())?;
    let encrypted = EncryptedVault::from_bytes(&data)?;
    let plaintext = decrypt_vault(&encrypted, password)?;
    serde_json::from_slice(&plaintext).map_err(|e| e.to_string())
}

pub fn write_vault(app: &tauri::AppHandle, vault: &Vault, password: &str) -> Result<(), String> {
    let path = vault_path(app);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let prev_revision = fs::read(&path)
        .ok()
        .and_then(|data| EncryptedVault::from_bytes(&data).ok())
        .map(|e| e.revision)
        .unwrap_or(0);

    let plaintext = serde_json::to_vec(vault).map_err(|e| e.to_string())?;
    let mut encrypted = encrypt_vault(&plaintext, password)?;
    encrypted.revision = prev_revision + 1;
    fs::write(&path, encrypted.to_bytes()).map_err(|e| e.to_string())
}
