import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { publicApi } from "../api";
import type { PublicSurvey } from "../types";

// ── Question components (all inline for clarity) ──────────────────
function ShortTextQ({ label, required, value, onChange }: QProps) {
  return (
    <div className="question-block">
      <label className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="Your answer…"
          className="q-input"
        />
      </label>
    </div>
  );
}

function EmailQ({ label, required, value, onChange }: QProps) {
  const invalid = value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <div className="question-block">
      <label className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="you@example.com"
          className={`q-input${invalid ? " q-input-error" : ""}`}
          autoComplete="email"
        />
      </label>
      {invalid && <p className="q-field-error">Enter a valid email address</p>}
    </div>
  );
}

function PhoneQ({ label, required, value, onChange }: QProps) {
  return (
    <div className="question-block">
      <label className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="+91 98765 43210"
          className="q-input"
          autoComplete="tel"
        />
      </label>
    </div>
  );
}

function DateQ({ label, required, value, onChange }: QProps) {
  return (
    <div className="question-block">
      <p className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </p>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          if ("showPicker" in e.target) {
            (e.target as HTMLInputElement).showPicker();
          }
        }}
        required={required}
        className="q-input"
        style={{ cursor: "pointer", maxWidth: 220 }}
        min="2000-01-01"
        max="2100-12-31"
      />
    </div>
  );
}

function RatingQ({ label, required, value, onChange }: QProps) {
  const cur = Number(value) || 0;
  return (
    <fieldset className="question-block" style={{ border: "none", padding: 0, margin: 0 }}>
      <legend className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </legend>
      <div className="pub-rating-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`pub-star${n <= cur ? " active" : ""}`}
            onClick={() => onChange(cur === n ? "" : String(n))}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          >
            ⭐
          </button>
        ))}
        {cur > 0 && <span className="pub-rating-label">{cur}/5</span>}
      </div>
    </fieldset>
  );
}

