import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GoogleIcon } from "./icons";

function formatKeyEvent(e: React.KeyboardEvent): string | null {
  if (["Alt", "Shift", "Control", "Meta"].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join("+");
}

interface SyncResult {
  action: "uploaded" | "downloaded" | "in_sync";
  message: string;
}

interface Props {
  currentShortcut: string;
  vaultId: string;
  onSave: (shortcut: string) => Promise<void>;
  onClose: () => void;
  onVaultReplaced: () => void;
}

export default function SettingsModal({ currentShortcut, vaultId, onSave, onClose, onVaultReplaced }: Props) {
  const [pending, setPending] = useState(currentShortcut);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Vault storage location
  const [vaultDir, setVaultDir] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_vault_dir").then(setVaultDir).catch(() => {});
  }, []);

  // Google auth state
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    invoke<string | null>("google_auth_status").then(setGoogleEmail).catch(() => {});
  }, []);

  const hasChanges = pending !== currentShortcut;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === "Escape") { setRecording(false); return; }
    const combo = formatKeyEvent(e);
    if (combo) { setPending(combo); setRecording(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(pending);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleConnect = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const email = await invoke<string>("google_auth_start");
      setGoogleEmail(email);
      setSyncResult(null);
    } catch (err) {
      setGoogleError(String(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await invoke("google_logout");
      setGoogleEmail(null);
      setSyncResult(null);
    } catch (err) {
      setGoogleError(String(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setGoogleError(null);
    try {
      const result = await invoke<SyncResult>("google_drive_sync", { vaultId });
      setSyncResult(result);
      if (result.action === "downloaded") {
        onVaultReplaced();
      }
    } catch (err) {
      setGoogleError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const syncIcon = syncResult
    ? syncResult.action === "uploaded"   ? "↑"
    : syncResult.action === "downloaded" ? "↓"
    : "✓"
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Global Shortcuts</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Show / Hide Toggle</span>
              <span className="settings-row-desc">Global hotkey to show or hide the window</span>
            </div>
            <div className="settings-row-control">
              <div
                className={`hotkey-chip${recording ? " recording" : ""}`}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={() => setRecording(true)}
                onBlur={() => setRecording(false)}
                title="Click to record a new shortcut"
              >
                {recording ? "Press keys…" : pending}
              </div>
              {hasChanges && !recording && (
                <button className="btn-revert" onClick={() => setPending(currentShortcut)} title="Revert to saved">↩</button>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Storage</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Vault directory</span>
              <span className="settings-row-desc vault-dir-path" title={vaultDir}>{vaultDir || "—"}</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Cloud Sync</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Google Drive</span>
              <span className="settings-row-desc">
                {googleEmail ? `Connected as ${googleEmail}` : "Sync your vault to Google Drive"}
              </span>
            </div>
            <div className="settings-row-control">
              {googleEmail ? (
                <>
                  <button
                    className="btn-sync"
                    onClick={handleSync}
                    disabled={syncing}
                    title="Sync vault with Google Drive"
                  >
                    {syncing ? "Syncing…" : "Sync Now"}
                  </button>
                  <button
                    className="btn-google btn-google-disconnect"
                    onClick={handleGoogleDisconnect}
                    disabled={googleLoading || syncing}
                  >
                    {googleLoading ? "…" : "Disconnect"}
                  </button>
                </>
              ) : (
                <button
                  className="btn-google btn-google-connect"
                  onClick={handleGoogleConnect}
                  disabled={googleLoading}
                >
                  <GoogleIcon size={15} />
                  {googleLoading ? "Connecting…" : "Connect"}
                </button>
              )}
            </div>
          </div>

          {syncResult && (
            <div className={`sync-status sync-status--${syncResult.action}`}>
              <span className="sync-status-icon">{syncIcon}</span>
              {syncResult.message}
            </div>
          )}
          {googleError && <p className="error-msg" style={{ marginTop: 6 }}>{googleError}</p>}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="settings-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="btn-save-settings" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
