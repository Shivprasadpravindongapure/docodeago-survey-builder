import { useId } from "react";

interface LongTextQuestionProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function LongTextQuestion({ label, required, value, onChange, id }: LongTextQuestionProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="question-block">
      <label htmlFor={inputId} className="question-label">
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <textarea
        id={inputId}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={4}
        style={{ resize: "vertical", minHeight: 100 }}
        placeholder="Your answer…"
      />
    </div>
  );
}
