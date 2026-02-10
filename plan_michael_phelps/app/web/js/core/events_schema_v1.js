// S0 kickoff artifact for story S0-B09.
// Canonical runtime event names and required envelope fields.

export const EVENT_NAMES_V1 = Object.freeze([
  'route_changed',
  'session_started',
  'step_started',
  'gate_passed',
  'gate_failed',
  'recovery_started',
  'session_completed',
  'session_abandoned',
  'content_fallback_used'
]);

export const EVENT_ENVELOPE_FIELDS_V1 = Object.freeze([
  'event',
  'at',
  'session_id',
  'day_id',
  'step_id',
  'route_id',
  'metadata'
]);

export function isValidEventName(eventName) {
  return EVENT_NAMES_V1.includes(String(eventName || ''));
}

export function missingEnvelopeFields(payload = {}) {
  return EVENT_ENVELOPE_FIELDS_V1.filter((field) => !(field in payload));
}
