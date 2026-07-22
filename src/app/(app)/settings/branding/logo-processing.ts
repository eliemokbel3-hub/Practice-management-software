// Client-side logo cleanup so uploaded logos look polished anywhere:
//  1. Cut out a plain (uniform) background by flood-filling inward from the
//     edges — interior outlines are kept because they aren't edge-connected.
//  2. Trim to the artwork's bounding box (removes dead space).
//  3. Cap the size and re-encode to a small WebP with transparency — which
//     also strips any SVG scripting.
// Returns a transparent data URL plus the dominant brand colour.

const WORK_MAX = 340; // working resolution for processing
const OUT_MAX = 260; // stored resolution

function dist(
  d: Uint8ClampedArray,
  p: number,
  r: number,
  g: number,
  b: number
): number {
  const dr = d[p] - r;
  const dg = d[p + 1] - g;
  const db = d[p + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function draw(img: HTMLImageElement, max: number) {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/** Flood-fill the uniform border background to transparent, in place. */
function removeBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): boolean {
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  // If it already has real transparency, leave it alone.
  let transparent = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 200) transparent++;
  if (transparent > w * h * 0.04) return false;

  // Seed colour = average of the four corners; require them to agree.
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of corners) {
    r += d[p];
    g += d[p + 1];
    b += d[p + 2];
  }
  r /= 4;
  g /= 4;
  b /= 4;
  for (const p of corners) if (dist(d, p, r, g, b) > 42) return false;

  const tol = 62;
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const q = y * w + x;
    if (visited[q]) return;
    visited[q] = 1;
    if (dist(d, q * 4, r, g, b) <= tol) stack.push(q);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const q = stack.pop()!;
    const x = q % w;
    const y = (q / w) | 0;
    d[q * 4 + 3] = 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  ctx.putImageData(image, 0, 0);
  return true;
}

/** Crop to the bounding box of non-transparent pixels (with a little padding). */
function trim(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const d = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) {
        any = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!any) return canvas;
  const pad = 3;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = tw;
  out.height = th;
  out.getContext("2d")!.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

function dominantColor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): string | null {
  const d = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<string, { r: number; g: number; b: number; wt: number }>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 232 || max < 24) continue;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.12) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const wt = 1 + sat * 3;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, wt: 0 };
    cur.r += r * wt;
    cur.g += g * wt;
    cur.b += b * wt;
    cur.wt += wt;
    buckets.set(key, cur);
  }
  let best: { r: number; g: number; b: number; wt: number } | null = null;
  for (const v of buckets.values()) if (!best || v.wt > best.wt) best = v;
  if (!best) return null;
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(best.r / best.wt)}${to(best.g / best.wt)}${to(best.b / best.wt)}`;
}

export interface ProcessedLogo {
  dataUrl: string;
  color: string | null;
  removedBackground: boolean;
}

export function processLogo(img: HTMLImageElement): ProcessedLogo {
  const { canvas, ctx, w, h } = draw(img, WORK_MAX);
  const removed = removeBackground(ctx, w, h);
  const trimmed = trim(canvas);

  const scale = Math.min(1, OUT_MAX / Math.max(trimmed.width, trimmed.height));
  const fw = Math.max(1, Math.round(trimmed.width * scale));
  const fh = Math.max(1, Math.round(trimmed.height * scale));
  const out = document.createElement("canvas");
  out.width = fw;
  out.height = fh;
  const outCtx = out.getContext("2d", { willReadFrequently: true })!;
  outCtx.drawImage(trimmed, 0, 0, fw, fh);

  return {
    dataUrl: out.toDataURL("image/webp", 0.92),
    color: dominantColor(outCtx, fw, fh),
    removedBackground: removed,
  };
}
