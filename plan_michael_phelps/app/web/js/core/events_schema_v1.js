const SESSION_ID_PREFIX = "sess_";

export const EVENT_NAMES = Object.freeze({
  ROUTE_CHANGED: "route_changed",
  SESSION_STARTED: "session_started",
  SESSION_RESUMED: "session_resumed",
  STEP_STARTED: "step_started",
  GATE_PASSED: "gate_passed",
  GATE_FAILED: "gate_failed",
  RECOVERY_STARTED: "recovery_started",
  SESSION_COMPLETED: "session_completed",
  SESSION_ABANDONED: "session_abandoned",
  CONTENT_FALLBACK_USED: "content_fallback_used"
});

export const REQUIRED_ENVELOPE_KEYS = Object.freeze([
  "event",
  "at",
  "session_id",
  "day_id",
  "step_id",
  "route_id",
  "metadata"
]);

const EVENT_NAME_SET = new Set(Object.values(EVENT_NAMES));

function randomHex(size) {
  let out = "";
  while (out.length < size) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out.slice(0, size);
}

export function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${SESSION_ID_PREFIX}${crypto.randomUUID()}`;
  }

  const time = Date.now().toString(16);
  return `${SESSION_ID_PREFIX}${time}-${randomHex(12)}`;
}

export function isKnownEventName(eventName) {
  return EVENT_NAME_SET.has(eventName);
}

function asMetadataObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

function normalizeEventAt(at) {
  if (typeof at === "string" && !Number.isNaN(Date.parse(at))) {
    return at;
  }
  return new Date().toISOString();
}

export function buildRuntimeEvent({
  event,
  session_id,
  day_id,
  step_id = null,
  route_id = null,
  metadata = {},
  at
} = {}) {
  if (!isKnownEventName(event)) {
    throw new Error(`Unknown runtime event name: ${String(event)}`);
  }

  if (typeof session_id !== "string" || !session_id.trim()) {
    throw new Error("session_id is required for runtime events");
  }

  if (typeof day_id !== "string" || !day_id.trim()) {
    throw new Error("day_id is required for runtime events");
  }

  return {
    event,
    at: normalizeEventAt(at),
    session_id,
    day_id,
    step_id: typeof step_id === "string" && step_id.trim() ? step_id : null,
    route_id: typeof route_id === "string" && route_id.trim() ? route_id : null,
    metadata: asMetadataObject(metadata)
  };
}
