"use client";

// Upload one or two logos → the background is cut out and the artwork trimmed
// automatically → preview and save a full theme. The second (dark-background)
// logo is optional. Works for any clinic.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deriveTheme, normalizeHex } from "@/lib/branding";
import { processLogo } from "./logo-processing";
import { saveBrandingAction } from "./actions";

const DEFAULT = "#0d9488";

// A faint checkerboard so transparency is visible in previews.
const checker: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%), linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.15) 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 7px 7px",
};

function readImage(file: File, cb: (img: HTMLImageElement) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => cb(img);
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function LogoSlot({
  title,
  hint,
  value,
  dark = false,
  onPick,
  onRemove,
}: {
  title: string;
  hint: string;
  value: string | null;
  dark?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-lg border border-border p-2"
          style={{ ...checker, backgroundColor: dark ? "#1a2120" : "#ffffff" }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo preview" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-faint">No logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <ImageUp size={15} /> {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-danger"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="h-9 w-9 rounded-lg border border-black/10" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-faint">{label}</span>
    </div>
  );
}

function Preview({ hex }: { hex: string }) {
  const t = deriveTheme(hex);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(["light", "dark"] as const).map((mode) => {
        const v = t[mode];
        const bg = mode === "light" ? "#ffffff" : "#101615";
        const fg = mode === "light" ? "#14201f" : "#edf2f1";
        return (
          <div
            key={mode}
            className="flex flex-col gap-3 rounded-xl border border-border p-4"
            style={{ backgroundColor: bg, color: fg }}
          >
            <span className="text-xs font-medium capitalize">{mode} mode</span>
            <div className="flex gap-3">
              <Swatch color={v.primary} label="Primary" />
              <Swatch color={v.primaryHover} label="Hover" />
              <Swatch color={v.primarySoft} label="Soft" />
            </div>
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: v.primary, color: v.primaryForeground }}
            >
              Book appointment
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function BrandingForm({
  initialLogo,
  initialLogoDark,
  initialColor,
}: {
  initialLogo: string | null;
  initialLogoDark: string | null;
  initialColor: string | null;
}) {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [logoDark, setLogoDark] = useState<string | null>(initialLogoDark);
  const [color, setColor] = useState<string>(initialColor ?? DEFAULT);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function pickLight(file: File) {
    setSaved(false);
    readImage(file, (img) => {
      const { dataUrl, color: picked, removedBackground } = processLogo(img);
      setLogo(dataUrl);
      if (picked && (!initialColor || color === DEFAULT)) setColor(picked);
      setNote(
        removedBackground
          ? "Background removed automatically and trimmed to fit."
          : "Logo trimmed to fit."
      );
    });
  }
  function pickDark(file: File) {
    setSaved(false);
    readImage(file, (img) => setLogoDark(processLogo(img).dataUrl));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const hex = normalizeHex(color) ?? DEFAULT;
    await saveBrandingAction(logo, logoDark, hex);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function resetAll() {
    setSaving(true);
    setLogo(null);
    setLogoDark(null);
    setColor(DEFAULT);
    setNote(null);
    await saveBrandingAction(null, null, null);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const normColor = normalizeHex(color) ?? DEFAULT;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-sm font-semibold">Logos</h2>
          <p className="text-xs text-faint">
            PNG, JPG, WebP or SVG. We automatically remove a plain background and
            trim the artwork, so your logo sits cleanly everywhere. Add the
            dark-background logo only if your main one doesn&apos;t read well on
            dark backgrounds.
          </p>
        </div>
        <LogoSlot
          title="Logo"
          hint="Used everywhere, and in light mode."
          value={logo}
          onPick={pickLight}
          onRemove={() => {
            setLogo(null);
            setSaved(false);
          }}
        />
        <div className="border-t border-border" />
        <LogoSlot
          title="Dark-background logo (optional)"
          hint="Shown in dark mode and on dark surfaces."
          value={logoDark}
          dark
          onPick={pickDark}
          onRemove={() => {
            setLogoDark(null);
            setSaved(false);
          }}
        />
        {note && <p className="text-xs text-muted">{note}</p>}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Brand colour</h2>
            <p className="text-xs text-faint">
              Drives buttons, highlights and links across your whole app.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normColor}
              onChange={(e) => {
                setColor(e.target.value);
                setSaved(false);
              }}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-surface"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setSaved(false);
              }}
              className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-mono text-sm outline-none focus:border-ring"
            />
          </div>
        </div>
        <Preview hex={normColor} />
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={resetAll}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-60"
        >
          <RotateCcw size={14} /> Reset to default
        </button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-primary">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save branding
          </button>
        </div>
      </div>
    </div>
  );
}
