# EXEC-UX-S8-DESIGN-FACTORY-003 - Benchmark-Driven Design Factory

Status: active
Owner: UI UX Director Agent
Started: 2026-02-12
Updated: 2026-02-12

## Objective

Reprogram agent workflows using benchmarked product design patterns and establish a design factory architecture (monorepo-style) so visual quality becomes consistent, measurable, and reusable.

## Scope

In scope:
- Benchmark top product web patterns (Tailwind ecosystem + high-trust product sites).
- Convert benchmarks into hard rules for 5 specialist lanes:
  - palette
  - buttons
  - typography
  - motion
  - color storytelling
- Publish S8 agent assignment and launch scripts with strict acceptance gates.
- Introduce `design_factory/` package structure and generated CSS output import for app consumption.

Out of scope:
- Full product-wide visual rewrite in one commit.
- Domain/curriculum logic changes.

## Current Audit Snapshot

Commands executed:
- `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`

Result:
- Runtime quality: `PASS`.
- Visual quality: still inconsistent in palette narrative and component governance.

## Findings (severity-first)

| Severity | Finding | Evidence |
|---|---|---|
| P1 | Visual language still feels disconnected across shell, wizard, and cards. | `app/web/css/{tokens,components,reboot_s7}.css` |
| P1 | No benchmark-backed acceptance contract for agent lanes. | `guides/backlog/agents/S7_AGENT_ASSIGNMENT_DESIGN_SKELETON_WAVE2.md` |
| P1 | CSS governance is repo-local but not package-oriented; reuse lifecycle is weak. | `app/web/css/index.css` |
| P2 | Figma artifacts exist but lack explicit external benchmark references and measurable rejection criteria. | `docs/design/figma/FIGMA_DESIGN_SKELETON_AGENTS_S7.md` |

## Work Breakdown

| Item | Description | Status |
|---|---|---|
| W1 | Benchmark web product references and extract design constraints | Done |
| W2 | Publish benchmark artifact with source-backed rules | Done |
| W3 | Define S8 lane assignment with strict acceptance gates | Done |
| W4 | Publish S8 parallel launch commands and worktree scripts | Done |
| W5 | Introduce design factory package layout (palette/buttons/type/motion/story) | Done |
| W6 | Wire generated `factory.css` into app entrypoint as controlled override layer | Done |
| W7 | Run mandatory quality gates and architecture checks | Done |
| W8 | Finalize decision log and execution status handoff | Done |

## Progress Log

- 2026-02-12: User feedback indicates visual progress is still below professional quality expectation.
- 2026-02-12: Benchmark research completed from official Tailwind/product/accessibility/Figma/monorepo sources.
- 2026-02-12: S8 design-factory orchestration drafted with 5 specialist lanes + integration lane.
- 2026-02-12: Design factory package skeleton created and integrated into CSS entrypoint.
- 2026-02-12: S8 worktrees bootstrapped for lanes S8-DF-01..06.
- 2026-02-12: Mandatory quality gates completed in green (lint, drift, audit, tests, frontend-ux, guardian).

## Decision Log

Related decisions are recorded in:
- `docs/architecture/plans/decisions/DECISION_LOG.md`

Decision delta for this execution:
- Move from ad-hoc visual tweaks to benchmark-driven lane contracts with package-governed style distribution.

## Validation Checklist

- [x] `python3 scripts/lint_architecture_docs.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/check_docs_drift.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `node --test app/web/js/tests/*.test.mjs`
- [x] `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/agent_quality_guardian.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`

## Multi-Agent Orchestration

See:
- `guides/backlog/agents/S8_AGENT_ASSIGNMENT_DESIGN_FACTORY_WAVE1.md`
- `guides/backlog/agents/AGENT_LAUNCH_COMMANDS_S8_DESIGN_FACTORY.md`
- `guides/backlog/agents/S8_AGENT_PROMPT_LIBRARY_DESIGN_FACTORY.md`
- `guides/backlog/agents/EXECUTION_STATUS_S8_DESIGN_FACTORY_WAVE1.md`

## Definition of Done

- All 5 specialist lanes deliver benchmark-backed artifacts with measurable gates.
- `design_factory/` package outputs are consumed by app CSS entrypoint.
- Contrast/focus/reduced-motion rules are explicit and enforced.
- Visual system expresses one coherent product story across navigation, hero, cards, and CTAs.
