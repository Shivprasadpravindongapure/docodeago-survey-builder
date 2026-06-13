interface DateProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function DateQuestion({ label, required, value, onChange }: DateProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <input type="date" className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

interface EmailQProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function EmailQuestion({ label, required, value, onChange }: EmailQProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <input type="email" className="input" value={value} placeholder="you@example.com" onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

interface PhoneProps {
  label: string; required: boolean; value: string; onChange: (v: string) => void;
}
export function PhoneQuestion({ label, required, value, onChange }: PhoneProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <input type="tel" className="input" value={value} placeholder="+91 98765 43210" onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

interface CheckboxProps {
  label: string; required: boolean; options: string[]; value: string; onChange: (v: string) => void;
}
export function CheckboxQuestion({ label, required, options, value, onChange }: CheckboxProps) {
  const selected = value ? value.split("|||") : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
    onChange(next.join("|||"));
  };
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>Select all that apply</p>
      <div className="checkbox-list">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <label key={opt} className={`checkbox-item${checked ? " checked" : ""}`}>
              <span className="checkbox-box">{checked && "✓"}</span>
              {opt}
              <input type="checkbox" checked={checked} onChange={() => toggle(opt)} style={{ display: "none" }} />
            </label>
          );
        })}
      </div>
    </div>
  );
}
