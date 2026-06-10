---
name: Graphify Field Report
description: "Evidence-first editorial system for technical graph demos and creator-style breakdown videos."
colors:
  canvas: "#f5efe6"
  paper: "#fcf8f1"
  ink: "#101720"
  muted: "#5f6b76"
  accent: "#1f5ed7"
  signal: "#0d6d66"
  clay: "#b45437"
  sun: "#b88426"
typography:
  display:
    fontFamily: "IBM Plex Sans Condensed"
    fontSize: 4.5rem
    fontWeight: 700
    lineHeight: 0.98
  body:
    fontFamily: "IBM Plex Sans"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  data:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.95rem
    fontWeight: 500
rounded:
  sm: 8px
  md: 14px
  lg: 20px
spacing:
  xs: 8px
  sm: 14px
  md: 22px
  lg: 34px
  xl: 48px
components:
  proof-strap:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
  insight-note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

## Overview

Field-report editorial design for technical creator demos. The tone should feel like a lab notebook, not a SaaS dashboard and not a marketing landing page.

## Colors

- **Canvas:** warm paper, not pure white.
- **Ink:** dense near-black for all major headlines.
- **Accent:** cobalt for structure, focus boxes, and interactive proof.
- **Signal:** oxidized green for navigation cues and valid evidence.
- **Clay:** human emphasis, correction, and skepticism.

## Typography

- Use condensed sans for display lines so dense technical claims still read large on video.
- Use a neutral grotesk for body copy.
- Use mono only for paths, commands, and evidence snippets.

## Layout

- Treat each scene like a proof board: one main claim, one evidence zone, one annotation zone.
- Favor asymmetry and left-weighted reading flow over centered marketing layouts.
- Use bands, rules, and labels to separate claim from proof.

## Elevation & Depth

- Keep depth shallow and tactile: paper surfaces, thin rules, soft shadows.
- Avoid glassmorphism, giant gradients, or glowing dark-mode chrome.

## Shapes

- Corners are tight, almost print-like.
- Boxes and note cards should feel clipped onto a board, not floating as product cards.

## Do's and Don'ts

- Do lead with evidence before commentary.
- Do use accent colors as punctuation.
- Do keep code and graph screenshots large and legible.
- Don't reproduce dashboard UI patterns if the point is architecture understanding.
- Don't let decorative motion overpower the proof.
