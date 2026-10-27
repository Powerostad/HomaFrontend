# Studio progressive discovery — 2026-10-17

## User problem and reference

The user sees a room photo, a long analysis, products, services, sourcing and an
invoice together, before understanding what Homa noticed or why a change helps.
The job is: “Help me understand what can improve in my room, then show me a
believable picture and related choices that I can act on.”

Reference reviewed read-only:
`D:/Company/Homa_Refactor/01_Discovery_Flow/08_Discovery_App_Orchestrated_v2.3`.
Key evidence: `README.md`, `UI_UX_V2.3.md`, `SpaceReportStage.tsx`,
`VisualThread.tsx`, `DecisionStages.tsx`, `BriefStages.tsx`.

| Before | After | Why |
| --- | --- | --- |
| Full result layout opens while analysis is still empty | Focused initial discovery view with the original photo | Establish context before asking the user to interpret a report |
| Findings and recommendations arrive as a long page | One saved observation and its linked change at a time | Connect the evidence and the proposed response |
| Multiple report sources, stages and technical details | Optional overview and full-text disclosures | Depth stays available without dominating the first read |
| Image, analysis, products and invoice compete | Final result opens on suggestions, with analysis and basket as distinct views | Each view has one job |
| Extra confirmation/questions in the old discovery prototype | Back, next, skip and optional existing chat | Avoid restoring mandatory intake/change-boundary gates previously removed |

Keep from v2.3: the persistent photo, one-finding focus, back navigation,
distinction between observation and recommendation, contextual explanation,
and optional depth. Do not transplant its multi-agent pipeline, mandatory
two-question intake, per-item change constraints, multi-step brief confirmation,
or lab/technical vocabulary into this UI change.

## Implementation boundary

- `buildDiscoveryReview` reads the saved `current_execution.studio_documents`.
  It links diagnostic IDs to layout fixes, existing-item actions or mother
  product recommendations from the same scene.
- Legacy plans use recommendation reasons labelled as design ideas; these
  reasons are never presented as observed defects.
- Nothing modifies, shortens or adds to the mother prompt or model payload.
  No narration API call or fabricated user message is introduced.
- The existing operation recovery exposes the saved plan during rendering.
  Review and rendering overlap; there are no artificial timers or percentages.
- When the image becomes ready, the reader is not interrupted. They can open
  the result immediately. Choosing “go straight to the result” explicitly waits
  for completion and then opens it. Errors keep retry and partial-result paths.
- Existing saved completed sessions open the final result directly. Follow-up
  turns stay in the normal conversation/result workspace.
- Explicit conversation uses the existing composer. A draft can be written
  while busy; only the user's send action submits it when available.

## Hypothesis and evidence

Hypothesis: first-time Studio users will better understand the proposed design
if they see one observation with its linked change while the result prepares.
Pre-committed first usability check: with 5 representative users, at least 4
can explain one observation/change relationship and reach the result unaided.
Measure task completion and confusion, not time spent reading as success.
The proposal is user-directed and not yet validated by external usability data.

Lean UX readiness: **5/10 (4 of 8 diagnostic rows evidenced here)**, not a product
quality rating. Explicit assumptions, a testable hypothesis, a small offline
reviewable flow, and outcome instrumentation are present. Whole-team research,
a recurring user-research cadence, Agile discovery linkage, and an invalidated
hypothesis are not established by this review; remedy with a 5-user review,
recorded outcomes, an owner/date in the delivery backlog, and an experiment log.

`studio_result_action` events add analysis availability, distinct finding
views, and result opening with review counts and duration. They include IDs and
counts, not room photos, analysis prose or user text. Existing analytics can be
disabled; events then remain no-ops. No claim of collected production data.

## Verification

Use local saved/fixture data, never a paid model request. Check pending analysis,
mid-render review, ready while reading, explicit skip/wait, partial image failure,
empty/legacy documents, long prose, RTL/LTR, keyboard focus and mobile widths.
The final product/service separation and selected-item invoice must remain.

Implementation verified locally: the full suite passed 188 tests across 43
files, including the linked-recommendation regression. TypeScript,
zero-warning ESLint and the Vite production build passed.
Existing Browserslist/chunk-size/dynamic-import build warnings remain.
Browser checks covered 320/390px mobile, desktop, RTL/LTR, pending analysis,
ready without interruption, partial image failure and independent result views.
No paid model, checkout or consultation submission was performed.

Local preview: `http://127.0.0.1:3000/tests/fixtures/studio-discovery.html?lang=fa`.
Screenshots: `tools/studio-progressive-review/discovery-mobile-2026-10-17.png`
and `discovery-desktop-2026-10-17.png` under the HomaLatest workspace.
Deployed on 2026-10-17 at 13:03:48 UTC through isolated OpenAI-Frontend,
deployment `QRY03eg5FXnE-0t8NxALh`, manifest commit `f54bab4`, image
`prebuilt-1d8c718`. Container `02184c158af8` is healthy. Public `/studio`
and `/assets/index-Da8uq2LI.js` return 200; the asset SHA256 matches the
locally verified build exactly. Initial routing returned 404 while the new
container's health check was starting; it recovered after becoming healthy.
Previous `prebuilt-fc13596` is pinned for rollback. No backend, database,
provider, ERP or original Homa service changes. No paid AI request was made;
production generation quality/latency has not been measured by this rollout.
