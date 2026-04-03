use tauri::{AppHandle, Manager};
use rfd;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::vault::{load_vault, write_vault, Vault};
use crate::{parse_shortcut, toggle_window, CurrentShortcut};

#[tauri::command]
pub async fn pick_and_import_vault(app: AppHandle) -> Result<bool, String> {
    let handle = rfd::AsyncFileDialog::new()
        .add_filter("Zorah Vault", &["vault"])
        .set_title("Select a Zorah vault file")
        .pick_file()
        .await;

    let file = match handle {
        None => return Ok(false),
        Some(f) => f,
    };

    let data = file.read().await;
    // Validate it's a real vault before overwriting
    crate::crypto::EncryptedVault::from_bytes(&data)?;
    std::fs::write(crate::vault::vault_path(&app), data).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn vault_exists(app: AppHandle) -> bool {
    crate::vault::vault_path(&app).exists()
}

#[tauri::command]
pub fn get_vault_dir(app: AppHandle) -> String {
    crate::vault::vault_path(&app)
        .parent()
        .unwrap_or_else(|| std::path::Path::new(""))
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn unlock_vault(app: AppHandle, master_password: String) -> Result<Vault, String> {
    load_vault(&app, &master_password)
}

#[tauri::command]
pub fn save_vault(app: AppHandle, vault: Vault, master_password: String) -> Result<(), String> {
    write_vault(&app, &vault, &master_password)
}

#[tauri::command]
pub fn set_toggle_shortcut(app: AppHandle, shortcut_str: String) -> Result<(), String> {
    let new_shortcut = parse_shortcut(&shortcut_str)?;

    let state = app.state::<CurrentShortcut>();
    let mut current = state.0.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    // Unregister the old shortcut
    if let Ok(old) = parse_shortcut(&current) {
        let _ = app.global_shortcut().unregister(old);
    }

    // Register the new shortcut with the toggle handler
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(new_shortcut, move |_app, _shortcut, event| {
            if event.state() != ShortcutState::Pressed {
                return;
            }
            toggle_window(&app_handle);
        })
        .map_err(|e| e.to_string())?;

    // Update in-memory state (vault save is handled by the frontend)
    *current = shortcut_str;

    Ok(())
}
