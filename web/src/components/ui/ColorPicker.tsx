import { useEffect, useState } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setHexInput(newColor);
    onChange(newColor);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
    }
  };

  const colorId = `color-picker-${label?.replace(/\s+/g, "-").toLowerCase() ?? "default"}`;

  return (
    <div className="field">
      {label && <label htmlFor={colorId}>{label}</label>}
      <div className="color-picker-row">
        <input
          id={colorId}
          type="color"
          value={value}
          onChange={handleColorChange}
          aria-label={label ?? "Color picker"}
        />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#6366f1"
          maxLength={7}
          aria-label={`${label ?? "Color"} hex value`}
        />
      </div>
    </div>
  );
}
