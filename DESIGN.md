---
version: alpha
name: HOMA
description: Persian-first AI furniture visualization and commerce
colors:
  brand-primary: "#E31E24"
  brand-secondary: "#F5E6D3"
  surface-page: "#F7F7F5"
  surface-default: "#FFFFFF"
  surface-elevated: "#FDFDFB"
  surface-muted: "#F2F2F7"
  surface-inverse: "#080808"
  content-primary: "#1A1A1A"
  content-secondary: "#6B7280"
  content-muted: "#9CA3AF"
  content-inverse: "#FFFFFF"
  border-subtle: "#E9E9E6"
  interactive-primary: "#111111"
  interactive-primary-hover: "#0B0B0B"
  interactive-primary-active: "#000000"
  destructive: "#FF383C"
  feedback-success: "#00312D"
  feedback-warning: "#FC6F20"
  feedback-error: "#5D0D02"
  feedback-info: "#0088FF"
  editorial-accent: "#9A8C74"
  editorial-stone: "#FAF9F6"
  editorial-charcoal: "#1C1C1A"
typography:
  display:
    fontFamily: Vazirmatn
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.25
  heading-1:
    fontFamily: Vazirmatn
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.3
  heading-2:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.4
  heading-3:
    fontFamily: Vazirmatn
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  heading-4:
    fontFamily: Vazirmatn
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: Vazirmatn
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Vazirmatn
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
spacing:
  "0": 0px
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  "10": 40px
  "12": 48px
  "16": 64px
  "20": 80px
  "24": 96px
  content-max: 1440px
  narrow-max: 680px
rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 28px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.interactive-primary}"
    textColor: "{colors.content-inverse}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 36px
  button-primary-hover:
    backgroundColor: "{colors.interactive-primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.interactive-primary-active}"
  card:
    backgroundColor: "{colors.surface-default}"
    textColor: "{colors.content-primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  input:
    backgroundColor: "{colors.surface-default}"
    textColor: "{colors.content-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 36px
---

# HOMA Design System

This file is the single source of truth for HOMA's visual language. It follows
the [DESIGN.md format](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md).
The YAML tokens are normative; the prose explains how to apply them.

`src/styles/tokens.css` is the runtime implementation of this document. A change
to a canonical value or rule must update both files in the same commit. If they
conflict, treat the mismatch as a defect and use this document to resolve the
design intent. Page-specific specs may extend these rules but must not silently
override them.

## Overview

HOMA is a Persian-first platform for visualizing furniture in a customer's
space, redesigning rooms with AI, exploring products, and purchasing from
stores. The primary audience uses Farsi on mobile devices; desktop, Arabic,
English, and Turkish remain supported.

The interface should feel calm, useful, and premium without becoming
decorative. It is image-led and warm-editorial: generous neutral surfaces let
room and product photography lead, near-black controls make actions clear, and
HOMA red supplies restrained brand emphasis.

Design priorities, in order:

1. Make the current task and next action obvious.
2. Preserve room and product imagery as the visual focus.
3. Make RTL behavior, loading, failure, and empty states feel intentional.
4. Reuse shared tokens and primitives before introducing local styling.
5. Prefer clarity and speed over ornamental effects.

## Colors

Use semantic roles rather than choosing colors by appearance.

- **Brand red (`brand-primary`)** identifies HOMA, selected brand moments, and
  rare emphasis. It is not the default button background and must not compete
  with product imagery.
- **Cream (`brand-secondary`)** adds warmth to secondary surfaces and
  highlights.
- **Near-black (`interactive-primary`)** is the default high-priority action
  color. Its hover and active tokens provide state changes.
- **Warm neutrals** form the page, card, modal, and muted surface hierarchy.
- **Content colors** distinguish primary, supporting, disabled, and inverse
  text. Do not simulate this hierarchy with arbitrary opacity.
- **Feedback colors** communicate success, warning, error, and information.
  Always pair color with text or an icon.
- **Editorial colors** are reserved for the Studio result experience and other
  explicitly editorial surfaces. They are not a second global theme.

Dark mode may override semantic surface, content, and border tokens. Components
must use semantic tokens so the override works without component-specific
patches.

All normal text must meet WCAG 2.2 AA contrast. Large text and non-text controls
must meet their applicable WCAG thresholds. Check the rendered foreground and
background pair, including opacity and images.

## Typography

Vazirmatn is the default family and the source for the normative type scale.
Language-specific family overrides are:

- Persian (`fa`): Vazirmatn, RTL.
- Arabic (`ar`): Noto Sans Arabic with Vazirmatn fallback, RTL.
- English (`en`) and Turkish (`tr`): Inter with system fallbacks, LTR.
- Playfair Display may be used only for an existing editorial accent, never for
  controls, long text, or a new global heading style.

Use the semantic scale in the frontmatter or its matching CSS tokens. Keep
weights to 400, 500, 600, and 700. Use one clear page heading, preserve semantic
HTML heading order, and avoid uppercase transformations for Persian or Arabic.

Body copy defaults to 16px with a 1.5 line height. Text may shrink to 14px for
supporting copy and 12px for captions; interactive labels should remain
readable and must not depend on letter spacing for emphasis. Truncation is
acceptable only when the full value remains available through context or an
accessible disclosure.

## Layout

Use a mobile-first layout on the 4px spacing grid. Prefer Tailwind's existing
spacing utilities, which align with the canonical scale, over arbitrary values.
Use `1440px` for broad commerce and gallery content and `680px` for focused
forms, reading, and single-task flows.

