# Figma Design Factory Playbook - Sprint 8

Last updated: 2026-02-12
Scope: benchmark-driven professional redesign for `app/web`

## Goal

Translate external product benchmarks into an enforceable Figma-to-code system with one coherent visual language and measurable quality gates.

## Mandatory Inputs

- `docs/design/research/WEB_PRODUCT_BENCHMARKS_S8_2026-02-12.md`
- `guides/backlog/agents/S8_AGENT_ASSIGNMENT_DESIGN_FACTORY_WAVE1.md`

## Figma File Contract

File name:
- `English Sprint - Design Factory S8`

Pages (mandatory order):
1. `00 - Benchmark Board`
2. `01 - Palette System`
3. `02 - Typography System`
4. `03 - Button Matrix`
5. `04 - Motion Scorecard`
6. `05 - Color Story by Route`
7. `06 - Unified Screens`
8. `07 - Dev Handoff`

## Required Artifacts

### 00 - Benchmark Board

- One frame per reference product.
- Captured rationale (why it works, what to adopt, what to avoid).
- No copying. Only pattern extraction.

### 01 - Palette System

- Primitive scale and semantic tokens.
- Brand colors limited to one primary family and one accent family.
- Status colors isolated from CTA brand family.

### 02 - Typography System

- Full type ramp with semantic roles (`display`, `headline`, `title`, `body`, `label`).
- Vertical rhythm rules and line-height contract.
- Route-level mapping (`Hoy`, `Sesion`, `Cierre`, `Evaluacion`, `Modulos`, `Progreso`).

### 03 - Button Matrix

- Variants: Primary, Secondary, Ghost, Destructive.
- States: default, hover, focus-visible, active, disabled, loading.
- Context matrix: hero, cards, wizard actions, sidebar actions.

### 04 - Motion Scorecard

- Purpose matrix: orientation, feedback, emphasis.
- Duration and easing tokens.
- Explicit reduced-motion behavior per interaction type.

### 05 - Color Story by Route

- Emotional intent by route and state.
- Route palette usage matrix to prevent color drift.
- Anti-pattern list (combinations that break trust/readability).

### 06 - Unified Screens

- Desktop + mobile screens with full consistency.
- Same design language across shell and wizard.

### 07 - Dev Handoff

- Component-to-file mapping for CSS and JS UI files.
- Token naming parity with `design_factory/packages/*`.
- Redlines and implementation priorities.

## Hard Gates

1. Contrast gate:
- Normal text min `4.5:1`, large text min `3:1`.

2. Focus gate:
- All interactive controls show visible focus state.

3. Palette gate:
- No new accent families beyond approved palette.

4. Typography gate:
- No ad-hoc font sizes outside ramp.

5. Motion gate:
- No decorative motion without UX purpose.
- Reduced motion behavior is explicit.

6. Handoff gate:
- Every Figma token maps to a code token or package source.
