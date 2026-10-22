# Local paired Studio comparison

Open `/studio/compare` in `npm run dev:studio` on loopback, using the existing
local account. The route is lazy and excluded from production builds. The import-only workflow remains available. Live execution uses the two isolated
local runtimes described below; it does not deploy or run the production server.

For each case, keep the same original image and user brief. Import independent
A/B outputs. Display order is randomized once per case; sources, raw inputs,
costs and timing stay hidden until reveal. Voting records actual A/B identity,
judge, note, time and whether identities had been revealed. Revealing is permanent
for that case, including after replacing data. Replacing an arm/photo or changing
the brief invalidates the current votes. There is one current vote per criterion
per case, not multiple independent samples when the same button is clicked again.

## Inputs

- Read a saved **local** session by UUID or loopback Studio URL. This uses only
  GET session, diagnostics and performance endpoints; no text/image generation,
  receipt-refresh POST or automatic model retry occurs. Server URLs are rejected
  instead of accidentally querying a local UUID as if it were server data.
- Import an arm JSON exported here (`format: homa-studio-arm-v1`), a raw session
  snapshot, `{session, diagnostics, performance, source}`, or a diagnostics JSON.
  Diagnostics alone may not contain selected catalogue products, rendered image
  or processing time. Missing values stay unknown; they are never reconstructed.
- Import `request.json` from a R&D ZIP, or extract the ZIP and select request.json
  **together with all numbered images** using the multiple-file control. Reference
  SHA256s are checked when available. The original/refinement distinction is
  preserved. R&D inputs contain no generated result image; attach a ChatGPT render
  separately. No image model is called to fill missing data.
- Download a blank arm template to manually describe a saved output when only a
  screenshot is available. Keep unknown costs/time null; don't treat screenshots
  as source traces or claim they prove why a product was excluded.

JSON imports are limited to 50 MiB, workspaces to 50 cases, each uploaded photo
to 12 MiB (JPEG/PNG/WebP). URLs are limited to HTTP(S) and raster data URLs;
SVG/script sources are rejected. Imported prose/JSON is rendered as text, not HTML.

## Interpretation and storage

Cost comes only from saved billed amounts, including a partial-known label.
Unknown costs/time/call counts are null, not zero. Existing session metrics are
session totals, potentially including retries and multiple turns. They are not
presented as the cost/time of the selected design version. An older render is not
shown as the output of a failed or unmatched newer render operation.

Products list actual selected catalogue products when the source contains them;
desired design needs are a separate list. No selected product data is not proof
that the catalogue had no suitable product. Failure and missing-data states stay
visible, and an absent arm cannot win a vote.

Cases/photos/votes are stored in IndexedDB per local account. Storage failure is
visible and JSON download remains available. Exporting a report preserves votes;
Live session image URLs can expire; the page says so. Import extracted R&D image
files or attach photos to embed the bytes in the saved report for portable use.
exporting the reviewer copy clears votes/revealed state and randomizes order for
another judge. Raw files still contain identities; this is a visually blinded
review UI, not cryptographic concealment. Keep independent judges' reports as
separate files. The displayed summary counts latest case votes only and does not
claim statistical significance or silently choose an overall winner.

The real local run can be read immediately. The successful server case
`e58acf14-9a62-48f0-a279-7d755fba256d` still needs its own exported data; do not
substitute the older failed/timeout server sessions or the local output for it.


## Live paired execution (no images)

The page can now start both architectures with one brief and raster data-URL photo
(max 8 MiB). `A` uses the server source snapshot (baseline `f2206b2` plus its
optional export port `3e40b6e`); `B` uses the current local split-prompt/V2 source.
The Vite-only bridges map `/__studio_ab/server` to loopback 8001 and
`/__studio_ab/local` to 8002. These bridges exist only in studio-local mode.

Both use the dedicated `homa_studio_ab` database, a pg_dump/pg_restore copy of the
local catalogue/account/configuration, not production data or a server connection.
Readiness checks verify matching model, catalogue and product count and that
images are disabled before any billed turn starts. The prepared snapshot has
1,415 products and gpt-6-luna. Cache/ticket/channel namespaces are separate.
Embedding computation uses a dedicated local CPU worker and queue; actual
retrieval/ranking is performed by each arm's own code. Concurrent timings include
shared machine/worker contention and are not isolated production latency numbers.
Server-native validation/retry policy is retained; no browser retry is added.

Each click creates a new comparison case and two fresh backend sessions. Both
text turns start concurrently with exactly the same input. No chat.render command
is sent; automatic render enqueue is suppressed by STUDIO_COMPARISON_NO_IMAGES
and run_render also fails before any image provider call. No render workers run
for these profiles. The original Studio runtime on 8000 is unchanged when that
flag is absent. Session IDs, runtime revisions, stages and states survive export
and IndexedDB reload. Reading saved status/output never resubmits model work.
Disconnecting is not cancellation; reconnect/read the saved sessions rather than
clicking run again. Image evaluation is disabled for these no-image cases.

Start from the backend root with its existing Python environment:

```powershell
python scripts/run_studio_comparison.py server --root "D:/Company/Homa_V.0.0/New folder/studio-ab-runtime/server"
python scripts/run_studio_comparison.py local --root "D:/Company/Homa_Studio_Product_Search_v2"
python scripts/run_studio_comparison.py embedding --root "D:/Company/Homa_Studio_Product_Search_v2"
```

The database snapshot is provisioned once. Do not recreate it while runs are
active. The launcher reads the existing ignored local environment; credentials
are never included in the browser report. Billing totals are read from saved
receipts; absent receipts remain unknown. Each fresh session contains only its
own run, while original model retry counts are reflected in its diagnostics.
