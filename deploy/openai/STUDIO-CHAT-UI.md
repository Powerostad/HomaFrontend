# Conversational Studio UI and account archive

Scope: Homa / openai, frontend branch `codex/isolated-development` only.
This change does not alter provider models, mother-prompt policy/schema, backend
generation, quota, credentials, databases or image-storage settings.

## Design and navigation

- `/studio` keeps the photo/intake flow and opens the conversational workbench.
- A created conversation immediately receives its canonical
  `/studio/chat/:sessionId` URL, including while its first render is pending.
- Desktop keeps the room/version preview and scrollable conversation side by
  side. Mobile starts in Chat, with an explicit Room & recommendations switch.
- The message composer is labelled, multiline and reachable; users can draft
  while processing, but duplicate sends are disabled. Reading older messages
  does not force scrolling to the latest reply.
- Design guide and Products have separate views. All six mother-prompt summary
  sections remain visible in the guide. Purchases show rationale, placement,
  quantity, catalogue identity, price, merchant destination and alternatives.
  Concepts remain distinctly non-purchasable and unpriced. Unknown costs are
  not represented as a zero estimate. Model text is escaped, never rendered as HTML.
- Styling reuses `DESIGN.md` / `src/styles/tokens.css` and existing UI primitives.
  No new global theme or dependency is introduced.

## Why conversations appeared to disappear

The previous project dashboard only fetched legacy image-job sessions. Chat
sessions were already persisted by the backend, but never listed in the profile.
It also displayed demo projects when the real list was empty.

The shared `ChatSessionArchive` now reads the authenticated, owner-only
`GET /api/recommendations/chat/sessions/` endpoint:

- Full archive: `/studio/projects`.
- Profile: `/account/gallery` (All or Studio tab), latest three plus All conversations.
- Real links reopen `/studio/chat/:sessionId`; existing detail/recovery loads the
  saved turns and versions without submitting a new image-generation request.
- Failed and rendering conversations are retained in the list, not hidden.
- Error, loading and genuinely empty lists are separate states; no demo data.
- The archive refreshes on mount, explicit refresh and returning focus. Data is
  account-scoped; stale responses from a previous account are discarded.
- Conversations are server-owned, not a browser-local history. Existing image
  jobs remain separately accessible under Previous designs.

## Moving to another domain

No hostnames are embedded in the new components. Keep the same API routes and
authenticated account mapping. Configure the shared API/media bases, proxy,
cookies/auth origin, CORS/CSRF, WebSocket host and storage signing as documented
in backend `deploy/openai/STUDIO-AI.md` and the existing migration/runbook files.
Preserve the chat database and private media when moving; changing only the
hostname cannot move account history. No environment additions or migrations
are required by this UI patch. Never use fresh volumes for this rollout.

## Minimal verification

At the user's request, only essential simulated regressions were run: 13 checks
cover owned archive/resume links, fetch error vs empty, account-switch stale
responses, busy composer, canonical summary/product display and persisted render
recovery. All passed. Targeted lint and the production TypeScript/Vite build
are required before publication. No live generation, paid model/image request,
full suite or extensive browser test is part of this change.

User acceptance: open an existing chat from Profile, verify its turns and saved
versions, review guide/products, leave and return, and continue with one message.
The last step can incur the usual AI costs and is left to the user.

## Rollout / rollback

Deploy only OpenAI-Frontend (`lV8z1EMrI0jxZMpggrMQa`) from the isolated branch.
No backend deploy is needed. Roll back by deploying the previous frontend
revision; no stored conversations are changed by this patch.
