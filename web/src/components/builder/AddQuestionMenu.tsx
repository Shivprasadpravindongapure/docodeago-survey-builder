import { useState } from "react";
import type { QuestionType } from "../../types";

interface AddQuestionMenuProps {
  onAdd: (type: QuestionType) => void;
}

const OPTIONS: { type: QuestionType; label: string; icon: string }[] = [
  { type: "short_text", label: "Short text", icon: "✏️" },
  { type: "multiple_choice", label: "Multiple choice", icon: "☑️" },
  { type: "rating", label: "Rating", icon: "⭐" },
];

export function AddQuestionMenu({ onAdd }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAdd = (type: QuestionType) => {
    onAdd(type);
    setOpen(false);
  };

  return (
    <div className="add-question-menu">
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        id="add-question-btn"
      >
        + Add Question
      </button>

      {open && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            role="presentation"
            aria-hidden="true"
          />
          <div className="add-question-dropdown" role="menu">
            {OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                className="add-question-option"
                role="menuitem"
                onClick={() => handleAdd(opt.type)}
                id={`add-question-${opt.type}`}
              >
                <span className="add-question-option-icon">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
