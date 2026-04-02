import { useState, useEffect, useRef } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Credential, CustomField } from "../types/vault";
import { CopyIcon, EyeOpen, EyeOff, ExternalLinkIcon, ChevronDown, ChevronUp } from "./icons";

interface Props {
  credential: Credential;
  onEdit: () => void;
  dragHandle?: React.ReactNode;
}

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

export default function CredentialCard({ credential, onEdit, dragHandle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fields = credential.custom_fields;
  const visibleFields = expanded ? fields : fields.slice(0, MAX_VISIBLE);
  const hasMore = fields.length > MAX_VISIBLE;

  return (
    <div className="credential-card">
      <div className="card-header">
        {dragHandle}
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
