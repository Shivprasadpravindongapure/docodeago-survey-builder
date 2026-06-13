interface DropdownProps {
  label: string; required: boolean; options: string[]; value: string; onChange: (v: string) => void;
}
export function DropdownQuestion({ label, required, options, value, onChange }: DropdownProps) {
  return (
    <div className="public-question">
      <p className="public-question-label">{label}{required && <span className="required-star"> *</span>}</p>
      <select className="input dropdown-select" value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">— Select an option —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
