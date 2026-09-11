# HOMA SEO foundation

Owner: HOMA engineering/content. Canonical origin: `https://myhoma.ir`.
Implementation date: 2026-09-10. Local validation is not production deployment,
indexing, or acquisition evidence.

## Architecture decision

Keep React/Vite and the existing Nginx container. Nginx serves assets and proxies
documents to Node. The public renderer and browser hydrate the same serialized
data into the original HOMA public page structures, dispatched through
`PublicPage`. Public navigation uses document links; private React routes keep
their providers and workflows. The browser restores anonymous baskets from the
API when crossing that document boundary. The public renderer must not introduce
a replacement page shell or a competing visual system: shared Header/Footer
chrome and each public page's existing layout remain the authority.

During server rendering, product commerce uses visible safe anchors in the
existing action layout. Browser-only basket and purchase controls load after
hydration through focused slots, so private providers are never imported by the
server renderer and the initial server/client tree remains equal. This is a
rendering boundary, not a workflow replacement: after hydration, selected
variant, basket, purchase tracking, thumbnails, details disclosure, and mobile
Try-On retain their existing controls.

`src/seo/routes.ts` owns route policy, `loadPage.ts` owns public data/status,
`metadata.ts` owns head output, and `sitemap.ts` owns complete catalog snapshots.
There is no user-agent branch. Rendering starts in Persian; saved language
preferences apply after hydration. Fallback Persian content retains `lang=fa`
and RTL even when navigation switches language.

The Node cache holds public, non-personalized page data for 60 seconds, at most
500 entries, and deduplicates concurrent loads. It never forwards cookies or
authorization upstream. Required API requests time out after three seconds;
failure without a fresh entry returns uncached 503 with Retry-After. List APIs
perform exact lookups; empty matches are 404. The tracked product-detail endpoint
is deliberately not called during SSR or sitemap generation.

The sitemap is generated at startup, refreshed hourly, and published only after
both complete paginated enumerations succeed. Failed refreshes keep the previous
in-process snapshot. Restarting requires a new complete snapshot; until then the
sitemap returns 503. `/health/seo` returns 503 after 24-hour staleness or before
the first complete snapshot. `/health` checks renderer availability separately.

## Run and verify

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
node scripts/seo-http-check.mjs
PORT=3000 VITE_API_BASE_URL=http://127.0.0.1:8000 node server.mjs
npm run audit:seo -- --base http://127.0.0.1:3000 --api-base http://127.0.0.1:8000 --crawl
```

The audit exits nonzero on failure and writes dated `audit.json` and `audit.md`
to `reports/seo/`. Use `--out` for a retained CI artifact directory. Add
`--indexable` only when checking a production-indexable deployment. `--crawl`
traverses catalog links; `--api-base` additionally reconciles the complete API
population with discovered links and the sitemap. Run against an isolated seeded
API in CI, and against public production APIs after deployment. Reports are
ignored by Git; retain them as CI/release artifacts.

## Release configuration and rollback

1. Deploy the additive backend filters/response fields first. No migration is
   needed. Verify exact lookups return one result or an empty list and do not
   increment product visits.
2. Build this frontend image and deploy to the established staging Compose
   service. Keep `SEO_INDEXABLE=false` on staging and previews.
3. Set production `SITE_URL=https://myhoma.ir`, `SEO_INDEXABLE=true`, and
   `VITE_API_BASE_URL` to the production API. Preserve the established auth,
   realtime and Umami settings. `SUPPORT_URL` defaults to the verified
   `https://www.instagram.com/myhoma.ir/` account.
4. Retain the previous image digest and effective runtime environment before
   replacing the production image. Check Nginx and Node health, public CDN raw
   responses, `/robots.txt`, `/sitemap.xml`, and all representative workflows.
5. Roll back to that previous digest for renderer failure, wrong status/indexing
   behavior, or a broken core workflow. The API additions remain compatible.
   Re-run the audit after rollback; account for already-installed workers and
   purge obsolete CDN HTML if the CDN cached it.

