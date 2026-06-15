interface Props {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function YesNoQuestion({ label, required, value, onChange }: Props) {
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
      <div className="yes-no-btns">
        {(["Yes", "No"] as const).map((opt) => (
          <label
            key={opt}
            className={`yn-btn${value === opt ? " active" : ""}`}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <input
              type="radio"
              name={`yn-${label}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(value === opt ? "" : opt)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            {opt === "Yes" ? "👍" : "👎"} {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
