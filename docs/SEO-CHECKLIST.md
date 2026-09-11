# SEO release checklist and evidence

Prior SEO validation was recorded on **2026-09-10**. Production release gates
remain open where marked pending. Passing local checks does not prove
search-engine indexing or organic growth. Re-run and replace evidence after
every release.

## Public UI restoration correction — 2026-09-10

The earlier public-page captures, layout, hydration, and performance rows below
were taken against the SEO replacement presentation. They are **historical SEO
evidence only**; they do not accept the restored original HOMA public UI.

The restoration keeps the existing page structures for Home, Explore, Gallery,
Store, Product detail, Collaboration, Contact, FAQ, and Terms, and keeps SEO
status, metadata, data loading, and sitemap behavior underneath them. Required
fresh acceptance evidence is a same-data, same-viewport comparison against
detached Git `HEAD` for desktop and mobile; visible breadcrumbs, 20-item page
links, the two approved acquisition pages, and the verified Instagram support
link are the only allowed public presentation additions. The original baseline
worktree is `/tmp/homa-frontend-head-visual` at `cf9b7e42e2914717b5ebc1bc854b8691640408f4`.

| Route/template | Expected behavior | Observed evidence | Status | Verified |
|---|---|---|---|---|
| Restored original public UI | Original structures, controls, and shared header/footer chrome at matching data and viewports | Detached HEAD baseline setup complete; browser comparison is pending final integrated server availability | Pending | 2026-09-10 |
| Restored product commerce | Server has safe visible anchors; post-hydration browser controls retain basket, purchase, selected variant, thumbnails, details, and mobile Try-On | Adapter contract implemented; full integration/browser workflow retest pending | Pending | 2026-09-10 |

## Automated evidence

| Route/template | Expected behavior | Observed evidence | Status | Verified |
|---|---|---|---|---|
| Public templates | Meaningful Persian initial HTML, one H1, links and metadata | Local HTTP audit: 175/175 checks; 9 static templates plus store/product/catalog crawl | Pass locally | 2026-09-10 |
| All public templates | Same content for humans, Googlebot, Bingbot, Twitterbot and OAI-SearchBot | Initial-response title, canonical and main text compared by audit | Pass locally | 2026-09-10 |
| Explore/Gallery/Store | Crawlable page links; all eligible catalog entities reachable | API reconciliation: 22 synthetic shops, 43 synthetic products, all 65 catalog URLs discovered; 74 sitemap URLs including static pages | Pass locally | 2026-09-10 |
| Missing routes/entities | HTTP 404 rather than generic 200 | Live audit and route/data-loader tests; out-of-range pagination included | Pass locally | 2026-09-10 |
| Aliases/wrong store slug | Permanent redirect to authoritative destination | Audit aliases; built-renderer test wrong slug → 308 product canonical path | Pass locally | 2026-09-10 |
| Filters/tracking/page 1 | Filters noindex, tracking stripped, pagination retained, page 1 redirected | Data-loader/metadata unit tests and HTTP audit | Pass locally | 2026-09-10 |
| Private route families | Initial-response noindex; excluded from sitemap | Route tests plus HTTP samples basket/account/studio/try-on/shared result | Pass locally | 2026-09-10 |
| Required API failure | Uncached 503, Retry-After, no successful generic substitute | Built-renderer outage test and loader tests | Pass locally | 2026-09-10 |
| Public cache | 60s TTL, bounded entries, request deduplication, no private/error cache | Dedicated Node cache test | Pass locally | 2026-09-10 |
| Sitemap | Atomic complete refresh; failure retains snapshot; stale diagnostics | Multi-page, duplicate, malformed, partial failure and staleness unit tests; HTTP availability checks | Pass locally | 2026-09-10 |
| Metadata/schema | Escaped JSON, absolute canonical/image, real IRR prices, no invented ratings | Metadata tests and parse checks; backend price remains rial | Pass locally | 2026-09-10 |
| Public API lookup | Exact filters, active/deleted exclusions, deterministic ties, no visit side effects | 6 focused PostgreSQL API tests; detail tracking function not called | Pass locally | 2026-09-10 |
| Frontend regression | Existing and SEO tests pass | 57 Vitest tests + 1 Node cache test | Pass locally | 2026-09-10 |
| Backend basket regression | Existing basket domain/use cases preserved | 30 basket tests; 36 total with catalog tests | Pass locally | 2026-09-10 |
| Built renderer | Production bundles serve synthetic catalog correctly | CI HTTP gate: 130/130 audit checks plus redirect/outage assertions | Pass locally | 2026-09-10 |
| Type/lint/build | TypeScript, ESLint, client/server builds and container build succeed | Local commands and Docker build; Nginx/Node startup and homepage 200 | Pass locally | 2026-09-10 |
| Container Persian locale | Server/browser numeric formatting agrees | Full ICU installed; final image reports fa/ar/tr support and formats 1200000 as ۱٬۲۰۰٬۰۰۰; build assertion enforces Persian locale | Pass locally | 2026-09-10 |

