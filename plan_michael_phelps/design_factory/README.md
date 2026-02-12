# Design Factory

Last reviewed: 2026-02-12

## Purpose

Design Factory is the style governance workspace for English Sprint.
It follows a monorepo-style package model so each visual skeleton can be evolved independently and then merged into one runtime artifact consumed by the web app.

## Package ownership

- `packages/palette/`: primitives + semantic color tokens + legacy bridges.
- `packages/typography/`: type ramp + semantic text roles + utility alignment.
- `packages/motion/`: timing/easing contracts + reduced-motion behavior.
- `packages/buttons/`: CTA hierarchy + interaction states + accessibility focus.
- `packages/story/`: shell, wizard, module cards, and route-level visual storytelling.
- `packages/progress/`: premium progreso dashboard styles (dual-theme cards, heatmap, table, metrics hierarchy).

## Build output

Run:

```bash
bash scripts/build_design_factory_css.sh
```

Generated artifacts:
- `design_factory/dist/factory.css`
- `app/web/css/factory.css`

The app imports `app/web/css/factory.css` from `app/web/css/index.css` as the last override layer.

## Quality contract

1. Palette contract:
- one primary hue family
- one accent hue family
- semantic status hues isolated from CTA brand colors

2. Button contract:
- `primary`, `secondary`, `ghost`, route CTA handling
- states: default, hover, focus-visible, active, disabled, loading

3. Typography contract:
- fixed ramp tokens only
- heading/body/label role mapping

4. Motion contract:
- purposeful transitions only
- mandatory `prefers-reduced-motion` fallback

5. Story contract:
- one coherent visual language across sidebar, hero, widgets, wizard, and module artifacts

## Execution notes

- Any package update must rebuild `factory.css` before validation.
- If package-level changes alter behavior, update architecture plan and decision log in the same commit.
