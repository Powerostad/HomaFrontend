# Homa Integrated Mobile V2 — implementation report

Implemented in the existing application on 2026-10-27. The supplied HTML is a visual/interaction reference only; its simulated content, timers, window hooks and embedded base64 images are not shipped.

## Entry point and compatibility

Primary production flow: `/studio` → `/studio/chat/:sessionId`, through `RoomRedesignPage`, `StudioDiscovery`, `ConversationResult` and the shared `StudioResultView`. Existing routing, SSE/WebSocket recovery, session API, current project/revision handling, recommendation cards, alternative selection, basket and rendering endpoints remain in place. No backend fields, prompt changes, validators, model calls, dependencies or migrations were introduced. The older `/studio/progress` → `/studio/result/:jobId` archive/legacy flow retains its existing entry behavior; the new automatic journey is attached to the current conversational Studio.

## Actual backend → UI mapping

| Existing source | Presentation |
| --- | --- |
| Hook creating/streaming; stage `analyze` or `refine` | Existing editorial sample comparison/loading. Timers rotate inspiration only. |
| `analysis_preview.studio_documents`, emitted after accepted stage-one analysis; stage `design` | The uploaded room and genuine findings may enter the existing loader after the inspiration moments. |
| `current_execution`; stage `search` | Canonical design/products remain available. No invented completion percentage. |
| Running render operation, stage `render`, `versions[].image_pending` | Truthful rendering state; no transition based on elapsed time. |
| Idle/completed operation, canonical plan, no error, actual final image URL and original | Prepare both images with load/decode, cancellation and a 15-second bound. No blank-image reveal. |
| Both images decoded | One 4.5-second comparison presentation, ending on After. The opening headline/copy leaves the DOM when the reveal finishes. Reduced motion proceeds promptly. |
| Canonical findings | Radix modal bottom sheet: variable count, previous/next, skip, progress and final product CTA. |
| Complete, skip or Escape | Close modal, unlock scroll, select Recommendations, scroll/focus its existing section. Navigation afterwards never replays the guide. |
| Image prepare failure | Retry image loading only, or view existing recommendations. Does not rerun a model. |
| Actual analysis/render error | Existing error/retry workflow retained. No automatic generation retry added. |
| R&D/exported image or missing original | Existing accessible result/available-recommendations fallback; no fabricated After image. |

## Finding/data fidelity

`resultJourney.ts` reads the original canonical mother document without summarizing or mutating it:

- `room_analysis` layout/harmony/function/surface evidence provides the Before context.
- `existing_items_decision`: exact `item_name`, `decision`, `visible_evidence`, `action_instruction`, `decision_reason` and related issue IDs. Keep decisions remain visible even when no purchase is needed.
- `layout_fix_plan`: `target_item`, `action_type`, `specific_instruction`, `why_it_works`, `resolves_issue_id`.
- `product_recommendations`: `product_name_generic`, `placement_instruction`, `why_needed`, `shopping_attributes.replace_existing` and related issues.
- Links to products require a matching stable same-scene `source_item_id` or an unambiguous single-scene mother product ID. Unsupported links are omitted.
- Missing evidence/reasons are omitted, not filled with generic model claims. No findings means no empty modal.

## Presentation state and commerce

The existing job owner remains responsible for real work. Presentation records `pending`/`seen` under `homa.studio.result-journey-v2:<sessionId>`. A pending journey survives refresh; a started/completed introduction does not automatically replay. History browsing, product changes, duplicate result notifications and ordinary tab navigation do not restart onboarding. The Analysis tab contains an intentional replay action.

The current full project and product cards remain intact. Opening alternatives does not change selected items. Deliberately selecting another principal product uses the existing selection handler. No checkout is triggered by the guide.

Out-of-catalog items retain existing designer guidance/search and now show known `sourcing_guidance.specifications_fa`. Self-sourcing is a separate reversible session-local choice. Homa follow-up uses the existing checklist/consultation path; choosing it does not send a request. Existing consultation currently records a confirmed local request; this work does not add a remote fulfilment/submission endpoint. UI copy makes the separate confirmation explicit.

## Files changed in this implementation

