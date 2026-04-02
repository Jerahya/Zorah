import { useState, FormEvent } from "react";
import { ZorahLogo } from "./icons";
import { EyeOpen, EyeOff } from "./icons";
import AppVersion from "./AppVersion";

interface Props {
  onUnlock: (password: string) => void;
  loading: boolean;
  error: string | null;
}

export default function LoginScreen({ onUnlock, loading, error }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password) onUnlock(password);
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <h1 className="app-title"><ZorahLogo />orah Vault</h1>
        <p className="app-subtitle">Password Manager</p>
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
            {loading ? "Unlocking..." : "Unlock Vault"}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>
      <AppVersion />
    </div>
  );
}
