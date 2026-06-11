import { useState } from "react";
import { authApi } from "../api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await authApi.magicLink(email);
    setLoading(false);

    if (res.ok) {
      setSent(true);
      setVerifyUrl(res.data?.verifyUrl ?? null);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            FormCraft
          </span>
        </div>
        <h1>Welcome back</h1>
        <p className="subtitle">Enter your email to receive a magic sign-in link.</p>

        {!sent ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              id="login-email"
            />

            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !email}
              id="send-magic-link-btn"
              style={{ marginTop: 4 }}
            >
              {loading ? "Sending…" : "✉️ Send magic link"}
            </Button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Primary CTA — instant sign-in, always shown */}
            {verifyUrl && (
              <a
                href={verifyUrl}
                id="magic-link-click-here"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "16px 24px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 8px 32px rgba(108,99,255,0.35)",
                  transition: "opacity 0.15s, transform 0.15s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = "0.92";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                ✅ Click here to sign in
              </a>
            )}

            {/* Email notice */}
            <div
              style={{
                background: "var(--brand-light)",
                border: "1px solid rgba(108,99,255,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
                📬 A sign-in link was also sent to{" "}
                <strong style={{ color: "var(--text)" }}>{email}</strong>
              </p>
            </div>

            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 13, marginTop: 4 }}
              onClick={() => { setSent(false); setVerifyUrl(null); }}
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
