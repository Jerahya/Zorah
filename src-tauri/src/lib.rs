mod commands;
mod crypto;
mod google;
mod vault;

use commands::{get_vault_dir, pick_and_import_vault, save_vault, set_toggle_shortcut, unlock_vault, vault_exists};
use google::{
    google_auth_start, google_auth_status, google_drive_import_vault, google_drive_list_vaults,
    google_drive_sync, google_logout, GoogleAuthState,
};
use std::sync::Mutex;
use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

pub struct CurrentShortcut(pub Mutex<String>);

pub fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(true) {
            let _ = window.hide();
        } else {
            show_window(app);
        }
    }
}

fn str_to_code(s: &str) -> Result<Code, String> {
    let upper = s.to_uppercase();
    // Function keys: F1–F12
    if let Some(num_str) = upper.strip_prefix('F') {
        if let Ok(n) = num_str.parse::<u8>() {
            return match n {
                1 => Ok(Code::F1), 2 => Ok(Code::F2), 3 => Ok(Code::F3),
                4 => Ok(Code::F4), 5 => Ok(Code::F5), 6 => Ok(Code::F6),
                7 => Ok(Code::F7), 8 => Ok(Code::F8), 9 => Ok(Code::F9),
                10 => Ok(Code::F10), 11 => Ok(Code::F11), 12 => Ok(Code::F12),
                _ => Err(format!("Unsupported function key: {}", s)),
            };
        }
    }
    // Single character: letters and digits
    if upper.len() == 1 {
        let c = upper.chars().next().unwrap();
        if c.is_ascii_alphabetic() {
            return match c {
                'A' => Ok(Code::KeyA), 'B' => Ok(Code::KeyB), 'C' => Ok(Code::KeyC),
                'D' => Ok(Code::KeyD), 'E' => Ok(Code::KeyE), 'F' => Ok(Code::KeyF),
                'G' => Ok(Code::KeyG), 'H' => Ok(Code::KeyH), 'I' => Ok(Code::KeyI),
                'J' => Ok(Code::KeyJ), 'K' => Ok(Code::KeyK), 'L' => Ok(Code::KeyL),
                'M' => Ok(Code::KeyM), 'N' => Ok(Code::KeyN), 'O' => Ok(Code::KeyO),
                'P' => Ok(Code::KeyP), 'Q' => Ok(Code::KeyQ), 'R' => Ok(Code::KeyR),
                'S' => Ok(Code::KeyS), 'T' => Ok(Code::KeyT), 'U' => Ok(Code::KeyU),
                'V' => Ok(Code::KeyV), 'W' => Ok(Code::KeyW), 'X' => Ok(Code::KeyX),
                'Y' => Ok(Code::KeyY), 'Z' => Ok(Code::KeyZ),
                _ => Err(format!("Unsupported key: {}", s)),
            };
        }
        if c.is_ascii_digit() {
            return match c {
                '0' => Ok(Code::Digit0), '1' => Ok(Code::Digit1), '2' => Ok(Code::Digit2),
                '3' => Ok(Code::Digit3), '4' => Ok(Code::Digit4), '5' => Ok(Code::Digit5),
                '6' => Ok(Code::Digit6), '7' => Ok(Code::Digit7), '8' => Ok(Code::Digit8),
                '9' => Ok(Code::Digit9),
                _ => unreachable!(),
            };
        }
    }
    // Named special keys
    match upper.as_str() {
        "SPACE"      => Ok(Code::Space),
        "ENTER"      => Ok(Code::Enter),
        "ESCAPE"     => Ok(Code::Escape),
        "TAB"        => Ok(Code::Tab),
        "BACKSPACE"  => Ok(Code::Backspace),
        "DELETE"     => Ok(Code::Delete),
        "INSERT"     => Ok(Code::Insert),
        "HOME"       => Ok(Code::Home),
        "END"        => Ok(Code::End),
        "PAGEUP"     => Ok(Code::PageUp),
        "PAGEDOWN"   => Ok(Code::PageDown),
        "ARROWUP"    => Ok(Code::ArrowUp),
        "ARROWDOWN"  => Ok(Code::ArrowDown),
        "ARROWLEFT"  => Ok(Code::ArrowLeft),
        "ARROWRIGHT" => Ok(Code::ArrowRight),
        _            => Err(format!("Unsupported key: {}", s)),
    }
}

pub fn parse_shortcut(s: &str) -> Result<Shortcut, String> {
    let mut modifiers = Modifiers::empty();
    let mut key_code: Option<Code> = None;
    for part in s.split('+') {
        match part.trim() {
            "Alt" | "alt" => modifiers |= Modifiers::ALT,
            "Shift" | "shift" => modifiers |= Modifiers::SHIFT,
            "Ctrl" | "ctrl" | "Control" | "control" => modifiers |= Modifiers::CONTROL,
            "Meta" | "meta" | "Super" | "super" | "Win" | "win" => modifiers |= Modifiers::META,
            k => key_code = Some(str_to_code(k)?),
        }
    }
    let code = key_code.ok_or_else(|| "No key specified".to_string())?;
    let mods = if modifiers.is_empty() { None } else { Some(modifiers) };
    Ok(Shortcut::new(mods, code))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            vault_exists, get_vault_dir, unlock_vault, save_vault, set_toggle_shortcut, pick_and_import_vault,
            google_auth_start, google_auth_status, google_logout, google_drive_sync,
            google_drive_list_vaults, google_drive_import_vault
        ])
        .setup(|app| {
            let tray_handle = app.handle().clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Zorah")
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        show_window(&tray_handle);
                    }
                })
                .build(app)?;

            let default_str = "Alt+Shift+P".to_string();
            let shortcut = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyP);

            app.manage(CurrentShortcut(Mutex::new(default_str)));
            app.manage(GoogleAuthState(Mutex::new(google::load_tokens(app.handle()))));

            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state() != ShortcutState::Pressed { return; }
                toggle_window(&app_handle);
            })?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(false) = event {
                if window.is_minimized().unwrap_or(false) {
                    let _ = window.hide();
                    let _ = window.unminimize();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
