# ADR-001: Canonical Routing Contract for Learning Flow

- Status: Proposed
- Date: 2026-02-10
- Owner: Agent-S0-01 (`S0-B01`)
- Related Story: `S0-B01`

## Context

Current navigation has multiple route vocabularies across router and shell views. This causes route drift, regressions, and ambiguous deep links.

## Decision

Adopt one canonical route contract for product flow:

1. `#/modulo/hoy`
2. `#/modulo/sesion`
3. `#/modulo/cierre`
4. `#/modulo/evaluacion`
5. `#/modulo/modulos`
6. `#/modulo/progreso`

Canonical route IDs:

- `hoy`
- `sesion`
- `cierre`
- `evaluacion`
- `modulos`
- `progreso`

## Legacy Alias Policy (Transition)

Allowed for one transition release only:

- `#/today/action` -> `#/modulo/hoy`
- `#/today/session` -> `#/modulo/sesion`
- `#/today/close` -> `#/modulo/cierre`
- `#/today/evaluate` -> `#/modulo/evaluacion`
- `#step-action` -> `#/modulo/hoy`
- `#step-prompt` -> `#/modulo/sesion`
- `#step-timer` -> `#/modulo/sesion`
- `#step-checklist` -> `#/modulo/cierre`
- `#step-evidence` -> `#/modulo/evaluacion`

After migration release, aliases are removed.

## Consequences

Positive:

- Single source of truth for navigation.
- Stable deep links and route tests.
- Lower cognitive load for frontend contributors.

Tradeoffs:

- Requires coordinated update across router, view metadata, shell actions, and tests.

## Implementation Scope

- `app/web/js/routing/routes.js`
- `app/web/js/routing/hash_router.js`
- `app/web/js/ui/views.js`
- `app/web/js/ui/learning_shell.js`
- routing test suite

## Validation

- `node --test app/web/js/tests/routes.test.mjs`
- `node --test app/web/js/tests/hash_router.test.mjs`
- `node --test app/web/js/tests/view_switcher.test.mjs`

