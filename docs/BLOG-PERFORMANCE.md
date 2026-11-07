# Blog performance contract

The blog is server-rendered HTML without React hydration. Real article pages
load `/config.js` and a small `/blog-analytics.js` bundle. Index, category and
error pages do not emit `article_view`. Article content and navigation remain
usable when analytics is blocked. Runtime configuration must point to a real
Umami instance; `about:blank` / `disabled` explicitly disables collection.

## Events and ownership

| Event | Trigger | Not a trigger |
| --- | --- | --- |
| `article_view` | Rendered published article document | Listing, missing article, loading placeholder |
| `studio_cta_click` | Article link to same-origin `/studio` or a child route | External link, opening a product |
| `studio_processing_started` | Current chat receives backend `stage` with `analyze` or `design`; legacy session API accepts a new queued/processing design | CTA click, auth modal, socket connection, session shell, polling/recovery page, ordinary chat |

`studio_processing_started` means processing began, not successful generation,
payment, a completed design, or a purchase. It is counted once per design
session, not for every retry, render stage or conversation revision. Session IDs
are used only for local deduplication; these editorial events contain no user
ID, session ID, uploaded image, prompt text, private result URL or search query.
The pre-existing application's other analytics events retain their own schema.

On article pages, links in the header, body, CTA and footer are covered with one
delegated listener. The last explicit same-tab article CTA is held in
`sessionStorage` for 30 minutes. A mere article view does not get credit for a
later design. Blocked storage yields an unattributed start and in-memory dedup.
Ctrl/Meta/Shift clicks are counted as CTA clicks without altering same-tab
attribution; cross-device and new-tab conversions are not inferred.

Payload properties are `schema_version=1`, `article_path`, and a coarse
`acquisition=google|other` where available. Processing events also carry
`attribution=article_cta_30m|unattributed`. Only public canonical article paths
are stored, never URL parameters or referrer query strings. A Google referrer
is a browser-observed hint, not proof of a particular Search Console query.

## Aggregate reporting

Run the reporting tool locally or on an internal reporting runner, never in the
public frontend. It supports Umami **3.4's paginated events API**, verified
against the pinned 3.4.1 runtime. It reads raw event pages transiently, strips
identifiers immediately, and persists only counts by article/date/device. IDs
are used in memory to deduplicate pagination overlap and are never exported.
Unsupported API shapes fail visibly instead of silently creating zeroes.

Google Search Console is requested twice, independently:

1. `date, page, device` for page totals.
2. `date, page, device, query` for editorial query detail.

Both are `web` search, `dataState=final`, paginated daily. Search Console's
privacy thresholds and internal limits still apply; page totals must never be
calculated by summing visible query rows. The sources are joined only on
canonical article path, calendar date and device. **No visitor-level join with
Query exists.** Foreign domains are excluded. Unknown Umami devices stay in an
`unknown` row, without invented Google data.

All report dates use **America/Los_Angeles** to match Search Console's Pacific
calendar, including 23/25-hour DST days. Umami timestamps remain stored in UTC.
Choose completed past days; Google final data may be delayed. A missing source
or missing search row is `null` / `—`, not a fabricated zero. Failure to fetch
either configured source aborts the live report. An offline snapshot can mark
one source as `null` explicitly for a partial report.

The HTML report shows an article/device summary for the selected window,
expandable daily detail, and separate query detail. JSON includes event count
ratios `cta_per_view` and `starts_per_cta`; these are not unique-person funnel
conversion rates. Browser blocking, closed tabs and date boundaries can produce
incomplete journeys or ratios over 100%. Onsite counts include all channels;
Google clicks remain a separate aggregate. **Do not label starts/views or
starts/Google clicks as a Google-user conversion rate.**

## Configure reporting access

Use environment variables in a private shell/runner secret store:

| Variable | Meaning |
| --- | --- |
| `GSC_PROPERTY` | Verified property, e.g. `sc-domain:myhoma.ir` |
| `GSC_ACCESS_TOKEN` | OAuth access token with `webmasters.readonly`; refresh outside this tool |
| `UMAMI_API_URL` | HTTPS origin of private Umami reporting API |
| `UMAMI_WEBSITE_ID` | Website UUID; public tracking ID is not an API credential |
| `UMAMI_ACCESS_TOKEN` | Authenticated reporting token; keep server-side/private |

The command does not create Google credentials or store/refresh OAuth tokens.
Do not put reporting secrets into `VITE_*`, browser storage, URLs, source files
or GitHub commits. A Google browser login alone does not authorize API access.

```powershell
npm run report:blog -- --start 2026-11-01 --end 2026-11-04
# Or process a previously collected aggregate snapshot:
npm run report:blog -- --input C:/private/report-snapshot.json
```

Output goes to ignored `reports/blog-performance/START_END/`: `snapshot.json`,
`report.json`, and `index.html`. Do not publish this internal report under
`public/`. A snapshot has `{start,end,timezone,gsc:{rows,queries},umami:{rows}}`;
Umami rows contain only `{date,article_path,device,event,count}`. Use `null` for
an unavailable source. Queries are search statistics, never event properties.

## Separate Umami installation

`ops/analytics/compose.yml` pins the official Umami 3.4.1 image and a separate
PostgreSQL volume. The database has no host port; secrets are required via env.
`compose.local.yml` exposes the panel only at `127.0.0.1:8788`.

```powershell
node scripts/setup-umami-local.mjs D:/Company/Homa_Releases/blog-performance-20261108/private
```

This command generates credentials outside Git, starts the local service,
immediately changes the default admin credentials via the local API, creates a
QA website and a native 30-minute `Blog → Design` funnel, and saves
credentials/reporting access in that private directory.
Never use the local QA website ID for production data. Restrict directory ACLs
to the current user and SYSTEM on Windows; Unix files are created mode 0600.

For server installation, first take the normal dated deployment backup. Add a
dedicated analytics service/domain with TLS and a private database; do not
replace Homa's database or create another Homa application. Bootstrap and change
default credentials before exposing the login publicly. Configure the production
website separately, then set Homa's public `VITE_UMAMI_SRC` and
`VITE_UMAMI_WEBSITE_ID` to that website. Keep reporting credentials out of Homa's
frontend env. Back up the analytics volume separately. No production configuration
or deployment is performed by the local setup command.

## Verification and rollout

1. Unit tests: no click-as-conversion, one start across duplicate stage/recovery,
   missing/expired attribution, no private fields, DST, separate query/page
   totals, pagination/deduplication and API failures.
2. Build and real Nginx release gate: article HTML and assets, human/Googlebot
   parity, genuine 404/noindex behavior remain covered.
3. Against local Umami: send named QA events, read them through the actual API,
   and verify only aggregate dimensions reach the report.
4. Before production activation: confirm real tracker config, perform one
   marked QA journey on the deployed release, verify counts in the reporting API,
   and exclude that QA website from business reports.

As of 2026-11-08, the inspected production configuration was `about:blank` /
`disabled`; no historical blog counts are claimed. Search Console login returned
“This service isn't available in your country”; property verification and API
authorization remain pending. These are explicit activation gaps, not zero
traffic or proof that the site is absent from Google.

Official contracts: [Umami tracker](https://docs.umami.is/docs/tracker-functions),
[Umami events API source](https://github.com/umami-software/umami/blob/v3.4.1/src/app/api/websites/%5BwebsiteId%5D/events/route.ts),
[Search Console query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).
