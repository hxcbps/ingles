# S7-W2-01 Palette System

Owner lane: `S7-DS-01` (Palette Architect)
Status: done
Date: 2026-02-12

## Palette Narrative

Narrative: `Focused Momentum`
- Base mood: confianza, concentración, progreso.
- Emotional arc: calma inicial -> energía accionable -> logro visible.

## Core Tokens (approved)

- `--story-midnight-950`: navigation depth and high-contrast anchors.
- `--story-primary-600`: primary action and progress emphasis.
- `--story-secondary-500`: motion and guidance highlights.
- `--story-accent-500`: milestone/reward marker.
- `--surface-base`, `--surface-card`, `--surface-sunken`: structural hierarchy.

## Rules

1. Use midnight tones only for structural containers (sidebar/header accents).
2. Use primary blue for CTA hierarchy, not for every decorative element.
3. Use cyan as transition/highlight color, never as base text color.
4. Use accent (amber) only for reward/progress badges.
5. Keep text hierarchy on slate scale (`900/500/400`).

## Anti-Patterns

- Multiple unrelated gradients in same viewport.
- Accent color used as body copy.
- Conflicting blue/purple stories per route.
