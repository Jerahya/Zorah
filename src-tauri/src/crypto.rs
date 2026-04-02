use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use argon2::Argon2;
use base64::{engine::general_purpose::STANDARD, Engine};
use rand::RngCore;

const MAGIC: &[u8; 4] = b"ZORH";
const HEADER_LEN: usize = 4 + 4 + 8 + 32 + 12; // magic + version + revision + salt + nonce

pub struct EncryptedVault {
    pub version: u32,
    pub revision: u64,
    pub salt: Vec<u8>,
    pub nonce: Vec<u8>,
    pub ciphertext: Vec<u8>,
}

impl EncryptedVault {
    /// Serialize to compact binary: ZORH | version | revision | salt | nonce | ciphertext
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(HEADER_LEN + self.ciphertext.len());
        buf.extend_from_slice(MAGIC);
        buf.extend_from_slice(&self.version.to_be_bytes());
        buf.extend_from_slice(&self.revision.to_be_bytes());
        buf.extend_from_slice(&self.salt);
        buf.extend_from_slice(&self.nonce);
        buf.extend_from_slice(&self.ciphertext);
        buf
    }

    /// Deserialize from binary. Also accepts the legacy JSON format for migration.
    pub fn from_bytes(data: &[u8]) -> Result<Self, String> {
        // Legacy JSON migration: first byte is '{'
        if data.first() == Some(&b'{') {
            return Self::from_legacy_json(data);
        }
        if data.len() < HEADER_LEN + 1 {
            return Err("Vault file is too short or corrupted.".to_string());
        }
        if &data[..4] != MAGIC {
            return Err("Unrecognized vault file format.".to_string());
        }
        let version  = u32::from_be_bytes(data[4..8].try_into().unwrap());
        let revision = u64::from_be_bytes(data[8..16].try_into().unwrap());
        let salt       = data[16..48].to_vec();
        let nonce      = data[48..60].to_vec();
        let ciphertext = data[60..].to_vec();
        Ok(Self { version, revision, salt, nonce, ciphertext })
    }

    fn from_legacy_json(data: &[u8]) -> Result<Self, String> {
        #[derive(serde::Deserialize)]
        struct JsonVault {
            version: u32,
            #[serde(default)]
            revision: u64,
            salt: String,
            nonce: String,
            ciphertext: String,
        }
        let j: JsonVault = serde_json::from_slice(data).map_err(|e| e.to_string())?;
        Ok(Self {
            version:    j.version,
            revision:   j.revision,
            salt:       STANDARD.decode(&j.salt).map_err(|e| e.to_string())?,
            nonce:      STANDARD.decode(&j.nonce).map_err(|e| e.to_string())?,
            ciphertext: STANDARD.decode(&j.ciphertext).map_err(|e| e.to_string())?,
        })
    }
}

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let argon2 = Argon2::default();
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

pub fn encrypt_vault(plaintext: &[u8], password: &str) -> Result<EncryptedVault, String> {
    let mut salt = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut salt);

    let mut nonce_bytes = [0u8; 12];
    rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);

    let key_bytes = derive_key(password, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;

    Ok(EncryptedVault {
        version: 1,
        revision: 0,
        salt: salt.to_vec(),
        nonce: nonce_bytes.to_vec(),
        ciphertext,
    })
}

pub fn decrypt_vault(encrypted: &EncryptedVault, password: &str) -> Result<Vec<u8>, String> {
    let key_bytes = derive_key(password, &encrypted.salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&encrypted.nonce);

    cipher
        .decrypt(nonce, encrypted.ciphertext.as_ref())
        .map_err(|_| "Decryption failed: wrong password or corrupted vault.".to_string())
}
