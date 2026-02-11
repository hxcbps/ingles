import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_NAMES, REQUIRED_ENVELOPE_KEYS } from "../core/events_schema_v1.js";
import { Orchestrator } from "../core/orchestrator.js";

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

function buildCriticalDayContent() {
  return {
    day_id: "W20_D04",
    goal: "Critical path validation",
    session_script: [
      {
        step_id: "CP_S1",
        type: "input_video",
        title: "Input operativo",
        difficulty_level: "B2",
        duration_min: 10,
        content: { instructions: "Completa primer gate." },
        gate: { type: "manual_check" }
      },
      {
        step_id: "CP_S2",
        type: "ai_roleplay",
        title: "Roleplay final",
        difficulty_level: "B2",
        duration_min: 15,
        content: { instructions: "Completa gate final." },
        gate: { type: "manual_check" }
      }
    ]
  };
}

test("critical path hoy->sesion->cierre->evaluacion emits structured events", () => {
  const events = [];
  const orchestrator = new Orchestrator({
    storageAdapter: createMemoryStorage(),
    onEvent: (event) => events.push(event)
  });

  orchestrator.init(buildCriticalDayContent());

  orchestrator.emit(EVENT_NAMES.ROUTE_CHANGED, {
    routeId: "hoy",
    metadata: { from_route: null, to_route: "hoy", source: "startup" }
  });

  orchestrator.emit(EVENT_NAMES.ROUTE_CHANGED, {
    routeId: "sesion",
    metadata: { from_route: "hoy", to_route: "sesion", source: "shell_nav" }
  });

  orchestrator.submitStep("CP_S1", { checked: true });
  orchestrator.submitStep("CP_S2", { checked: true });

  orchestrator.emit(EVENT_NAMES.ROUTE_CHANGED, {
    routeId: "cierre",
    metadata: { from_route: "sesion", to_route: "cierre", source: "shell_nav" }
  });

  orchestrator.emit(EVENT_NAMES.ROUTE_CHANGED, {
    routeId: "evaluacion",
    metadata: { from_route: "cierre", to_route: "evaluacion", source: "shell_nav" }
  });

  const eventNames = events.map((event) => event.event);
  assert.equal(eventNames.includes(EVENT_NAMES.SESSION_STARTED), true);
  assert.equal(eventNames.includes(EVENT_NAMES.SESSION_COMPLETED), true);

  const routeEvents = events.filter((event) => event.event === EVENT_NAMES.ROUTE_CHANGED);
  assert.deepEqual(
    routeEvents.map((event) => event.metadata?.to_route),
    ["hoy", "sesion", "cierre", "evaluacion"]
  );

  const completedIndex = eventNames.indexOf(EVENT_NAMES.SESSION_COMPLETED);
  const closeRouteIndex = routeEvents.findIndex((event) => event.metadata?.to_route === "cierre");
  assert.equal(completedIndex >= 0, true);
  assert.equal(closeRouteIndex >= 0, true);

  for (const payload of events) {
    for (const key of REQUIRED_ENVELOPE_KEYS) {
      assert.equal(Object.prototype.hasOwnProperty.call(payload, key), true);
    }

    assert.equal(typeof payload.session_id, "string");
    assert.equal(payload.day_id, "W20_D04");
    assert.equal(Number.isNaN(Date.parse(payload.at)), false);
  }
});
