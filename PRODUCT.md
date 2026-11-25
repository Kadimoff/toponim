# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript + Tailwind CSS v4, MapLibre GL JS with OpenFreeMap tiles (no API key), Framer Motion, Fuse.js, lucide-react. No backend; local JSON. (Pinned by the user's brief.)

## Users

Primary: the Ministry of Culture of Azerbaijan grant committee — culture experts, not engineers — evaluating a funding application, usually in a presentation or by opening a link. Secondary (the eventual product): researchers, teachers, tourism and culture professionals looking up the history of place names.

## Product Purpose

A high-fidelity demo of "Ağıllı Toponim Atlası": AI extracts place names from archival texts, experts verify them, and an interactive atlas shows each place's historical name forms, meaning, sources and location. Success: a non-technical reviewer finds it real, credible and well made within 30 seconds.

## Positioning

The pipeline joins machine extraction with mandatory human expert verification, and shows a place name's history as forms changing over time with their sources, in Azerbaijani, Russian and English.

## Operating Context

Joint project: Baku Slavic University (language and content) and ADNSU (technology). Shown in grant presentations, often projected; reviewers may also open it on a phone.

## Capabilities and Constraints

- Fuzzy, typo-tolerant search across AZ / RU / EN spellings and historical forms.
- Filters: toponym type (oykonim, hidronim, oronim), period of first record, verification status.
- Shareable deep links per toponym (`#/atlas/:id`).
- AI demo is a simulation with a local dictionary and must stay labelled as such.
- UI in AZ (default), RU, EN.

## Evidence on Hand

No real data yet. All 30 toponyms, historical forms, years and archive codes are fictional sample data (`src/data/toponyms.json`) and must be labelled "Nümunə məlumat". Never invent real historical claims, etymologies or archival citations. Partner names are text placeholders (no logos supplied).

## Product Principles

1. Verification is visible: every toponym shows whether an expert confirmed it.
2. Sources travel with the name; nothing on screen is asserted without one.
3. Honest about simulation and sample data, everywhere a reviewer could be misled.
4. Three languages are equal citizens of the interface.

## Brand Commitments

User-pinned: "Violet dusk" — light and dark violet gradients as the product signature (hero, key CTAs, highlights), warm gold #F2B84B as the only non-violet accent, glass cards, circled map-pin motif, dark mode default.

## Accessibility & Inclusion

WCAG AA contrast in both themes, full keyboard navigation, visible violet focus rings, reduced-motion support, mobile-first.
