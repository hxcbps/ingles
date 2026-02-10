import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_NAMES, REQUIRED_ENVELOPE_KEYS } from "../core/events_schema_v1.js";
import { Orchestrator, STEP_STATUS } from "../core/orchestrator.js";

function createMemoryStorage() {
  const state = new Map();
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    }
  };
}

function buildDayContent() {
  return {
    day_id: "W99_D01",
    goal: "Test day",
    session_script: [
      {
        step_id: "S1",
        type: "input_video",
        title: "Paso principal",
        difficulty_level: "A1",
        duration_min: 10,
        content: { instructions: "Completa timer." },
        gate: { type: "timer_complete", value: 10 },
        retry_policy: { max_attempts: 1 },
        fallback_step_id: "S1_FB"
      },
      {
        step_id: "S2",
        type: "quiz",
        title: "Paso final",
        difficulty_level: "A1",
        duration_min: 5,
        content: { instructions: "Marca check." },
        gate: { type: "manual_check" }
      },
      {
        step_id: "S1_FB",
        type: "repair_drill",
        title: "Recovery",
        difficulty_level: "A1",
        duration_min: 5,
        content: { instructions: "Recovery step." },
        gate: { type: "manual_check" }
      }
    ]
  };
}

test("orchestrator initializes first primary step as active", () => {
  const orchestrator = new Orchestrator({ storageAdapter: createMemoryStorage() });
  orchestrator.init(buildDayContent());

  const current = orchestrator.getCurrentStep();
  assert.equal(current.definition.step_id, "S1");
  assert.equal(current.status, STEP_STATUS.ACTIVE);
  assert.equal(current.totalSteps, 2);
});

test("orchestrator retry -> fallback -> recovered flow works", () => {
  const orchestrator = new Orchestrator({ storageAdapter: createMemoryStorage() });
  orchestrator.init(buildDayContent());

  const failAttemptOne = orchestrator.submitStep("S1", { timeElapsedMin: 1 });
  assert.equal(failAttemptOne.success, false);
  assert.equal(failAttemptOne.action, "retry");

  const failAttemptTwo = orchestrator.submitStep("S1", { timeElapsedMin: 1 });
  assert.equal(failAttemptTwo.success, false);
  assert.equal(failAttemptTwo.action, "fallback");
  assert.equal(orchestrator.getCurrentStep().definition.step_id, "S1_FB");

  const fallbackPass = orchestrator.submitStep("S1_FB", { checked: true });
  assert.equal(fallbackPass.success, true);
  assert.equal(orchestrator.getCurrentStep().definition.step_id, "S2");
  assert.equal(orchestrator.state.stepStates.S1, STEP_STATUS.RECOVERED);
});

test("orchestrator completes session and returns 100% progress on primary path", () => {
  const orchestrator = new Orchestrator({ storageAdapter: createMemoryStorage() });
  orchestrator.init(buildDayContent());

  orchestrator.submitStep("S1", { timeElapsedMin: 10 });
  const last = orchestrator.submitStep("S2", { checked: true });

  assert.equal(last.success, true);
  assert.equal(orchestrator.getProgress(), 100);
  assert.equal(Boolean(orchestrator.state.completedAt), true);
  assert.equal(orchestrator.getCurrentStep().definition, null);
});

test("orchestrator emits schema v1 runtime envelopes", () => {
  const emittedEvents = [];
  const orchestrator = new Orchestrator({
    storageAdapter: createMemoryStorage(),
    onEvent: (event) => emittedEvents.push(event)
  });

  orchestrator.init(buildDayContent());
  orchestrator.submitStep("S1", { timeElapsedMin: 1 });
  orchestrator.abandon("test_exit");

  assert.ok(emittedEvents.length >= 4);

  const eventNames = emittedEvents.map((event) => event.event);
  assert.equal(eventNames.includes(EVENT_NAMES.SESSION_STARTED), true);
  assert.equal(eventNames.includes(EVENT_NAMES.STEP_STARTED), true);
  assert.equal(eventNames.includes(EVENT_NAMES.GATE_FAILED), true);
  assert.equal(eventNames.includes(EVENT_NAMES.SESSION_ABANDONED), true);

  for (const payload of emittedEvents) {
    for (const key of REQUIRED_ENVELOPE_KEYS) {
      assert.equal(Object.prototype.hasOwnProperty.call(payload, key), true);
    }

    assert.equal(typeof payload.session_id, "string");
    assert.equal(payload.day_id, "W99_D01");
    assert.equal(Number.isNaN(Date.parse(payload.at)), false);
  }

  const gateFailed = emittedEvents.find((event) => event.event === EVENT_NAMES.GATE_FAILED);
  assert.equal(gateFailed.metadata.gate_type, "timer_complete");
  assert.equal(gateFailed.metadata.attempt, 1);
});
