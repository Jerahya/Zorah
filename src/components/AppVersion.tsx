import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

export default function AppVersion() {
  const [version, setVersion] = useState("");
  useEffect(() => { getVersion().then(setVersion); }, []);
  if (!version) return null;
  return <span className="app-version">v{version}</span>;
}
