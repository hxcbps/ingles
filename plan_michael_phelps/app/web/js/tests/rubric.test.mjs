import test from "node:test";
import assert from "node:assert/strict";

import { clampRubricScore, normalizeScores, summarizeRubric } from "../domain/rubric.js";

test("rubric clamp and normalize enforce 0..3", () => {
  assert.equal(clampRubricScore(-2), 0);
  assert.equal(clampRubricScore(2.6), 3);

  const normalized = normalizeScores({
    fluency: 10,
    accuracy: -1,
    interaction: 1.8,
    pronunciation: "x"
  });

  assert.deepEqual(normalized, {
    fluency: 3,
    accuracy: 0,
    interaction: 2,
    pronunciation: 0
  });
});

test("rubric summary computes average and met targets", () => {
  const summary = summarizeRubric(
    {
      fluency: 3,
      accuracy: 2,
      interaction: 1,
      pronunciation: 2
    },
    {
      fluency: { target: 2 },
      accuracy: { target: 2 },
      interaction: { target: 2 },
      pronunciation: { target: 2 }
    }
  );

  assert.equal(summary.average, "2.00");
  assert.equal(summary.metTargets, 3);
  assert.equal(summary.totalTargets, 4);
});