function YesNoQ({ label, required, value, onChange }: QProps) {
  return (
    <fieldset className="question-block" style={{ border: "none", padding: 0, margin: 0 }}>
      <legend className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </legend>
      <div className="pub-yn-row">
        {(["Yes", "No"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pub-yn-btn${value === opt ? " active" : ""}`}
            onClick={() => onChange(value === opt ? "" : opt)}
            aria-pressed={value === opt}
          >
            {opt === "Yes" ? "👍" : "👎"} {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultipleChoiceQ({
  label,
  required,
  value,
  onChange,
  options,
}: QProps & { options: string[] }) {
  if (!options?.length)
    return (
      <div className="question-block">
        <p className="question-label">{label}</p>
        <p className="q-no-options">No options configured</p>
      </div>
    );
  return (
    <fieldset className="question-block" style={{ border: "none", padding: 0, margin: 0 }}>
      <legend className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </legend>
      <div className="pub-mc-list">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pub-mc-opt${value === opt ? " active" : ""}`}
            onClick={() => onChange(value === opt ? "" : opt)}
            aria-pressed={value === opt}
          >
            <span className="pub-mc-radio" aria-hidden="true" />
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxQ({ label, required, value, onChange, options }: QProps & { options: string[] }) {
  const selected = value ? value.split("|||").filter(Boolean) : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next.join("|||"));
  };
  if (!options?.length)
    return (
      <div className="question-block">
        <p className="question-label">{label}</p>
        <p className="q-no-options">No options configured</p>
      </div>
    );
  return (
    <fieldset className="question-block" style={{ border: "none", padding: 0, margin: 0 }}>
      <legend className="question-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </legend>
      <div className="pub-mc-list">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pub-mc-opt${selected.includes(opt) ? " active" : ""}`}
            onClick={() => toggle(opt)}
            aria-pressed={selected.includes(opt)}
          >
            <span className="pub-mc-check" aria-hidden="true">
              {selected.includes(opt) ? "✓" : ""}
            </span>
            {opt}
          </button>
        ))}
      </div>
      {selected.length > 0 && <p className="pub-mc-count">{selected.length} selected</p>}
    </fieldset>
  );
}

// ── Types ─────────────────────────────────────────────────────────
type QProps = { label: string; required: boolean; value: string; onChange: (v: string) => void };
type Q = PublicSurvey["questions"][0];

function QuestionRenderer({
  q,
  value,
  onChange,
}: { q: Q; value: string; onChange: (v: string) => void }) {
  const opts = q.options ?? [];
  const p: QProps = { label: q.label, required: q.required === 1, value, onChange };
  if (q.type === "short_text") return <ShortTextQ {...p} />;
  if (q.type === "email") return <EmailQ {...p} />;
  if (q.type === "phone") return <PhoneQ {...p} />;
  if (q.type === "date") return <DateQ {...p} />;
  if (q.type === "rating") return <RatingQ {...p} />;
  if (q.type === "yes_no") return <YesNoQ {...p} />;
  if (q.type === "multiple_choice") return <MultipleChoiceQ {...p} options={opts} />;
  if (q.type === "checkbox") return <CheckboxQ {...p} options={opts} />;
  // Fallback for any legacy type
  return (
    <div className="question-block">
      <label className="question-label">
        {q.label}
        {q.required === 1 && <span className="required-mark"> *</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer…"
          className="q-input"
        />
      </label>
    </div>
  );
}

// ── PDF helper ────────────────────────────────────────────────────
function printResponsePDF(survey: PublicSurvey, answers: Record<string, string>, sorted: Q[]) {
  const lines = sorted
    .map((q, i) => {
      const raw = answers[q.id] ?? "—";
      const val = q.type === "checkbox" ? raw.replace(/\|\|\|/g, ", ") : raw;
      return `<div class="pdf-q">
      <p class="pdf-num">Q${i + 1}</p>
      <div class="pdf-body">
        <p class="pdf-label">${q.label}${q.required ? " *" : ""}</p>
        <p class="pdf-answer">${val || "—"}</p>
      </div>
    </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${survey.title} — My Response</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;background:#fff;padding:40px}
.pdf-header{border-left:5px solid ${survey.brand_color};padding:12px 20px;margin-bottom:32px;background:${survey.brand_color}15}
.pdf-header h1{font-size:22px;font-weight:800}
.pdf-header p{font-size:12px;color:#666;margin-top:4px}
.pdf-q{display:flex;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #eee;page-break-inside:avoid}
.pdf-num{width:28px;height:28px;border-radius:50%;background:${survey.brand_color};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pdf-label{font-size:14px;font-weight:600;color:#222;margin-bottom:6px}
.pdf-answer{font-size:15px;color:#444;background:#f8f8f8;padding:8px 12px;border-radius:6px;border-left:3px solid ${survey.brand_color}}
@media print{body{padding:20px}}
</style></head><body>
<div class="pdf-header"><h1>${survey.title}</h1><p>Submitted on ${new Date().toLocaleString()}</p></div>
${lines}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to download PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ── Main page ─────────────────────────────────────────────────────
export function PublicSurveyPage() {
  const { surveyId } = useParams({ from: "/s/$surveyId" });
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    publicApi.getSurvey(surveyId).then((res) => {
      if (res.ok) {
        setSurvey(res.data);
        const c = res.data.brand_color;
        const root = document.documentElement;
        root.style.setProperty("--brand", c);
        root.style.setProperty("--brand-light", `color-mix(in srgb, ${c} 15%, white)`);
        root.style.setProperty("--brand-dark", `color-mix(in srgb, ${c} 80%, black)`);
        root.style.setProperty("--brand-hover", `color-mix(in srgb, ${c} 85%, black)`);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => {
      const root = document.documentElement;
      for (const k of ["--brand", "--brand-light", "--brand-dark", "--brand-hover"]) {
        root.style.removeProperty(k);
      }
    };
  }, [surveyId]);

  const handleChange = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    const sorted = [...survey.questions].sort((a, b) => a.position - b.position);
    const errs: Record<string, string> = {};
    for (const q of sorted) {
      if (q.required === 1 && !(answers[q.id] ?? "").trim()) {
        errs[q.id] = "This question is required";
      }
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstId = Object.keys(errs)[0];
      document
        .getElementById(`q-${firstId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const payload = Object.entries(answers)
      .filter(([, v]) => v.trim() !== "")
      .map(([questionId, value]) => ({ questionId, value }));

    try {
      const res = await publicApi.respond(surveyId, payload);
      if (res.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError(res.error ?? "Submission failed. Try again.");
      }
    } catch {
      setSubmitError("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="pub-loading">
        <div className="spinner" />
        <p style={{ marginTop: 16, color: "var(--text-3)" }}>Loading survey…</p>
      </div>
    );

  if (notFound || !survey)
    return (
      <div className="pub-page">
        <div className="pub-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: 56, marginBottom: 16 }}>😕</p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Survey not found</h1>
          <p style={{ color: "var(--text-3)" }}>
            This link may be invalid or the survey was deleted.
          </p>
        </div>
      </div>
    );

  const sorted = [...survey.questions].sort((a, b) => a.position - b.position);
  const answered = sorted.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const progress = sorted.length > 0 ? Math.round((answered / sorted.length) * 100) : 0;
  const shareUrl = `${window.location.origin}/s/${surveyId}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`Fill out "${survey.title}": ${shareUrl}`)}`;

  // ── Thank you screen ──
  if (submitted)
    return (
      <div className="pub-page">
        <div
          className="pub-brand-bar"
          style={{
            background: `linear-gradient(135deg, ${survey.brand_color}, color-mix(in srgb, ${survey.brand_color} 60%, #7c3aed))`,
          }}
        >
          {survey.logo_url && (
            <img
              src={survey.logo_url}
              alt="logo"
              className="pub-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <h1 className="pub-brand-title">{survey.title}</h1>
        </div>
        <div className="pub-inner">
          <div className="pub-thankyou">
            <div className="pub-thankyou-icon">🎉</div>
            <h2 className="pub-thankyou-title">Response submitted!</h2>
            <p className="pub-thankyou-sub">Thank you for completing this survey.</p>
            <div className="pub-thankyou-actions">
              <button
                type="button"
                className="pub-pdf-btn"
                onClick={() => printResponsePDF(survey, answers, sorted)}
                id="download-pdf-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                See response (PDF)
              </button>
              <a href={shareUrl} className="pub-again-btn">
                ↩ Fill out again
              </a>
            </div>
          </div>
        </div>
      </div>
    );

  // ── Survey form ──
  return (
    <div className="pub-page">
      {/* Brand header */}
      <div
        className="pub-brand-bar"
        style={{
          background: `linear-gradient(135deg, ${survey.brand_color}, color-mix(in srgb, ${survey.brand_color} 60%, #7c3aed))`,
        }}
      >
        {survey.logo_url && (
          <img
            src={survey.logo_url}
            alt="logo"
            className="pub-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <h1 className="pub-brand-title">{survey.title}</h1>
        {survey.description && <p className="pub-brand-desc">{survey.description}</p>}
      </div>

      {/* Progress bar */}
      <div className="pub-progress-wrap" title={`${answered} of ${sorted.length} answered`}>
        <div
          className="pub-progress-bar"
          style={{ width: `${progress}%`, background: survey.brand_color }}
        />
        <span className="pub-progress-label">
          {answered} / {sorted.length} answered
        </span>
      </div>

      <div className="pub-inner">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {sorted.map((q, idx) => (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`pub-question-card${errors[q.id] ? " pub-question-error" : ""}`}
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="pub-q-num">{idx + 1}</div>
              <div className="pub-question-wrap">
                <QuestionRenderer
                  q={q}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => handleChange(q.id, v)}
                />
                {errors[q.id] && (
                  <p className="pub-field-error" role="alert">
                    ⚠ {errors[q.id]}
                  </p>
                )}
              </div>
            </div>
          ))}

          {submitError && (
            <div className="pub-submit-error" role="alert">
              <strong>Submission failed:</strong> {submitError}
            </div>
          )}

          <button
            type="submit"
            className="pub-submit-btn"
            disabled={submitting}
            id="pub-submit-btn"
            style={{ background: survey.brand_color }}
          >
            {submitting ? (
              <>
                <span
                  className="btn-spinner"
                  style={{ borderTopColor: "#fff", width: 18, height: 18, borderWidth: 2 }}
                />
                Submitting…
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Submit response
              </>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", marginTop: 20 }}>
            Powered by Survey Builder · Your response is saved securely
          </p>
        </form>
      </div>
    </div>
  );
}
