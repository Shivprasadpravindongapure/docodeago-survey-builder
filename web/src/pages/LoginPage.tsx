import { useState } from "react";
import { authApi } from "../api";

type Step =
  | { name: "email" }
  | { name: "new-user"; email: string; verifyUrl: string }
  | { name: "password"; email: string; hasPassword: boolean }
  | { name: "magic-sent"; email: string; verifyUrl: string };

export function LoginPage() {

  const [step, setStep] = useState<Step>({ name: "email" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: Check if email is new or returning ────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authApi.checkEmail(email.trim().toLowerCase());
    setLoading(false);

    if (!res.ok) { setError("Something went wrong. Try again."); return; }

    const { exists, hasPassword } = res.data;

    if (!exists) {
      // Brand-new user → auto-send magic link
      setLoading(true);
      const ml = await authApi.magicLink(email.trim().toLowerCase());
      setLoading(false);
      if (ml.ok) {
        setStep({ name: "new-user", email, verifyUrl: ml.data.verifyUrl });
      } else {
        setError(ml.error || "Failed to send magic link.");
      }
    } else {
      // Returning user
      setStep({ name: "password", email, hasPassword });
    }
  };

  // ── Step 2a: Password login (returning user with password set) ────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authApi.login(email, password);
    setLoading(false);
    if (res.ok) { window.location.href = "/dashboard"; }
    else { setError(res.error || "Invalid password. Try again."); }
  };

  // ── Step 2b: Request magic link (returning user with no password yet) ─────
  const handleSendMagicLink = async () => {
    setError(null);
    setLoading(true);
    const res = await authApi.magicLink(email);
    setLoading(false);
    if (res.ok) { setStep({ name: "magic-sent", email, verifyUrl: res.data.verifyUrl }); }
    else { setError(res.error || "Failed to send magic link."); }
  };

  return (
    <div className="auth-page">
      {/* Background glow orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="var(--brand)" />
              <path d="M7 8h14M7 13h10M7 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="18" r="4" fill="white" opacity="0.9" />
              <path d="M19.5 18l1 1 2-2" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-brand-name">Survey-Builders</h1>
        </div>

        {/* ── STEP: email ── */}
        {step.name === "email" && (
          <form onSubmit={handleEmailSubmit} style={{ width: "100%" }}>
            <div className="auth-heading">
              <h2>Welcome</h2>
              <p>Enter your email to get started or sign in.</p>
            </div>
            <div className="field">
              <label htmlFor="email-input">Email address</label>
              <input
                id="email-input"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
              />
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={loading} id="email-continue-btn">
              {loading ? <span className="btn-spinner" /> : "Continue →"}
            </button>
          </form>
        )}

        {/* ── STEP: new user — magic link sent ── */}
        {step.name === "new-user" && (
          <div className="auth-success">
            <div className="auth-success-icon">✉️</div>
            <h2>Check your inbox!</h2>
            <p>We sent a sign-in link to <strong>{step.email}</strong></p>
            <p className="auth-note">New to Survey-Builders? Your account is created automatically when you click the link.</p>
            <a
              href={step.verifyUrl}
              className="btn-primary btn-full"
              id="instant-signin-btn"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              ✨ Click here to sign in instantly
            </a>
            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => { setStep({ name: "email" }); setEmail(""); }}>
              ← Use a different email
            </button>
          </div>
        )}

        {/* ── STEP: returning user ── */}
        {step.name === "password" && (
          <div style={{ width: "100%" }}>
            <div className="auth-heading">
              <div className="auth-returning-badge">
                <span>👋</span> Welcome back
              </div>
              <h2>Sign in</h2>
              <p style={{ wordBreak: "break-all" }}>{step.email}</p>
            </div>

            {step.hasPassword ? (
              /* Has a password — show password field */
              <form onSubmit={handlePasswordLogin}>
                <div className="field">
                  <label htmlFor="password-input">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      className="input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14 }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button type="submit" className="btn-primary btn-full" disabled={loading} id="password-login-btn">
                  {loading ? <span className="btn-spinner" /> : "Sign in →"}
                </button>
                <div className="auth-divider"><span>or</span></div>
                <button type="button" className="btn-ghost btn-full" onClick={handleSendMagicLink} disabled={loading} id="send-magic-link-btn">
                  📧 Send magic link instead
                </button>
              </form>
            ) : (
              /* No password yet — only magic link option */
              <div>
                <p className="auth-note" style={{ marginBottom: 20 }}>Your account uses magic links. Click below to receive a sign-in link, then you can set a password in your profile.</p>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button type="button" className="btn-primary btn-full" onClick={handleSendMagicLink} disabled={loading} id="send-magic-link-btn">
                  {loading ? <span className="btn-spinner" /> : "📧 Send magic link"}
                </button>
              </div>
            )}

            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => { setStep({ name: "email" }); setPassword(""); setError(null); }}>
              ← Different email
            </button>
          </div>
        )}

        {/* ── STEP: magic link sent to returning user ── */}
        {step.name === "magic-sent" && (
          <div className="auth-success">
            <div className="auth-success-icon">✉️</div>
            <h2>Magic link sent!</h2>
            <p>We sent a sign-in link to <strong>{step.email}</strong></p>
            <p className="auth-note">The link expires in 15 minutes.</p>
            <a
              href={step.verifyUrl}
              className="btn-primary btn-full"
              id="instant-signin-btn"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              ✨ Click here to sign in instantly
            </a>
            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => { setStep({ name: "email" }); setPassword(""); setError(null); }}>
              ← Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
