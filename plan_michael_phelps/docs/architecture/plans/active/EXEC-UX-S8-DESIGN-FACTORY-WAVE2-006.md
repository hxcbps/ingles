# EXEC-UX-S8-DESIGN-FACTORY-WAVE2-006 - Design Factory Deep Refinement

Status: active
Owner: UI UX Director Agent
Started: 2026-02-12
Updated: 2026-02-13

## Objective

Execute a detailed, package-by-package refinement of Design Factory so palette, typography, buttons, motion, and storytelling become production-grade and consistently applied to all major frontend artifacts.

## Scope

In scope:
- Deep review and hardening of:
  - `design_factory/packages/palette/palette.css`
  - `design_factory/packages/typography/typography.css`
  - `design_factory/packages/buttons/buttons.css`
  - `design_factory/packages/motion/motion.css`
  - `design_factory/packages/story/story.css`
- Regenerate and validate:
  - `design_factory/dist/factory.css`
  - `app/web/css/factory.css`
- Ensure styles are mapped to real shell/wizard/module artifacts in runtime markup.

Out of scope:
- curriculum/content contract changes
- routing logic redesign

## Current Audit Snapshot

Commands executed:
- `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`

Result:
- Runtime: `PASS`
- Visual direction: improved, but requires deeper package-level governance and artifact coverage.

## Findings (severity-first)

| Severity | Finding | Evidence |
|---|---|---|
| P1 | Package styles were still too shallow for full shell + wizard + module artifact coverage. | `design_factory/packages/*.css` |
| P1 | Hero/widgets/journey structures lacked stable semantic hooks for deterministic styling. | `app/web/js/ui/learning_shell.js` |
| P2 | Motion and state mapping needed clearer contract for loading/focus/disabled patterns. | `design_factory/packages/motion/motion.css`, `design_factory/packages/buttons/buttons.css` |

## Work Breakdown

| Item | Description | Status |
|---|---|---|
| W1 | Publish Wave-2 specialist assignment for package-level deep refinement | Done |
| W2 | Add semantic hooks in runtime markup for stable style targeting | Done |
| W3 | Expand palette package with semantic and legacy bridge tokens | Done |
| W4 | Expand typography package with editorial ramp + utility mapping | Done |
| W5 | Expand buttons package with full interaction state model | Done |
| W6 | Expand motion package with purposeful transitions + reduced motion | Done |
| W7 | Expand story package for shell/wizard/modules coherence | Done |
| W8 | Rebuild factory output and run mandatory quality gates | Done |

## Progress Log

