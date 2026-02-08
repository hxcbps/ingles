import test from "node:test";
import assert from "node:assert/strict";

import { checkGate } from "../routing/hard_guards.js";

test("hard guards validates timer gate using seconds payload", () => {
  const pass = checkGate({ type: "timer_complete", value: 15 }, { timeElapsedSec: 900 });
  const fail = checkGate({ type: "timer_complete", value: 15 }, { timeElapsedSec: 240 });

  assert.equal(pass.passed, true);
  assert.equal(fail.passed, false);
});

test("hard guards validates compound gate and surfaces first failure message", () => {
  const gate = {
    type: "compound",
    rules: [
      { type: "timer_complete", value: 10 },
      { type: "min_words", value: 8 }
    ]
  };

  const fail = checkGate(gate, {
    timeElapsedMin: 10,
    text: "solo tres palabras"
  });
  const pass = checkGate(gate, {
    timeElapsedMin: 10,
    text: "esta evidencia tiene suficientes palabras para validar el gate"
  });

  assert.equal(fail.passed, false);
  assert.match(fail.message, /al menos 8 palabras/i);
  assert.equal(pass.passed, true);
});

test("hard guards validates metrics threshold map", () => {
  const gate = {
    type: "metrics_threshold",
    value: {
      pronunciation_score: 0.8,
      gist_pct: 75
    }
  };

  const fail = checkGate(gate, {
    metrics: {
      pronunciation_score: 0.75,
      gist_pct: 90
    }
  });

  const pass = checkGate(gate, {
    metrics: {
      pronunciation_score: 0.85,
      gist_pct: 78
    }
  });

  assert.equal(fail.passed, false);
  assert.match(fail.message, /pronunciation_score/i);
  assert.equal(pass.passed, true);
});

test("hard guards validates rubric minimum average", () => {
  const gate = {
    type: "rubric_min",
    value: 2
  };

  const fail = checkGate(gate, {
    rubric: {
      fluency: 1,
      accuracy: 2
    }
  });

  const pass = checkGate(gate, {
    rubric: {
      fluency: 2,
      accuracy: 2,
      pronunciation: 3
    }
  });

  assert.equal(fail.passed, false);
  assert.equal(pass.passed, true);
});
