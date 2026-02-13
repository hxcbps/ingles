# English Sprint - Figma Component Library Spec

Last updated: 2026-02-12
Owner: UI UX Director

## Goal

Create a premium Apple/Stripe-like component library in Figma that matches the implemented web design system.

## Page Structure in Figma

Create these pages in your Figma file:

1. `00 Foundations`
2. `01 Components`
3. `02 Shell Templates`
4. `03 States`

## 00 Foundations

Create color styles with these semantic names:

- `bg/app` = `#F7F9FC`
- `bg/canvas` = `#F4F7FC`
- `surface/card` = `#FFFFFF`
- `text/title` = `#1A1F36`
- `text/body` = `#3C4257`
- `text/muted` = `#697386`
- `primary/default` = `#635BFF`
- `primary/hover` = `#5851DF`
- `border/subtle` = `rgba(15,23,42,0.06)`
- `border/default` = `rgba(26,31,54,0.10)`
- `success/default` = `#059669`
- `warning/default` = `#D97706`
- `danger/default` = `#E11D48`

Typography styles:

- `display/xl`: Inter 700, 56/0.95, tracking -3%
- `display/lg`: Inter 700, 40/0.95, tracking -3%
- `heading/md`: Inter 600, 28/1.18, tracking -1.2%
- `body/md`: Inter 400, 16/1.6
- `body/sm`: Inter 400, 14/1.6
- `label/xs`: IBM Plex Mono 600, 12/1.3, tracking 6%

Spacing scale (8pt with 4pt support):

- `4, 8, 12, 16, 24, 32, 40, 48, 64`

Radii:

- `sm=10`, `md=14`, `lg=16`, `xl=24`, `pill=999`

Elevation styles:

- `card/default`: `0 4 6 -1 / 7%` + `0 2 4 -1 / 5%`
- `card/hover`: `0 20 25 -5 / 16%` + `0 10 10 -5 / 8%`

## 01 Components

Build as Figma Components with variants.

### Button

Component: `Button`

Variants:

- `type`: Primary, Secondary, Ghost
- `state`: Default, Hover, Pressed, Disabled, Loading
- `size`: M (48h), S (40h)

Layout:

- Auto layout horizontal
- Height: 48
- Padding: 12 vertical / 24 horizontal
- Gap: 8
- Radius: 14

Behavior:

- Pressed state = scale 98%
- Disabled opacity = 58%

### Badge

Component: `Badge`

- Height: 28
- Padding: 6/10
- Radius: pill
- Text style: `label/xs`
- Variants: Neutral, Primary, Success, Warning

### Card

Component: `Card`

Variants:

- `tone`: Default, Accent, Warning
- `interactive`: true/false

Layout:

- Radius: 16
- Border: subtle/default
- Padding: 24
- Gap: 16

Hover variant:

- Y: -2
- Shadow: `card/hover`

### KPI Tile

Component: `KPI Tile`

- Width: Fill container
- Padding: 12
- Radius: 14
- Label: `label/xs`
- Value: `heading/md`

### Pill

Component: `Pill`

- Height: 28
- Padding: 6/10
- Radius: pill
- Variants: Neutral, Good, Warning

## 02 Shell Templates

Create these templates from components:

1. `Topbar/Glass`
- Height 72
- Blur 12
- Border bottom subtle

2. `Hero/Header`
- Title + Kicker + action row
- Action row uses `Button` + `Badge`

3. `Main Grid`
- Desktop: `1.16fr / 0.84fr`
- Mobile: `1fr`
- Gap: 16

4. `Module Card`
- Header + chips + progress bar + KPI row

## 03 States

Create explicit reusable state frames:

1. `Loading/Skeleton`
- Two skeleton cards
- 4 lines per card
- Pulse/shimmer prototype animation

2. `Offline/Banner`
- Title: `Sin conexion`
- Body text + two actions (`Reintentar`, `Seguir en modo local`)

3. `Fatal/Error`
- Icon container + title + body + retry CTA

## Naming Convention

- Components: `Component/Variant`
- Styles: `group/name`
- Use consistent prefixes:
  - `ES/Color/...`
  - `ES/Text/...`
  - `ES/Effect/...`

## QA Checklist

- [ ] Button states complete (default/hover/pressed/disabled/loading)
- [ ] Card elevation consistent across templates
- [ ] All text uses semantic text styles
- [ ] All colors come from semantic styles, no random hex
- [ ] Loading/offline/error states present in template library
- [ ] Mobile frame tested (390 width)

