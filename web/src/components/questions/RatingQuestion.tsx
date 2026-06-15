import { useId } from "react";

interface Props {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

const STARS = [1, 2, 3, 4, 5];

export function RatingQuestion({ label, required, value, onChange }: Props) {
  const groupId = useId();
  const current = Number.parseInt(value) || 0;

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
      <div className="rating-stars" id={groupId}>
        {STARS.map((n) => (
          <label
            key={n}
            className={`star-btn${n <= current ? " active" : ""}`}
            title={`${n} star${n !== 1 ? "s" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <input
              type="radio"
              name={`rating-${groupId}`}
              value={n}
              checked={current === n}
              onChange={() => onChange(current === n ? "" : String(n))}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            ⭐
          </label>
        ))}
      </div>
      {current > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
          {current} / 5 stars selected
        </p>
      )}
    </fieldset>
  );
}
