# Local Studio without model reviews

When the backend emits `evaluation.model_reviews_enabled=false`, the full
StudioReviewPanel and the result-page image-review warning are omitted. Older
stored model opinions are hidden in this mode. Product cards, external sourcing,
variant-aware basket checks and the private cost/time diagnostics stay available.
An absent field retains the earlier compatible display for other deployments.

The backend separately disables bundle/product/image opinions, removes the
`revise_analysis` option from the active stage schema and bypasses only model
approval gates. Numeric purchase checks remain required. The frontend flag does
not authorize a purchase or alter backend validation.

Validated with review-panel, diagnostics and sourcing tests, TypeScript and scoped
ESLint. No paid model calls or server deployment are involved.
