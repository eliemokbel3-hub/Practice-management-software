"use client";

// Upload one or two logos (a light-background one and, optionally, a
// dark-background one) → read the dominant colour → preview and save a full
// theme. Works for any clinic; the second logo is never required.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deriveTheme, normalizeHex } from "@/lib/branding";
import { saveBrandingAction } from "./actions";

const DEFAULT = "#0d9488";

/** Pick the most prominent, saturated colour from an image. */
function extractColor(img: HTMLImageElement): string | null {
  const size = 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { r: number; g: number; b: number; w: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 232 || max < 24) continue;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.12) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const weight = 1 + sat * 3;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, w: 0 };
    cur.r += r * weight;
    cur.g += g * weight;
    cur.b += b * weight;
    cur.w += weight;
    buckets.set(key, cur);
  }
  let best: { r: number; g: number; b: number; w: number } | null = null;
  for (const v of buckets.values()) if (!best || v.w > best.w) best = v;
  if (!best) return null;
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(best.r / best.w)}${to(best.g / best.w)}${to(best.b / best.w)}`;
}

/** Re-encode to a small raster data URL (strips any SVG scripting, caps size). */
function toLogoDataUrl(img: HTMLImageElement): string {
  const maxDim = 240;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/webp", 0.9);
}

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
          className={`flex h-16 w-40 items-center justify-center overflow-hidden rounded-lg border border-border p-2 ${
            dark ? "bg-[#1a2120]" : "bg-background"
          }`}
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
      setLogo(toLogoDataUrl(img));
      const extracted = extractColor(img);
      if (extracted && (!initialColor || color === DEFAULT)) {
        setColor(extracted);
        setNote("Colour picked from your logo — tweak it below if you like.");
      }
    });
  }
  function pickDark(file: File) {
    setSaved(false);
    readImage(file, (img) => setLogoDark(toLogoDataUrl(img)));
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
            PNG, JPG, WebP or SVG. The dark-background logo is optional — add it
            only if your main logo doesn&apos;t sit well on dark backgrounds. A
            logo with a transparent background looks best.
          </p>
        </div>
        <LogoSlot
          title="Logo"
          hint="Used everywhere, and in light mode. Best on a light/transparent background."
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
          hint="Shown in dark mode and on dark surfaces. Best on a dark/transparent background."
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
