# S7-W2-04 Motion Scorecard

Owner lane: `S7-DS-04` (Motion Auditor)
Status: done
Date: 2026-02-12

## Motion Principles

- Motion must orient, not decorate.
- Keep transitions under 300ms for UI micro-interactions.
- Reduced motion mode must disable non-essential movement.

## Current Scorecard

- Navigation feedback: `pass` (active/hover states visible).
- Route transition coherence: `pass` (view container transition present).
- CTA motion quality: `partial` (some buttons still mixed between utility and component behavior).
- Wizard transitions: `pass` (clear progression cues).
- Reduced-motion support: `pass`.

## Action Items

1. Standardize CTA transition timing across shell and wizard.
2. Remove redundant decorative transforms that do not improve comprehension.
3. Keep only one progress-motion language across routes.

## Code Mapping

- `app/web/css/layout.css`
- `app/web/css/wizard_polish.css`
- `app/web/css/reboot_s7.css`
