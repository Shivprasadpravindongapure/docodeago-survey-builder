import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { responsesApi, surveysApi } from "../api";
import { Button } from "../components/ui/Button";
import type { Question, Response, ResponseAnswer, Survey } from "../types";

type ResponseWithAnswers = Response & { answers: ResponseAnswer[] };
type Tab = "table" | "analytics";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Analytics helpers ────────────────────────────────────────────────────────
function avg(nums: number[]): string {
  if (!nums.length) return "—";
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

function countChoices(responses: ResponseWithAnswers[], questionId: string, options: string[]) {
  const counts: Record<string, number> = {};
  for (const o of options) counts[o] = 0;
  for (const r of responses) {
    const val = r.answers.find((a) => a.question_id === questionId)?.value;
    if (val && val in counts) counts[val]++;
  }
  return counts;
}

// ── CSV export ───────────────────────────────────────────────────────────────
function exportCsv(survey: Survey, questions: Question[], responses: ResponseWithAnswers[]) {
  const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const headers = ["Submitted", ...questions.map((q) => q.label)];
  const rows = responses.map((r) => [
    formatDate(r.submitted_at),
    ...questions.map((q) => r.answers.find((a) => a.question_id === q.id)?.value ?? ""),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${survey.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────────
function AnalyticsPanel({
  questions,
  responses,
}: { questions: Question[]; responses: ResponseWithAnswers[] }) {
  const total = responses.length;
  if (total === 0)
    return <p style={{ color: "var(--text-3)", fontSize: 14 }}>No responses to analyse yet.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {[
          { label: "Total responses", value: total },
          { label: "Questions", value: questions.length },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-2)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 30, fontWeight: 800, color: "var(--brand)", margin: 0 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-question breakdown */}
      {questions.map((q) => {
        const answered = responses.filter((r) =>
          r.answers.some((a) => a.question_id === q.id && a.value.trim()),
        );
        const pct = total ? Math.round((answered.length / total) * 100) : 0;

        if (q.type === "rating") {
          const nums = answered
            .map((r) => Number(r.answers.find((a) => a.question_id === q.id)?.value))
            .filter((n) => !Number.isNaN(n) && n > 0);
          const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          for (const n of nums) dist[n] = (dist[n] ?? 0) + 1;
          const maxCount = Math.max(...Object.values(dist), 1);
          return (
            <div
              key={q.id}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 16,
                }}
              >
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{q.label}</p>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Avg: <strong style={{ color: "var(--brand)" }}>{avg(nums)}</strong> ·{" "}
                  {answered.length}/{total} answered
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
                {([1, 2, 3, 4, 5] as const).map((star) => {
                  const h = maxCount ? Math.max(8, (dist[star] / maxCount) * 64) : 8;
                  return (
                    <div
                      key={star}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{dist[star]}</span>
                      <div
                        style={{
                          width: "100%",
                          height: h,
                          background: "var(--brand)",
                          borderRadius: 4,
                          opacity: 0.7 + star / 10,
                        }}
                      />
                      <span style={{ fontSize: 12 }}>{"★".repeat(star)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (q.type === "multiple_choice" && q.options?.length) {
          const counts = countChoices(responses, q.id, q.options);
          const maxCount = Math.max(...Object.values(counts), 1);
          return (
            <div
              key={q.id}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{q.label}</p>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {answered.length}/{total} answered
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt) => {
                  const c = counts[opt] ?? 0;
                  const barPct = (c / maxCount) * 100;
                  const optPct = total ? Math.round((c / total) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{opt}</span>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {c} ({optPct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: "var(--bg-3)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${barPct}%`,
                            background: "var(--brand)",
                            borderRadius: 4,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // short_text / long_text — show response rate + last few answers
        const sample = answered
          .slice(-3)
          .map((r) => r.answers.find((a) => a.question_id === q.id)?.value ?? "");
        return (
          <div
            key={q.id}
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{q.label}</p>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{pct}% response rate</span>
            </div>
            {sample.map((s) => (
              <p
                key={`${s.slice(0, 50)}-${s.length}`}
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  padding: "8px 12px",
                  background: "var(--bg-3)",
                  borderRadius: "var(--radius)",
                  marginBottom: 6,
                  borderLeft: "3px solid var(--brand)",
                }}
              >
                "{s}"
              </p>
            ))}
            {answered.length > 3 && (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                …and {answered.length - 3} more
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function ResponsesPage() {
  const { id } = useParams({ from: "/surveys/$id/responses" });
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    Promise.all([surveysApi.get(id), responsesApi.list(id)]).then(([surveyRes, responsesRes]) => {
      if (surveyRes.ok) {
        setSurvey(surveyRes.data);
        setQuestions([...surveyRes.data.questions].sort((a, b) => a.position - b.position));
      } else {
        navigate({ to: "/dashboard" });
      }
      if (responsesRes.ok) setResponses(responsesRes.data);
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading)
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );

  const getAnswer = (r: ResponseWithAnswers, questionId: string) =>
    r.answers.find((a) => a.question_id === questionId)?.value ?? "—";

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
            ← Dashboard
          </Button>
          <span style={{ width: 1, height: 20, background: "var(--border)", display: "block" }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{survey?.title}</span>
        </div>
        <div className="flex gap-2" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            {responses.length} response{responses.length !== 1 ? "s" : ""}
          </span>
          {responses.length > 0 && survey && (
            <Button
              variant="secondary"
              size="sm"
              id="export-csv-btn"
              onClick={() => exportCsv(survey, questions, responses)}
            >
              ⬇️ CSV
            </Button>
          )}
        </div>
      </nav>

      <div className="page-container">
        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 28,
            background: "var(--bg-2)",
            padding: 4,
            borderRadius: "var(--radius-lg)",
            width: "fit-content",
            border: "1px solid var(--border)",
          }}
        >
          {(["analytics", "table"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: tab === t ? "var(--brand)" : "transparent",
                color: tab === t ? "#fff" : "var(--text-2)",
                fontWeight: tab === t ? 700 : 400,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t === "analytics" ? "📊 Analytics" : "📋 All responses"}
            </button>
          ))}
        </div>

        {responses.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 280 }}>
            <p style={{ fontSize: 48 }}>📭</p>
            <h3>No responses yet</h3>
            <p>Share your survey to start collecting responses.</p>
            <Button
              variant="secondary"
              id="copy-link-from-responses-btn"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/s/${id}`);
              }}
            >
              🔗 Copy survey link
            </Button>
          </div>
        ) : tab === "analytics" ? (
          <AnalyticsPanel questions={questions} responses={responses} />
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
