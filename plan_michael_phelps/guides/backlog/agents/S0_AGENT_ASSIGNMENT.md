# Sprint 0 - Agent Assignment and Kickoff

Date: 2026-02-10
Source backlog: `guides/SPRINT_BACKLOG_0_B2_V1.md` and `guides/backlog/import/BACKLOG_MASTER_S0.csv`.

Assignment policy: one dedicated execution agent per story (`S0-B01..S0-B09`). Subtasks are owned by the same agent to avoid overlap.

| Story | Agent | Module | Priority | Depends On | Status | Kickoff Artifact |
|---|---|---|---|---|---|---|
| `S0-B01` | `Agent-S0-01` | Navigation Shell | Highest | - | `STARTED` | `guides/backlog/agents/workpacks/S0-B01.md` |
| `S0-B02` | `Agent-S0-02` | Navigation Shell | Highest | S0-B01 | `STARTED` | `guides/backlog/agents/workpacks/S0-B02.md` |
| `S0-B03` | `Agent-S0-03` | Governance | Highest | S0-B01 | `STARTED` | `guides/backlog/agents/workpacks/S0-B03.md` |
| `S0-B04` | `Agent-S0-04` | Quality Pipeline | Highest | S0-B03 | `STARTED` | `guides/backlog/agents/workpacks/S0-B04.md` |
| `S0-B05` | `Agent-S0-05` | Quality Pipeline | Highest | S0-B04 | `STARTED` | `guides/backlog/agents/workpacks/S0-B05.md` |
| `S0-B06` | `Agent-S0-06` | Design System | High | - | `STARTED` | `guides/backlog/agents/workpacks/S0-B06.md` |
| `S0-B07` | `Agent-S0-07` | Design System | High | S0-B06 | `STARTED` | `guides/backlog/agents/workpacks/S0-B07.md` |
| `S0-B08` | `Agent-S0-08` | Curriculum Data | Highest | S0-B04 | `STARTED` | `guides/backlog/agents/workpacks/S0-B08.md` |
| `S0-B09` | `Agent-S0-09` | Observability | High | S0-B01 | `STARTED` | `guides/backlog/agents/workpacks/S0-B09.md` |

## Coordination Guardrails

1. Each agent edits only its scoped paths until integration window.
2. Cross-story changes require explicit handoff note in workpack.
3. Integration order follows dependency graph from `dependencies_s0.csv`.
4. Merge gate: tests and validations listed in each workpack must pass.

## Daily Sync Contract

1. Report blockers in the format: `story -> blocker -> needed decision`.
2. Report progress in the format: `story -> files changed -> validation evidence`.
3. Escalate scope changes to Program Lead before touching out-of-scope files.