import test from "node:test";
import assert from "node:assert/strict";

import { evaluateAdaptivePlan } from "../domain/adaptation.js";

function entry(isoDate, values = {}) {
  return {
    isoDate,
    checklist: {
      listening: true,
      speaking: true,
      reading: true,
      writing: true,
      evidence: true
    },
    scores: {
      fluency: 2,
      accuracy: 2,
      interaction: 2,
      pronunciation: 2
    },
    metrics_numeric: {
      error_density_per_100w: values.error_density_per_100w ?? 8,
      repair_success_pct: values.repair_success_pct ?? 70,
      turn_length_seconds: values.turn_length_seconds ?? 70,
      gist_pct: values.gist_pct ?? 80,
      detail_pct: values.detail_pct ?? 60,
      lexical_reuse_count: values.lexical_reuse_count ?? 10,
      pronunciation_score: values.pronunciation_score ?? 2
    }
  };
}

test("adaptation triggers repair boost when recent repair success is low", () => {
  const history = [
    entry("2026-02-01", { repair_success_pct: 50 }),
    entry("2026-02-02", { repair_success_pct: 55 }),
    entry("2026-02-03", { repair_success_pct: 58 })
  ];

  const plan = evaluateAdaptivePlan({
    history,
    weekNumber: 3,
    rubricAverage: 1.8,
    targets: {
      turn_length_min_seconds: 60,
      pronunciation_score_min: 2,
      repair_success_min: 70,
      error_density_max: 8
    }
  });

  assert.equal(plan.appliedRules.includes("repair_success_boost"), true);
});

test("adaptation marks extension risk from week 10 when performance remains low", () => {
  const history = Array.from({ length: 14 }, (_, idx) =>
    entry(`2026-02-${String(idx + 1).padStart(2, "0")}`, {
      error_density_per_100w: 14,
      repair_success_pct: 45,
      turn_length_seconds: 30,
      pronunciation_score: 1
    })
  );

  const plan = evaluateAdaptivePlan({
    history,
    weekNumber: 10,
    rubricAverage: 1,
    targets: {
      turn_length_min_seconds: 60,
      pronunciation_score_min: 2,
      repair_success_min: 70,
      error_density_max: 8
    }
  });

  assert.equal(plan.extensionRisk, true);
  assert.equal(plan.appliedRules.includes("extension_auto_w10"), true);
});
