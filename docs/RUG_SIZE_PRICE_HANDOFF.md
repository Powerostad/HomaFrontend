# Rug size / price preservation

Server-style (`studio-search-v1`) matches now accept optional `variant_id`,
`variant_label` and `dimensions_cm`. The backend binds these fields and the
price to the same suitable active catalogue size. V2 nested `candidate` fields
remain supported and take precedence.

The result adapter preserves the SKU, the card displays actual width × length,
and product details show size metadata even without a V2 purchase status.
Checkout grouping includes both merchant product link and variant ID; the exact
variant is submitted to the existing basket API. It no longer defaults to the
parent product's size. Change badges also distinguish changed size identity.

This frontend change depends on the matching backend implementation in
`D:/Company/Homa_Studio_Product_Search_v2`, documented in
`docs/rug_size_recommendation_fix.md`. Frontend deployment alone cannot fix
backend retrieval or catalogue data. No new schema migration is required.

Read-only local audit (2026-10-27): 502 active rug products, 387 with at least
one size having dimensions and price, 115 without a complete priced size.
Missing source values were not invented. Server publication is separate.

Focused tests verify per-size projection, price totals and basket variant IDs.
No paid model or image generation call was used for validation.
