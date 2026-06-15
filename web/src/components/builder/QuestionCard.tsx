import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Question, QuestionType } from "../../types";

interface QuestionCardProps {
  question: Question;
  onUpdate: (id: string, fields: Partial<Question>) => void;
  onDelete: (id: string) => void;
}

const LABELS: Partial<Record<QuestionType, string>> = {
  short_text: "Short Text",
  multiple_choice: "Multiple Choice",
  checkbox: "Multi-Select",
  rating: "1–5 Rating",
  yes_no: "Yes / No",
  date: "Date",
  email: "Email",
  phone: "Phone",
};

const ICONS: Partial<Record<QuestionType, string>> = {
  short_text: "✏️",
  multiple_choice: "🔘",
  checkbox: "☑️",
  rating: "⭐",
  yes_no: "👍",
  date: "📅",
  email: "📧",
  phone: "📱",
};

const HINTS: Partial<Record<QuestionType, string>> = {
  short_text: "Respondents type a short text answer",
  multiple_choice: "Respondents pick exactly one option (also works as a poll/vote)",
  checkbox: "Respondents can pick multiple options",
  rating: "Respondents click 1 to 5 stars",
  yes_no: "Respondents tap Yes or No",
  date: "Respondents pick a date from a calendar",
  email: "Validated email address (e.g. name@example.com)",
  phone: "Phone number with tel keyboard on mobile",
};

const NEEDS_OPTIONS: QuestionType[] = ["multiple_choice", "checkbox"];

export function QuestionCard({ question, onUpdate, onDelete }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const [options, setOptions] = useState<string[]>(question.options ?? []);
  const [newOpt, setNewOpt] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const pushOptions = (next: string[]) => {
    setOptions(next);
    onUpdate(question.id, { options: next });
  };

  const addOption = () => {
    const text = newOpt.trim() || `Option ${options.length + 1}`;
    pushOptions([...options, text]);
    setNewOpt("");
  };

  const updateOpt = (i: number, val: string) =>
    pushOptions(options.map((o, idx) => (idx === i ? val : o)));

  const removeOpt = (i: number) => pushOptions(options.filter((_, idx) => idx !== i));

  const moveOpt = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= options.length) return;
    const next = [...options];
    [next[i], next[t]] = [next[t], next[i]];
    pushOptions(next);
  };

  const needsOptions = NEEDS_OPTIONS.includes(question.type);

  return (
    <div ref={setNodeRef} style={style} className={`qcard${isDragging ? " qcard-dragging" : ""}`}>
      {/* ── Top row ── */}
      <div className="qcard-top">
        <div
          className="qcard-drag"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="5" cy="4" r="1.5" fill="currentColor" />
            <circle cx="5" cy="8" r="1.5" fill="currentColor" />
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="11" cy="4" r="1.5" fill="currentColor" />
            <circle cx="11" cy="8" r="1.5" fill="currentColor" />
            <circle cx="11" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <span className="qcard-badge">
          <span>{ICONS[question.type] ?? "❓"}</span>
          {LABELS[question.type] ?? question.type}
        </span>

        <label className="qcard-required">
          <input
            type="checkbox"
            checked={question.required === 1}
            onChange={(e) => onUpdate(question.id, { required: e.target.checked ? 1 : 0 })}
          />
          <span>Required</span>
        </label>

        <button
          type="button"
          className="qcard-delete"
          onClick={() => onDelete(question.id)}
          aria-label={`Delete: ${question.label}`}
          id={`delete-q-${question.id}`}
          title="Remove question"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

      {/* ── Body ── */}
      <div className="qcard-body">
        {/* Question label */}
        <div className="qcard-field">
          <label htmlFor={`lbl-${question.id}`} className="qcard-label">
            Question text
          </label>
          <input
            id={`lbl-${question.id}`}
            type="text"
            value={question.label}
            onChange={(e) => onUpdate(question.id, { label: e.target.value })}
            placeholder="Type your question here…"
            className="qcard-input"
          />
        </div>

        {/* Options editor — Multiple Choice & Multi-Select */}
        {needsOptions && (
          <div className="qcard-field" style={{ marginTop: 12 }}>
            <div className="qcard-options-header">
              <span className="qcard-label">
                Options
                <span style={{ fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>
                  ({options.length})
                </span>
              </span>
            </div>

            {options.length === 0 && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-4)",
                  fontStyle: "italic",
                  marginBottom: 8,
                }}
              >
                No options yet — add one below ↓
              </p>
            )}

            {/* Option rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {options.map((opt, i) => (
                <div key={`${question.id}-${i}`} className="qcard-option-row">
                  {/* Up / Down */}
                  <div className="qcard-opt-arrows">
                    <button
                      type="button"
                      onClick={() => moveOpt(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      title="Move up"
                      className="qcard-arrow-btn"
                      style={{ opacity: i === 0 ? 0.3 : 1 }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOpt(i, 1)}
                      disabled={i === options.length - 1}
                      aria-label="Move down"
                      title="Move down"
                      className="qcard-arrow-btn"
                      style={{ opacity: i === options.length - 1 ? 0.3 : 1 }}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Number badge */}
                  <span className="qcard-opt-num">{i + 1}</span>

                  {/* Text input */}
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOpt(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    aria-label={`Option ${i + 1}`}
                    className="qcard-opt-input"
                  />

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeOpt(i)}
                    aria-label={`Remove option: ${opt}`}
                    title="Remove"
                    className="qcard-opt-remove"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M2 2l8 8M10 2L2 10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add option row */}
            <div className="qcard-add-opt-row">
              <input
                type="text"
                value={newOpt}
                onChange={(e) => setNewOpt(e.target.value)}
                placeholder={"New option…"}
                aria-label="New option text"
                className="qcard-opt-new"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
              <button type="button" onClick={addOption} className="qcard-add-opt">
                + Add
              </button>
            </div>
          </div>
        )}

        {/* Type hint */}
        {HINTS[question.type] && (
          <div className="qcard-hint">
            {ICONS[question.type]} {HINTS[question.type]}
          </div>
        )}
      </div>
    </div>
  );
}
