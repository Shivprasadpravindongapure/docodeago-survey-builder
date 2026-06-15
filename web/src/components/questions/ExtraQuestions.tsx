import { useId } from "react";

interface Props {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function EmailQuestion({ label, required, value, onChange, id }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="question-block">
      <label htmlFor={inputId} className="question-label">
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder="your@email.com"
        autoComplete="email"
        inputMode="email"
      />
      {value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && (
        <p className="pub-field-error" role="alert">
          Please enter a valid email address
        </p>
      )}
    </div>
  );
}

export function PhoneQuestion({ label, required, value, onChange, id }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="question-block">
      <label htmlFor={inputId} className="question-label">
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
        inputMode="tel"
      />
    </div>
  );
}

export function DateQuestion({ label, required, value, onChange, id }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="question-block">
      <label htmlFor={inputId} className="question-label">
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min="2000-01-01"
        max="2100-12-31"
        style={{ cursor: "pointer" }}
      />
    </div>
  );
}

export function CheckboxQuestion({
  label,
  required,
  value,
  onChange,
  options,
}: Props & { options: string[] }) {
  const selected: string[] = value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next.join(", "));
  };

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
      <div className="checkbox-options">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`checkbox-option${selected.includes(opt) ? " checked" : ""}`}
            onClick={() => toggle(opt)}
            aria-pressed={selected.includes(opt)}
          >
            <span className="checkbox-box" aria-hidden="true" />
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