The supervisor runs runtime configuration/CSP generation before starting Node
and Nginx and exits when either service fails. Public HTML has `no-store` HTTP
cache policy; the 60-second cache is inside the renderer. Public navigations
never use the service-worker SPA fallback. Only known private routes may receive
the noindex offline shell. Activation removes old HOMA/Workbox asset caches.
The runtime installs full ICU locale data; a Docker build assertion checks
Persian support so number formatting matches the browser during hydration.

Deployment identifiers/access were not available during local implementation.
No production release or search-engine submission is claimed by this document.

## Webmaster setup

Prefer a Search Console domain property verified with its supplied DNS TXT
record. For URL-prefix verification, set `GOOGLE_SITE_VERIFICATION` to the
provided token and redeploy. Set `BING_SITE_VERIFICATION` for Bing's meta token,
or import the verified Search Console property in Bing Webmaster Tools.
Verification tokens are public; account credentials must not enter frontend
configuration. Submit `https://myhoma.ir/sitemap.xml` after production passes.
Inspect `/`, both acquisition pages, Explore, Gallery, a store and a product.
Record indexed/excluded counts and reported reasons, not just submission success.

## Acquisition baseline and 28-day review

Use distinct session funnels in Umami, filtered by `acquisition_source` and
grouped by `landing_path`. Attribution is captured once per browser tab session;
query values and shared-result tokens are not recorded in URL attribution.
Campaigns, organic search, AI referrals, direct traffic and other referrals are
separate. Referrer blocking can make attribution incomplete.

| Audience | Entry | Generation/conversion events |
|---|---|---|
| AI-tool users | `acquisition_cta_clicked` with `funnel=ai_tool`, `studio_upload_viewed` | `studio_processing_started` → `studio_processing_completed` |
| Shoppers | `store_viewed` / `product_viewed` | `buy_button_clicked`, basket events; try-on has `tryon_processing_started` → `tryon_processing_completed` |

External purchase and checkout-link events are clicks or checkout intent, not
confirmed merchant sales. Preserve existing event names. Pageviews use one
explicit initial call and one per pathname change; Umami automatic pageviews
are disabled. Test with the configured collector before attributing a release.

At release day 0, export the preceding 28 complete days from Search Console and
Umami using a recorded timezone. Keep branded queries (`HOMA`, `هُما`, `هما`,
`myhoma`) separate from non-branded queries; document false positives for the
generic Persian word. Record country/device filters and query privacy omissions.
Capture impressions, clicks, CTR, position, landing pages, index coverage,
organic sessions, funnel entries, starts, completions and purchase clicks.

At +24 hours inspect renderer/sitemap health, statuses, crawling and errors.
At days 7 and 28 compare equal-length periods, annotate releases and campaigns,
and retain both denominators and raw exports. Search Console data is delayed;
do not treat missing recent days as zero. Capture Bing AI Performance citation
reporting when available. Google AI visibility shares the crawl/index/content
foundation; this release adds no special AI schema or `llms.txt`.

Field targets are mobile p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Lab traces do not
prove field performance; INP needs real interactions. Record lab device/network,
cache state, URL and date separately. Field results and 28-day acquisition
results remain pending until the deployment and measurement window exist.

## Content maintenance

Edit typed Persian records in `src/seo/content.ts` and route metadata together.
Keep one H1, visible question answers and crawlable links. Demo images are
existing HOMA examples, accurately labeled; never imply a measured guarantee.
Use real displayed rial prices for schema and toman for visible prices. Do not
invent stock, reviews, ratings, ownership, delivery or return terms. AI can help
outline/edit content, but product claims must be checked against actual behavior.
Search volumes and forecasts need measured sources.

References: [Vite SSR](https://github.com/vitejs/vite/blob/v5.4.21/docs/guide/ssr.md),
[Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[Google AI features](https://developers.google.com/search/docs/appearance/ai-features),
[Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview).
