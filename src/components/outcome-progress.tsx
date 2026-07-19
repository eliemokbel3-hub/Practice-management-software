// A small server-rendered SVG line chart of a patient's scores on one
// outcome measure over time. Uses theme colours via CSS variables.

export interface ProgressPoint {
  date: string; // ISO
  score: number;
}

export function OutcomeProgress({
  points,
  maxScore,
  higherIsBetter,
}: {
  points: ProgressPoint[];
  /** Chart ceiling: 100 for %, 80 for LEFS, 10 for PSFS. */
  maxScore: number;
  higherIsBetter: boolean;
}) {
  if (points.length < 2) return null;
  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const w = 260;
  const h = 64;
  const pad = 6;
  const t0 = new Date(sorted[0].date).getTime();
  const t1 = new Date(sorted[sorted.length - 1].date).getTime();
  const span = Math.max(t1 - t0, 1);
  const x = (d: string) =>
    pad + ((new Date(d).getTime() - t0) / span) * (w - pad * 2);
  const y = (s: number) =>
    h - pad - (Math.min(Math.max(s, 0), maxScore) / maxScore) * (h - pad * 2);

  const line = sorted.map((p) => `${x(p.date)},${y(p.score)}`).join(" ");
  const first = sorted[0].score;
  const last = sorted[sorted.length - 1].score;
  const improved = higherIsBetter ? last > first : last < first;

  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-16 w-full max-w-64"
        role="img"
        aria-label="Score over time"
      >
        <polyline
          points={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {sorted.map((p, i) => (
          <circle
            key={i}
            cx={x(p.date)}
            cy={y(p.score)}
            r="3"
            fill="var(--primary)"
          />
        ))}
      </svg>
      <span
        className={`shrink-0 text-xs font-medium ${
          improved ? "text-primary" : "text-muted"
        }`}
      >
        {improved ? "Improving" : first === last ? "No change" : "Watch"}
      </span>
    </div>
  );
}
