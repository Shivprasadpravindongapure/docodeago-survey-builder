interface YesNoProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function YesNoQuestion({ label, required, value, onChange }: YesNoProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <div className="yesno-buttons">
        {["Yes", "No"].map((opt) => (
          <button key={opt} type="button"
            className={`yesno-btn${value === opt ? " active" : ""}`}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}>
            {opt === "Yes" ? "👍 Yes" : "👎 No"}
          </button>
        ))}
      </div>
    </div>
  );
}
