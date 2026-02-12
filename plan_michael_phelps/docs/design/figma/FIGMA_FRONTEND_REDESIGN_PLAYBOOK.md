# Figma Frontend Redesign Playbook

Last updated: 2026-02-12
Scope: `/Users/dfernandez/code/ingles/plan_michael_phelps/app/web`

## Goal

Convert the current frontend into a premium, high-clarity UX/UI system with deterministic navigation and production-ready visual consistency.

## Figma File Contract

File name:
- `English Sprint - Frontend Reboot S7`

Pages (mandatory order):
1. `00 - North Star`
2. `01 - Navigation IA`
3. `02 - Screen System (Desktop)`
4. `03 - Screen System (Mobile)`
5. `04 - Components & Tokens`
6. `05 - States & Feedback`
7. `06 - Prototype Journeys`
8. `07 - Dev Handoff`

## Required Artifacts by Page

### 00 - North Star
- Visual direction board (2 candidates max).
- Typography scale and tone of voice guidance.
- Color strategy: neutrals, primary, accent, semantic states.

### 01 - Navigation IA
- Global nav map for:
  - `Hoy`
  - `Sesion`
  - `Cierre`
  - `Evaluacion`
  - `Modulos`
  - `Progreso`
- Desktop sidebar hierarchy.
- Mobile bottom navigation hierarchy.
- Route intent table (what user must do in each route).

### 02/03 - Screen System
For each route, include:
- default state
- loading state
- blocked/warning state
- completion state
- empty/error fallback

### 04 - Components & Tokens
- Button system (Primary, Secondary, Tertiary, Destructive, Ghost).
- Card system (hero, metric, action, status, module).
- Inputs, badges, chips, progress tracks.
- Motion specs (duration, easing, when to animate, when not).
- Token naming aligned to CSS vars and implementation constraints.

### 05 - States & Feedback
- Validation, warning, error and success patterns.
- Session wizard feedback behavior.
- Route guard and next-step banners.

### 06 - Prototype Journeys
Mandatory prototype flows:
1. User lands in `Hoy` and starts session.
2. User completes session, moves to `Cierre`.
3. User attempts blocked route and receives guidance.
4. User checks `Modulos` and `Progreso`.

### 07 - Dev Handoff
- Component inventory + mapping to code paths.
- Redlines and spacing specs.
- Interaction specs (hover/focus/active/disabled).
- "Do not" list (anti-patterns to prevent drift).

## Figma Review Gates

1. Visual impact gate: the interface has a defined identity, not generic defaults.
2. Navigation clarity gate: users find next action in <= 3 seconds.
3. CTA quality gate: primary actions are obvious and distinct.
4. Consistency gate: shell and wizard share one design language.
5. Accessibility gate: focus, contrast, reduced-motion behavior are specified.
6. Handoff gate: each artifact maps to implementable frontend files.

## Code Mapping Contract

Map every major component to one or more files:
- Shell/navigation: `app/web/js/ui/learning_shell.js`
- Session wizard: `app/web/js/ui/session_wizard.js`
- Shared style system: `app/web/css/{tokens,components,layout,responsive}.css`
- Route contracts: `app/web/js/ui/views.js`, `app/web/js/routing/canonical_routes_s0.js`

## Execution Rule

Do not start visual implementation wave until pages `00` to `07` are completed and approved.
