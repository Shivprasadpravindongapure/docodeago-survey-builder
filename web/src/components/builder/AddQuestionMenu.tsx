import { useEffect, useRef, useState } from "react";
import type { QuestionType } from "../../types";

interface AddQuestionMenuProps {
  onAdd: (type: QuestionType) => void;
}

const TYPES: { type: QuestionType; label: string; icon: string; desc: string; color: string }[] = [
  {
    type: "short_text",
    label: "Short Text",
    icon: "✏️",
    desc: "Single line text answer",
    color: "#6366f1",
  },
  {
    type: "multiple_choice",
    label: "Multiple Choice",
    icon: "🔘",
    desc: "Pick one · also used as a poll",
    color: "#0ea5e9",
  },
  {
    type: "checkbox",
    label: "Multi-Select",
    icon: "☑️",
    desc: "Pick multiple answers",
    color: "#7c3aed",
  },
  {
    type: "rating",
    label: "1–5 Rating",
    icon: "⭐",
    desc: "Star rating from 1 to 5",
    color: "#f59e0b",
  },
  {
    type: "yes_no",
    label: "Yes / No",
    icon: "👍",
    desc: "Quick binary question",
    color: "#10b981",
  },
  { type: "date", label: "Date", icon: "📅", desc: "Calendar date picker", color: "#8b5cf6" },
  { type: "email", label: "Email", icon: "📧", desc: "Validated email address", color: "#ec4899" },
  { type: "phone", label: "Phone", icon: "📱", desc: "Phone number input", color: "#14b8a6" },
];

function QuestionTypeModal({
  onAdd,
  onClose,
}: {
  onAdd: (t: QuestionType) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape key is handled via document listener above
    <div
      className="aqm-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="aqm-modal" aria-label="Choose question type" ref={ref} tabIndex={-1}>
        {/* Header */}
        <div className="aqm-modal-header">
          <div>
            <p className="aqm-modal-title">Choose Question Type</p>
            <p className="aqm-modal-sub">Click a type to add it to your survey</p>
          </div>
          <button type="button" className="aqm-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 4×2 type grid */}
        <div className="aqm-type-grid" role="menu">
          {TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              className="aqm-type-card"
              role="menuitem"
              onClick={() => {
                onAdd(t.type);
                onClose();
              }}
              id={`add-q-${t.type}`}
              style={{ "--card-color": t.color } as React.CSSProperties}
            >
              <span className="aqm-type-icon">{t.icon}</span>
              <span className="aqm-type-label">{t.label}</span>
              <span className="aqm-type-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddQuestionMenu({ onAdd }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="add-q-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        id="add-question-btn"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        Add Question
      </button>

      {open && <QuestionTypeModal onAdd={onAdd} onClose={() => setOpen(false)} />}
    </>
  );
}
