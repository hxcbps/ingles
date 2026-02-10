# ADR-002: Single CSS Entrypoint Governance

- Status: Proposed
- Date: 2026-02-10
- Owner: Agent-S0-06 (`S0-B06`)
- Related Story: `S0-B06`

## Context

Two concurrent stylesheet entrypoints exist:

- `app/web/styles.css`
- `app/web/css/index.css`

This duplicates loading concerns and increases drift risk between layer definitions and runtime styles.

## Decision

Set `app/web/css/index.css` as the canonical entrypoint.

Reasons:

- Explicit layer governance (`@layer reset, tokens, base, components, utilities, overrides`).
- Clear import order aligned with design system architecture.
- Better maintainability and lower regression risk.

## Migration Plan

Phase 1 (S0):

- Point `app/web/index.html` to canonical entrypoint.
- Keep `app/web/styles.css` as temporary compatibility alias if needed.

Phase 2 (S3):

- Remove alias file after no references remain.
- Clean stale selectors from `responsive.css`.

## Consequences

Positive:

- Predictable style cascade.
- Easier CSS code ownership by module.

Tradeoffs:

- Requires visual smoke tests on desktop and mobile.

## Validation

- Desktop and mobile smoke check on `Hoy`, `Sesion`, `Modulos` views.
- Verify no duplicate stylesheet load in network panel.

