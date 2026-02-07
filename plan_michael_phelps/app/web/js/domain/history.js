function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeHistory(history, maxEntries = 30) {
  return asArray(history)
    .filter((item) => item && typeof item === "object" && typeof item.isoDate === "string")
    .slice(-maxEntries);
}

export function appendHistory(history, entry, maxEntries = 30) {
  const current = normalizeHistory(history, maxEntries);
  if (!entry || typeof entry !== "object" || typeof entry.isoDate !== "string") {
    return current;
  }

  const next = current.filter((item) => item.isoDate !== entry.isoDate);
  next.push(entry);
  return next.slice(-maxEntries);
}

export function getRecentHistory(history, days = 14) {
  const safeDays = Math.max(1, Number(days) || 14);
  return normalizeHistory(history).slice(-safeDays);
}

export function getRecentStreak(history, predicate) {
  const items = normalizeHistory(history).slice().reverse();
  let streak = 0;

  for (const item of items) {
    if (!predicate(item)) break;
    streak += 1;
  }

  return streak;
}

export function averageMetric(history, field) {
  const values = normalizeHistory(history)
    .map((item) => Number(item?.metrics_numeric?.[field]))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function checklistCompletion(history, days = 7) {
  const recent = getRecentHistory(history, days);
  if (recent.length === 0) return 0;

  const completions = recent.map((item) => {
    const checklist = item?.checklist || {};
    const done = Object.values(checklist).filter(Boolean).length;
    const total = Math.max(1, Object.keys(checklist).length);
    return done / total;
  });

  const avg = completions.reduce((sum, value) => sum + value, 0) / completions.length;
  return Math.round(avg * 100);
}

export function buildTrendSnapshot(history, days = 14) {
  const recent = getRecentHistory(history, days);
  return {
    days: recent.length,
    error_density_avg: averageMetric(recent, "error_density_per_100w"),
    repair_success_avg: averageMetric(recent, "repair_success_pct"),
    turn_length_avg: averageMetric(recent, "turn_length_seconds"),
    pronunciation_avg: averageMetric(recent, "pronunciation_score")
  };
}