Layouts must:

- Work from 320px wide without horizontal page scrolling.
- Keep the primary action visible or easy to reach on mobile.
- Use responsive grids that collapse to one or two columns before content
  becomes cramped.
- Reserve stable space for media to limit layout shift.
- Respect safe areas for fixed mobile controls.
- Use CSS logical properties or direction-aware utilities when placement has
  semantic meaning.

RTL mirrors navigation, reading order, drawers, progress direction, and
directional icons. Do not mirror product images, logos, media controls, phone
numbers, OTP fields, or other intrinsically directional content. Phone and
numeric-entry controls remain LTR.

## Elevation & Depth

Create hierarchy with surface color, spacing, and subtle borders before adding
shadow. Cards normally use `surface-default` over `surface-page`; popovers and
dropdowns use `surface-elevated`.

Use the existing `sm`, `md`, `lg`, and `xl` shadow tokens. Larger shadows belong
to modals, floating action surfaces, or direct-manipulation feedback—not every
card. Glass and backdrop blur are accents for transient overlays; content must
remain legible when blur is unsupported.

Overlays must use the shared z-index scale. Never add arbitrary values such as
`z-[9999]`.

## Shapes

The system is softly geometric. Use the radius scale consistently:

- `sm` and `md`: inputs, buttons, compact cards, and utility controls.
- `lg` through `2xl`: prominent cards, sheets, and media containers.
- `3xl`: exceptional hero or feature containers.
- `full`: avatars, chips, segmented controls, and icon buttons that are
  intentionally circular or pill-shaped.

Do not mix sharp and heavily rounded containers in the same component family.
Images should inherit the containing component's radius and clipping.

## Components

Use primitives from `src/components/ui/` and compose feature components around
them. Do not recreate a button, input, dialog, sheet, card, toast, or form
control locally when a shared primitive already fits.

### Buttons

- One visually dominant action is preferred per region.
- Primary actions use near-black with inverse text. HOMA red is reserved for a
  brand-led or specifically emphasized action.
- Secondary actions use a neutral fill or border; tertiary actions use ghost or
  link treatment.
- Icon-only buttons require an accessible name and a tooltip when the icon is
  not universally understood.
- Every button must define hover, focus-visible, active, disabled, and loading
  behavior. Loading must retain the label or an equivalent accessible name and
  prevent duplicate submission.

### Inputs and Forms

- Every input has a persistent label. Placeholder text is supplementary.
- Instructions appear before interaction; validation appears next to the
  affected field and is announced to assistive technology.
- Errors shown to users are in the active UI language. Persian is the default
  and English network errors must never leak into the interface.
- Keep entered values after recoverable errors.
- Use native input semantics and autocomplete attributes before custom widgets.

### Cards and Product Media

- Cards group related information; they are not decoration for every block.
- Product and room imagery keeps its natural subject visible through stable
  aspect ratios and `object-fit` choices.
- Product cards must provide product identity and price as text, not only inside
  an image. Interactive cards need a single clear hit area and visible keyboard
  focus.
- Before/after and zoom interactions must have keyboard-operable alternatives.

### Navigation, Dialogs, and Sheets

- Navigation exposes the current location and uses real links for navigation.
- Dialogs are for blocking decisions; sheets are preferred for contextual
  mobile tasks. Both need a visible title, focus management, Escape behavior
  when dismissal is safe, and focus restoration.
- Destructive confirmations state the object and consequence explicitly.

### Loading, Empty, Error, and Success States

Every data-driven surface defines:

- A shape-matched loading state that avoids layout jumps.
- An empty state that explains why it is empty and offers a relevant next step.
- A recoverable error with a concise localized message and retry path.
- A success acknowledgment proportional to the action.

Animation must never be the only status signal. Long-running AI tasks should
show understandable progress or staged status text without inventing precision.

## Do's and Don'ts

### Do

- Do use semantic Tailwind utilities or CSS variables from
  `src/styles/tokens.css`.
- Do update this file and `tokens.css` together when canonical design values
  change.
- Do reuse shared primitives and existing feature patterns.
- Do design Persian and RTL behavior as the default, then verify LTR languages.
- Do use Lucide icons at consistent size and stroke weight.
- Do keep visible focus on every interactive element.
- Do ensure pointer targets are at least 24×24 CSS pixels or satisfy the WCAG
  spacing exception; prefer 44×44 pixels for primary mobile actions.
- Do support `prefers-reduced-motion` by suppressing non-essential motion.
- Do test long translations, slow loading, missing images, empty data, and
  recoverable failures.

### Don't

- Don't add raw hex colors, arbitrary z-indexes, one-off shadows, or near-match
  spacing when a semantic token exists.
- Don't use HOMA red across large surfaces or for routine primary buttons.
- Don't create a competing page-level design system.
- Don't use color, animation, placeholder text, or icons as the only carrier of
  meaning.
- Don't hide focus indicators or rely on hover-only interaction.
- Don't mirror logos, media, phone numbers, or numeric inputs in RTL.
- Don't use pills for every container or heavy shadows for ordinary cards.
- Don't display raw backend, browser, or English error messages to Persian
  users.

Before merging UI work, verify token use, RTL and LTR layout, keyboard order,
focus visibility, contrast, responsive overflow, reduced motion, and all async
states.
