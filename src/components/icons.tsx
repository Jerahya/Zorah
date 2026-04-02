// ── Credential type icons ────────────────────────────────────────────────────

const S = (p: { size: number; children: React.ReactNode }) => (
  <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {p.children}
  </svg>
);

function IconDefault({ size }: { size: number }) {
  return <S size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>;
}
function IconWeb({ size }: { size: number }) {
  return <S size={size}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></S>;
}
function IconRdp({ size }: { size: number }) {
  return <S size={size}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></S>;
}
function IconCard({ size }: { size: number }) {
  return <S size={size}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="6" y1="15" x2="9" y2="15"/></S>;
}
function IconEmail({ size }: { size: number }) {
  return <S size={size}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></S>;
}
function IconWifi({ size }: { size: number }) {
  return <S size={size}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></S>;
}
function IconDatabase({ size }: { size: number }) {
  return <S size={size}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></S>;
}
function IconServer({ size }: { size: number }) {
  return <S size={size}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></S>;
}
function IconApi({ size }: { size: number }) {
  return <S size={size}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></S>;
}
function IconSsh({ size }: { size: number }) {
  return <S size={size}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></S>;
}
function IconNote({ size }: { size: number }) {
  return <S size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></S>;
}
function IconIdentity({ size }: { size: number }) {
  return <S size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></S>;
}

const ICON_MAP: Record<string, (size: number) => React.ReactElement> = {
  default:  (s) => <IconDefault  size={s} />,
  web:      (s) => <IconWeb      size={s} />,
  rdp:      (s) => <IconRdp      size={s} />,
  card:     (s) => <IconCard     size={s} />,
  email:    (s) => <IconEmail    size={s} />,
  wifi:     (s) => <IconWifi     size={s} />,
  database: (s) => <IconDatabase size={s} />,
  server:   (s) => <IconServer   size={s} />,
  api:      (s) => <IconApi      size={s} />,
  ssh:      (s) => <IconSsh      size={s} />,
  note:     (s) => <IconNote     size={s} />,
  identity: (s) => <IconIdentity size={s} />,
};

export const CREDENTIAL_TYPES: { id: string; label: string }[] = [
  { id: "default",  label: "General"        },
  { id: "web",      label: "Web"            },
  { id: "rdp",      label: "Remote Desktop" },
  { id: "card",     label: "Credit Card"    },
  { id: "email",    label: "Email"          },
  { id: "wifi",     label: "Wi-Fi"          },
  { id: "database", label: "Database"       },
  { id: "server",   label: "Server"         },
  { id: "api",      label: "API Key"        },
  { id: "ssh",      label: "SSH"            },
  { id: "note",     label: "Secure Note"    },
  { id: "identity", label: "Identity"       },
];

export function CredentialTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  return (ICON_MAP[type] ?? ICON_MAP.default)(size);
}

// ── UI icons ─────────────────────────────────────────────────────────────────

