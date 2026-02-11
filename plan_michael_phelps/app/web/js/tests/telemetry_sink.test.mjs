import test from "node:test";
import assert from "node:assert/strict";

import { TelemetrySink, createTelemetrySink } from "../core/telemetry_sink.js";

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

test("telemetry sink stores and caps events", () => {
  const storage = createMemoryStorage();
  const sink = new TelemetrySink({ storageAdapter: storage, maxEvents: 3, storageKey: "test:telemetry" });

  sink.write({ event: "e1" });
  sink.write({ event: "e2" });
  sink.write({ event: "e3" });
  sink.write({ event: "e4" });

  const events = sink.list();
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((event) => event.event), ["e2", "e3", "e4"]);
  assert.equal(typeof events[0].at, "string");
});

test("telemetry sink reloads persisted events", () => {
  const storage = createMemoryStorage();
  const sinkA = createTelemetrySink({ storageAdapter: storage, storageKey: "test:persist", maxEvents: 5 });

  sinkA.write({ event: "session_started", session_id: "sess_1", day_id: "W01_D01" });
  sinkA.write({ event: "step_started", session_id: "sess_1", day_id: "W01_D01", step_id: "S1" });

  const sinkB = createTelemetrySink({ storageAdapter: storage, storageKey: "test:persist", maxEvents: 5 });
  const events = sinkB.list();

  assert.equal(events.length, 2);
  assert.equal(events[0].event, "session_started");
  assert.equal(events[1].step_id, "S1");
});

test("telemetry sink clear wipes storage and memory buffer", () => {
  const storage = createMemoryStorage();
  const sink = createTelemetrySink({ storageAdapter: storage, storageKey: "test:clear" });

  sink.write({ event: "a" });
  sink.write({ event: "b" });
  assert.equal(sink.list().length, 2);

  sink.clear();
  assert.equal(sink.list().length, 0);
  assert.equal(storage.getItem("test:clear"), null);
});
