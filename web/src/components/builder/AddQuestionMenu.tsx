import { useEffect, useRef, useState } from "react";
import type { QuestionType } from "../../types";

interface AddQuestionMenuProps {
  onAdd: (type: QuestionType) => void;
}

const OPTIONS: { type: QuestionType; label: string; icon: string; desc: string; group: string }[] = [
  // Basic
  { type: "short_text",      label: "Short Text",       icon: "✏️",  desc: "Single line answer",          group: "Text" },
  { type: "long_text",       label: "Long Text",        icon: "📝",  desc: "Paragraph / multi-line",       group: "Text" },
  { type: "email",           label: "Email",            icon: "📧",  desc: "Validated email address",      group: "Text" },
  { type: "phone",           label: "Phone",            icon: "📱",  desc: "Phone number input",           group: "Text" },
  // Choice
  { type: "multiple_choice", label: "Multiple Choice",  icon: "🔘",  desc: "Pick exactly one option",      group: "Choice" },
  { type: "checkbox",        label: "Checkboxes",       icon: "☑️",  desc: "Pick multiple options",        group: "Choice" },
  { type: "dropdown",        label: "Dropdown",         icon: "🔽",  desc: "Select from a list",           group: "Choice" },
  { type: "yes_no",          label: "Yes / No",         icon: "👍",  desc: "Quick binary answer",          group: "Choice" },
  // Scale / Rating
  { type: "rating",          label: "Star Rating",      icon: "⭐",  desc: "1–5 star rating",              group: "Scale" },
  { type: "nps",             label: "NPS Score",        icon: "📊",  desc: "Net promoter score 0–10",      group: "Scale" },
  { type: "scale",           label: "Scale Slider",     icon: "🎚️",  desc: "Drag slider from 1 to 10",     group: "Scale" },
  // Other
  { type: "date",            label: "Date",             icon: "📅",  desc: "Date picker",                  group: "Other" },
];

const GROUPS = ["Text", "Choice", "Scale", "Other"] as const;

export function AddQuestionMenu({ onAdd }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAdd = (type: QuestionType) => {
    onAdd(type);
    setOpen(false);
  };

  return (
    <div className="add-question-menu" ref={menuRef}>
      <button
        type="button"
        className="btn-primary add-q-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        id="add-question-btn"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Add Question
      </button>

      {open && (
        <div className="aqm-panel" role="menu">
          <div className="aqm-header">Choose question type</div>
          {GROUPS.map((group) => {
            const items = OPTIONS.filter((o) => o.group === group);
            return (
              <div key={group} className="aqm-group">
                <p className="aqm-group-label">{group}</p>
                <div className="aqm-grid">
                  {items.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      className="aqm-item"
                      role="menuitem"
                      onClick={() => handleAdd(opt.type)}
                      id={`add-q-${opt.type}`}
                      title={opt.desc}
                    >
                      <span className="aqm-icon">{opt.icon}</span>
                      <span className="aqm-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
