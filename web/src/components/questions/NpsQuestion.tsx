interface NpsProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function NpsQuestion({ label, required, value, onChange }: NpsProps) {
  const selected = value !== "" ? Number(value) : null;
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <div className="nps-grid">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const isSelected = selected === n;
          const color = n <= 6 ? "#f87171" : n <= 8 ? "#facc15" : "#4ade80";
          return (
            <button key={n} type="button"
              className={`nps-btn${isSelected ? " active" : ""}`}
              style={isSelected ? { background: color, borderColor: color, color: "#000" } : {}}
              onClick={() => onChange(String(n))}
              aria-pressed={isSelected}
              aria-label={`Score ${n}`}>
              {n}
            </button>
          );
        })}
      </div>
      <div className="nps-labels">
        <span>😞 Not likely</span>
        <span>😍 Extremely likely</span>
      </div>
    </div>
  );
}
