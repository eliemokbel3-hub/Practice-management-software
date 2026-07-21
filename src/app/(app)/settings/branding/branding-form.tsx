"use client";

// Upload a logo → read its dominant colour in the browser → preview and save a
// full theme. Works for any clinic: the colour maths and placement are generic.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deriveTheme, normalizeHex } from "@/lib/branding";
import { saveBrandingAction } from "./actions";

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
    const a = data[i + 3];
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 232) continue; // near-white
    if (max < 24) continue; // near-black
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.12) continue; // skip greys
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const weight = 1 + sat * 3; // vivid colours count for more
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
  const to = (n: number) =>
    Math.round(n)
      .toString(16)
      .padStart(2, "0");
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

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="h-9 w-9 rounded-lg border border-black/10"
        style={{ backgroundColor: color }}
      />
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
            <span className="text-xs font-medium capitalize" style={{ color: fg }}>
              {mode} mode
            </span>
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
            <span
              className="self-start rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: v.primarySoft, color: v.primarySoftForeground }}
            >
              Pinned
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BrandingForm({
  initialLogo,
  initialColor,
}: {
  initialLogo: string | null;
  initialColor: string | null;
}) {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [color, setColor] = useState<string>(initialColor ?? "#0d9488");
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaved(false);
    setNote(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setLogo(toLogoDataUrl(img));
        const extracted = extractColor(img);
        if (extracted) {
          setColor(extracted);
          setNote("Colour picked from your logo — tweak it below if you like.");
        } else {
          setNote(
            "Couldn't find a strong colour in that logo — choose one below."
          );
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const hex = normalizeHex(color) ?? "#0d9488";
    await saveBrandingAction(logo, hex);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function resetTheme() {
    setSaving(true);
    setLogo(null);
    setColor("#0d9488");
    await saveBrandingAction(null, null);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const normColor = normalizeHex(color) ?? "#0d9488";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-sm font-semibold">Logo</h2>
          <p className="text-xs text-faint">
            PNG, JPG, WebP or SVG. Shown in the sidebar, on your booking page,
            questionnaires and invoices.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-faint">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              <ImageUp size={15} /> {logo ? "Replace logo" : "Upload logo"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => {
                  setLogo(null);
                  setSaved(false);
                }}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-danger"
              >
                <Trash2 size={13} /> Remove logo
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onFile}
            className="hidden"
          />
        </div>
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
          onClick={resetTheme}
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
