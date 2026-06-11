import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi } from "../api";

interface VerifySearch {
  token?: string;
}

export function VerifyPage() {
  const search = useSearch({ from: "/verify" }) as VerifySearch;
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = search.token;
    if (!token) {
      setError("No token found in URL. Please request a new magic link.");
      setLoading(false);
      return;
    }

    authApi.verify(token).then((res) => {
      if (res.ok) {
        // Hard redirect (not SPA navigate) so the browser re-sends the
        // SameSite=None session cookie in the new page context
        window.location.href = "/dashboard";
      } else {
        setError(res.error || "Invalid or expired token. Please request a new link.");
        setLoading(false);
      }
    });
  }, [search.token, navigate]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.2rem" }}>Verifying your link…</h2>
          <p style={{ color: "var(--text-3)", fontSize: 14, marginTop: 8 }}>Just a moment!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
        <h2 style={{ fontSize: "1.3rem", color: "var(--text)", marginBottom: 10 }}>
          Verification Failed
        </h2>
        <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24 }}>{error}</p>
        <a
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--brand)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "var(--radius)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Back to login
        </a>
      </div>
    </div>
  );
}
