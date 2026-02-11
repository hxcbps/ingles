# Runtime Events Schema V1

- Status: Active
- Owner: Frontend Core
- Contract module: `app/web/js/core/events_schema_v1.js`

## Goal

Define stable event payloads for session/runtime observability.

## Envelope (required for all events)

```json
{
  "event": "string",
  "at": "ISO-8601 timestamp",
  "session_id": "string",
  "day_id": "string",
  "step_id": "string|null",
  "route_id": "string|null",
  "metadata": {}
}
```

## Event Catalog

1. `route_changed`
- Trigger: hash route transition (`bootstrap_v4` + `hash_router`)
- Required metadata: `from_route`, `to_route`, `source`

2. `session_started`
- Trigger: orchestrator init with executable day
- Required metadata: `day_goal`, `total_steps`, `start_reason`

3. `session_resumed`
- Trigger: orchestrator rehydrate with compatible state/schema
- Required metadata: `resume_count`, `progress_pct`, `current_step_id`, `schema_signature`

4. `step_started`
- Trigger: current step becomes active
- Required metadata: `step_type`, `gate_type`, `step_index`, `total_steps`

5. `gate_passed`
- Trigger: gate validation success
- Required metadata: `gate_type`, `attempt`

6. `gate_failed`
- Trigger: gate validation fail
- Required metadata: `gate_type`, `attempt`, `reason`

7. `recovery_started`
- Trigger: fallback step activation
- Required metadata: `from_step_id`, `fallback_step_id`

8. `session_completed`
- Trigger: last primary step completed
- Required metadata: `progress_pct`, `duration_sec`

9. `session_abandoned`
- Trigger: unload/exit before completion
- Required metadata: `reason`

10. `content_fallback_used`
- Trigger: preferred day unavailable and fallback day loaded
- Required metadata: `requested_day`, `fallback_day`, `week`

## Validation Rules

- All events include the full envelope keys.
- Unknown event names are rejected by `events_schema_v1.js`.
- `at` is parseable ISO timestamp.
- `session_id` is stable during one session lifecycle.

## Adoption in Code

- `app/web/js/core/events_schema_v1.js`
- `app/web/js/core/orchestrator.js`
- `app/web/js/core/bootstrap_v4.js`
- `app/web/js/core/telemetry_sink.js`
- tests:
  - `app/web/js/tests/events_schema_v1.test.mjs`
  - `app/web/js/tests/orchestrator.test.mjs`
  - `app/web/js/tests/telemetry_sink.test.mjs`
  - `app/web/js/tests/runtime_critical_path_e2e.test.mjs`