export function EyeOpen({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function EyeOff({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

export function ExternalLinkIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export function ChevronDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

export function ChevronUp({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

export function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

export function PencilIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

export function LockIcon({ size = 14, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export function GearIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function ZorahLogo() {
  return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="1.2em"
    width="auto"
    viewBox="0 0 320 380"
    style={{ display: "inline-block", verticalAlign: "-0.1em" }}>
    <g>
      <path d="M 161.09 379.58 C160.86,379.81 196.52,380.00 240.33,380.00 L 0.00 380.00 L 79.75 379.94 C148.87,379.88 159.10,379.69 156.50,378.47 C154.85,377.70 147.88,374.58 141.00,371.52 C80.46,344.63 33.84,300.16 13.90,250.31 C9.87,240.22 6.50,229.00 3.76,216.50 C1.61,206.75 1.55,204.53 1.23,127.90 L 0.91 49.31 L 10.71 48.64 C45.02,46.31 87.73,33.98 133.64,13.15 C143.25,8.79 157.63,1.52 158.92,0.37 L 158.92 0.37 C158.92,0.17 123.34,0.00 79.67,0.00 L 240.50 0.00 C196.77,0.00 161.00,0.22 161.00,0.49 C161.00,1.98 203.30,21.05 222.50,28.21 C248.78,38.02 280.96,45.96 304.00,48.32 C305.92,48.52 310.31,48.75 313.75,48.84 L 320.00 49.00 L 320.00 380.00 L 319.78 214.75 C319.67,127.81 319.57,89.87 319.39,89.87 C319.28,89.87 319.14,103.55 318.95,128.50 C318.27,217.00 318.52,213.74 310.40,238.47 C291.62,295.67 242.93,344.08 174.50,373.56 C167.35,376.64 161.32,379.35 161.09,379.58 ZM 143.00 341.20 C151.52,345.47 159.09,348.98 159.81,348.99 C162.23,349.01 191.38,334.28 201.50,327.92 C249.31,297.86 278.24,259.54 288.24,213.04 C290.15,204.20 290.33,199.30 290.71,146.00 C291.06,96.49 290.93,88.71 289.71,90.00 C288.94,90.82 281.85,99.38 273.97,109.00 C266.08,118.62 257.76,128.75 255.47,131.50 C253.18,134.25 249.30,138.98 246.84,142.00 C234.91,156.69 208.00,189.59 200.63,198.50 C196.09,204.00 184.45,218.18 174.78,230.00 C165.10,241.82 153.59,255.77 149.21,261.00 L 141.24 270.50 L 178.37 270.79 L 215.50 271.08 L 219.54 266.56 C221.76,264.07 225.40,258.98 227.63,255.26 L 231.68 248.50 L 246.84 248.22 C255.18,248.07 262.00,248.20 262.00,248.50 C262.00,248.81 259.80,253.66 257.11,259.28 C251.67,270.63 244.04,281.81 234.24,292.75 L 227.75 300.00 L 155.13 300.04 L 82.50 300.08 L 87.50 304.70 C100.71,316.93 120.31,329.81 143.00,341.20 ZM 46.10 253.20 C47.71,256.39 49.36,258.97 49.76,258.94 C50.17,258.91 53.97,254.53 58.21,249.19 C67.43,237.59 75.08,228.18 101.49,195.92 C145.95,141.61 155.25,130.30 159.06,125.82 C161.25,123.25 166.07,117.43 169.77,112.89 C173.47,108.34 178.64,102.01 181.25,98.81 L 185.99 93.00 L 101.00 93.00 L 101.00 116.00 L 72.00 116.00 L 72.00 66.77 L 69.25 67.28 C67.74,67.56 60.42,69.16 53.00,70.84 C45.58,72.52 37.14,74.20 34.25,74.58 L 29.00 75.26 L 29.00 132.17 C29.00,165.10 29.44,193.17 30.05,198.79 C32.06,217.41 37.73,236.62 46.10,253.20 ZM 73.99 291.78 C77.84,295.75 81.19,299.00 81.44,299.00 C81.69,299.00 87.06,292.59 93.38,284.75 C99.70,276.91 107.40,267.41 110.48,263.62 C113.57,259.84 120.00,251.97 124.77,246.12 C133.15,235.86 155.53,208.91 167.63,194.50 C175.06,185.66 208.66,144.84 212.00,140.60 C213.38,138.86 219.45,131.43 225.50,124.10 C231.55,116.77 237.62,109.35 239.00,107.61 C240.38,105.86 245.78,99.27 251.01,92.97 C264.91,76.20 268.27,71.93 267.86,71.54 C267.66,71.35 262.43,69.88 256.23,68.27 L 244.96 65.34 L 231.23 82.32 C223.68,91.66 209.46,109.02 199.63,120.90 C179.31,145.47 177.67,147.47 158.50,171.08 C135.66,199.21 106.56,234.76 97.22,245.93 C92.42,251.67 86.93,258.44 85.00,260.98 C83.07,263.52 78.24,269.49 74.25,274.24 C70.26,278.99 67.00,283.26 67.00,283.72 C67.00,284.19 70.15,287.81 73.99,291.78 ZM 83.00 63.58 C83.00,63.81 118.21,63.97 161.25,63.93 L 239.50 63.87 L 225.50 59.07 C204.76,51.97 182.96,42.96 164.78,33.97 L 160.07 31.63 L 147.28 37.72 C126.96,47.40 110.87,53.96 92.75,59.94 C87.39,61.72 83.00,63.35 83.00,63.58 Z" fill="rgb(109,99,250)"/>
      <path d="M 0.00 190.00 L 0.00 0.00 L 79.67 -0.00 C123.48,-0.00 159.15,0.17 158.92,0.37 C157.63,1.52 143.25,8.79 133.64,13.15 C87.73,33.98 45.02,46.31 10.71,48.64 L 0.91 49.31 L 1.23 127.90 C1.55,204.53 1.61,206.75 3.76,216.50 C6.50,229.00 9.87,240.22 13.90,250.31 C33.84,300.16 80.46,344.63 141.00,371.52 C147.88,374.58 154.85,377.70 156.50,378.47 C159.10,379.69 148.87,379.88 79.75,379.94 L 0.00 380.00 L 0.00 190.00 ZM 161.09 379.58 C161.32,379.35 167.35,376.64 174.50,373.56 C242.93,344.08 291.62,295.67 310.40,238.47 C318.52,213.74 318.27,217.00 318.95,128.50 C319.47,61.98 319.60,75.61 319.78,214.75 L 320.00 380.00 L 240.33 380.00 C196.52,380.00 160.86,379.81 161.09,379.58 ZM 143.00 341.20 C120.31,329.81 100.71,316.93 87.50,304.70 L 82.50 300.08 L 155.13 300.04 L 227.75 300.00 L 234.24 292.75 C244.04,281.81 251.67,270.63 257.11,259.28 C259.80,253.66 262.00,248.81 262.00,248.50 C262.00,248.20 255.18,248.07 246.84,248.22 L 231.68 248.50 L 227.63 255.26 C225.40,258.98 221.76,264.07 219.54,266.56 L 215.50 271.08 L 178.37 270.79 L 141.24 270.50 L 149.21 261.00 C153.59,255.77 165.10,241.82 174.78,230.00 C184.45,218.18 196.09,204.00 200.63,198.50 C208.00,189.59 234.91,156.69 246.84,142.00 C249.30,138.98 253.18,134.25 255.47,131.50 C257.76,128.75 266.08,118.62 273.97,109.00 C281.85,99.38 288.94,90.82 289.71,90.00 C290.93,88.71 291.06,96.49 290.71,146.00 C290.33,199.30 290.15,204.20 288.24,213.04 C278.24,259.54 249.31,297.86 201.50,327.92 C191.38,334.28 162.23,349.01 159.81,348.99 C159.09,348.98 151.52,345.47 143.00,341.20 ZM 73.99 291.78 C70.15,287.81 67.00,284.19 67.00,283.72 C67.00,283.26 70.26,278.99 74.25,274.24 C78.24,269.49 83.07,263.52 85.00,260.98 C86.93,258.44 92.42,251.67 97.22,245.93 C106.56,234.76 135.66,199.21 158.50,171.08 C177.67,147.47 179.31,145.47 199.63,120.90 C209.46,109.02 223.68,91.66 231.23,82.32 L 244.96 65.34 L 256.23 68.27 C262.43,69.88 267.66,71.35 267.86,71.54 C268.27,71.93 264.91,76.20 251.01,92.97 C245.78,99.27 240.38,105.86 239.00,107.61 C237.62,109.35 231.55,116.77 225.50,124.10 C219.45,131.43 213.38,138.86 212.00,140.60 C208.66,144.84 175.06,185.66 167.63,194.50 C155.53,208.91 133.15,235.86 124.77,246.12 C120.00,251.97 113.57,259.84 110.48,263.62 C107.40,267.41 99.70,276.91 93.38,284.75 C87.06,292.59 81.69,299.00 81.44,299.00 C81.19,299.00 77.84,295.75 73.99,291.78 ZM 46.10 253.20 C37.73,236.62 32.06,217.41 30.05,198.79 C29.44,193.17 29.00,165.10 29.00,132.17 L 29.00 75.26 L 34.25 74.58 C37.14,74.20 45.58,72.52 53.00,70.84 C60.42,69.16 67.74,67.56 69.25,67.28 L 72.00 66.77 L 72.00 91.39 L 72.00 116.00 L 86.50 116.00 L 101.00 116.00 L 101.00 104.50 L 101.00 93.00 L 143.50 93.00 L 185.99 93.00 L 181.25 98.81 C178.64,102.01 173.47,108.34 169.77,112.89 C166.07,117.43 161.25,123.25 159.06,125.82 C155.25,130.30 145.95,141.61 101.49,195.92 C75.08,228.18 67.43,237.59 58.21,249.19 C53.97,254.53 50.17,258.91 49.76,258.94 C49.36,258.97 47.71,256.39 46.10,253.20 ZM 83.00 63.58 C83.00,63.35 87.39,61.72 92.75,59.94 C110.87,53.96 126.96,47.40 147.28,37.72 L 160.07 31.63 L 164.78 33.97 C182.96,42.96 204.76,51.97 225.50,59.07 L 239.50 63.87 L 161.25 63.93 C118.21,63.97 83.00,63.81 83.00,63.58 ZM 304.00 48.32 C280.96,45.96 248.78,38.02 222.50,28.21 C203.30,21.05 161.00,1.98 161.00,0.49 C161.00,0.22 196.77,0.00 240.50,0.00 L 320.00 0.00 L 320.00 24.50 L 320.00 49.00 L 313.75 48.84 C310.31,48.75 305.92,48.52 304.00,48.32 Z" fill="none"/>
    </g>
  </svg>
  );
}
