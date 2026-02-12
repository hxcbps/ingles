# S7-W2-02 Button Matrix

Owner lane: `S7-DS-02` (Button System)
Status: done
Date: 2026-02-12

## Variants

1. Primary CTA
- Purpose: main progression action (`Comenzar`, `Validar y continuar`).
- Style: blue->cyan gradient, high contrast, elevated shadow.

2. Secondary CTA
- Purpose: alternative safe action (`Ver programa`, `Ver historial`).
- Style: neutral card button, visible border, low elevation.

3. Tertiary/Ghost
- Purpose: low priority helper actions.
- Style: transparent with subtle hover fill.

4. Destructive
- Purpose: exit/reset with caution intent.
- Style: rose-toned border+text; no gradient.

## States (mandatory)

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`
- `loading` (for async actions)

## Code Mapping

- Base button contract: `app/web/css/components.css`
- View-specific emphasis: `app/web/css/reboot_s7.css`
- Runtime hooks: `app/web/js/ui/learning_shell.js`, `app/web/js/ui/session_wizard.js`
