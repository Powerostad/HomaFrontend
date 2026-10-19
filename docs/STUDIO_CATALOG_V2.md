# Studio catalogue/order integration V2

Follow-up branch `codex/studio-catalog-v2`, based on integration commit `292313d`.
Requires matching backend catalogue V2 changes on top of integration PR #5.

The result's purchase quantity now counts actual sales units; the candidate's
quantity retains design demand. `candidate.order_quote` describes pack/roll/metre
rounding, supplied amount and unit. Original cards, product sheets and printed
reports show this basis using the existing `StudioSkuDetails` component and all
four locales. Five design pieces sold in packs of four remain two commercial
units at the price per pack. Rendering still uses five design pieces.

The existing owner-bound fresh purchase check rejects changed SKU/quantity/price
before any basket write. Order quotes preserve that contract; no client-side
coverage arithmetic or conversion of design count into commercial count is added.
V1 creation defaults/behavior remain unchanged and the existing V2 feature flag
controls new sessions. Keep compatible readers for saved V2 sessions on rollback.

Fractional sales increments are not supported by the integer basket contract;
the backend blocks unsupported terms rather than silently changing quantities.
Development preview `?preview=v2` uses illustrative fixtures and cannot place orders.
No production deployment, merchant feed import or real model quality test is implied.

Validation: 217 Vitest tests / 48 files passed; strict TypeScript and ESLint passed.
Production compiler/Vite/PWA build passed with the existing remote sitemap
lifecycle excluded. Pack quantity/price preservation and rejecting changed fresh
commercial quantities are exercised through the real UI adapter and checkout hook.

Local visual sample (fixture data, not an authenticated live-server run):

![Order basis and review status](validation/screenshots/studio-catalog-v2-after.jpg)
