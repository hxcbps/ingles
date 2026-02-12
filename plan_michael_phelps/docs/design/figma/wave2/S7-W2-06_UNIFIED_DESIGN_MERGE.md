# S7-W2-06 Unified Design Merge

Status: done
Date: 2026-02-12
Source lanes: `S7-DS-01..05`

## Unified Decisions

1. Story palette locked to Midnight + Electric Blue + Cyan + Amber.
2. CTA hierarchy standardized into Primary/Secondary/Ghost/Destructive behaviors.
3. Typography roles fixed by semantic function (display/body/mono).
4. Motion constrained to orienting transitions and accessible fallbacks.
5. Route storytelling map adopted for all six core views.

## Implementation Priorities

1. Token governance and palette consistency (`tokens.css`, `reboot_s7.css`).
2. Button system harmonization (`components.css`, shell CTA selectors).
3. Typography role alignment (`tokens.css`, `base.css`, heading usage).
4. Motion normalization (`layout.css`, `wizard_polish.css`, `reboot_s7.css`).

## Acceptance Criteria

- No contradictory color narratives between sidebar, hero, and wizard.
- CTA priority readable within 2 seconds of screen scan.
- Heading/body/meta typography is semantically consistent.
- Reduced-motion behavior remains compliant.
