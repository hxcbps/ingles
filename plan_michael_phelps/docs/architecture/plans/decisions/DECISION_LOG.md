# Architecture Decision Log

Last reviewed: 2026-02-13
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

### D-2026-02-12-016

- Context: Product required the `#/modulo/progreso` experience to match a premium standalone dual-theme layout (topbar navigation, no sidebar shell) aligned with provided visual reference.
- Decision: Route `progreso` now renders through a dedicated standalone shell (`renderProgressStandaloneLayout`) while preserving existing shell for other views.
- Consequence: Progreso visual identity is no longer constrained by shared sidebar/dashboard chrome, enabling direct parity with premium dual-theme composition without regressing route contracts.

### D-2026-02-12-017

- Context: Product requested an Apple/Stripe-grade redesign and explicitly reported a disconnected experience (white/empty shell risk, poor load/error feedback).
- Decision: Harden the Design Factory token baseline (palette/typography/buttons/progress) and add first-class resilience states in UI runtime (`skeleton loading`, `offline banner + retry`, `friendly fatal state`).
- Consequence: The app preserves perceived continuity during load/connectivity failures, reduces visual inconsistency across views, and keeps UX quality aligned with premium interface expectations without breaking routing/runtime contracts.

### D-2026-02-13-018

- Context: Product requested full-app visual maturity and reported that `progreso` and `sesion` still felt stylistically disconnected from the rest of the app.
- Decision: Standardize route chrome on the shared `es-*` shell header (including `progreso`) and enforce wizard cohesion through a final override contract in `app/web/css/shell_rethink.css`, while preserving renderer/runtime boundaries.
- Consequence: Navigation, theming controls, and session execution now present one coherent visual language across all primary routes without introducing cross-layer dependency violations.

### D-2026-02-13-019

- Context: Token discipline warnings remained noisy because legacy CSS layers were still versioned and the advisory flagged any `rgb/rgba(...)` usage, including tokenized channel patterns (`rgb(var(--token-rgb) / x)`).
- Decision: Remove obsolete visual layers (`reboot_s7.css`, `shell_unified.css`, `wizard.css`), keep one canonical active shell override, and refine `run_frontend_ux_gates.sh` token advisory to detect only true hard-coded literals (hex + non-tokenized `rgb/rgba`) while excluding generated artifacts.
- Consequence: UX gate signal became actionable; token discipline now passes with zero findings after semantic tokenization of active base/layout/component utility styles.

### D-2026-02-13-020

- Context: Product feedback reported unreadable typography and low-contrast CTAs in multiple routes (`hoy`, `sesion`, `modulos`, `progreso`) due global heading inheritance and dark-mode accent-ink mismatch.
- Decision: Harden `app/web/css/shell_rethink.css` as the explicit contrast contract: force route-shell heading colors, introduce theme-specific accent ink for primary CTAs/wizard states, and dampen dark-mode background glows/surface opacity balance.
- Consequence: Cross-route shell readability is now deterministic and no longer dependent on global `base.css` heading defaults, improving visual coherence without changing runtime or routing boundaries.

### D-2026-02-13-021

- Context: Residual legacy rules in `app/web/css/factory.css` still owned global theme/background selectors and broad utility recoloring (`.text-slate-*`, `.bg-*`, `.border-*`) that could compete with the new `es-*` shell contract.
- Decision: Isolate Wave-3 legacy shell theming to `.app-shell` scope in `factory.css` and keep `es-*` visual authority in `shell_rethink.css`; in parallel, add route-specific micro-typography and spacing rhythm via `data-view-panel` contracts.
- Consequence: Legacy styling no longer leaks into the modern shell, while `hoy/sesion/cierre/evaluacion/modulos` gain explicit line-height/weight/spacing behavior per viewport for a cleaner and more consistent enterprise-grade reading rhythm.

### D-2026-02-13-022

- Context: Product feedback still reported an intrusive background slab and inconsistent visual rhythm between modules, with oversized headings and spacing/border shifts after route changes.
- Decision: Normalize boot container state by removing legacy `loading-shell` class at runtime mount, and simplify `shell_rethink.css` toward a flat surface baseline (no aggressive radial body glows) with one consistent typography scale across views instead of per-route heading jumps.
- Consequence: The shell now renders from a stable full-width container without inherited loading layout artifacts, and route transitions preserve a unified contour/spacing system with calmer visual hierarchy.

### D-2026-02-13-023

- Context: A final visual audit still found legacy dark-theme rules in `factory.css` applying to broad selectors (`button[data-shell-route]`, `body.app-mode-v4` story background) and creating style collisions with the `es-*` shell (CTA contrast drift, route contour mismatch, side glow perception).
- Decision: Scope the remaining legacy selectors to `.app-shell` only and keep `shell_rethink.css` as the sole authority for `es-*` shell visuals, while further reducing heading scale, card contrast, and route-specific variance (including removal of `es-shell--progress` special chrome overrides).
- Consequence: Current runtime shell now keeps one deterministic visual contract across `hoy/sesion/cierre/evaluacion/modulos/progreso`, with no broad legacy selectors overriding navigation/buttons/backgrounds in the modern shell path.

### D-2026-02-13-024

- Context: Product feedback still identified weak information hierarchy and inconsistent skeleton semantics across routes (`hoy`, `sesion`, `modulos`, `progreso`), especially in module rhythm blocks and progress standalone renderer.
- Decision: Standardize route content on one semantic UI grammar (`es-section`, `es-panel`, `es-list`, `es-table`, `es-kpis`) and retire legacy `progress-shell` markup in favor of `es-*` renderer contracts, while tuning heading hierarchy (`hero > section > card`) and spacing rhythm.
- Consequence: The app now renders from a single structural system with predictable typography and section order, reducing route-to-route visual drift and making the HTML skeleton materially clearer for future UX iterations.
