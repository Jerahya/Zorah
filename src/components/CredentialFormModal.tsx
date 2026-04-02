import { useRef, useState } from "react";
import { Credential, CustomField } from "../types/vault";

type CredentialInput = Omit<Credential, "id" | "created_at" | "updated_at">;

interface Props {
  initial: Credential | null;
  onSubmit: (data: CredentialInput) => Promise<void>;
  onDelete?: (confirmPassword: string) => Promise<void>;
  onClose: () => void;
}

const EyeOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const LockIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function DeleteConfirmModal({ onConfirm, onClose }: { onConfirm: (password: string) => Promise<void>; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!password) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Credential</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Enter master password to confirm
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="button" className="btn-eye btn-eye-margin" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
          </label>
          {error && <p className="error-msg">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn-delete" disabled={deleting || !password}>
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
            <div className="modal-actions-right">
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFieldModal({ onAdd, onClose }: { onAdd: (type: string) => void; onClose: () => void }) {
  const [fieldType, setFieldType] = useState("text");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>Add Field</h2>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(fieldType); }}>
          <label className="label-row">
            Type
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
              <option value="text">Text</option>
              <option value="link">Link</option>
            </select>
          </label>
          <div className="modal-actions">
            <div className="modal-actions-right">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Add</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CredentialFormModal({ initial, onSubmit, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [customFields, setCustomFields] = useState<CustomField[]>(initial?.custom_fields ?? []);
  const [fieldVisibility, setFieldVisibility] = useState<boolean[]>(
    () => (initial?.custom_fields ?? []).map(() => false)
  );
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null);
  const fieldCounter = useRef(
    Math.max(0, ...(initial?.custom_fields ?? []).map((_, i) => i + 1))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title, custom_fields: customFields });
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const handleAddField = (type: string) => {
    fieldCounter.current += 1;
    setCustomFields((f) => {
      setEditingLabelIdx(f.length);
      return [...f, { key: `Custom label ${fieldCounter.current}`, value: "", secret: false, field_type: type }];
    });
    setFieldVisibility((v) => [...v, false]);
    setShowAddModal(false);
  };

  const removeField = (i: number) => {
    setCustomFields((f) => f.filter((_, idx) => idx !== i));
    setFieldVisibility((v) => v.filter((_, idx) => idx !== i));
    if (editingLabelIdx === i) setEditingLabelIdx(null);
  };

  const updateField = (i: number, patch: Partial<CustomField>) => {
    setCustomFields((f) => f.map((field, idx) => idx === i ? { ...field, ...patch } : field));
  };

  const toggleFieldVisibility = (i: number) => {
    setFieldVisibility((v) => v.map((vis, idx) => idx === i ? !vis : vis));
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{initial ? "Edit Credential" : "New Credential"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="modal-fields">
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </label>

            {customFields.length > 0 && (
              <div className="custom-fields">
                {customFields.map((field, i) => (
                  <div key={i} className="custom-field">
                    <div className="custom-field-label-row">
                      {editingLabelIdx === i ? (
                        <input
                          className="custom-field-label-edit"
                          value={field.key}
                          onChange={(e) => updateField(i, { key: e.target.value })}
                          onBlur={() => setEditingLabelIdx(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") setEditingLabelIdx(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="custom-field-label">{field.key}</span>
                      )}
                      {editingLabelIdx !== i && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditingLabelIdx(i)}
                          title="Edit label"
                        >
                          <PencilIcon />
                        </button>
                      )}
                    </div>
                    <div className="custom-field-controls">
                      <div className="password-field custom-field-value">
                        <input
                          type={field.secret && !fieldVisibility[i] ? "password" : "text"}
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => updateField(i, { value: e.target.value })}
                        />
                        {field.secret && (
                          <button
                            type="button"
                            className="btn-eye btn-eye-margin"
                            onClick={() => toggleFieldVisibility(i)}
                            tabIndex={-1}
                          >
                            {fieldVisibility[i] ? <EyeOff /> : <EyeOpen />}
                          </button>
                        )}
                      </div>
                      {field.field_type !== "link" && (
                        <button
                          type="button"
                          className={`btn-lock-field${field.secret ? " active" : ""}`}
                          onClick={() => updateField(i, { secret: !field.secret })}
                          title="Hidden"
                        >
                          <LockIcon active={field.secret} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-remove-field"
                        onClick={() => removeField(i)}
                        aria-label="Remove field"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="btn-add-field" onClick={() => setShowAddModal(true)}>
              + Add field
            </button>

            </div>{/* end modal-fields */}

            {error && <p className="error-msg">{error}</p>}
            <div className="modal-actions">
              {onDelete && (
                <>
                  <button type="button" className="btn-delete" onClick={() => setShowDeleteModal(true)}>Delete</button>
                  <div className="modal-actions-right">
                    <button type="button" onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={saving || customFields.length === 0}>{saving ? "Saving..." : "Save"}</button>
                  </div>
                </>
              )}
              {!onDelete && (
                <>
                  <button type="button" onClick={onClose}>Cancel</button>
                  <button type="submit" disabled={saving || customFields.length === 0}>{saving ? "Saving..." : "Save"}</button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {showAddModal && (
        <AddFieldModal onAdd={handleAddField} onClose={() => setShowAddModal(false)} />
      )}
      {showDeleteModal && onDelete && (
        <DeleteConfirmModal onConfirm={onDelete} onClose={() => setShowDeleteModal(false)} />
      )}
    </>
  );
}
