# Sprint 1 Wave 2 - Agent Assignment

Date: 2026-02-10
Source backlog: `guides/backlog/P0_CONTENT_REMEDIATION_QUEUE.md`

Objective: close remaining P0 findings (`46`) with parallel, non-overlapping file ownership.

## Assignment Matrix

| Lane | Agent | Queue IDs | File Ownership | Priority | Status |
|---|---|---|---|---|---|
| `S1-W2-01` | `Agent-S1-10` | `P0-026..P0-043` | `learning/prompts/PROMPT_PACK.md` | Highest | `DONE` |
| `S1-W2-02` | `Agent-S1-11` | `P0-011`, `P0-049` | `learning/content/week06.v4.json` | Highest | `DONE` |
| `S1-W2-03` | `Agent-S1-12` | `P0-012`, `P0-050` | `learning/content/week07.v4.json` | Highest | `DONE` |
| `S1-W2-04` | `Agent-S1-13` | `P0-013`, `P0-051` | `learning/content/week08.v4.json` | Highest | `DONE` |
| `S1-W2-05` | `Agent-S1-14` | `P0-014`, `P0-052` | `learning/content/week09.v4.json` | Highest | `DONE` |
| `S1-W2-06` | `Agent-S1-15` | `P0-016`, `P0-017`, `P0-053`, `P0-054` | `learning/content/week11.v4.json`, `learning/content/week12.v4.json` | Highest | `DONE` |
| `S1-W2-07` | `Agent-S1-16` | `P0-018`, `P0-019`, `P0-055`, `P0-056` | `learning/content/week13.v4.json`, `learning/content/week14.v4.json` | Highest | `DONE` |
| `S1-W2-08` | `Agent-S1-17` | `P0-020`, `P0-021`, `P0-057`, `P0-058` | `learning/content/week15.v4.json`, `learning/content/week16.v4.json` | Highest | `DONE` |
| `S1-W2-09` | `Agent-S1-18` | `P0-022`, `P0-023`, `P0-059`, `P0-060` | `learning/content/week17.v4.json`, `learning/content/week18.v4.json` | Highest | `DONE` |
| `S1-W2-10` | `Agent-S1-19` | `P0-024`, `P0-025`, `P0-061`, `P0-062` | `learning/content/week19.v4.json`, `learning/content/week20.v4.json` | Highest | `DONE` |

## Integration Order

1. Merge `S1-W2-01` (prompt pack) first.
2. Merge content lanes in batches (`S1-W2-02..05`, then `S1-W2-06..10`).
3. Re-run canonical audit after each merge batch.

## Guardrails

1. One lane, one file set. No cross-lane edits.
2. Keep schema and router untouched in this wave.
3. Every lane must pass canonical audit no-regression after integration.
