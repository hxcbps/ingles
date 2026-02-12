# Design Factory

Last reviewed: 2026-02-12

## Purpose

Monorepo-style style factory for English Sprint. Each package owns one design skeleton and exports CSS that is merged into `app/web/css/factory.css`.

## Packages

- `packages/palette/`: color primitives and semantic tokens.
- `packages/typography/`: type ramp and semantic typography roles.
- `packages/motion/`: timing/easing rules and reduced-motion guardrails.
- `packages/buttons/`: CTA hierarchy and interaction states.
- `packages/story/`: route-level visual storytelling and shell cohesion.

## Build

```bash
bash scripts/build_design_factory_css.sh
```

This command generates:
- `design_factory/dist/factory.css`
- `app/web/css/factory.css`

## Governance

- Each package should change independently.
- No hard-coded brand colors outside `packages/palette/palette.css`.
- App styles should consume semantic tokens before adding local overrides.
