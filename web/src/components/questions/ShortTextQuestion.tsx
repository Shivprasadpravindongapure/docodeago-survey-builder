interface ShortTextQuestionProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ShortTextQuestion({ label, required, value, onChange }: ShortTextQuestionProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">
        {label}
        {required && <span className="required-star"> *</span>}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer…"
        rows={3}
        required={required}
        aria-label={label}
      />
    </div>
  );
}
