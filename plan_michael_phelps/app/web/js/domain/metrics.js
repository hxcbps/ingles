export const METRIC_NUMERIC_FIELDS = [
  { id: "error_density_per_100w", label: "Error density (per 100w)" },
  { id: "repair_success_pct", label: "Repair success (%)" },
  { id: "turn_length_seconds", label: "Turn length (seconds)" },
  { id: "gist_pct", label: "Gist comprehension (%)" },
  { id: "detail_pct", label: "Detail comprehension (%)" },
  { id: "lexical_reuse_count", label: "Lexical reuse (chunks)" },
  { id: "pronunciation_score", label: "Pronunciation score (0-3)" }
];

export const METRIC_NOTE_FIELDS = [
  { id: "error_density", label: "Error density note" },
  { id: "repair_success", label: "Repair success note" },
  { id: "turn_length", label: "Turn length note" },
  { id: "comprehension_split", label: "Comprehension split note" },
  { id: "lexical_reuse", label: "Lexical reuse note" }
];

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getDefaultMetricsNumeric() {
  return {
    error_density_per_100w: 0,
    repair_success_pct: 0,
    turn_length_seconds: 0,
    gist_pct: 0,
    detail_pct: 0,
    lexical_reuse_count: 0,
    pronunciation_score: 0
  };
}

export function normalizeMetricsNumeric(metrics) {
  const defaults = getDefaultMetricsNumeric();
  return {
    error_density_per_100w: normalizeNumber(metrics?.error_density_per_100w, defaults.error_density_per_100w),
    repair_success_pct: normalizeNumber(metrics?.repair_success_pct, defaults.repair_success_pct),
    turn_length_seconds: normalizeNumber(metrics?.turn_length_seconds, defaults.turn_length_seconds),
    gist_pct: normalizeNumber(metrics?.gist_pct, defaults.gist_pct),
    detail_pct: normalizeNumber(metrics?.detail_pct, defaults.detail_pct),
    lexical_reuse_count: normalizeNumber(metrics?.lexical_reuse_count, defaults.lexical_reuse_count),
    pronunciation_score: normalizeNumber(metrics?.pronunciation_score, defaults.pronunciation_score)
  };
}

export function getDefaultMetricsNotes() {
  return {
    error_density: "",
    repair_success: "",
    turn_length: "",
    comprehension_split: "",
    lexical_reuse: ""
  };
}

export function normalizeMetricsNotes(notes) {
  const defaults = getDefaultMetricsNotes();
  return {
    error_density: normalizeText(notes?.error_density ?? defaults.error_density),
    repair_success: normalizeText(notes?.repair_success ?? defaults.repair_success),
    turn_length: normalizeText(notes?.turn_length ?? defaults.turn_length),
    comprehension_split: normalizeText(notes?.comprehension_split ?? defaults.comprehension_split),
    lexical_reuse: normalizeText(notes?.lexical_reuse ?? defaults.lexical_reuse)
  };
}

export function parseLegacyMetrics(legacyMetrics) {
  const notes = normalizeMetricsNotes(legacyMetrics);
  const numeric = getDefaultMetricsNumeric();
  return { numeric, notes };
}

// Legacy exports kept for compatibility with older modules.
export const METRIC_FIELDS = METRIC_NOTE_FIELDS;
export function getDefaultMetrics() {
  return getDefaultMetricsNotes();
}
export function normalizeMetrics(metrics) {
  return normalizeMetricsNotes(metrics);
}
