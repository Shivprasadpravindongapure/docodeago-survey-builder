import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { responsesApi, surveysApi } from "../api";
import { Button } from "../components/ui/Button";
import type { Question, Response, ResponseAnswer, Survey } from "../types";

type ResponseWithAnswers = Response & { answers: ResponseAnswer[] };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ResponsesPage() {
  const { id } = useParams({ from: "/surveys/$id/responses" });
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([surveysApi.get(id), responsesApi.list(id)]).then(([surveyRes, responsesRes]) => {
      if (surveyRes.ok) {
        setSurvey(surveyRes.data);
        const sorted = [...surveyRes.data.questions].sort((a, b) => a.position - b.position);
        setQuestions(sorted);
      } else {
        navigate({ to: "/dashboard" });
      }
      if (responsesRes.ok) {
        setResponses(responsesRes.data);
      }
      setLoading(false);
    });
  }, [id, navigate]);

  const getAnswer = (response: ResponseWithAnswers, questionId: string): string => {
    return response.answers.find((a) => a.question_id === questionId)?.value ?? "—";
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <nav className="topbar">
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            id="back-to-dashboard-responses-btn"
          >
            ← Back to dashboard
          </Button>
          <span style={{ width: 1, height: 20, background: "var(--border)", display: "block" }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{survey?.title}</span>
        </div>
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>
          {responses.length} response{responses.length !== 1 ? "s" : ""}
        </span>
      </nav>

      <div className="page-container">
        <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Responses</h1>

        {responses.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 280 }}>
            <p style={{ fontSize: 48 }}>📭</p>
            <h3>No responses yet</h3>
            <p>Share your survey to start collecting responses.</p>
            <Button
              variant="secondary"
              onClick={() => {
                const url = `${window.location.origin}/s/${id}`;
                navigator.clipboard.writeText(url);
              }}
              id="copy-link-from-responses-btn"
            >
              🔗 Copy survey link
            </Button>
          </div>
        ) : (
          <div className="responses-table-wrapper">
            <table className="responses-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  {questions.map((q) => (
                    <th key={q.id}>{q.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-3)", fontSize: 12 }}>
                      {formatDate(r.submitted_at)}
                    </td>
                    {questions.map((q) => (
                      <td key={q.id}>{getAnswer(r, q.id)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
