import { useEffect } from "react";

interface Props {
  message: string;
  type: "uploaded" | "downloaded" | "in_sync" | "error";
  onDismiss: () => void;
}

const ICONS = {
  uploaded:   "↑",
  downloaded: "↓",
  in_sync:    "✓",
  error:      "✕",
};

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`toast toast--${type}`} onClick={onDismiss}>
      <span className="toast-icon">{ICONS[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
