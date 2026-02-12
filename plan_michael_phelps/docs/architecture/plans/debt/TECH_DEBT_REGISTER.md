# Technical Debt Register

Last reviewed: 2026-02-12
Status: active

## Open Debt

| ID | Severity | Area | Description | Mitigation | Owner | Target |
|---|---|---|---|---|---|---|
| `TD-001` | P1 | Layer enforcement | Import boundaries are documented but not fully enforced with structural tests at JS import graph level. | Add architecture boundary tests + custom JS dependency linter. | Frontend Core | S6 |
| `TD-002` | P1 | UX onboarding | New learners still face friction in first-run guidance and action clarity. | Implement first-90-seconds onboarding and measurable CTA flow. | Product + Frontend | S6 |
| `TD-003` | P2 | Provider isolation | Providers contract exists conceptually but is not yet isolated under a dedicated package root. | Create `app/web/js/providers/` and migrate routing/telemetry providers. | Frontend Core | S7 |
| `TD-004` | P2 | Curriculum UX bridge | Not every content artifact is rendered as structured actionable cards in all views. | Add renderer contract for prompt/resource/evidence cards across views. | Learning + Frontend | S6 |

## Closed Debt

| ID | Closed date | Summary |
|---|---|---|
| none | - | - |

## Rules

1. Every open debt ID must appear in `DOMAIN_LAYER_QUALITY_SCOREBOARD.md`.
2. Closing debt requires:
- linked commit SHA,
- updated scoreboard,
- updated decision log.