Machine-readable details: `reports/seo-local/audit.json` and
`reports/seo-ci/audit.json`; readable reports alongside them. The CI workflow
uploads the fixture audit. These generated reports are local/CI artifacts,
not tracked sources. Live-site baseline is `reports/seo-baseline/audit.json`:
45 passed and 57 failed before deployment of this work. Baseline and fixture
audits have different catalog populations and must not be compared as an SEO
growth percentage.

Final locally built image: `homa-seo:local`, image ID
`sha256:ab1a062a3d2e144e50224488f8727fe19c89f59565ad517831e76242d6d18aa8`.
Nginx validation through port 3302 confirmed homepage/contact 200+noindex,
basket 200+noindex, unknown page 404, `/shop` 308, robots 200, uncached worker
script, and the noindex/no-store private offline shell. This is a local image,
not a registry push or production deployment.

## Browser and external gates

| Route/template | Expected behavior | Observed evidence | Status | Verified |
|---|---|---|---|---|
| Homepage/contact/product | Correct mobile layout and hydration | Historical result against the replaced SEO presentation; repeat against restored original UI | Superseded; re-test pending | 2026-09-10 |
| Language switch | Persian initial SSR; saved language afterward; Persian fallback RTL | English navigation changed while Persian parent retained `lang=fa dir=rtl` | Pass locally | 2026-09-10 |
| Contact | Verified channel, no placeholder phone | Browser link resolves to `https://www.instagram.com/myhoma.ir/`, supplied by owner | Pass locally | 2026-09-10 |
| Guest basket | Added items survive product → basket document navigation | Historical result; repeat after restored product adapter dynamically loads commerce controls | Superseded; re-test pending | 2026-09-10 |
| Password login and basket merge | Login preserves anonymous selections | Synthetic local user logged in; profile/gallery requests 200; server logged anonymous basket merge; authenticated basket retained 2 items; checkout API returned 200 | Pass locally | 2026-09-10 |
| Studio/try-on entry | Existing upload surfaces work with product identifier | Both upload screens rendered; try-on loaded the selected synthetic product, upload buttons enabled, no console error | Pass for entry | 2026-09-10 |
| Analytics | One initial pageview, preserved event names, no shared/query leakage | Simulated-collector test verifies queue/pageviews/history changes and redaction | Pass locally | 2026-09-10 |
| Service-worker upgrade | Activate new worker, delete old caches, no public HTML fallback | Chrome active worker; only current HOMA cache remained after update; duplicate manifest URLs fixed | Pass locally | 2026-09-10 |
| Mobile performance | LCP ≤2.5s and low shift in representative lab runs | Historical result against the replaced SEO presentation; capture new restored-page traces | Superseded; re-test pending | 2026-09-10 |
| Mobile field performance | p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 | No production field dataset available; lab traces are not field p75/INP evidence | Pending | 2026-09-10 |
| Complete workflows | Login, checkout, generation, valid shared results through production integrations | Local entry/basket/unit coverage only; production OTP, AI workers, media and merchant outcomes require staging/production fixtures | Pending | 2026-09-10 |
| Staging/production | Deploy correct backend/frontend images and validate CDN | Deployment project/access identifiers unavailable; no deployment performed | Pending | 2026-09-10 |
| Search Console/Bing | Verify ownership, submit sitemap, inspect representative pages | Configuration supported; account access/submission outstanding | Pending | 2026-09-10 |
| Indexing/acquisition | Record coverage, branded/non-branded queries, two conversion funnels | Measurement protocol in SEO-OPERATIONS; no post-release results exist yet | Pending | 2026-09-10 |
| 24h/day7/day28 | Technical and equal-window acquisition reviews | Schedule relative to actual production release, which has not happened | Pending | 2026-09-10 |

Do not close the release until the pending production/workflow gates have fresh
evidence. Private app bundle size remains a build warning; public commerce was
separated from its previous accidental dependency on that bundle. No ranking,
traffic or revenue guarantee is inferred from technical checks.
