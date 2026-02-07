import { getDefaultChecklist } from "../domain/checklist.js";
import { getDefaultScores, normalizeScores } from "../domain/rubric.js";
import {
  getDefaultMetrics,
  getDefaultMetricsNotes,
  getDefaultMetricsNumeric,
  normalizeMetrics,
  normalizeMetricsNotes,
  normalizeMetricsNumeric,
  parseLegacyMetrics
} from "../domain/metrics.js";
import { getDefaultArtifacts, normalizeArtifacts } from "../domain/artifacts.js";
import { getDefaultTimer, normalizeTimer } from "../domain/timer.js";
import { normalizeHistory } from "../domain/history.js";
import { normalizeBookProgress } from "../domain/books.js";

const PREFIX = "english-sprint";
const CONTENT_VERSION = "v3";

function keyForDate(isoDate) {
  return `${PREFIX}:${isoDate}`;
}

function normalizeNonNegativeInteger(value, fallback = 0) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function createMemoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function resolveStorage(storageAdapter) {
  if (storageAdapter) return storageAdapter;
  try {
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore localStorage access failures.
  }
  return createMemoryStorage();
}

export function getDefaultDayState(sessionMinutes) {
  return {
    content_version: CONTENT_VERSION,
    checklist: getDefaultChecklist(),
    scores: getDefaultScores(),
    metrics: getDefaultMetrics(),
    metrics_notes: getDefaultMetricsNotes(),
    metrics_numeric: getDefaultMetricsNumeric(),
    artifacts: getDefaultArtifacts(),
    timer: getDefaultTimer(sessionMinutes),
    note: "",
    history_last_30_days: [],
    adaptive_focus_today: "",
    adaptive_recommendations: [],
    extension_risk: false,
    extension_weeks_assigned: 0,
    extension_trigger_week: 0,
    book_progress: normalizeBookProgress({})
  };
}

function migrateToV3(parsed, sessionMinutes) {
  const fallback = getDefaultDayState(sessionMinutes);
  if (!parsed || typeof parsed !== "object") return fallback;

  const legacyMetrics = parseLegacyMetrics(parsed.metrics);
  const normalizedMetricNotes = normalizeMetricsNotes(parsed.metrics_notes || parsed.metrics || legacyMetrics.notes);
  const normalizedMetricNumeric = normalizeMetricsNumeric(parsed.metrics_numeric || legacyMetrics.numeric);

  return {
    content_version: CONTENT_VERSION,
    checklist: {
      ...fallback.checklist,
      ...(parsed.checklist || {})
    },
    scores: normalizeScores(parsed.scores),
    metrics: normalizeMetrics(normalizedMetricNotes),
    metrics_notes: normalizedMetricNotes,
    metrics_numeric: normalizedMetricNumeric,
    artifacts: normalizeArtifacts(parsed.artifacts),
    timer: normalizeTimer(parsed.timer, sessionMinutes),
    note: typeof parsed.note === "string" ? parsed.note : "",
    history_last_30_days: normalizeHistory(parsed.history_last_30_days, 30),
    adaptive_focus_today:
      typeof parsed.adaptive_focus_today === "string" ? parsed.adaptive_focus_today : "",
    adaptive_recommendations: Array.isArray(parsed.adaptive_recommendations)
      ? parsed.adaptive_recommendations.filter((item) => typeof item === "string")
      : [],
    extension_risk: Boolean(parsed.extension_risk),
    extension_weeks_assigned: normalizeNonNegativeInteger(parsed.extension_weeks_assigned, 0),
    extension_trigger_week: normalizeNonNegativeInteger(parsed.extension_trigger_week, 0),
    book_progress: normalizeBookProgress(parsed.book_progress)
  };
}

export function loadDayState(isoDate, sessionMinutes, storageAdapter) {
  const storage = resolveStorage(storageAdapter);
  const fallback = getDefaultDayState(sessionMinutes);

  try {
    const raw = storage.getItem(keyForDate(isoDate));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return migrateToV3(parsed, sessionMinutes);
  } catch {
    return fallback;
  }
}

export function saveDayState(isoDate, state, storageAdapter) {
  const storage = resolveStorage(storageAdapter);
  try {
    storage.setItem(keyForDate(isoDate), JSON.stringify(state));
  } catch {
    // Ignore persistence failures to keep UI usable.
  }
}
