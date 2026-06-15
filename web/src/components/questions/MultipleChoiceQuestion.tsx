interface Props {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export function MultipleChoiceQuestion({ label, required, value, onChange, options }: Props) {
  if (!options || options.length === 0) {
    return (
      <div className="question-block">
        <p className="question-label">
          {label}
          {required && (
            <span className="required-mark" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
          No options yet — add options in the builder.
        </p>
      </div>
    );
  }

  return (
    <fieldset className="question-block" style={{ border: "none", padding: 0, margin: 0 }}>
      <legend className="question-label">
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </legend>
      <div className="mc-options">
        {options.map((opt) => (
          <label
            key={opt}
            className={`mc-option${value === opt ? " active" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <input
              type="radio"
              name={`mc-${label}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(value === opt ? "" : opt)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <span className="mc-option-radio" aria-hidden="true" />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
