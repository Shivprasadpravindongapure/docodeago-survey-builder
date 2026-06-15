import { useRef } from "react";

interface BrandPanelProps {
  brandColor: string;
  logoUrl: string;
  title: string;
  description: string;
  onColorChange: (color: string) => void;
  onLogoChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onDescChange: (desc: string) => void;
}

export function BrandPanel({
  brandColor,
  logoUrl,
  title,
  description,
  onColorChange,
  onLogoChange,
  onTitleChange,
  onDescChange,
}: BrandPanelProps) {
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <div className="brand-panel">
      {/* Preview swatch */}
      <div
        style={{
          height: 8,
          borderRadius: "6px 6px 0 0",
          background: brandColor,
          margin: "-20px -20px 16px",
          flexShrink: 0,
        }}
      />

      <h4>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Branding
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Title */}
        <div className="field">
          <label htmlFor="brand-title">Survey Title</label>
          <input
            id="brand-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My Awesome Survey"
          />
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="brand-desc">Description (optional)</label>
          <textarea
            id="brand-desc"
            value={description}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder="Tell respondents what this survey is about…"
            style={{ minHeight: 60, fontSize: 13 }}
          />
        </div>

        {/* Brand color */}
        <div className="field">
          <label htmlFor="brand-color-input">Brand Color</label>
          <button
            type="button"
            className="color-picker-wrap"
            onClick={() => colorRef.current?.click()}
            style={{ cursor: "pointer" }}
            title="Pick brand color"
          >
            <div className="color-preview" style={{ background: brandColor }} />
            <span className="color-hex">{brandColor.toUpperCase()}</span>
            <input
              ref={colorRef}
              id="brand-color-input"
              type="color"
              value={brandColor}
              onChange={(e) => onColorChange(e.target.value)}
              aria-label="Pick brand color"
              style={{
                position: "absolute",
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: "none",
              }}
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ marginLeft: "auto", color: "var(--text-4)" }}
            >
              <path
                d="M9 18.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Color swatches */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {[
              "#4f46e5",
              "#0ea5e9",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#f97316",
            ].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                title={c}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: c,
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: brandColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
                  transform: brandColor === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Logo URL */}
        <div className="field">
          <label htmlFor="brand-logo-url">Logo URL (optional)</label>
          <input
            id="brand-logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => onLogoChange(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          {logoUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <img
                src={logoUrl}
                alt="Logo preview"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: "1.5px solid var(--border)",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
