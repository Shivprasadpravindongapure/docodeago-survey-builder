import { useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi } from "../api";

interface VerifySearch { token?: string; }

export function VerifyPage() {
  const search = useSearch({ from: "/verify" }) as VerifySearch;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = search.token;
    if (!token) {
      setError("No token found in URL. Please request a new magic link.");
      return;
    }

    // Verify the token → always go straight to dashboard on success.
    // The user can set a password any time from the dashboard user menu.
    authApi.verify(token).then((res) => {
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(res.error || "Invalid or expired link. Please request a new one.");
      }
    });
  }, [search.token]);

  // ── Verifying (spinner) ──
  if (!error) {
    return (
      <div className="auth-page">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-card" style={{ textAlign: "center", gap: 16 }}>
          <div className="auth-brand" style={{ justifyContent: "center", marginBottom: 0 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="var(--brand)" />
              <path d="M7 8h14M7 13h10M7 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="18" r="4" fill="white" opacity="0.9" />
              <path d="M19.5 18l1 1 2-2" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="auth-brand-name">Survey-Builders</h1>
          </div>

          <div
            className="btn-spinner"
            style={{ width: 40, height: 40, margin: "8px auto", borderWidth: 3, borderTopColor: "var(--brand)", borderColor: "var(--border)" }}
          />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text)" }}>Signing you in…</h2>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>Hang tight, almost there!</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand" style={{ justifyContent: "center", marginBottom: 24 }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="var(--brand)" />
            <path d="M7 8h14M7 13h10M7 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h1 className="auth-brand-name">Survey-Builders</h1>
        </div>

        <p style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>⚠️</p>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>
          Link Expired or Invalid
        </h2>
        <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          {error}
        </p>
        <a href="/login" className="btn-primary btn-full" id="back-to-login-btn"
          style={{ display: "flex", justifyContent: "center", padding: "13px 20px", borderRadius: "var(--radius-lg)", fontSize: 15 }}>
          ← Back to login
        </a>
      </div>
    </div>
  );
}
