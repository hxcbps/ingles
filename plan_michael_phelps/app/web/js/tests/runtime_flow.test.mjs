import test from "node:test";
import assert from "node:assert/strict";

import { Orchestrator } from "../core/orchestrator.js";
import { deriveJourneySnapshot, evaluateRuntimeGuard } from "../core/runtime_flow.js";

function createMemoryStorage() {
  const state = new Map();
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    }
  };
}

function buildDayContent() {
  return {
    day_id: "W30_D02",
    goal: "Journey integration",
    session_script: [
      {
        step_id: "S1",
        type: "input_video",
        title: "Listening",
        duration_min: 5,
        gate: { type: "manual_check" }
      },
      {
        step_id: "S2",
        type: "ai_roleplay",
        title: "Speaking",
        duration_min: 5,
        gate: { type: "manual_check" }
      },
      {
        step_id: "S3",
        type: "reading_task",
        title: "Reading",
        duration_min: 5,
        gate: { type: "manual_check" }
      },
      {
        step_id: "S4",
        type: "writing_task",
        title: "Writing",
        duration_min: 5,
        gate: { type: "manual_check" }
      }
    ]
  };
}

test("runtime flow derives incomplete checklist and closure lock", () => {
  const orchestrator = new Orchestrator({ storageAdapter: createMemoryStorage() });
  orchestrator.init(buildDayContent());

  orchestrator.submitStep("S1", { checked: true });
  orchestrator.submitStep("S2", { checked: true });

  const journey = deriveJourneySnapshot(orchestrator);

  assert.equal(journey.checklist.listening, true);
  assert.equal(journey.checklist.speaking, true);
  assert.equal(journey.checklist.reading, false);
  assert.equal(journey.checklist.writing, false);
  assert.equal(journey.stage.closureReady, false);
  assert.equal(journey.stage.evaluationReady, false);

  const guard = evaluateRuntimeGuard({
    routeId: "cierre",
    journey: {
      ...journey,
      session: { progressPct: orchestrator.getProgress() }
    }
  });

  assert.equal(guard.level, "warning");
  assert.equal(guard.recommendedRouteId, "sesion");
});

test("runtime flow opens evaluacion when full day is completed", () => {
  const orchestrator = new Orchestrator({ storageAdapter: createMemoryStorage() });
  orchestrator.init(buildDayContent());

  orchestrator.submitStep("S1", { checked: true });
  orchestrator.submitStep("S2", { checked: true });
  orchestrator.submitStep("S3", { checked: true });
  orchestrator.submitStep("S4", { checked: true });

  const journey = deriveJourneySnapshot(orchestrator);

  assert.equal(journey.stage.closureReady, true);
  assert.equal(journey.stage.evidenceReady, true);
  assert.equal(journey.stage.evaluationReady, true);

  const guard = evaluateRuntimeGuard({
    routeId: "evaluacion",
    journey: {
      ...journey,
      session: { progressPct: orchestrator.getProgress() }
    }
  });

  assert.equal(guard.level, "none");
  assert.equal(guard.recommendedRouteId, "evaluacion");
});

test("runtime flow requires evidence in evaluacion when session is complete but evidence is missing", () => {
  const guard = evaluateRuntimeGuard({
    routeId: "evaluacion",
    journey: {
      stage: {
        closureReady: true,
        evidenceReady: false,
        evaluationReady: false
      },
      session: {
        progressPct: 100
      }
    }
  });

  assert.equal(guard.level, "warning");
  assert.equal(guard.recommendedRouteId, "cierre");
});
