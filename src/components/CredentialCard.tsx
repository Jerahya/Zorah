import { useState, useEffect, useRef } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Credential, CustomField } from "../types/vault";

interface Props {
  credential: Credential;
  onEdit: () => void;
}

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const EyeOpen = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="btn-copy" onClick={handleCopy} aria-label="Copy">
      {copied ? <span className="copied-label">Copied!</span> : <CopyIcon />}
    </button>
  );
}

const AUTO_HIDE_MS = 5000;

function FieldCell({ field }: { field: CustomField }) {
  const [show, setShow] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reveal = () => {
    clearTimers();
    setShow(true);
    setRemaining(AUTO_HIDE_MS / 1000);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    timerRef.current = setTimeout(() => {
      setShow(false);
      setRemaining(0);
      clearTimers();
    }, AUTO_HIDE_MS);
  };

  const hide = () => {
    clearTimers();
    setShow(false);
    setRemaining(0);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <div className="card-field-cell">
      <span className="card-field-key">{field.key}</span>
      <div className="card-field-value-row">
        {field.field_type === "link" ? (
          <span className="card-field-value">
            {field.value
              ? <button className="btn-link" onClick={() => openUrl(field.value)}>{field.value}</button>
              : <span className="card-field-empty">—</span>}
          </span>
        ) : (
          <span className="card-field-value">
            {field.secret && !show ? "••••••••" : (field.value || <span className="card-field-empty">—</span>)}
          </span>
        )}
        {field.field_type === "link" && field.value && (
          <>
            <button className="btn-copy" onClick={() => openUrl(field.value)} aria-label="Open link">
              <ExternalLinkIcon />
            </button>
            <CopyButton value={field.value} />
          </>
        )}
        {field.field_type !== "link" && field.secret && (
          <button className="btn-copy" onClick={show ? hide : reveal} aria-label={show ? "Hide" : "Show"}>
            {show ? <><EyeOff />{remaining > 0 && <span className="reveal-timer">{remaining}</span>}</> : <EyeOpen />}
          </button>
        )}
        {field.field_type !== "link" && field.value && <CopyButton value={field.value} />}
      </div>
    </div>
  );
}

const MAX_VISIBLE = 4;

export default function CredentialCard({ credential, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fields = credential.custom_fields;
  const visibleFields = expanded ? fields : fields.slice(0, MAX_VISIBLE);
  const hasMore = fields.length > MAX_VISIBLE;

  return (
    <div className="credential-card">
      <div className="card-header">
        <span className="card-title">{credential.title}</span>
        <button className="btn-edit" onClick={onEdit}>Edit</button>
      </div>
      {visibleFields.length > 0 && (
        <div className="card-fields-grid">
          {visibleFields.map((field, i) => (
            <FieldCell key={i} field={field} />
          ))}
        </div>
      )}
      {hasMore && (
        <button className="btn-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <><ChevronUp /> Less</> : <><ChevronDown /> More</>}
        </button>
      )}
    </div>
  );
}
