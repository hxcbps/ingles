# Content Contract V4.1

- Status: Draft (kickoff)
- Owner: Agent-S0-03 (`S0-B03`)
- Effective scope: `learning/content/week*.v4.json`
- Schema: `learning/content/schema.v4.1.json`

## Objective

Freeze a stable contract for curriculum/runtime integration while eliminating P0 data risks.

## Contract Entities

1. Week envelope
- `version`, `week`, `title`, `week_profile`, `days`

2. Day envelope
- `day_id`, `goal`, `session_script`
- Optional: `retention_loop`, `assessment_event`

3. Session step
- `step_id`, `type`, `title`, `difficulty_level`, `duration_min`, `content`, `gate`

## Frozen Enums (V4.1)

Step types:
- `input_video`
- `textbook_drill`
- `ai_roleplay`
- `recording_task`
- `quiz`
- `reading_task`
- `writing_transfer`
- `repair_drill`
- `pronunciation_lab`

Gate types:
- `timer_complete`
- `self_score`
- `min_words`
- `evidence_upload`
- `compound`
- `manual_check`
- `artifact_uploaded`
- `evidence_log_min_words`
- `min_turns`
- `rubric_min`
- `metrics_threshold`

## Integrity Rules (P0 blockers)

1. `session_script` must not be empty for executable learning days.
2. `difficulty_level` must align with module/week CEFR target (no downward drift in production steps).
3. Every `prompt_ref` must resolve in prompt registry.
4. Any `resource_locator` must include valid `page`.
5. Placeholder content in required fields is forbidden (`TBD`, `http://example.com`, `https://...`, `youtube.com/...`).
6. Milestone weeks require at least one `assessment_event: true`.

## Validation Stack

1. JSON schema validation (`schema.v4.1.json`).
2. Curriculum integrity validation (`scripts/validate_curriculum_integrity.py`).
3. Release gate audit (`--fail-on-p0`).

## Compatibility Notes (v4 -> v4.1)

- Structural compatibility is preserved.
- Enforcement is tightened via validator and CI rules.
- Runtime consumption in orchestrator stays backward-compatible for v4 payload shape.

