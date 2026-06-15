import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi, surveysApi } from "../api";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import type { SurveyWithResponseCount } from "../types";

// Extend user type to include hasPassword flag returned from /auth/me
interface UserWithPassword {
  email: string;
  id: string;
  hasPassword?: boolean;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-container">
      <div className="toast">{message}</div>
    </div>
  );
}

// ─── Set Password Modal ───────────────────────────────────────────────────────
function SetPasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await authApi.setPassword(password);
    setLoading(false);
    if (res.ok) {
      onSuccess();
    } else {
      setError(res.error || "Failed to save password.");
    }
  };

  const handleOverlayKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <dialog
      className="modal-overlay"
      open
      onKeyDown={handleOverlayKey}
      aria-label="Set password dialog"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: inner card stops propagation only */}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">🔑 Set a Password</h3>
            <p className="modal-subtitle">
              Sign in with email + password next time — no magic link needed.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="modal-password">
              New password{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(min 8 chars)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="modal-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-3)",
                  fontSize: 13,
                }}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="modal-confirm">Confirm password</label>
            <input
              id="modal-confirm"
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
            />
          </div>

          {error && (
            <p className="auth-error" style={{ marginBottom: 14 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading} id="save-password-btn">
              {loading ? (
                <span className="btn-spinner" style={{ borderTopColor: "#fff" }} />
              ) : (
                "Save password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 64, lineHeight: 1 }}>📋</div>
      <h3>No surveys yet</h3>
      <p>Create your first survey and start collecting branded responses in minutes.</p>
      <Button variant="primary" onClick={onCreate} id="create-first-survey-btn">
        + Create your first survey
      </Button>
    </div>
  );
}

// ─── Survey Card ──────────────────────────────────────────────────────────────
function SurveyCard({
  survey,
  onEdit,
  onShare,
  onResponses,
  onDelete,
}: {
  survey: SurveyWithResponseCount;
  onEdit: () => void;
  onShare: () => void;
  onResponses: () => void;
  onDelete: () => void;
}) {
  const created = new Date(survey.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      className="survey-card"
      style={{ "--survey-color": survey.brand_color } as React.CSSProperties}
    >
      <div className="survey-card-accent" />
      <div className="survey-card-body">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <p className="survey-card-title" title={survey.title}>
            {survey.title}
          </p>
        </div>

        <div className="survey-card-stats">
          <span className="stat-pill">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 4h10M3 8h8M3 12h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {survey.question_count} question{survey.question_count !== 1 ? "s" : ""}
          </span>
          <span className="stat-pill stat-pill-responses">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13 9.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM8 7v2.5l1.5 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {survey.response_count} response{survey.response_count !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="survey-card-date">Created {created}</p>
      </div>

      <div className="survey-card-actions">
        <button
          type="button"
          className="card-action-btn card-action-edit"
          onClick={onEdit}
          id={`edit-${survey.id}`}
          title="Edit survey"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M11 2l3 3-9 9H2v-3L11 2z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          Edit
        </button>
        <button
          type="button"
          className="card-action-btn card-action-share"
          onClick={onShare}
          id={`share-${survey.id}`}
          title="Copy share link"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 1l5 5-5 5M15 6H6a4 4 0 0 0-4 4v1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share
        </button>
        <button
          type="button"
          className="card-action-btn card-action-responses"
          onClick={onResponses}
          id={`responses-${survey.id}`}
          title="View responses"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 12h1.5M2 8h3M2 4h5M7 12h7M7 8h7M7 4h7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          Responses
        </button>
        <button
          type="button"
          className="card-action-btn card-action-delete"
          onClick={onDelete}
          id={`delete-${survey.id}`}
          title="Delete survey"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const typedUser = user as UserWithPassword | null;
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyWithResponseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    surveysApi.list().then((res) => {
      if (res.ok) setSurveys(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  const handleCreate = async () => {
    const res = await surveysApi.create({ title: "Untitled Survey" });
    if (res.ok) navigate({ to: "/builder/$id", params: { id: res.data.id } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this survey? All responses will be lost.")) return;
    const res = await surveysApi.delete(id);
    if (res.ok) {
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      setToast("🗑️ Survey deleted");
    }
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url).then(() => setToast("🔗 Share link copied!"));
  };

  const totalResponses = surveys.reduce((sum, s) => sum + s.response_count, 0);

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu((v) => !v);
  };

  return (
    <>
      {/* ── Topbar ── */}
      <nav className="topbar">
        <span className="topbar-logo">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="var(--brand)" />
            <path
              d="M7 8h14M7 13h10M7 18h12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="21" cy="18" r="4" fill="white" opacity="0.9" />
            <path
              d="M19.5 18l1 1 2-2"
              stroke="var(--brand)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Survey-Builders
        </span>

        <div className="topbar-right">
          <Button variant="primary" size="sm" onClick={handleCreate} id="new-survey-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New Survey
          </Button>

          {/* User avatar / menu */}
          <button
            type="button"
            className="user-menu-wrapper"
            onClick={toggleUserMenu}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="user-avatar" title={typedUser?.email}>
              {typedUser?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            {showUserMenu && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <p className="user-dropdown-email">{typedUser?.email}</p>
                  <p className="user-dropdown-role">
                    {typedUser?.hasPassword ? "Password + magic link" : "Magic link only"}
                  </p>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="user-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    setShowPasswordModal(true);
                  }}
                  id="set-password-menu-btn"
                >
                  🔑 {typedUser?.hasPassword ? "Change password" : "Set a password"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="user-dropdown-item user-dropdown-item-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    logout();
                  }}
                  id="logout-btn"
                >
                  ← Sign out
                </button>
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* ── Page body ── */}
      <div className="page-container">
        {/* Stats bar */}
        {!loading && surveys.length > 0 && (
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat-num">{surveys.length}</span>
              <span className="dash-stat-label">Survey{surveys.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span className="dash-stat-num">{totalResponses}</span>
              <span className="dash-stat-label">Total responses</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span
                className="dash-stat-num"
                style={{ color: typedUser?.hasPassword ? "#4ade80" : "#facc15" }}
              >
                {typedUser?.hasPassword ? "✓" : "!"}
              </span>
              <span className="dash-stat-label">
                {typedUser?.hasPassword ? (
                  "Password set"
                ) : (
                  <button
                    type="button"
                    className="dash-stat-link"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Set a password →
                  </button>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="dash-section-header">
          <div>
            <h1 className="dash-title">Your Surveys</h1>
            {!loading && surveys.length > 0 && (
              <p className="dash-subtitle">
                {surveys.length} survey{surveys.length !== 1 ? "s" : ""} · {totalResponses} response
                {totalResponses !== 1 ? "s" : ""} total
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-center" style={{ minHeight: 320 }}>
            <div className="spinner" />
          </div>
        ) : surveys.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <div className="survey-grid">
            {surveys.map((s) => (
              <SurveyCard
                key={s.id}
                survey={s}
                onEdit={() => navigate({ to: "/builder/$id", params: { id: s.id } })}
                onShare={() => handleShare(s.id)}
                onResponses={() => navigate({ to: "/surveys/$id/responses", params: { id: s.id } })}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals / Overlays ── */}
      {showPasswordModal && (
        <SetPasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            setToast("✅ Password saved! You can now sign in with email + password.");
            refreshUser();
          }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
