import { averageMetric, checklistCompletion, getRecentHistory, getRecentStreak } from "./history.js";

export const ADAPTATION_RULES = {
  repair_success_boost: "repair_success_boost",
  error_density_precision_cycle: "error_density_precision_cycle",
  turn_length_support: "turn_length_support",
  pronunciation_intensive_week: "pronunciation_intensive_week",
  anti_fatigue_protocol: "anti_fatigue_protocol",
  difficulty_upgrade: "difficulty_upgrade",
  extension_risk_w05: "extension_risk_w05",
  extension_auto_w10: "extension_auto_w10"
};

function lastN(history, n) {
  return getRecentHistory(history, n);
}

function everyMetricBelow(items, field, threshold) {
  if (items.length === 0) return false;
  return items.every((item) => Number(item?.metrics_numeric?.[field]) < threshold);
}

function everyMetricAbove(items, field, threshold) {
  if (items.length === 0) return false;
  return items.every((item) => Number(item?.metrics_numeric?.[field]) >= threshold);
}

function hasNoImprovementOnErrorDensity(history) {
  const recent14 = lastN(history, 14);
  if (recent14.length < 10) return false;

  const firstHalf = recent14.slice(0, Math.floor(recent14.length / 2));
  const secondHalf = recent14.slice(Math.floor(recent14.length / 2));

  const firstAvg = averageMetric(firstHalf, "error_density_per_100w");
  const secondAvg = averageMetric(secondHalf, "error_density_per_100w");

  if (!Number.isFinite(firstAvg) || !Number.isFinite(secondAvg)) return false;
  return secondAvg >= firstAvg;
}

export function evaluateAdaptivePlan({
  history = [],
  weekNumber = 1,
  rubricAverage = 0,
  targets = {}
} = {}) {
  const appliedRules = [];
  const recommendations = [];
  let extensionRisk = false;

  const recent3 = lastN(history, 3);
  const recent4 = lastN(history, 4);
  const recent14 = lastN(history, 14);
  const checklistPct = checklistCompletion(history, 7);

  if (everyMetricBelow(recent3, "repair_success_pct", 60)) {
    appliedRules.push(ADAPTATION_RULES.repair_success_boost);
    recommendations.push("Move 10 minutes from reading to repair speaking for 4 days.");
  }

  if (hasNoImprovementOnErrorDensity(history)) {
    appliedRules.push(ADAPTATION_RULES.error_density_precision_cycle);
    recommendations.push("Activate 3-day precision microcycle focused on error correction.");
  }

  if (everyMetricBelow(recent4, "turn_length_seconds", targets.turn_length_min_seconds || 60)) {
    appliedRules.push(ADAPTATION_RULES.turn_length_support);
    recommendations.push("Enable long-turn support with 90-second structured responses.");
  }

  const pronunciationStreak = getRecentStreak(history, (item) => {
    const value = Number(item?.metrics_numeric?.pronunciation_score);
    return Number.isFinite(value) && value < (targets.pronunciation_score_min || 2);
  });

  if (pronunciationStreak >= 14 || (recent14.length >= 10 && everyMetricBelow(recent14.slice(-10), "pronunciation_score", targets.pronunciation_score_min || 2))) {
    appliedRules.push(ADAPTATION_RULES.pronunciation_intensive_week);
    recommendations.push("Add 10 daily minutes of pronunciation for one week.");
  }

  if (checklistPct < 85) {
    appliedRules.push(ADAPTATION_RULES.anti_fatigue_protocol);
    recommendations.push("Apply anti-fatigue mode: same minutes, lower task complexity.");
  }

  const highPerformance =
    recent14.length >= 10 &&
    everyMetricAbove(recent14.slice(-10), "repair_success_pct", targets.repair_success_min || 70) &&
    everyMetricBelow(recent14.slice(-10), "error_density_per_100w", targets.error_density_max || 8) &&
    rubricAverage >= 2;

  if (highPerformance) {
    appliedRules.push(ADAPTATION_RULES.difficulty_upgrade);
    recommendations.push("Increase topic difficulty and pressure rounds for next week.");
  }

  if (weekNumber >= 5) {
    const lowW5Performance = recent14.length >= 10 && !highPerformance;
    if (lowW5Performance) {
      extensionRisk = true;
      appliedRules.push(ADAPTATION_RULES.extension_risk_w05);
      recommendations.push("Mark extension risk and trigger intensive remediation plan.");
    }
  }

  if (weekNumber >= 10) {
    const stillAtRisk = extensionRisk || (recent14.length >= 10 && !highPerformance);
    if (stillAtRisk) {
      extensionRisk = true;
      appliedRules.push(ADAPTATION_RULES.extension_auto_w10);
      recommendations.push("Enable automatic extension window (+8 to +12 weeks).");
    }
  }

  const focusLabel = recommendations[0] || "Keep current plan. Focus on consistency and transfer.";

  return {
    focusLabel,
    appliedRules,
    recommendations,
    extensionRisk,
    checklistPct
  };
}
