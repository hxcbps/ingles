export const METRICS = {
  ERROR_DENSITY: "error_density",
  REPAIR_SUCCESS: "repair_success",
  TURN_LENGTH: "turn_length",
  GIST_PCT: "gist_pct",
  DETAIL_PCT: "detail_pct",
  PRONUNCIATION: "pronunciation_score",
  LEXICAL_REUSE: "lexical_reuse"
};

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function smoothAverage(prev, next) {
  const a = asNumber(prev);
  const b = asNumber(next);
  if (a === null) return b === null ? 0 : b;
  if (b === null) return a;
  return Number(((a * 0.7) + (b * 0.3)).toFixed(2));
}

export class MetricsEngine {
  update(_dayId, _stepId, input, currentMetrics = {}) {
    const metrics = { ...(currentMetrics || {}) };
    const evidenceMetrics = input?.metrics && typeof input.metrics === "object" ? input.metrics : {};

    const turnCount = asNumber(input?.turnCount);
    const avgTurnLength = asNumber(input?.avgTurnLength);
    const score = asNumber(input?.score);
    const repairSuccess = asNumber(input?.repairSuccessPct);
    const errorDensity = asNumber(input?.errorDensity);

    if (turnCount !== null && avgTurnLength !== null) {
      metrics[METRICS.TURN_LENGTH] = smoothAverage(metrics[METRICS.TURN_LENGTH], avgTurnLength);
    }

    if (score !== null) {
      metrics[METRICS.GIST_PCT] = smoothAverage(metrics[METRICS.GIST_PCT], score);
    }

    if (repairSuccess !== null) {
      metrics[METRICS.REPAIR_SUCCESS] = smoothAverage(metrics[METRICS.REPAIR_SUCCESS], repairSuccess);
    }

    if (errorDensity !== null) {
      metrics[METRICS.ERROR_DENSITY] = smoothAverage(metrics[METRICS.ERROR_DENSITY], errorDensity);
    }

    Object.keys(evidenceMetrics).forEach((key) => {
      const value = asNumber(evidenceMetrics[key]);
      if (value !== null) {
        metrics[key] = smoothAverage(metrics[key], value);
      }
    });

    return metrics;
  }

  getAdaptationSuggestion(currentMetrics = {}, targets = {}) {
    const suggestions = [];
    const errorDensityMax = asNumber(targets.error_density_max);
    const pronunciationMin = asNumber(targets.pronunciation_score_min);

    if (
      errorDensityMax !== null &&
      asNumber(currentMetrics[METRICS.ERROR_DENSITY]) !== null &&
      currentMetrics[METRICS.ERROR_DENSITY] > errorDensityMax
    ) {
      suggestions.push({
        type: "simplify_input",
        reason: "Error density alto; conviene bajar complejidad momentaneamente."
      });
    }

    if (
      pronunciationMin !== null &&
      asNumber(currentMetrics[METRICS.PRONUNCIATION]) !== null &&
      currentMetrics[METRICS.PRONUNCIATION] < pronunciationMin
    ) {
      suggestions.push({
        type: "add_pronunciation_drill",
        reason: "Pronunciacion por debajo del objetivo minimo."
      });
    }

    if (
      asNumber(currentMetrics[METRICS.GIST_PCT]) !== null &&
      asNumber(currentMetrics[METRICS.DETAIL_PCT]) !== null &&
      currentMetrics[METRICS.GIST_PCT] >= 90 &&
      currentMetrics[METRICS.DETAIL_PCT] >= 85
    ) {
      suggestions.push({
        type: "increase_difficulty",
        reason: "Comprension alta sostenida; se puede escalar complejidad."
      });
    }

    return suggestions;
  }
}

export const metricsEngine = new MetricsEngine();
