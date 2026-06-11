import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { surveysApi } from "../api";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import type { SurveyWithResponseCount } from "../types";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="toast-container">
      <div className="toast">{message}</div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="15"
          width="80"
          height="90"
          rx="8"
          fill="var(--bg-3)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <rect x="32" y="32" width="56" height="6" rx="3" fill="var(--brand)" opacity="0.7" />
        <rect x="32" y="46" width="42" height="5" rx="2.5" fill="var(--border)" />
        <rect x="32" y="58" width="50" height="5" rx="2.5" fill="var(--border)" />
        <rect x="32" y="70" width="38" height="5" rx="2.5" fill="var(--border)" />
        <circle cx="88" cy="88" r="18" fill="var(--brand)" />
        <path d="M82 88h12M88 82v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h3>No surveys yet</h3>
      <p>Create your first survey and start collecting responses in minutes.</p>
      <Button variant="primary" onClick={onCreate} id="create-first-survey-btn">
        + Create your first survey
      </Button>
    </div>
  );
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyWithResponseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    surveysApi.list().then((res) => {
      if (res.ok) {
        setSurveys(res.data);
      }
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    const res = await surveysApi.create({ title: "Untitled Survey" });
    if (res.ok) {
      navigate({ to: "/builder/$id", params: { id: res.data.id } });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    const res = await surveysApi.delete(id);
    if (res.ok) {
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast("🔗 Link copied!");
    });
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/builder/$id", params: { id } });
  };

  const handleResponses = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/surveys/$id/responses", params: { id } });
  };

  return (
    <>
      {/* Topbar */}
      <nav className="topbar">
        <span className="topbar-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="var(--brand)" />
            <path d="M7 8h14M7 13h10M7 18h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="white" opacity="0.9" />
            <path d="M19.5 18l1 1 2-2" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Survey-Builders
        </span>
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>{user?.email}</span>
          <Button variant="primary" size="sm" onClick={handleCreate} id="new-survey-btn">
            + New Survey
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} id="logout-btn">
            Sign out
          </Button>
        </div>
      </nav>

      <div className="page-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem" }}>Your Surveys</h1>
            <p style={{ color: "var(--text-3)", fontSize: 14, marginTop: 4 }}>
              {surveys.length} survey{surveys.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: 300 }}>
            <div className="spinner" />
          </div>
        ) : surveys.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <div className="survey-grid">
            {surveys.map((s) => (
              <article
                key={s.id}
                className="survey-card"
                style={{ "--survey-color": s.brand_color } as React.CSSProperties}
              >
                <p className="survey-card-title">{s.title}</p>
                <p className="survey-card-meta">
                  {s.question_count} question{s.question_count !== 1 ? "s" : ""} ·{" "}
                  {s.response_count} response{s.response_count !== 1 ? "s" : ""}
                </p>
                <div className="survey-card-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleEdit(s.id, e)}
                    id={`edit-survey-${s.id}`}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleShare(s.id, e)}
                    id={`share-survey-${s.id}`}
                  >
                    🔗 Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleResponses(s.id, e)}
                    id={`responses-survey-${s.id}`}
                  >
                    📊 Responses
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => handleDelete(s.id, e)}
                    id={`delete-survey-${s.id}`}
                  >
                    🗑
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
