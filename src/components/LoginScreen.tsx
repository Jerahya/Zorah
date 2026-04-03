import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ZorahLogo, EyeOpen, EyeOff, ImportIcon, GoogleIcon } from "./icons";
import AppVersion from "./AppVersion";
import ImportFromDriveModal from "./ImportFromDriveModal";

interface Props {
  onUnlock: (password: string) => void;
  loading: boolean;
  error: string | null;
}

export default function LoginScreen({ onUnlock, loading, error }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isNewVault, setIsNewVault] = useState<boolean | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<boolean>("vault_exists")
      .then((exists) => setIsNewVault(!exists))
      .catch(() => setIsNewVault(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowImportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (password) onUnlock(password);
  };

  const handleImportFromFile = async () => {
    setShowImportMenu(false);
    try {
      const imported = await invoke<boolean>("pick_and_import_vault");
      if (imported) setIsNewVault(false);
    } catch {
      // user cancelled — ignore
    }
  };

  const handleImportFromDrive = () => {
    setShowImportMenu(false);
    setShowDriveModal(true);
  };

  return (
    <div className="login-screen">

      {/* Top-right import button */}
      <div className="login-import-wrap" ref={menuRef}>
        <button
          className="btn-login-import"
          onClick={() => setShowImportMenu((v) => !v)}
          title="Import vault"
        >
          <ImportIcon size={14} />
          Import
        </button>

        {showImportMenu && (
          <div className="login-import-menu">
            <button className="login-import-item" onClick={handleImportFromFile}>
              <span>📁</span> From file
            </button>
            <button className="login-import-item" onClick={handleImportFromDrive}>
              <GoogleIcon size={13} /> From Google Drive
            </button>
          </div>
        )}
      </div>

      <div className="login-box">
        <h1 className="app-title"><ZorahLogo />orah Vault</h1>
        <p className="app-subtitle">Password Manager</p>

        {isNewVault && (
          <p className="new-vault-hint">No vault found. Set a master password to create one.</p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              className="btn-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <EyeOpen size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading || !password}>
            {loading
              ? (isNewVault ? "Creating…" : "Unlocking…")
              : (isNewVault ? "Create New Vault" : "Unlock Vault")}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}
      </div>

      {showDriveModal && (
        <ImportFromDriveModal
          onImported={() => { setShowDriveModal(false); setIsNewVault(false); }}
          onClose={() => setShowDriveModal(false)}
        />
      )}

      <AppVersion />
    </div>
  );
}
