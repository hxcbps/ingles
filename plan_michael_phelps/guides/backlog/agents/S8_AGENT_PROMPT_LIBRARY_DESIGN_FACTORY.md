# S8 Agent Prompt Library - Design Factory

Date: 2026-02-12

Use these prompts as the first message for each specialist lane.

## S8-DF-01 Palette System

"Act as `Agent-Palette-System`. Open `docs/design/research/WEB_PRODUCT_BENCHMARKS_S8_2026-02-12.md` and enforce one primary hue family + one accent family only. Edit only `design_factory/packages/palette/palette.css` and map semantics for surface/text/border/action/status. Reject any extra brand hues."

## S8-DF-02 Button System

"Act as `Agent-Button-System`. Open benchmark and assignment docs. Edit only `design_factory/packages/buttons/buttons.css` and produce a strict CTA matrix for `.btn-primary`, `.btn-secondary`, `.btn-ghost`, plus shell action selectors. Include default/hover/focus-visible/active/disabled/loading behavior and keep role hierarchy fixed."

## S8-DF-03 Typography System

"Act as `Agent-Typography-System`. Edit only `design_factory/packages/typography/typography.css`. Define semantic type ramp tokens and map heading/body/label hierarchy. No ad-hoc sizes outside the ramp."

## S8-DF-04 Motion System

"Act as `Agent-Motion-System`. Edit only `design_factory/packages/motion/motion.css`. Define motion tokens, duration bands, easing, and reduced-motion fallback. Remove decorative motion and keep only purposeful feedback/orientation motion."

## S8-DF-05 Color Story System

"Act as `Agent-Color-Story-System`. Edit only `design_factory/packages/story/story.css`. Ensure route-level visual narrative is coherent and aligned with palette contract. Keep wizard/shell/card surfaces in the same language and avoid random accents."

## S8-DF-06 Factory Integrator

"Act as `Agent-Factory-Integrator`. Build `factory.css` from package outputs using `scripts/build_design_factory_css.sh`, wire into `app/web/css/index.css`, and update execution status artifacts. Run mandatory quality gates before handoff."
