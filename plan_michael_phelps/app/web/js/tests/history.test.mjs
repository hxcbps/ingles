import test from "node:test";
import assert from "node:assert/strict";

import { appendHistory, buildTrendSnapshot, checklistCompletion } from "../domain/history.js";

function makeEntry(day, repair = 70) {
  return {
    isoDate: `2026-02-${String(day).padStart(2, "0")}`,
    checklist: {
      listening: true,
      speaking: true,
      reading: true,
      writing: true,
      evidence: day % 2 === 0
    },
    metrics_numeric: {
      error_density_per_100w: 8,
      repair_success_pct: repair,
      turn_length_seconds: 70,
      pronunciation_score: 2
    }
  };
}

test("history appends and keeps max size", () => {
  let history = [];
  for (let i = 1; i <= 35; i += 1) {
    history = appendHistory(history, makeEntry(i), 30);
  }
  assert.equal(history.length, 30);
  assert.equal(history[0].isoDate, "2026-02-06");
});

test("history computes checklist completion and trend snapshot", () => {
  let history = [];
  for (let i = 1; i <= 7; i += 1) {
    history = appendHistory(history, makeEntry(i, 60 + i), 30);
  }

  const completion = checklistCompletion(history, 7);
  assert.equal(completion >= 80, true);

  const trend = buildTrendSnapshot(history, 7);
  assert.equal(trend.days, 7);
  assert.equal(Number.isFinite(trend.repair_success_avg), true);
});
