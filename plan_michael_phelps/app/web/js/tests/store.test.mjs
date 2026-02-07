import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryStorage,
  getDefaultDayState,
  loadDayState,
  saveDayState
} from "../state/store.js";

test("store migrates legacy state into v3 shape", () => {
  const isoDate = "2026-02-07";
  const storage = createMemoryStorage();

  storage.setItem(
    `english-sprint:${isoDate}`,
    JSON.stringify({
      checklist: {
        listening: true,
        speaking: true
      },
      timer: {
        remainingSeconds: 42,
        running: true,
        lastTick: 123
      },
      note: "legacy note"
    })
  );

  const state = loadDayState(isoDate, 120, storage);

  assert.equal(state.content_version, "v3");
  assert.equal(state.checklist.listening, true);
  assert.equal(state.checklist.speaking, true);
  assert.equal(state.checklist.reading, false);
  assert.equal(state.scores.fluency, 0);
  assert.equal(state.metrics.error_density, "");
  assert.equal(state.metrics_notes.error_density, "");
  assert.equal(state.metrics_numeric.error_density_per_100w, 0);
  assert.equal(state.artifacts.audio_path, "");
  assert.equal(state.timer.remainingSeconds, 42);
  assert.equal(state.timer.running, true);
  assert.equal(state.extension_weeks_assigned, 0);
  assert.equal(state.extension_trigger_week, 0);
  assert.equal(state.note, "legacy note");
});

test("store returns defaults for corrupt JSON", () => {
  const isoDate = "2026-02-08";
  const storage = createMemoryStorage({
    [`english-sprint:${isoDate}`]: "{invalid-json"
  });

  const state = loadDayState(isoDate, 300, storage);
  const defaults = getDefaultDayState(300);

  assert.deepEqual(state, defaults);
});

test("store persists and reloads saved state", () => {
  const isoDate = "2026-02-09";
  const storage = createMemoryStorage();
  const state = getDefaultDayState(120);

  state.checklist.evidence = true;
  state.scores.fluency = 3;
  state.metrics.turn_length = "20s";
  state.metrics_notes.turn_length = "20s";
  state.metrics_numeric.turn_length_seconds = 20;
  state.artifacts.audio_path = "tracking/daily/2026-02-09/audio/file.mp3";
  state.extension_weeks_assigned = 10;
  state.extension_trigger_week = 10;
  state.note = "good session";

  saveDayState(isoDate, state, storage);

  const loaded = loadDayState(isoDate, 120, storage);
  assert.deepEqual(loaded, state);
});
