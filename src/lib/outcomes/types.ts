// Outcome measure definitions — the shape of outcome_measures.definition.
// The library lives in library.json (usable by both the app and the seed
// script); these types describe it.

export interface MeasureOption {
  label: string;
  score: number;
}

export interface MeasureQuestion {
  key: string;
  text: string;
  options: MeasureOption[];
}

/** Interpretation band: applies when the final score is <= upTo. */
export interface MeasureBand {
  upTo: number;
  label: string;
}

export type ScoringMethod =
  | "percent_of_max" // sum / (max per question × answered) × 100 — ODI, NDI
  | "sum" // plain sum — LEFS
  | "quickdash" // ((mean of 1–5 items) − 1) × 25
  | "psfs_average"; // mean of 0–10 activity ratings

export interface MeasureScoring {
  method: ScoringMethod;
  unit: string; // "%", "/ 80", "/ 10"
  higherIsBetter: boolean;
  /** Max per question (percent_of_max) or max total (sum), for display. */
  maxScore?: number;
  /** Minimum answered questions for a valid score (e.g. QuickDASH needs 10). */
  minAnswered?: number;
  bands?: MeasureBand[];
}

export interface MeasureDefinition {
  instructions: string;
  kind: "questionnaire" | "psfs";
  questions: MeasureQuestion[]; // empty for psfs
  scoring: MeasureScoring;
}

export interface OutcomeMeasure {
  id: string;
  code: string;
  name: string;
  description: string | null;
  definition: MeasureDefinition;
}
