# Web Product Benchmarks - S8

Last reviewed: 2026-02-12
Scope: visual quality baseline for English Sprint frontend

## Objective

Build a professional, trustworthy UI direction from proven product patterns and convert those patterns into enforceable agent rules.

## Sources Reviewed (official references)

1. Tailwind CSS docs: color scales (`50-950`) and semantic utility strategy.
   - https://tailwindcss.com/docs/customizing-colors
2. Tailwind CSS docs: interaction states (`hover`, `focus`, `active`, `motion-reduce`).
   - https://tailwindcss.com/docs/hover-focus-and-other-states
3. Tailwind CSS docs: typography scale utilities (`text-xs` ... `text-9xl`).
   - https://tailwindcss.com/docs/font-size
4. Tailwind Showcase: production products using Tailwind (`Linear`, `Vercel`, `Notion`, `OpenAI`, `Supabase`).
   - https://tailwindcss.com/showcase
5. Vercel: product positioning centered on speed/clarity and the `Geist` font family release.
   - https://vercel.com
   - https://vercel.com/font
6. Linear: messaging and layout centered on precision, calm surfaces, and operational clarity.
   - https://linear.app
7. Stripe: conversion-oriented product UI narrative and branded surfaces.
   - https://stripe.com/apps-and-integrations
8. Notion: combining utility with visual polish.
   - https://www.notion.com/product
9. W3C WCAG 2.1 Understanding 1.4.3: contrast thresholds (`4.5:1` normal text, `3:1` large text).
   - https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
10. Apple Human Interface Guidelines: reduced motion support for accessibility.
   - https://developer.apple.com/design/human-interface-guidelines/motion
11. Figma Variables and Modes: token collections + mode-driven theming for consistent handoff.
   - https://help.figma.com/hc/en-us/articles/15145852043927-Guide-to-variables-in-Figma
   - https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-collections-and-modes-in-variables
12. Turborepo docs: one-purpose-per-package guidance for monorepo structure.
   - https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
13. pnpm workspaces docs: workspace protocol and package linking model.
   - https://pnpm.io/workspaces

## Extracted Patterns

### P1. One visual story, not many micro-stories

Top product UIs keep one narrative backbone:
- neutral base surfaces,
- one primary action hue,
- one accent hue with limited usage,
- semantic status colors that do not compete with primary actions.

### P2. CTA hierarchy is rigid

Professional products keep a strict hierarchy:
- Primary CTA: high contrast + strongest visual weight.
- Secondary CTA: low-emphasis but still clear.
- Ghost/Tertiary: utility actions only.

### P3. Typography drives trust

High-quality products use a controlled type ramp and role mapping:
- display/headline/body/label roles are fixed,
- line-height and spacing are consistent by role,
- no ad-hoc font-size jumps between cards/routes.

### P4. Motion is intentional and optional

Motion is used to reinforce state change and orientation, not decoration.
Rules:
- short transitions for micro-interactions,
- medium transitions for panel/view transitions,
- reduced motion mode respected globally.

### P5. Accessibility is a quality gate, not optional QA

Contrast and focus behavior are design constraints from day 1.
Any proposal that fails AA contrast or misses visible focus states is rejected.

### P6. Figma-to-code parity requires token governance

Variables + modes in Figma and CSS tokens in code must map 1:1.
If naming diverges, drift is guaranteed.

## Implications for English Sprint

1. Replace mixed palette behavior with a single semantic token spine.
2. Freeze CTA matrix and states so every view reuses the same component grammar.
3. Enforce a semantic typography ladder with explicit route-level usage.
4. Add motion scorecard with allowed durations/easing and anti-patterns.
5. Introduce a Design Factory (monorepo-style package layout) to own palette, typography, buttons, motion, and story mapping independently.

## Proposed Professional Baseline (S8)

- Surface system: calm cool neutrals with high readability.
- Primary action: one blue family.
- Accent: one cyan family for guidance/progress (not primary CTA replacement).
- Status: success/warning/danger isolated from brand CTA colors.
- Hero/story elements: branded gradient only in high-impact moments (not all cards).

## Rejection Criteria for Agent Outputs

Reject any lane output that:
- introduces extra accent colors outside approved tokens,
- adds new button variants without matrix approval,
- adds typography sizes not in the official ramp,
- adds motion without purpose + reduced-motion fallback,
- uses contrast below WCAG AA minimum.
