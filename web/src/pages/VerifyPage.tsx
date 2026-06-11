import { useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi } from "../api";

interface VerifySearch { token?: string; }

type State = "verifying" | "set-password" | "error";

export function VerifyPage() {
  const search = useSearch({ from: "/verify" }) as VerifySearch;

  const [state, setState] = useState<State>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const token = search.token;
    if (!token) {
      setError("No token found in URL. Please request a new magic link.");
      setState("error");
      return;
    }

    authApi.verify(token).then((res) => {
      if (res.ok) {
        if (!res.data.hasPassword) {
          // First time — prompt to set a password
          setState("set-password");
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        setError(res.error || "Invalid or expired token. Please request a new link.");
        setState("error");
      }
    });
  }, [search.token]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (password.length < 8) { setSaveError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setSaveError("Passwords do not match."); return; }
    setSaving(true);
    const res = await authApi.setPassword(password);
    setSaving(false);
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setSaveError(res.error || "Failed to save password.");
    }
  };

  if (state === "verifying") {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="btn-spinner" style={{ width: 36, height: 36, margin: "0 auto 16px", borderWidth: 3 }} />
          <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Verifying your link…</h2>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>Just a moment!</p>
        </div>
      </div>
    );
  }

  if (state === "set-password") {
    return (
      <div className="auth-page">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="var(--brand)" />
                <path d="M7 8h14M7 13h10M7 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="auth-brand-name">Survey-Builders</h1>
          </div>

          <div className="auth-success-icon" style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div className="auth-heading">
            <h2>You're in! Set a password</h2>
            <p>Create a password so you can sign in quickly next time — no magic link needed.</p>
          </div>

          <form onSubmit={handleSetPassword} style={{ width: "100%" }}>
            <div className="field">
              <label htmlFor="new-password">Password <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(min 8 chars)</span></label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoFocus
                  required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 13 }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type={showPw ? "text" : "password"}
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </div>
            {saveError && <p className="auth-error" role="alert">{saveError}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={saving} id="set-password-btn">
              {saving ? <span className="btn-spinner" /> : "Save password & go to dashboard →"}
            </button>
          </form>

          <button type="button" className="btn-ghost btn-full" style={{ marginTop: 8 }}
            onClick={() => { window.location.href = "/dashboard"; }}>
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  // error state
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>⚠️</p>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Verification Failed</h2>
        <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24 }}>{error}</p>
        <a href="/login" className="btn-primary" id="back-to-login-btn">← Back to login</a>
      </div>
    </div>
  );
}
