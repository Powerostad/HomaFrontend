# Homa V5 loading integration

The approved `Homa_Loading_Interactive_v5_fixed.html` is a visual reference only.
Its demo sidebar, file upload, fake timeline, countdown, percentage and simulated
completion are not shipped. The three exact embedded WebP assets were extracted
once to `public/images/studio/loading-v5/` (232,714 decoded bytes total). Existing
URLs/asset caching are reused for collage crops; no repeated base64 or dependency.

## Integration points

- Conversational submission `/studio` → `/studio/chat/:sessionId` continues through
  `RoomRedesignPage` / `useRedesignChat`. Existing `StudioDiscovery` now adapts its
  existing handlers/data into `HomaLoadingExperience`.
- Legacy `/studio/progress?sessionId=…` uses the same component. Its existing
  session recovery, polling, explicit retry and `/studio/result/:id` navigation
  are retained; estimated message timers/`ProgressScreen` are removed here only.
- No backend endpoints, model prompts, jobs, billing, API contracts or result
  components were changed. `stage.key` was already sent by the backend; the chat
  hook now retains that key alongside the existing translated status label.

## Exact status mapping

| Actual source | Presentation |
| --- | --- |
| New running job, no output | Opening sample Before/After. `stage=analyze` or `refine` supplies truthful status copy. |
| After 8 seconds of presentation | Sample moodboard; timing changes inspiration only, never readiness. |
| Accepted `analysis` event / persisted `analysis_preview`, or an existing execution plan | After the moodboard has appeared for 1.8 seconds, user photo may be mounted. Without the actual photo, remain on explicitly illustrative moodboard. |
| `stage=design` with accepted analysis but no execution plan | Actual photo and actual analysis insight. No invented decisions. |
| Execution plan + product search (`search`, legacy `match`) | Actual photo and decisions from `existing_items_decision`, or saved free/surface actions. Keep, move, remove and replace remain distinct. |
| `render_pending`, recovered active render operation, `stage=render` / `finalize` | Actual room and its progressive insights remain visible. With no available room, retain labelled inspiration. Real rendering status continues. |
| Initial plan complete, no running operation, no error | Immediately show the reference's warm HOMA ready overlay, focused heading and “View my design” button. The button invokes the existing result callback exactly once, without rerunning work. No forced inspiration delay. |
| Error | Preserved failure text, explicit retry. Existing analysis/plan stays accessible; available recommendations can be opened without claiming image success. No automatic new model requests. |
| No active work, no plan | Conversation action, rather than invented completion. |
| More than 120 seconds still running | Honest extended-wait copy, no progress percentage/countdown. |
| New job ID / route | New presentation instance; route mismatch is guarded before old private room data can render. Existing hook generation checks/abort/recovery remain. |

The legacy API does not expose intermediate analysis content. Its real
`generating`/`matching`/`ready` lifecycle boundaries establish that initial analysis
has finished; until then there is no user photo. In this path, keep/move decisions
and personalized insights are not invented: the component presents a clearly
generic Homa approach. `retrying` alone does not establish initial readiness.

## Data and privacy

Inspiration always uses the supplied static sample assets and sample labels.
The user's uploaded image uses the existing original-image reference, mounted
only after actual readiness and the initial inspiration sequence. No upload,
storage, analytics payload or third-party photo API is added. If it cannot load,
the component returns to labelled inspiration rather than a pretend room.
Insights come from `buildDiscoveryReview`, which reads saved mother documents.
Full backend data is never modified to fit presentation.

The component's display clock cannot complete a job. Both short jobs and R&D
exports expose the ready overlay immediately on genuine completion. Error/retry/navigation and
multiple-session isolation stay with the original job owner, not loading UI.

## Interaction / accessibility

The Before/After slider supports pointer capture, touch with vertical scrolling,
ArrowLeft/ArrowRight and Home/End, bounded to 12–88. Ambient glide pauses 6.5s
after manual input, suspends in hidden documents and stops for reduced motion.
Inactive layers are aria-hidden and the inactive slider is not keyboard-focusable.
Status announcements are polite; errors expose explicit buttons; there is no
fake progressbar. Reduced motion removes transitions, animated seam/pulses and
ambient RAF work. Private-photo aspect ratio is preserved with object-fit contain.

V5 warm-neutral colors, Tahoma body, Georgia HOMA wordmark, comparison seam,
collage proportions and fade/scale transitions are scoped in `loading-v5.css`.
Small viewports get a shorter hero so copy/status are not placed below an
oversized image. Photo captions live below the photo, not over its details.
Each real observation is paired with its own saved design response in one card.
The positive summary no longer hides the individual findings. Cards advance every
7 seconds during actual work, stop at the final card, and support pause, previous
and next. Manual navigation pauses rotation; reduced motion starts paused.
Long text remains fully available in a bounded reading area. The card index
counts available insights, not simulated processing steps.
All Persian UI copy uses the existing translation helper, with English mappings.

2026-10-27 refinement: 278 tests passed, lint and type-check passed; real browser
inspection at 390×844 confirmed a full-viewport personal-room card with no page
overflow and a ready overlay matching the reference. No model requests are needed
for the local preview. The legacy polling flow now uses the same ready moment
before its existing result navigation.

## Verification

- Component/job adapter tests: sample → moodboard ordering; private image gate;
  genuine insights/decisions; finishing state; fast success; long wait; explicit
  retry; missing photo; new-job isolation; keyboard/pointer; reduced motion.
- Route tests: intake → inspiration; pending render → existing focused result;
  image failure keeps analysis/recommendations; existing product/result controls.
- Existing hook tests cover refresh, compact polling, reconnect, identity checks
  and no duplicate accepted operation.
- Run `npm test`, `npm run lint`, `npm run type-check`, `npm run build`.
- Unused lint suppressions in Catalogue/StudioCompare were removed to satisfy the
  existing zero-warning command; no behavior there was changed.

Visual browser automation is disabled in current Work settings, so screenshots
and real mobile/desktop browser interaction could not be confirmed in this run.
No paid design/image request was sent for QA. Component and route tests exercise
the actual handlers with deterministic mocked transport. Browser review remains
available at the existing local-only `/studio/preview?state=loading` route; it
does not submit model jobs. Production rendering is integrated in the real routes
listed above, not an iframe/demo.

Final recorded checks: 61 Vitest files / 277 tests passing; repository ESLint
zero-warning gate passing; strict TypeScript passing; Vite production build,
PWA generation and information-page generation passing. Existing build notices
remain for large chunks/outdated Browserslist data. Sitemap generation preserved
the existing sitemap when its remote backend was unavailable. Local route and
all three static image requests returned HTTP 200. Logs are in
`reports/loading-v5-{tests,lint,typecheck,build}.log`.
