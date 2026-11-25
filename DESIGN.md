# Design

Violet dusk: an archive reading room at dusk. Calm reading surfaces, violet light carrying the hero and key actions, gold reserved for what an expert has confirmed.

## Color tokens (`src/index.css`)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--page` | #1E0B3A | #F7F5FF | page base |
| `--page-gradient` | 160° #1E0B3A → #2E1065 → #4C1D95 | 135° #F7F5FF → #EDE9FE → #DDD6FE | hero only |
| `--ink` / `--ink-soft` / `--ink-faint` | #E9E6F5 / #BDB4DC / #9A90BF | #1F1B2E / #4D4566 / #6B6386 | text roles |
| `--link` | #C4B5FD | #5B21B6 | links, small violet text |
| `--line` | rgba(139,92,246,.25) | same | hairlines, glass border |
| `--glass` / `--glass-strong` | rgba(30,11,58,.55/.82) | rgba(255,255,255,.65/.9) | glass panels |
| gold | #F2B84B, ink #3A2600 | figure #A8670F | verified, selected pin, one key figure |

Interactive / focus: #8B5CF6. Primary button: 135° #7C3AED → #5B21B6 (hover #8B5CF6 → #6D28D9, shadow 0 8px 24px rgba(124,58,237,.35)).

## Type

- Display: Piazzolla Variable (opsz), weight 400–500, tracking −0.015 to −0.03em on large sizes, word-spacing +0.08em.
- UI/body: IBM Plex Sans 400/500/600. Tabular numerals for all figures.
- Both cover Azerbaijani Latin (ə ğ ı ö ş ç ü) and Cyrillic.
- Italic is used only for cited historical name forms (linguistic convention), never for emphasis.

## Components

- Glass panel: radius 20px, 1px `--line`, blur 16px (8px and more opaque on phones).
- Controls: radius 10px, 44px min height. Chips: pill, 32px.
- Pin motif (`PinMark`): violet (verified), muted with dashed ring (pending), gold (selected / verified badge). Selected map pin has a pulsing violet halo.
- Timeline: violet→gold gradient line; the latest form's node is gold.
- Sample-data label: dashed hairline pill, secondary text, info icon.

## Motion

One curve `cubic-bezier(0.22, 1, 0.36, 1)`; 150–300ms feedback, ≤500ms entrances. Signature moments: hero pins landing and one toponym's history surfacing in turn; the AI scan beam. All motion respects `prefers-reduced-motion`.

## Layout

Max width 1320px, 16px/24px gutters. Atlas is full-bleed: glass side panel (380px) + detail panel (≤460px) on desktop; draggable bottom sheet on phones.
