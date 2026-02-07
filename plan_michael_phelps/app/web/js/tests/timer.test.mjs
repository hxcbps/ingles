import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultTimer, pauseTimer, resetTimer, startTimer, tickTimer } from "../domain/timer.js";

test("timer start resets when it is depleted", () => {
  const started = startTimer({ remainingSeconds: 0, running: false, lastTick: null }, 1000, 120);

  assert.equal(started.running, true);
  assert.equal(started.remainingSeconds, 120 * 60);
  assert.equal(started.lastTick, 1000);
});

test("timer tick decrements and completes", () => {
  const active = { remainingSeconds: 5, running: true, lastTick: 1000 };

  const first = tickTimer(active, 3000, 120);
  assert.equal(first.timer.remainingSeconds, 3);
  assert.equal(first.completed, false);

  const second = tickTimer(first.timer, 7000, 120);
  assert.equal(second.timer.remainingSeconds, 0);
  assert.equal(second.timer.running, false);
  assert.equal(second.completed, true);
});

test("timer pause and reset normalize state", () => {
  const paused = pauseTimer({ remainingSeconds: 15, running: true, lastTick: 123 }, 120);
  assert.equal(paused.running, false);
  assert.equal(paused.lastTick, null);

  const reset = resetTimer(300);
  assert.deepEqual(reset, getDefaultTimer(300));
});
