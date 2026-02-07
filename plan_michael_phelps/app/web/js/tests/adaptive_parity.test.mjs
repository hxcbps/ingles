import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
      fluency: 1,
      accuracy: 1,
      interaction: 1,
      pronunciation: 1
    },
    metrics_numeric: {
      error_density_per_100w: values.error_density_per_100w ?? 14,
      repair_success_pct: values.repair_success_pct ?? 45,
      turn_length_seconds: values.turn_length_seconds ?? 30,
      gist_pct: values.gist_pct ?? 70,
      detail_pct: values.detail_pct ?? 50,
      lexical_reuse_count: values.lexical_reuse_count ?? 7,
      pronunciation_score: values.pronunciation_score ?? 1
    }
  };
}

test("python and js adaptation rules match for shared fixture", () => {
  const history = Array.from({ length: 14 }, (_, idx) =>
    entry(`2026-03-${String(idx + 1).padStart(2, "0")}`)
  );
  const payload = {
    history,
    weekNumber: 10,
    rubricAverage: 1,
    targets: {
      turn_length_min_seconds: 60,
      pronunciation_score_min: 2,
      repair_success_min: 70,
      error_density_max: 8
    }
  };

  const jsResult = evaluateAdaptivePlan(payload);
  const helperPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "adaptive_parity_helper.py"
  );
  const pyResult = JSON.parse(
    execFileSync("python3", [helperPath], {
      input: JSON.stringify(payload),
      encoding: "utf-8"
    })
  );

  assert.deepEqual(pyResult.appliedRules, jsResult.appliedRules);
  assert.equal(pyResult.extensionRisk, jsResult.extensionRisk);
});
