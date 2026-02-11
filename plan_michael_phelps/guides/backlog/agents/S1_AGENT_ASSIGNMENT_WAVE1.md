# Sprint 1 Wave 1 - Agent Assignment (Recalibrated)

Date: 2026-02-10
Source backlog: `guides/backlog/P0_CONTENT_REMEDIATION_QUEUE.md`
Calibration source: `guides/backlog/agents/PIPELINE_RCA_AND_RECALIBRATION_S0_TO_S1.md`

Objective: execute Wave-1 P0 remediation in parallel with strict file ownership so agents do not collide.

## Assignment Matrix

| Lane | Agent | Queue IDs | File Ownership | Priority | Status |
|---|---|---|---|---|---|
| `S1-W1-01` | `Agent-S1-01` | `P0-001` | `learning/content/week16.v4.json` | Highest | `DONE` |
| `S1-W1-02` | `Agent-S1-02` | `P0-002` | `learning/content/week17.v4.json` | Highest | `DONE` |
| `S1-W1-03` | `Agent-S1-03` | `P0-003` | `learning/content/week18.v4.json` | Highest | `DONE` |
| `S1-W1-04` | `Agent-S1-04` | `P0-004` | `learning/content/week19.v4.json` | Highest | `DONE` |
| `S1-W1-05` | `Agent-S1-05` | `P0-005` | `learning/content/week20.v4.json` | Highest | `DONE` |
| `S1-W1-06` | `Agent-S1-06` | `P0-015`, `P0-063` | `learning/content/week10.v4.json` | Highest | `DONE` |
| `S1-W1-07` | `Agent-S1-07` | `P0-006`, `P0-044` | `learning/content/week01.v4.json` | Highest | `DONE` |
| `S1-W1-08` | `Agent-S1-08` | `P0-007`, `P0-045` | `learning/content/week02.v4.json` | Highest | `DONE` |
| `S1-W1-09` | `Agent-S1-09` | `P0-008..P0-010`, `P0-046..P0-048` | `learning/content/week03.v4.json`, `learning/content/week04.v4.json`, `learning/content/week05.v4.json` | Highest | `DONE` |

## Integration Order

1. Merge lanes `S1-W1-01..S1-W1-08` first (single-file scope each).
2. Merge `S1-W1-09` last in Wave-1 (touches three files).
3. Re-run audit gate after each merge batch to guarantee no regression.

## Gate Policy

1. Every lane must run local validation before PR:
   - `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
2. Branches must be rebased on current `main` before merge.
3. Merge is allowed only if quality gate remains within policy (`P0 <= baseline` in CI push mode).

## Guardrails

1. No lane may edit prompt files in Wave-1.
2. No lane may modify schema/contracts in Wave-1.
3. If a fix requires cross-week edits, escalate and split into a dedicated lane before coding.
