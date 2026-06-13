interface ScaleProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function ScaleQuestion({ label, required, value, onChange }: ScaleProps) {
  const num = value !== "" ? Number(value) : null;
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <div className="scale-wrapper">
        <input
          type="range" min={1} max={10} step={1}
          value={num ?? 5}
          onChange={(e) => onChange(e.target.value)}
          className="scale-slider"
          style={{ "--brand-color": "var(--brand)" } as React.CSSProperties}
        />
        <div className="scale-value">{num ?? "—"}</div>
      </div>
      <div className="scale-labels"><span>1</span><span>10</span></div>
    </div>
  );
}
