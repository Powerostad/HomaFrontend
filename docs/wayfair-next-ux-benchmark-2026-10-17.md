# Wayfair Next — HOMA Studio UX benchmark

Inspected: 2026-10-17. Source: https://www.wayfairnext.com/designer/looks/detail/P7H7umnzTv1kNdvIwic5j

Scope: interactive inspection of this public look, not a full competitor audit or a crawl of the whole site. Welcome terms were accepted following the user's explicit confirmation. No account was created, purchase made, feedback sent, or new design generated. HOMA UI code was not changed by this benchmark.

## Observed and exercised

| Surface | Observed behavior | Verification boundary |
| --- | --- | --- |
| Desktop workspace | Current Look/moodboard and selected products on the left; Looks/Products workspace on the right; independently scrollable panels | Viewed at 1280×720 |
| Selected product | Small image, functional role, short name, price, Swap and Remove; an anchor product is marked separately | Eight selected items in this example |
| Swap | Inline two-column image/price alternative grid opens below the original item | Selecting an alternative prompted sign-in; no replacement was committed |
| Details | Large product photo, name, price, rating; external details link separated from the main workspace | Opened and closed; did not navigate to retailer |
| Products | Category-grouped three-column desktop grid; functional labels such as layered lighting, short natural-language preferences, image/rating/price tiles | Viewed without changing preferences |
| Change Direction | Description; optional reference products by URL/photo; reference role Anchor vs Find something similar; room, styles, budget | Opened only; Apply was not submitted |
| Guided help | Five steps: room → reference products → project description → styles → budget. Optional steps expose Skip; final action is Design my room | Traversed to final step, then closed without generation |
| Mobile | Current Look becomes a compact image/total/item-count summary; Edit opens a tall bottom sheet containing moodboard and selected items; product grid becomes two columns | Viewed at 390×844; viewport reset afterward |
| Export | Download image and Download tear sheet (PDF) actions are present alongside Copy Link | Download/output quality not tested |

The existing look displayed a total around $1,799. During the direction form inspection, budget/room values appeared populated without manually editing them. Their origin was not verified; do not infer pricing or budget enforcement from this example.

## Why it is useful for HOMA

1. **One decision at a time.** The user first sees a visual result, not a wall of analysis. Selection, explanation, refinement and technical reporting are distinct layers.
2. **Local alternatives.** Replace one item in its own context rather than expanding all alternatives for every recommendation at once.
3. **Functional product labels.** Explain what an item contributes to the room before displaying lengthy catalog descriptions.
4. **Image-first discovery.** Photos, concise names and prices carry the list; full details are on demand.
5. **A genuinely different mobile composition.** The selected set is a summary plus a sheet, not a compressed desktop sidebar.
6. **Optional guided input.** Users can progress without inventing a description or choosing a style. HOMA must not turn skipped input into a synthetic user prompt.
7. **Explicit reference intent.** Keeping a specific product and finding a similar one are different user goals.

## Proposed HOMA adaptation — not yet implemented

- Main workspace: before/after result and a compact design summary, with a persistent clear path to selected items.
- Recommendations: selected item first; a single local action reveals alternatives or the existing product-specific chat refinement.
- Analysis: progressively reveal observed problems and proposed changes; keep evidence separate from recommendations.
- Mobile: one primary content surface at a time, with the current selection in a sheet and minimal persistent navigation.
- Products and services remain separate. Paint, layout changes and labor must not be forced into shopping-product cards.
- The combined performance/prompt/cost report remains the last, collapsed technical section.
- Printable report remains an explicit user action using saved before/after, findings, changes and product data, without rerunning AI.
- Preserve HOMA's Persian/RTL language, accessible controls and design tokens. Use the interaction principles as a benchmark, not Wayfair branding, images or literal copy.

## Patterns not to copy

- A timed feedback survey interrupted the guided flow and layered another modal over it. Avoid competing overlays and interruptions during design decisions.
- The login gate prevented a completed swap test. Its presence is an observation, not a recommendation for HOMA's test experience.
- Avoid carrying desktop multi-panel scrolling directly into mobile.
- Do not expose raw technical schemas, long repeated rationales or debugging information by default.

## Next implementation acceptance checks

- Users can identify the current image/result, selected products and next action without reading analysis.
- Changing one product keeps its room/design context visible; failed refinement preserves the user's draft and selection.
- Mobile photos remain fully inspectable; no horizontal overflow or fixed controls cover content.
- Details, alternatives and analysis are progressively disclosed and keyboard accessible.
- Empty user input stays empty in the model request; no benchmark copy becomes a hidden instruction.
- No AI request or paid generation occurs merely from opening details, switching tabs or viewing/exporting a saved report.
- RTL/LTR, long names, missing photos/prices, busy/error states and reduced motion are verified before release.

## Untested

Authenticated editing/persistence, actual successful swapping, new-look generation, room visualization/upload, checkout and PDF output. No claims about their speed or reliability are made from this inspection.
