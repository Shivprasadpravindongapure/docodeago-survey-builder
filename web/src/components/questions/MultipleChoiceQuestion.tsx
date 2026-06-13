interface MultipleChoiceQuestionProps {
  label: string;
  required: boolean;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function MultipleChoiceQuestion({
  label, required, options, value, onChange,
}: MultipleChoiceQuestionProps) {
  const name = `mc-${label.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`;
  return (
    <div className="public-question">
      <p className="public-question-label">
        {label}
        {required && <span className="required-star"> *</span>}
      </p>
      <div className="mc-options">
        {options.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: 13, fontStyle: "italic" }}>No options added yet</p>
        ) : (
          options.map((opt) => {
            const isSelected = value === opt;
            return (
              <label
                key={opt}
                className={`mc-option${isSelected ? " mc-option-selected" : ""}`}
                htmlFor={`${name}-${opt}`}
              >
                <span className={`mc-radio${isSelected ? " mc-radio-selected" : ""}`}>
                  {isSelected && <span className="mc-radio-dot" />}
                </span>
                <span className="mc-option-text">{opt}</span>
                <input
                  type="radio"
                  id={`${name}-${opt}`}
                  name={name}
                  value={opt}
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
