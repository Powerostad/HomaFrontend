# Merchant product cards and gallery — 2026-10-27

The Studio details sheet now fetches the complete existing public product detail endpoint when opened. It displays source merchant specifications as a full labelled definition list, the saved merchant description as a separate readable section, and design reasoning under its own heading. No AI vision text or import/diagnostic JSON is used as a customer-facing specification. All source specs are displayed, not the previous first-four limit or truncated search description. Selected variant prices and cart actions are retained.

The product detail API adds merchant_details and gallery_images; existing fields and raw data remain intact. Merchant specs come from source_digikala.specifications, source_merchant.specifications, or legacy Persian merchant key/value fields. Legacy colon-separated description lines become readable rows without rewriting their values. Duplicate labels prefer structured source facts.

Gallery images come from saved Digikala and merchant photo lists. Primary image stays first; duplicate resolutions are not separate photos. Support includes trusted www merchant aliases. Gallery navigation provides thumbnails, previous/next, keyboard navigation, selected state and image count. Browsing a gallery does not switch a purchasable color/size variant or change the model's selected reference.

Loading, abort-on-product-change/close and failure/retry states prevent stale details appearing under another product. Gallery photos are loaded lazily in thumbnails. No new dependency, scrape, model call, database migration or product rewrite was performed.

Validation: frontend 303 tests passed (65 files), TypeScript, zero-warning lint and production build passed. Backend 10 focused tests passed. Browser inventory explicitly reports local browser use disabled in Work settings; visual screenshots/interactive mobile verification could not be performed. DOM tests verify full specs, no vision text, photo switching and retry.

Rollback images: homa_archive_backend:before-merchant-product-cards-20261027 and homa_archive_frontend:before-merchant-product-cards-20261027.
