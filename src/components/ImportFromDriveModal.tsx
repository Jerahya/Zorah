import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GoogleIcon } from "./icons";

interface DriveVaultFile {
  id: string;
  name: string;
  modified_time: string;
  size_bytes: number;
  revision: number;
}

interface Props {
  onImported: () => void;
  onClose: () => void;
}

function vaultLabel(name: string): string {
  return name;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function ImportFromDriveModal({ onImported, onClose }: Props) {
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vaults, setVaults] = useState<DriveVaultFile[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on open
  useEffect(() => {
    invoke<string | null>("google_auth_status").then((email) => {
      setGoogleEmail(email);
      if (email) fetchVaults();
    }).catch(() => {});
  }, []);

  const fetchVaults = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await invoke<DriveVaultFile[]>("google_drive_list_vaults");
      setVaults(files);
      if (files.length === 1) setSelected(files[0].id);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const email = await invoke<string>("google_auth_start");
      setGoogleEmail(email);
      await fetchVaults();
    } catch (err) {
      setError(String(err));
    } finally {
      setConnecting(false);
    }
  };

  const handleImport = async () => {
    if (!selected) return;
    setImporting(true);
    setError(null);
    try {
      await invoke("google_drive_import_vault", { fileId: selected });
      onImported();
    } catch (err) {
      setError(String(err));
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-import-drive" onClick={(e) => e.stopPropagation()}>
        <div className="import-drive-header">
          <h2>Import from Google Drive</h2>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!googleEmail ? (
          <div className="import-drive-connect">
            <p>Sign in to Google to access your Drive vaults.</p>
            <button
              className="btn-google btn-google-connect"
              onClick={handleConnect}
              disabled={connecting}
            >
              <GoogleIcon size={15} />
              {connecting ? "Connecting…" : "Connect Google"}
            </button>
          </div>
        ) : (
          <div className="import-drive-body">
            <p className="import-drive-account">
              <GoogleIcon size={13} /> {googleEmail}
            </p>

            {loading && <p className="import-drive-hint">Loading vaults…</p>}

            {!loading && vaults !== null && vaults.length === 0 && (
              <p className="import-drive-empty">No vault files found in your Google Drive.</p>
            )}

            {!loading && vaults && vaults.length > 0 && (
              <ul className="vault-file-list">
                {vaults.map((v) => (
                  <li
                    key={v.id}
                    className={`vault-file-item${selected === v.id ? " selected" : ""}`}
                    onClick={() => setSelected(v.id)}
                  >
                    <span className="vault-file-radio">{selected === v.id ? "◉" : "○"}</span>
                    <span className="vault-file-info">
                      <span className="vault-file-name" title={v.name}>{vaultLabel(v.name)}</span>
                      <span className="vault-file-meta">
                        <span title="Last modified">{formatDate(v.modified_time)}</span>
                        <span className="vault-file-meta-sep">·</span>
                        <span title="File size">{formatSize(v.size_bytes)}</span>
                        <span className="vault-file-meta-sep">·</span>
                        <span title="Revision">r{v.revision}</span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p className="error-msg" style={{ margin: "8px 16px 0" }}>{error}</p>}

        <div className="import-drive-footer">
          {googleEmail && (
            <button
              className="btn-google btn-google-disconnect"
              onClick={async () => {
                await invoke("google_logout");
                setGoogleEmail(null);
                setVaults(null);
                setSelected(null);
              }}
            >
              Disconnect
            </button>
          )}
          <div className="import-drive-footer-right">
            <button onClick={onClose}>Cancel</button>
            {googleEmail && (
              <button
                className="btn-save-settings"
                onClick={handleImport}
                disabled={!selected || importing || loading}
              >
                {importing ? "Importing…" : "Import"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
