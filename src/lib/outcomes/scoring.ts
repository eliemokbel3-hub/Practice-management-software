// Scoring calculators for the outcome measure library. Answers are stored as
// { questionKey: chosenScore } for questionnaires, and
// { activities: [{ name, rating }] } for the PSFS.

import type { MeasureDefinition } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ScoreResult {
  /** Final score in the measure's units, or null if not scoreable. */
  score: number | null;
  /** e.g. "34%" or "62 / 80". */
  display: string;
  /** Interpretation band label, when the measure defines bands. */
  band: string | null;
  answered: number;
}

export function scoreMeasure(
  definition: MeasureDefinition,
  answers: any
): ScoreResult {
  const s = definition.scoring;

  if (s.method === "psfs_average") {
    const activities: { name?: string; rating?: number }[] = Array.isArray(
      answers?.activities
    )
      ? answers.activities
      : [];
    const ratings = activities
      .map((a) => Number(a.rating))
      .filter((r) => Number.isFinite(r) && r >= 0 && r <= 10);
    if (ratings.length === 0) {
      return { score: null, display: "—", band: null, answered: 0 };
    }
    const avg =
      Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) /
      10;
    return {
      score: avg,
      display: `${avg} / 10`,
      band: null,
      answered: ratings.length,
    };
  }

  // Questionnaires: collect valid chosen scores.
  const chosen: number[] = [];
  for (const q of definition.questions) {
    const v = Number((answers ?? {})[q.key]);
    if (Number.isFinite(v) && q.options.some((o) => o.score === v)) {
      chosen.push(v);
    }
  }
  const answered = chosen.length;
  if (answered === 0 || (s.minAnswered && answered < s.minAnswered)) {
    return { score: null, display: "—", band: null, answered };
  }
  const total = chosen.reduce((sum, v) => sum + v, 0);

  let score: number;
  let display: string;
  switch (s.method) {
    case "percent_of_max": {
      score = Math.round((total / ((s.maxScore ?? 5) * answered)) * 1000) / 10;
      display = `${score}%`;
      break;
    }
    case "sum": {
      score = total;
      display = `${score} ${s.unit}`;
      break;
    }
    case "quickdash": {
      score = Math.round((total / answered - 1) * 25 * 10) / 10;
      display = `${score}%`;
      break;
    }
    default:
      return { score: null, display: "—", band: null, answered };
  }

  const band =
    s.bands?.find((b) => score <= b.upTo)?.label ??
    (s.bands ? s.bands[s.bands.length - 1].label : null);
  return { score, display, band, answered };
}
