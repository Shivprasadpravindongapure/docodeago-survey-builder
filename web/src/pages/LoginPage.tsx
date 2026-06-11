import { useState } from "react";
import { authApi } from "../api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await authApi.magicLink(email);
    setLoading(false);

    if (res.ok) {
      setSent(true);
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
          <div
            style={{
              background: "var(--brand-light)",
              border: "1px solid var(--brand)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 28, marginBottom: 8 }}>📬</p>
            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Check your email!
            </p>
            <p style={{ fontSize: 13, color: "var(--text-2)" }}>
              For local dev — copy the token from the Wrangler console and visit:
            </p>
            <code
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 12,
                background: "var(--bg-3)",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                color: "var(--brand)",
                wordBreak: "break-all",
              }}
            >
              /verify?token=&lt;token from console&gt;
            </code>

            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 16, fontSize: 13 }}
              onClick={() => setSent(false)}
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
