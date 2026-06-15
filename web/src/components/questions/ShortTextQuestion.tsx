import { useId } from "react";

interface ShortTextQuestionProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function ShortTextQuestion({
  label,
  required,
  value,
  onChange,
  id,
}: ShortTextQuestionProps) {
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
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder="Type your answer…"
      />
    </div>
  );
}
