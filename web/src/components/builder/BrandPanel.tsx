import { ColorPicker } from "../ui/ColorPicker";
import { Input } from "../ui/Input";

interface BrandPanelProps {
  brandColor: string;
  logoUrl: string;
  title: string;
  onColorChange: (color: string) => void;
  onLogoChange: (url: string) => void;
  onTitleChange: (title: string) => void;
}

export function BrandPanel({
  brandColor,
  logoUrl,
  title,
  onColorChange,
  onLogoChange,
  onTitleChange,
}: BrandPanelProps) {
  return (
    <div className="brand-panel">
      <h4>⚡ Branding</h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="Survey Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="My Awesome Survey"
          id="brand-title"
        />

        <ColorPicker label="Brand Color" value={brandColor} onChange={onColorChange} />

        <Input
          label="Logo URL"
          value={logoUrl}
          onChange={(e) => onLogoChange(e.target.value)}
          placeholder="https://example.com/logo.png"
          type="url"
          id="brand-logo-url"
        />
      </div>
    </div>
  );
}
