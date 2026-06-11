interface RatingQuestionProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function RatingQuestion({ label, required, value, onChange }: RatingQuestionProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">
        {label}
        {required && <span className="required-star"> *</span>}
      </p>
      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-btn${value === String(n) ? " active" : ""}`}
            onClick={() => onChange(String(n))}
            aria-label={`Rate ${n} out of 5`}
            aria-pressed={value === String(n)}
            id={`rating-${n}-for-${label.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
