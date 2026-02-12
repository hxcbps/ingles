# EXEC-ARCH-KB-001 - Agent-Readable Architecture Reboot

Status: active
Owner: Architecture Lead
Started: 2026-02-12
Updated: 2026-02-12

## Objective

Create an architecture knowledge base that is readable and enforceable by agents without relying on external context.

## Scope

In scope:

- Domain/layer map with strict dependency directions.
- Quality scoreboard by domain and layer.
- Versioned plan registry (active/completed/debt/decisions).
- Mechanical docs validation in CI.
- `AGENTS.md` orchestration rules.
- Scheduled docs-review automation in CI.

Out of scope:

- Full package relocation to strict physical layers.
- Backend multi-tenant platform design.

## Work Breakdown

| Item | Description | Status |
|---|---|---|
| W1 | Create architecture entrypoint and domain/layer map | Done |
| W2 | Create quality scoreboard with trend tracking | Done |
| W3 | Create plan/debt/decision registry | Done |
| W4 | Add docs linters and CI enforcement | Done |
| W5 | Publish AGENTS orchestration rules | Done |
| W6 | Align root/project README with new architecture source | Done |
| W7 | Add scheduled docs review workflow | Done |

## Progress Log

- 2026-02-12: Knowledge base scaffolded under `docs/architecture`.
- 2026-02-12: Layer map and scoreboard published with deficiency IDs.
- 2026-02-12: Docs lint and drift scripts added and wired to quality-gates CI.
- 2026-02-12: AGENTS rules published for direct-to-main agent workflows.
- 2026-02-12: Scheduled docs-review workflow added for recurrent drift checks.

## Decision Log

Related decisions are recorded in:

- `docs/architecture/plans/decisions/DECISION_LOG.md`

## Validation Checklist

- [x] `python3 scripts/lint_architecture_docs.py --repo-root .`
- [x] `python3 scripts/check_docs_drift.py --repo-root .`
- [x] `python3 scripts/audit_english_sprint.py --repo-root .`
- [x] Existing JS tests still pass after documentation/CI wiring changes
