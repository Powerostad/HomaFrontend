# Shared catalogue taxonomy and designer sourcing

New V5 conversations opt in with `VITE_STUDIO_PRODUCT_TAXONOMY_V1=true`.
The client sends `product_taxonomy_version=product-taxonomy-v1` and selects the
concept-preserving rules V3. Removing the flag leaves the existing conversation
profiles selectable. Saved conversations retain their own pinned versions.

`ExecutionPlan.purchases[].taxonomy_selection` carries the selected category,
subcategory, revision, scope and validation status. `sourcing_guidance` carries the
designer's desired product, reason, specifications, placement and search query
when no usable catalogue option exists. These are optional for legacy responses.

The adapter preserves the guidance through `CategoryGroup`; `StudioResultView`
passes it to the existing completion checklist with an encoded Google search link.
No product, merchant link, price or basket entry is invented. Copy does not claim
an image has completed just because a concept exists. Successful image events
still control actual render display. Layout and paid services keep their paths.

The local flag is set in the ignored environment file. No web/model worker was
started and no image/text model call was made. Backend taxonomy data rollback is
documented in ADR 0053 in the backend repository; disabling the flag alone does
not undo the explicit local catalogue corrections.

Validation covers the request version and V3 combination, sourcing adapter,
encoded search link, legacy Studio page and review panel, plus TypeScript/ESLint.
