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

### D-2026-02-12-005

- Context: UX quality checks existed as manual guidance but were not part of repository-owned delivery gates.
- Decision: Version `scripts/run_frontend_ux_gates.sh` in the project and wire it into `quality-gates` workflows.
- Consequence: Frontend fluidez, accesibilidad baseline y contratos de UI se validan mecánicamente en cada integración.

### D-2026-02-12-006

- Context: The session wizard could lose its mount target after shell route re-render, producing an apparently empty `Sesion` module.
- Decision: Remount wizard explicitly when route/view enters `sesion` from bootstrap runtime wiring.
- Consequence: Session execution remains visible and actionable after navigation changes.

### D-2026-02-12-007

- Context: The `frontend-ux` gate failed in CI with limited diagnostics and predictable runner prerequisite gaps.
- Decision: Add `Agent Quality Guardian` script and workflow jobs to enforce frontend-ux prerequisites and validate agent-orchestration quality contracts.
- Consequence: Predictable failures (missing prerequisites, workflow drift, orchestration inconsistencies) are detected early with structured artifacts.

### D-2026-02-12-008

- Context: Product feedback reported low visual impact and unclear navigation even after planning artifacts were created.
- Decision: Apply an immediate S7 visual hotfix layer (`reboot_s7.css`) plus navigation label clarity and button reset, while keeping Figma-first Wave 1 as the strategic design phase.
- Consequence: The app gains immediate UX clarity and stronger CTA hierarchy without waiting for full redesign, but token-hardcode debt remains and must be reduced in subsequent implementation waves.

### D-2026-02-12-009

- Context: The visual hotfix improved the interface, but product direction still requires stronger consistency and explicit ownership by design skeleton domains.
- Decision: Create Sprint 7 Wave 2 specialist lanes for palette, button system, typography, motion, and color storytelling with independent Figma artifacts and controlled merge rules.
- Consequence: Design quality becomes accountable per specialist lane, reducing ambiguity and accelerating convergence to a professional and coherent UI system.

### D-2026-02-12-010

- Context: Product requested explicit specialist execution by design skeleton domains (palette, buttons, typography, motion, color storytelling).
- Decision: Execute Sprint 7 Wave 2 specialist lanes and publish a unified design merge artifact (`S7-W2-06`) as implementation baseline.
- Consequence: Visual decisions become traceable by domain, enabling controlled implementation and reducing style inconsistency drift.

### D-2026-02-12-011

- Context: Product feedback reports persistent lack of professional visual consistency despite S7 improvements.
- Decision: Base the next UI wave on official benchmark references (Tailwind ecosystem, leading product sites, accessibility standards, Figma variable workflows) and codify them into hard agent acceptance gates.
- Consequence: Subjective design debate is reduced by measurable criteria for palette, typography, CTA hierarchy, motion, and color storytelling.

### D-2026-02-12-012

- Context: Style ownership remained concentrated in `app/web/css` without package-level governance, making reuse and parallel specialization fragile.
- Decision: Introduce `design_factory/` as a monorepo-style package layout and generate `app/web/css/factory.css` through `scripts/build_design_factory_css.sh`, imported by the canonical CSS entrypoint.
- Consequence: Each design skeleton can evolve independently while the app consumes one controlled output artifact.

### D-2026-02-12-013

- Context: Design Factory Wave-1 established package scaffolding but product feedback requested deeper quality and clearer trust signals in visual execution.
- Decision: Launch S8 Wave-2 deep refinement with package-level hardening for palette, typography, buttons, motion, and story coverage over shell/wizard/module artifacts.
- Consequence: Visual system moves from scaffold quality to production-grade contract with tighter state and semantic control.

### D-2026-02-12-014

- Context: Styling key sections (hero/widgets/journey cards) via utility-only selectors was brittle for long-term governance.
- Decision: Add semantic hooks in runtime markup (`hero-banner`, `widget-card`, `journey-card`) and target them from Design Factory story package.
- Consequence: Frontend visual changes become more deterministic, maintainable, and less dependent on broad utility overrides.

### D-2026-02-12-015

- Context: Product requested direct adoption of a premium dual-theme progreso visual system with cleaner architecture than inline shell templates.
- Decision: Extract progreso rendering into `app/web/js/ui/renderers/progress_premium_renderer.js` and add `design_factory/packages/progress/progress.css`, wired in the factory build pipeline.
- Consequence: Progreso UI now follows a dedicated renderer + package contract, reducing shell coupling and enabling independent evolution of premium visual patterns.
