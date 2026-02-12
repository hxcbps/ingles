# Sprint 8 Design Factory - Agent Assignment Wave 1

Date: 2026-02-12
Source: `docs/architecture/plans/active/EXEC-UX-S8-DESIGN-FACTORY-003.md`

Objective: convertir benchmarks de diseño de productos top en un sistema visual profesional ejecutable por agentes con ownership estricto por esqueleto.

## Parallel Lane Plan

| Lane ID | Agent | Scope | Touched Paths | Deliverables | Priority | Status |
|---|---|---|---|---|---|---|
| `S8-DF-01` | `Agent-Palette-System` | Paleta profesional y tokens semánticos únicos | `design_factory/packages/palette/`, `app/web/css/tokens.css` | `S8-W1-01 Palette Contract` | Highest | `READY` |
| `S8-DF-02` | `Agent-Button-System` | Jerarquía de CTA, estados y personalidad de botones | `design_factory/packages/buttons/`, `app/web/css/components.css` | `S8-W1-02 Button Contract` | Highest | `READY` |
| `S8-DF-03` | `Agent-Typography-System` | Escala tipográfica editorial y mapeo semántico por vista | `design_factory/packages/typography/`, `app/web/css/base.css` | `S8-W1-03 Type Contract` | Highest | `READY` |
| `S8-DF-04` | `Agent-Motion-System` | Motion scorecard, easing, tiempos y reduced-motion | `design_factory/packages/motion/`, `app/web/css/*` | `S8-W1-04 Motion Contract` | High | `READY` |
| `S8-DF-05` | `Agent-Color-Story-System` | Storytelling cromático por ruta y coherencia narrativa | `design_factory/packages/story/`, `app/web/css/reboot_s7.css` | `S8-W1-05 Color Story Contract` | Highest | `READY` |
| `S8-DF-06` | `Agent-Factory-Integrator` | Build de factory CSS + integración en entrypoint + cierre de status | `design_factory/`, `scripts/build_design_factory_css.sh`, `app/web/css/index.css`, `guides/backlog/agents/EXECUTION_STATUS_S8_DESIGN_FACTORY_WAVE1.md` | `S8-W1-06 Unified Integration` | Highest | `READY` |

## Non-Overlap Rule

- Each lane edits only its declared paths.
- Shared file edits require sequenced handoff through Agent-Factory-Integrator.
- If a lane needs cross-file edits, escalate and split scope before coding.

## Mandatory Input References Per Lane

- `docs/design/research/WEB_PRODUCT_BENCHMARKS_S8_2026-02-12.md`
- `docs/design/figma/FIGMA_DESIGN_FACTORY_PLAYBOOK_S8.md`
- `docs/architecture/plans/active/EXEC-UX-S8-DESIGN-FACTORY-003.md`

## Acceptance Gates (hard)

1. Color governance:
- No new hard-coded brand colors outside palette package.
- Primary CTA hue must stay in the approved primary range.

2. CTA governance:
- Primary/Secondary/Ghost roles cannot invert by screen.
- All button variants include `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`.

3. Typography governance:
- Only approved ramp tokens allowed.
- Heading/body/label roles mapped and documented by route.

4. Motion governance:
- Micro and macro motion durations are tokenized.
- `prefers-reduced-motion` behavior is documented and implemented.

5. Accessibility governance:
- Contrast must meet at least WCAG AA thresholds.
- Focus visible state is mandatory for all interactive controls.

## Per-Lane Handoff Contract

Each lane must deliver:
- Goal completed
- Files changed
- Rules accepted/rejected
- Validation commands + pass/fail
- Risks and follow-up for next lane
