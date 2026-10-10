# Isolated Studio result recovery

Scope: only Homa / openai; branch `codex/isolated-development`. Do not deploy
BackendServices or change production databases, storage, domains or credentials.

## Confirmed failure and repair (2026-10-11)

- The WebSocket completion helper received `keepRenderSocket` as `closeSocket`.
  A pending image incorrectly closed the socket. Both completion paths now
  pass its inverse; regression tests reproduce the old failure.
- Recovery previously fetched one snapshot after an acknowledgement. It now
  single-flights compact durable-status checks every five seconds, bounded to
  ten minutes. Full image/history detail loads only when operations change.
  It handles transient network errors, missed pushes, stale responses, focus,
  reconnect, abort and the text-operation-to-render-operation link. Recovery
  never submits another paid generation automatically.
- Explicit Original selection is preserved, with a ready-image notice even
  for the first generated version. A failed media load renews the saved signed
  URL once and offers an explicit saved-image reload, not generation retry.
- Rotating-token refresh uses an origin Web Lock where available, protects
  newer credentials against stale responses, and retains login on transient
  network/server errors. Unsupported browsers retain same-tab single-flight
  and stale-token guards, but not cross-tab mutual exclusion.
- Same-origin signed `/homa` media receives no API Authorization header;
  only the legacy own-origin `/api/` image route receives the JWT.

## Deploy / rollback

Deploy OpenAI-Backend first for `?status_only=1`, then OpenAI-Frontend. Do not
use fresh volumes. No environment, provider model, DNS or credential changes
are required. Keep the existing domain settings documented in backend
`deploy/openai/STUDIO-AI.md`. The recovery code has no hard-coded hostnames.
For rollback deploy the previous frontend revision before the previous backend
revision. No data migration or database restore is needed for this patch.

The startup AuthContext also preserves retained credentials after a transient
refresh failure; it does not resurrect credentials the refresh helper revoked.

## Verification

Run `npm test`, `npm run type-check`, and `npm run build` before publication.
Transport, hook, media and login tests use simulated events, not paid API calls.
On the server, validate owner-only compact status, persisted completed versions,
and a bounded streamed GET of saved media. A successful server media response
does not by itself prove browser rendering. Refresh the page once after deploy
to load the new JS bundle, then select the saved generated version if Original
was intentionally selected. Do not regenerate a completed image to repair UI.

Verified 2026-10-11: deployed frontend `75c6e9a` (Dokploy
`qAZd9NrlrOxK1VNzUMLkr`) and backend `5b92f93` (Dokploy
`gvEBYc9HMKEcal8tDP_kR`), both done. 123 frontend tests, TypeScript, targeted
lint and build passed; 27 focused backend tests passed. Full Django integration
suite was not run locally. Live Chrome displayed the user's saved Version 2
(1024x1024) without an error panel. A read-only browser GET-response simulation
of missing terminal delivery recovered it after two compact polls. No new paid
generation was triggered. Compact live owner status GET was 200 / 1,273 bytes;
anonymous GET was 401. Backend startup gate exited zero and web was healthy.
