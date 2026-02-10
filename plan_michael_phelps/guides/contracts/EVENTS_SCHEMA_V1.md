# Runtime Events Schema V1

- Status: Draft (kickoff)
- Owner: Agent-S0-09 (`S0-B09`)

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
- Trigger: navigation transition
- Required metadata: `from_route`, `to_route`, `source`

2. `session_started`
- Trigger: orchestrator init with executable day
- Required metadata: `day_goal`, `total_steps`

3. `step_started`
- Trigger: current step becomes active
- Required metadata: `step_type`, `gate_type`, `step_index`, `total_steps`

4. `gate_passed`
- Trigger: gate validation success
- Required metadata: `gate_type`, `attempt`

5. `gate_failed`
- Trigger: gate validation fail
- Required metadata: `gate_type`, `attempt`, `reason`

6. `recovery_started`
- Trigger: fallback step activation
- Required metadata: `from_step_id`, `fallback_step_id`

7. `session_completed`
- Trigger: last primary step completed
- Required metadata: `progress_pct`, `duration_sec`

8. `session_abandoned`
- Trigger: unload/exit before completion
- Required metadata: `reason`

9. `content_fallback_used`
- Trigger: preferred day unavailable and fallback day loaded
- Required metadata: `requested_day`, `fallback_day`, `week`

## Validation Rules

- All events must include full envelope keys.
- Unknown event names are rejected by test suite.
- `at` must be parseable ISO timestamp.
- `session_id` must be stable during one session lifecycle.

## Adoption in Code

Initial touch points:

- `app/web/js/core/orchestrator.js`
- `app/web/js/core/bootstrap_v4.js`

