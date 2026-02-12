# Domain x Layer Quality Scoreboard

Last reviewed: 2026-02-12
Status: active

This document classifies architecture quality by business domain and layer. It also tracks deficiency trends over time.

## Scoring Model

- `Green`: target behavior is implemented and validated.
- `Amber`: partially implemented; bounded risk exists.
- `Red`: missing or violated boundary.

## Current Classification

| Domain | Types | Config | Repo | Service | Runtime | UI | Providers | Status | Deficiencies |
|---|---|---|---|---|---|---|---|---|---|
| Curriculum Content | Green | Green | Green | Green | Amber | Amber | Green | Amber | `TD-004` |
| Prompt and Resources | Green | Green | Green | Amber | Amber | Amber | Green | Amber | `TD-004` |
| Session Runtime | Amber | Green | Amber | Green | Green | Amber | Amber | Amber | `TD-001`, `TD-003` |
| Navigation Shell | Green | Green | Amber | Amber | Green | Amber | Green | Amber | `TD-001`, `TD-002` |
| Progress and Measurement | Green | Green | Green | Green | Amber | Amber | Amber | Amber | `TD-001` |
| Governance and Quality | Green | Green | Green | Green | Green | Green | Green | Green | none |

## Deficiency Snapshot

| ID | Severity | Domain | Layer | Summary | Owner | Target Sprint | Status |
|---|---|---|---|---|---|---|---|
| `TD-001` | P1 | Session Runtime / Navigation / Progress | Runtime/UI | Layer boundaries are defined but not yet enforced by import-level structural tests. | Frontend Core | S6 | Open |
| `TD-002` | P1 | Navigation Shell | UI | UX consistency still requires first-90-seconds onboarding hardening for new learners. | Product + Frontend | S6 | Open |
| `TD-003` | P2 | Session Runtime | Providers | Providers interface is present but not isolated into a dedicated package root. | Frontend Core | S7 | Open |
| `TD-004` | P2 | Curriculum/Prompt/Resources | Runtime/UI | Some content references are surfaced as plain text instead of structured actionable cards in all views. | Learning + Frontend | S6 | Open |

## Trend Log

| Date | Architecture score | Content audit | Notes |
|---|---|---|---|
| 2026-02-10 | Amber (baseline) | P0=63 / P1=46 / P2=6 | Pre-remediation baseline from canonical audit. |
| 2026-02-11 | Green for content / Amber for architecture | P0=0 / P1=0 / P2=0 | Content debt closed; runtime and UX debt remains. |
| 2026-02-12 | Amber (improving) | P0=0 / P1=0 / P2=0 | Domain/layer map and docs CI policy introduced. |

## Review Cadence

- Update this file whenever a plan changes domain boundaries or closes/open deficits.
- Keep this synchronized with:
  - `docs/architecture/DOMAIN_LAYER_MAP.md`
  - `docs/architecture/plans/debt/TECH_DEBT_REGISTER.md`
  - `docs/architecture/plans/decisions/DECISION_LOG.md`
