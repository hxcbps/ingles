# Sprint 8 Design Factory - Agent Assignment Wave 2 (Deep Refinement)

Date: 2026-02-12
Source: `docs/architecture/plans/active/EXEC-UX-S8-DESIGN-FACTORY-WAVE2-006.md`

Objective: execute a detailed, package-level refinement with strict lane ownership so every visual artifact (shell, wizard, module cards, CTA flows) is governed by the factory.

## Parallel Lane Plan

| Lane ID | Agent | Scope | Touched Paths | Deliverables | Priority | Status |
|---|---|---|---|---|---|---|
| `S8-DF2-01` | `Agent-Factory-Palette` | deep semantic token map + legacy bridges | `design_factory/packages/palette/` | `S8-W2-01 Palette Deep Contract` | Highest | `DONE` |
| `S8-DF2-02` | `Agent-Factory-Typography` | editorial type ramp + utility role mapping | `design_factory/packages/typography/` | `S8-W2-02 Typography Deep Contract` | Highest | `DONE` |
| `S8-DF2-03` | `Agent-Factory-Buttons` | CTA matrix + complete interaction states | `design_factory/packages/buttons/` | `S8-W2-03 Buttons Deep Contract` | Highest | `DONE` |
| `S8-DF2-04` | `Agent-Factory-Motion` | purposeful motion + reduced-motion enforcement | `design_factory/packages/motion/` | `S8-W2-04 Motion Deep Contract` | High | `DONE` |
| `S8-DF2-05` | `Agent-Factory-Story` | shell/wizard/module artifact coherence | `design_factory/packages/story/`, `app/web/js/ui/learning_shell.js` | `S8-W2-05 Story Deep Contract` | Highest | `DONE` |
| `S8-DF2-06` | `Agent-Factory-Integrator` | rebuild dist + app artifact + status handoff | `design_factory/dist/`, `app/web/css/factory.css`, `scripts/build_design_factory_css.sh`, status docs | `S8-W2-06 Unified Factory Integration` | Highest | `DONE` |

## Non-overlap rules

- Lane edits are restricted to declared paths.
- Any cross-lane requirement must be handed to Factory Integrator lane for integration sequencing.
- No package may redefine another package's ownership domain.

## Mandatory references

- `docs/design/research/WEB_PRODUCT_BENCHMARKS_S8_2026-02-12.md`
- `docs/design/figma/FIGMA_DESIGN_FACTORY_PLAYBOOK_S8.md`
- `docs/architecture/plans/active/EXEC-UX-S8-DESIGN-FACTORY-WAVE2-006.md`

## Hard acceptance gates

1. Palette gate:
- all shell/wizard/module colors derive from semantic tokens
- status colors remain independent from primary CTA family

2. Typography gate:
- one ramp, no random sizes
- display/headline/body/label roles documented and reflected in classes

3. Button gate:
- explicit default/hover/focus-visible/active/disabled/loading
- focus ring visible and consistent

4. Motion gate:
- motion has UX purpose (orientation, feedback, emphasis)
- reduced motion mode disables non-essential animation

5. Story gate:
- shell, hero, widgets, journey cards, wizard, and module cards feel like one product

## Handoff template (mandatory)

- Goal completed
- Files changed
- Quality gate evidence
- Risks and follow-ups
