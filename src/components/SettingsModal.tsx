import { useState } from "react";

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

interface Props {
  currentShortcut: string;
  onSave: (shortcut: string) => Promise<void>;
  onClose: () => void;
}

export default function SettingsModal({ currentShortcut, onSave, onClose }: Props) {
  const [pending, setPending] = useState(currentShortcut);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasChanges = pending !== currentShortcut;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === "Escape") {
      setRecording(false);
      return;
    }
    const combo = formatKeyEvent(e);
    if (combo) {
      setPending(combo);
      setRecording(false);
    }
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
                <button
                  className="btn-revert"
                  onClick={() => setPending(currentShortcut)}
                  title="Revert to saved"
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="settings-footer">
          <button onClick={onClose}>Cancel</button>
          <button
            className="btn-save-settings"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
