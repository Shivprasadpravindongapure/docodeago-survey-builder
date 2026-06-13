import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Question, QuestionType } from "../../types";

interface QuestionCardProps {
  question: Question;
  onUpdate: (id: string, fields: Partial<Question>) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  rating: "⭐ Rating",
  yes_no: "Yes / No",
  nps: "NPS",
  dropdown: "Dropdown",
  scale: "Scale",
  date: "Date",
  email: "Email",
  phone: "Phone",
  checkbox: "Checkboxes",
};

export function QuestionCard({ question, onUpdate, onDelete }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const [optionsRaw, setOptionsRaw] = useState(question.options ? question.options.join("\n") : "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { label: e.target.value });
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    setOptionsRaw(raw);
    const parsed = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdate(question.id, { options: parsed });
  };

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { required: e.target.checked ? 1 : 0 });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`question-card${isDragging ? " is-dragging" : ""}`}
    >
      {/* Drag handle */}
      <div className="drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        <span />
        <span />
        <span />
      </div>

      <div className="question-card-body">
        <div className="flex gap-2" style={{ marginBottom: 10, alignItems: "center" }}>
          <span className="type-badge">{TYPE_LABELS[question.type]}</span>
          <label className="required-toggle">
            <input
              type="checkbox"
              checked={question.required === 1}
              onChange={handleRequiredChange}
            />
            Required
          </label>
        </div>

        <input
          type="text"
          value={question.label}
          onChange={handleLabelChange}
          placeholder="Question label…"
          style={{ marginBottom: question.type === "multiple_choice" ? 10 : 0 }}
        />

        {question.type === "long_text" && (
          <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: "var(--radius)", background: "var(--bg-3)", color: "var(--text-3)", fontSize: 12 }}>
            📝 Respondents will see a multi-line text area
          </div>
        )}

        {question.type === "multiple_choice" && (
          <div className="field" style={{ marginTop: 8 }}>
            <label htmlFor={`options-${question.id}`}>Options (one per line)</label>
            <textarea
              id={`options-${question.id}`}
              value={optionsRaw}
              onChange={handleOptionsChange}
              rows={3}
              placeholder={"Option A\nOption B\nOption C"}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => onDelete(question.id)}
        aria-label="Delete question"
        style={{ color: "#f87171", flexShrink: 0, alignSelf: "flex-start" }}
        id={`delete-question-${question.id}`}
      >
        ✕
      </button>
    </div>
  );
}
