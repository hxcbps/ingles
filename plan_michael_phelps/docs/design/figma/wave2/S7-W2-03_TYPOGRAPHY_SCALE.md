# S7-W2-03 Typography Scale

Owner lane: `S7-DS-03` (Typography Director)
Status: done
Date: 2026-02-12

## Typeface Roles

- Display: `Space Grotesk` (hero/title impact).
- Body/UI: `DM Sans` (readability and neutral rhythm).
- Data/metrics: `IBM Plex Mono` (precision and system tone).

## Type Scale (approved)

- `--type-display-xl`: Hero title
- `--type-display-lg`: Section headline
- `--type-title-md`: Card title
- `--type-body-md`: Primary body copy
- `--type-body-sm`: Secondary/support text
- `--type-label-xs`: Kicker/metadata labels

## Rules

1. Use display only in key semantic headers.
2. Avoid mixed font-weight extremes in same block.
3. Keep metadata uppercase/mono only where scannability benefits.
4. Maintain contrast and line-height consistency across routes.

## Code Mapping

- `app/web/css/tokens.css`
- `app/web/css/base.css`
- `app/web/js/ui/learning_shell.js`
