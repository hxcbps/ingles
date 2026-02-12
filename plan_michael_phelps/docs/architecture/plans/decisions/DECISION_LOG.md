# Architecture Decision Log

Last reviewed: 2026-02-12
Status: active

## Decision Entries

### D-2026-02-12-001

- Context: Agents were operating with fragmented architecture docs and no stable entrypoint.
- Decision: Introduce `docs/architecture/` as first-class knowledge base with progressive disclosure.
- Consequence: New agents can start from one stable path and expand context incrementally.

### D-2026-02-12-002

- Context: Architecture docs were not mechanically validated in CI.
- Decision: Add docs lint and docs drift checks to quality gates.
- Consequence: Documentation structure and freshness become enforceable constraints.

### D-2026-02-12-003

- Context: Need deterministic orchestration rules for direct-to-main agent workflows.
- Decision: Define `AGENTS.md` contract at repo root with strict workflow and quality commands.
- Consequence: Agent behavior is standardized and less dependent on chat context.

### D-2026-02-12-004

- Context: Documentation can drift between pushes even when content quality gates pass.
- Decision: Add scheduled `docs-review` workflow to run lint + drift + canonical audit snapshot on weekdays.
- Consequence: Drift is detected recurrently without relying on manual checks or PR-only workflows.
