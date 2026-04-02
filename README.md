# Zorah - Vault

A portable, cross-platform password manager built with Tauri, React, and Rust.

## Features

- AES-256-GCM encrypted vault
- Argon2id master password key derivation
- Custom fields per credential (text, links)
- Global hotkey to show/hide (`Alt+Shift+P`)
- Portable — vault stored alongside the executable

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build -- --no-bundle
```

Output: `src-tauri/target/release/zorah.exe`
