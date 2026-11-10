# Studio workspace benchmark implementation

Local implementation of the interaction principles recorded in `wayfair-next-ux-benchmark-2026-10-17.md`. Not a copy of third-party branding/assets. Not deployed by this task.

## Changes

- Shared static/connected result uses explicit recommendations, analysis, basket and conversation navigation. Desktop keeps the room image visible beside an independently scrollable task panel; chat occupies that same panel.
- Product rows are image-first and compact. Full photos use contain rather than crop. Rationale and impact are disclosed by the existing Why control, not repeated in the default view. Unsupported generic problem/impact claims were removed from the card.
- Every saved alternative can be disclosed under its own recommendation. Opening the alternatives changes no selections and makes no model call. Existing product-specific refinement remains available.
- Current Look summary opens a responsive selection dialog, bottom-aligned on mobile. Primary recommendations and selected alternatives remain linked to the existing basket state. Unknown price status remains explicit.
- Optional five-step intake guide edits the same room/note/preserved-items/style/budget draft. Skip advances without changing values. Finish closes back to final review, not analysis. User-authored text remains the only user message; no automatic generated description was added.
- Existing services/layout separation, invoice, saved print report and last collapsed technical report remain intact.
- Shared Button now forwards its DOM ref, fixing Radix trigger focus restoration instead of accepting ref warnings.

## Verification

- Full existing suite after the main changes: 204 tests / 46 files passed.
- Additional CurrentLook test passed, covering open-without-mutation, explicit toggle and focus restoration (205 tests total across these runs).
- TypeScript and focused ESLint passed before final production build.
- Isolated browser preview used the real shared result, card, dialog and conversation components with local-only example data and a stub header. No production API or paid generation was called.
- Desktop 1280×720: image plus task panel, contextual chat and navigation inspected.
- Mobile 390×844: alternatives in two columns, complete images (`object-fit: contain`), no horizontal page overflow (375px content/scroll width), selection sheet at x=0 and full viewport width. Fixed the half-offscreen sheet caused by Tailwind translate utilities and the fixed summary stacking above its overlay.
- Temporary preview entry/config/stub files were removed and its local server stopped. User data and existing dirty sitemap were preserved.

## Boundaries

No new backend schema, external product-reference uploads, automatic render on selection, community votes or login gate was introduced. The existing explicit preview/refinement actions remain responsible for model requests. Authenticated live-data verification and server publication are separate from this local change.
