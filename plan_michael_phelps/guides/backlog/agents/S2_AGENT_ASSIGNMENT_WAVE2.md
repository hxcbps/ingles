# Sprint 2 Wave 2 - Agent Assignment

Date: 2026-02-11
Source: `guides/SPRINT_BACKLOG_0_B2_V1.md` phases `S3 frontend integration debt burn-down` and `S4 runtime/UX polish`.

Objective: remove remaining hardcoded dashboard tokens in shell and expose runtime-backed progression without regressing quality gates.

## Parallel Lane Plan

| Lane ID | Agent | Scope | Files | Priority | Status |
|---|---|---|---|---|---|
| `S2-W2-01` | `Agent-S2-08` | Dashboard metrics contract and runtime mapping (`program`, `weekSummaries`, `session snapshot`) | `app/web/js/ui/learning_shell.js` | High | `DONE` |
| `S2-W2-02` | `Agent-S2-09` | Regression tests for shell render + derived metrics defaults | `app/web/js/tests/learning_shell_render.test.mjs` | High | `DONE` |
| `S2-W2-03` | `Agent-S2-10` | Backlog governance update and execution status evidence | `guides/backlog/agents/EXECUTION_STATUS_S2_WAVE2.md`, `guides/SPRINT_BACKLOG_0_B2_V1.md` | Medium | `DONE` |

## Integration Order

1. Merge `S2-W2-01` (runtime metrics wiring).
2. Merge `S2-W2-02` (regression tests).
3. Merge `S2-W2-03` (status + backlog checkpoint).
