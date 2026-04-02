use tauri::AppHandle;

use crate::vault::{load_vault, write_vault, Vault};

#[tauri::command]
pub fn unlock_vault(app: AppHandle, master_password: String) -> Result<Vault, String> {
    load_vault(&app, &master_password)
}

#[tauri::command]
pub fn save_vault(app: AppHandle, vault: Vault, master_password: String) -> Result<(), String> {
    write_vault(&app, &vault, &master_password)
}
