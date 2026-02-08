export const GATE_TYPES = {
  TIMER_COMPLETE: "timer_complete",
  SELF_SCORE: "self_score",
  MIN_WORDS: "min_words",
  EVIDENCE_UPLOAD: "evidence_upload",
  COMPOUND: "compound",
  MANUAL_CHECK: "manual_check",
  ARTIFACT_UPLOADED: "artifact_uploaded",
  EVIDENCE_LOG_MIN_WORDS: "evidence_log_min_words",
  MIN_TURNS: "min_turns",
  RUBRIC_MIN: "rubric_min",
  METRICS_THRESHOLD: "metrics_threshold"
};

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function countWords(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function gateResult(passed, code, message, details = {}) {
  return {
    passed: Boolean(passed),
    code,
    message,
    details
  };
}

function readElapsedMinutes(input, requiredMin = 0) {
  const explicitMin = asNumber(input?.timeElapsedMin);
  if (explicitMin !== null) return explicitMin;

  const seconds = asNumber(input?.timeElapsedSec);
  if (seconds !== null) return seconds / 60;

  const generic = asNumber(input?.timeElapsed);
  if (generic === null) return 0;

  if (requiredMin > 0 && generic > requiredMin * 3) {
    return generic / 60;
  }

  return generic;
}

function averageValues(obj) {
  const values = Object.values(obj || {})
    .map((value) => asNumber(value))
    .filter((value) => value !== null);
  if (!values.length) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function normalizeMetricRules(gate) {
  if (Array.isArray(gate?.value)) {
    return gate.value
      .map((rule) => ({
        metric: String(rule?.metric || ""),
        min: asNumber(rule?.min)
      }))
      .filter((rule) => rule.metric && rule.min !== null);
  }

  if (gate?.value && typeof gate.value === "object") {
    if ("metric" in gate.value) {
      const min = asNumber(gate.value.min ?? gate.min_value ?? gate.value.value);
      return min === null ? [] : [{ metric: String(gate.value.metric || ""), min }];
    }

    return Object.keys(gate.value)
      .map((metric) => ({ metric, min: asNumber(gate.value[metric]) }))
      .filter((rule) => rule.metric && rule.min !== null);
  }

  if (typeof gate?.value === "string") {
    const min = asNumber(gate?.min_value);
    if (min !== null) {
      return [{ metric: gate.value, min }];
    }
  }

  return [];
}

export function checkGate(gate, input, context = {}) {
  if (!gate || typeof gate !== "object") {
    return gateResult(true, "no_gate", "Sin gate configurado.");
  }

  switch (gate.type) {
    case GATE_TYPES.TIMER_COMPLETE: {
      const requiredMin = asNumber(gate.value) || 0;
      const elapsedMin = readElapsedMinutes(input, requiredMin);
      const passed = elapsedMin >= requiredMin;
      return gateResult(
        passed,
        gate.type,
        passed
          ? "Tiempo minimo completado."
          : `Completa ${requiredMin} min. Llevas ${Math.max(0, elapsedMin).toFixed(1)} min.`,
        { requiredMin, elapsedMin }
      );
    }

    case GATE_TYPES.SELF_SCORE: {
      const minScore = asNumber(gate.min_value ?? gate.value) || 0;
      const score = asNumber(input?.score) || 0;
      const passed = score >= minScore;
      return gateResult(
        passed,
        gate.type,
        passed ? "Auto-score valido." : `Auto-score minimo ${minScore}. Actual: ${score}.`,
        { minScore, score }
      );
    }

    case GATE_TYPES.MIN_WORDS:
    case GATE_TYPES.EVIDENCE_LOG_MIN_WORDS: {
      const minWords = asNumber(gate.value) || 0;
      const words = countWords(input?.text || input?.log);
      const passed = words >= minWords;
      return gateResult(
        passed,
        gate.type,
        passed ? "Longitud de evidencia valida." : `Escribe al menos ${minWords} palabras.`,
        { minWords, words }
      );
    }

    case GATE_TYPES.ARTIFACT_UPLOADED:
    case GATE_TYPES.EVIDENCE_UPLOAD: {
      const artifactPath = String(input?.artifactPath || input?.artifactUrl || "").trim();
      const passed = artifactPath.length > 0;
      return gateResult(
        passed,
        gate.type,
        passed ? "Evidencia registrada." : "Falta ruta o enlace de evidencia.",
        { artifactPath }
      );
    }

    case GATE_TYPES.MANUAL_CHECK: {
      const passed = input?.checked === true;
      return gateResult(
        passed,
        gate.type,
        passed ? "Checklist validado." : "Confirma el check para continuar."
      );
    }

    case GATE_TYPES.MIN_TURNS: {
      const minTurns = asNumber(gate.value) || 0;
      const turnCount = asNumber(input?.turnCount) || 0;
      const passed = turnCount >= minTurns;
      return gateResult(
        passed,
        gate.type,
        passed ? "Cantidad de turnos valida." : `Necesitas ${minTurns} turnos. Llevas ${turnCount}.`,
        { minTurns, turnCount }
      );
    }

    case GATE_TYPES.RUBRIC_MIN: {
      const rubric = input?.rubric && typeof input.rubric === "object" ? input.rubric : {};
      if (typeof gate.value === "number" || typeof gate.value === "string") {
        const minAvg = asNumber(gate.value) || 0;
        const avg = averageValues(rubric);
        const passed = avg !== null && avg >= minAvg;
        return gateResult(
          passed,
          gate.type,
          passed ? "Rubrica minima cumplida." : `Promedio minimo ${minAvg}.`,
          { minAvg, avg }
        );
      }

      if (gate.value && typeof gate.value === "object") {
        const rubricRules = gate.value;
        const minAvg = asNumber(rubricRules.average);
        if (minAvg !== null) {
          const avg = averageValues(rubric);
          if (avg === null || avg < minAvg) {
            return gateResult(false, gate.type, `Promedio minimo ${minAvg}.`, { minAvg, avg });
          }
        }

        for (const field of Object.keys(rubricRules)) {
          if (field === "average") continue;
          const required = asNumber(rubricRules[field]);
          if (required === null) continue;
          const actual = asNumber(rubric[field]) || 0;
          if (actual < required) {
            return gateResult(
              false,
              gate.type,
              `Rubrica '${field}' requiere ${required}. Actual ${actual}.`,
              { field, required, actual }
            );
          }
        }

        return gateResult(true, gate.type, "Rubrica minima cumplida.");
      }

      return gateResult(false, gate.type, "Rubrica invalida.");
    }

    case GATE_TYPES.METRICS_THRESHOLD: {
      const metrics = {
        ...(context?.metrics && typeof context.metrics === "object" ? context.metrics : {}),
        ...(input?.metrics && typeof input.metrics === "object" ? input.metrics : {})
      };
      const rules = normalizeMetricRules(gate);

      if (!rules.length) {
        return gateResult(false, gate.type, "Gate metrics_threshold sin reglas validas.");
      }

      for (const rule of rules) {
        const actual = asNumber(metrics[rule.metric]) || 0;
        if (actual < rule.min) {
          return gateResult(
            false,
            gate.type,
            `Metrica '${rule.metric}' requiere ${rule.min}. Actual ${actual}.`,
            { metric: rule.metric, min: rule.min, actual }
          );
        }
      }

      return gateResult(true, gate.type, "Umbrales de metrica cumplidos.");
    }

    case GATE_TYPES.COMPOUND: {
      if (!Array.isArray(gate.rules) || gate.rules.length === 0) {
        return gateResult(false, gate.type, "Gate compound sin reglas.");
      }

      for (const rule of gate.rules) {
        const result = checkGate(rule, input, context);
        if (!result.passed) {
          return gateResult(false, gate.type, result.message, {
            failedRule: rule?.type || "unknown",
            failedResult: result
          });
        }
      }

      return gateResult(true, gate.type, "Reglas compuestas cumplidas.");
    }

    default:
      return gateResult(false, "unknown_gate", `Gate desconocido: ${gate.type}`);
  }
}

export function isGatePassed(gate, input, context = {}) {
  return checkGate(gate, input, context).passed;
}
