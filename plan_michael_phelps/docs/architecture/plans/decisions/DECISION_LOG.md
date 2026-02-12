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
