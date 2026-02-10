import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENT_NAMES,
  REQUIRED_ENVELOPE_KEYS,
  buildRuntimeEvent,
  createSessionId,
  isKnownEventName
} from "../core/events_schema_v1.js";

test("events schema validates known names and envelope shape", () => {
  const payload = buildRuntimeEvent({
    event: EVENT_NAMES.SESSION_STARTED,
    session_id: createSessionId(),
    day_id: "W01_D01",
    step_id: null,
    route_id: "hoy",
    metadata: {
      day_goal: "Completar sesion",
      total_steps: 3
    }
  });

  for (const key of REQUIRED_ENVELOPE_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(payload, key), true);
  }

  assert.equal(payload.event, EVENT_NAMES.SESSION_STARTED);
  assert.equal(payload.day_id, "W01_D01");
  assert.equal(payload.route_id, "hoy");
  assert.equal(isKnownEventName(payload.event), true);
  assert.equal(Number.isNaN(Date.parse(payload.at)), false);
});

test("events schema rejects unknown event names", () => {
  assert.throws(() => {
    buildRuntimeEvent({
      event: "unknown_event",
      session_id: createSessionId(),
      day_id: "W01_D01",
      metadata: {}
    });
  }, /Unknown runtime event name/);
});
