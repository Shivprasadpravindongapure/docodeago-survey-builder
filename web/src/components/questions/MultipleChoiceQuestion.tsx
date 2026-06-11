interface MultipleChoiceQuestionProps {
  label: string;
  required: boolean;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function MultipleChoiceQuestion({
  label,
  required,
  options,
  value,
  onChange,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">
        {label}
        {required && <span className="required-star"> *</span>}
      </p>
      <div>
        {options.map((option) => (
          <label key={option} className={`radio-option${value === option ? " selected" : ""}`}>
            <input
              type="radio"
              name={label}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required={required && !value}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