- `src/pages/RoomRedesign/RoomRedesignPage.tsx` and its test: connect actual job completion and the existing result workspace.
- `src/pages/RoomRedesign/components/StudioDiscovery.tsx` and its test: decoded-image gate, image-only retry, pending/resume tracking.
- `src/pages/RoomRedesign/services/resultJourney.ts` and its test: canonical finding adapter, presentation persistence, cancellable image preparation.
- `src/pages/RoomRedesign/hooks/useConversationStudioResult.ts` and its test: tolerate partial canonical summaries without invented copy.
- `src/pages/RoomRedesign/services/studioResultAdapter.ts`: retain real external-sourcing specifications.
- `src/pages/Studio/ResultPage.tsx`: integrate reveal/guide into the existing result, active Recommendations destination and explicit replay.
- `src/pages/Studio/result/IntegratedResultJourney.tsx`, `.test.tsx`, `integrated-journey.css`: reveal, accessible modal and responsive presentation.
- `src/pages/Studio/result/CompletionChecklist.tsx`, its test, and `types.ts`: independent self/Homa intentions, undo, genuine sourcing specs.
- `src/components/studio/loading/SampleComparison.tsx`: capture deliberate horizontal drags only; vertical scrolling stays native; remove unsupported React image hint.
- `src/components/studio/loading/loading-v5.css`: compact short-phone loading layout without hiding real analysis.
- `src/i18n/locales/site.en.json`: new Persian/English UI copy.
- `src/pages/Studio/dev/DiscoveryPreview.tsx`, `LocalStudioPreview.tsx`: development-only preview using the same production components; clearly labelled fixtures, no paid calls.

## Verification

Final result: **301 tests passed across 64 files**; zero-warning ESLint and TypeScript/production build passed.

Commands: `npm test -- --maxWorkers=4`, `npm run lint` (zero-warning gate), and `npm run build` (includes TypeScript). Final logs and screenshot artifacts are in `reports/integrated-v2-*`.

Automated cases cover: real status/asset gates; both decodes; failure, timeout, cancellation and image-only retry; empty/partial data; keep/move/replace/add mapping; same-scene links; 0/1/3/7 findings; next/back/skip/Escape; recommendations resting state; reload/no replay; pending/resume persistence; reduced motion; vertical pointer intent; sourcing undo/persistence; existing cart and alternative tests.

Browser inspection used the actual app in Chromium with explicitly labelled development fixtures, without running a model. Viewports: 320×568, 375×667, 390×844, 430×932; desktop 1280×800. No horizontal overflow in the recorded sheet matrix; all footer buttons remain inside the viewport. Verified Radix body scroll lock/release, keyboard focus containment, Escape, final CTA, skip, tab navigation, preserving the original selected basket item while viewing alternatives, and real refresh without replay. A fresh browser run after local services started had no console errors.

Physical iPhone/Safari, iOS keyboard/browser safe-area behavior and a newly paid end-to-end model request were not tested. Safe-area CSS is present. The saved viewport matrix reports actual browser bounds. Existing build warnings concern Browserslist/esbuild configuration; no new dependency was added.

## Runnable preview and screenshots

Local app: `http://127.0.0.1:3000/studio`. Development preview: `http://127.0.0.1:3000/studio/preview?state=ready&preview=integrated&run=review-v2`. Reusing the same `run` intentionally does not replay a seen introduction; use the Analysis replay control, or a distinct development `run` for another UI test. This parameter exists only on the existing development preview route, not as a production timing override.

- Loading: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-loading.png)
- Reveal: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-reveal.png)
- Final After/no introduction copy: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-after.png)
- Analysis sheet: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-analysis-390.png)
- Short phone: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-analysis-375-short.png)
- Recommendations: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-recommendations.png)
- Self-sourcing: [Open screenshot](/D:/Company/Homa_Studio_Frontend_v2/reports/integrated-v2-sourcing.png)
- Bounds: `reports/integrated-v2-viewport-matrix.json`

## Deployment status

Published and verified on 2026-10-27 after the existing Dokploy connection recovered. Live frontend: `homa_openai_frontend:integrated-mobile-v2-20261027`, image `sha256:ac2fcd64ede24df58c742abb9aea8f7b730fca39ff0b8e49936e0b31a08be623`. Previous frontend is archived as `homa_archive_frontend:before-integrated-mobile-v2-20261027`. Fresh pre-deployment configuration snapshots are saved privately in the release directory.

Public `/studio`, frontend health and backend health return 200; database/cache health are true. The served JavaScript entry `/assets/index-p9H3MLjU.js` matches the locally validated production artifact by SHA-256. The live Studio intake was verified in the browser; no paid design/image request was issued for release verification. The temporary release helper was restored to its inert configuration. Backend, database, storage and model configuration were unchanged.
