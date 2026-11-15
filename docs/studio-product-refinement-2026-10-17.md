# Product-scoped refinement

Connected Studio product cards, including alternatives, now expose an inline
request form. Static legacy Studio cards without conversation callbacks are not
given a non-functional action. The existing general conversation remains intact.

The visible product context and user-entered message are sent through the existing
chat action, with the original item_id and product_id. The product context is
also in the text because generic chat should not depend on preview-only IDs.
No hidden design instruction or image-preview action is added.

Opening/cancelling the form and selecting replacement text make no request.
An empty message cannot submit. Duplicate submits are locked synchronously;
another active turn disables editing. Failed sends retain the draft, successful
sends open the existing conversation. Product basket controls remain unchanged.

Verification is offline with mocked chat transport: no paid model calls or server
deployment in this task. The normal chat workflow decides what to do after an
explicit user submission; this UI does not call the renderer separately.

196 tests passed, TypeScript validation and targeted ESLint passed, and production
Vite/PWA build passed. The real form was visually checked in an isolated local
Persian fixture at desktop and 375px width (document width remained 375px).
Expanded alternative cards span their grid so the request form is not squeezed
into a narrow two-column mobile tile. The temporary fixture was removed.