- 2026-02-12: User requested a deeper, detailed treatment across design factory packages.
- 2026-02-12: Wave-2 execution initiated with dedicated package ownership and explicit path-level scope.
- 2026-02-12: Runtime shell markup augmented with semantic hooks for hero/widgets/journey components.
- 2026-02-12: Palette/typography/buttons/motion/story packages upgraded with stricter contracts.
- 2026-02-12: Wave-2 worktrees provisioned for lanes S8-DF2-01..06.
- 2026-02-12: Mandatory validation suite passed (lint, drift, audit, tests, frontend-ux, guardian).
- 2026-02-12: Token baseline shifted toward Apple/Stripe semantics (text hierarchy, surfaces, borders, elevation, CTA weight) in `design_factory` packages.
- 2026-02-12: Resilience UX hardened with skeleton loading shell, offline banner with retry action, and friendlier fatal-state rendering.
- 2026-02-13: Unified shell chrome for all routes (including `progreso`) through shared `es-*` header contract and removed legacy dead render paths from `learning_shell.js`.
- 2026-02-13: Session wizard now inherits shell-level visual language (tokens, buttons, focus, surfaces) via final override layer in `app/web/css/shell_rethink.css`.
- 2026-02-13: Consolidated CSS layers by removing legacy overrides (`reboot_s7.css`, `shell_unified.css`, `wizard.css`) from canonical entrypoint and repository.
- 2026-02-13: Token discipline now reports only true hard-coded colors (hex and non-tokenized rgb/rgba) and passes with zero findings after tokenizing `base/layout/components/utilities`.
- 2026-02-13: Applied shell-level contrast hardening in `app/web/css/shell_rethink.css` (explicit heading colors, dark-mode accent-ink CTAs, muted glow/background balancing, stronger surface contrast) to fix low-visibility text and button states across `hoy`, `sesion`, `modulos` and `progreso`.
- 2026-02-13: Isolated legacy Wave-3 shell theming in `app/web/css/factory.css` under `.app-shell` scope to stop style collision with `es-*` shell routes.
- 2026-02-13: Added micro-typography and spacing rhythm contracts in `app/web/css/shell_rethink.css` using `data-view-panel` selectors (line-height, weight, heading scale, and per-view gap behavior with responsive clamps).
- 2026-02-13: Removed runtime inheritance of `loading-shell` layout in `v4-root` mount path (`bootstrap_v4.js`, `main.js`) to eliminate centered/slab-like rendering artifacts after app boot.
- 2026-02-13: Simplified shell background composition in `app/web/css/shell_rethink.css` (flat body backdrop + minimal shell overlay) and replaced per-route heading jumps with one shared typography scale for stable rhythm between `hoy` and `sesion`.
- 2026-02-13: Scoped residual legacy dark-state/button/story selectors in `app/web/css/factory.css` to `.app-shell` only, preventing collisions with `es-*` shell controls and background contracts.
- 2026-02-13: Final shell rhythm pass in `app/web/css/shell_rethink.css`: lower display/section heading scales, reduced card contrast/shadow density, removed route-specific `es-shell--progress` chrome variance, and aligned spacing cadence across route panels.
- 2026-02-13: Refactored route skeletons in `app/web/js/ui/learning_shell.js` (`hoy`, `sesion`, `cierre`, `evaluacion`, `modulos`) to semantic panel-based structure (`es-view-stack`, `es-panel`, `es-actions-row`, rhythm grid) for coherent section hierarchy.
- 2026-02-13: Rebuilt progreso standalone markup in `app/web/js/ui/renderers/progress_premium_renderer.js` to `es-*` contracts and removed dependence on legacy `progress-shell` class naming.
- 2026-02-13: Extended `app/web/css/shell_rethink.css` with shared semantic primitives (panel, rhythm, pill, heatmap, table, progress summary layout) and rebalanced heading scale (`hero > section > card`) for clearer typographic order.
- 2026-02-13: Removed dead legacy `progress-shell/progress-app-shell` CSS from `app/web/css/factory.css` to eliminate residual style collisions and reduce visual debt.
- 2026-02-13: Fixed side-card semantic mismatch in `app/web/js/ui/learning_shell.js` (`Operational Signal`, `Quick Routes`) so `es-card__head` no longer splits title/subtitle in separate columns.
- 2026-02-13: Increased structural contrast in `app/web/css/shell_rethink.css` (`es-card`, `es-card--main`, `es-panel`, list/table surfaces) to restore explicit section framing and reduce “text floating” perception.

## Decision Log

Related decisions are recorded in:
- `docs/architecture/plans/decisions/DECISION_LOG.md`

Decision delta for this execution:
- Prioritize package-level design governance and semantic style targeting over ad-hoc utility overrides.

## Validation Checklist

- [x] `python3 scripts/lint_architecture_docs.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/check_docs_drift.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/audit_english_sprint.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `node --test app/web/js/tests/*.test.mjs`
- [x] `bash scripts/run_frontend_ux_gates.sh /Users/dfernandez/code/ingles/plan_michael_phelps`
- [x] `python3 scripts/agent_quality_guardian.py --repo-root /Users/dfernandez/code/ingles/plan_michael_phelps`

## Multi-Agent Orchestration

See:
- `guides/backlog/agents/S8_AGENT_ASSIGNMENT_DESIGN_FACTORY_WAVE2.md`
- `guides/backlog/agents/AGENT_LAUNCH_COMMANDS_S8_DESIGN_FACTORY_WAVE2.md`
- `guides/backlog/agents/EXECUTION_STATUS_S8_DESIGN_FACTORY_WAVE2.md`
- `guides/backlog/agents/S8_AGENT_PROMPT_LIBRARY_DESIGN_FACTORY_WAVE2.md`

## Definition of Done

- Each package has a complete and non-overlapping visual contract.
- Factory output drives shell, wizard, and module artifacts consistently.
- Accessibility and reduced-motion behavior remain explicit and testable.
