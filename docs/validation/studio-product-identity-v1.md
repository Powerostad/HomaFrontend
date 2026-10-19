# Product Identity V1 session selection

This implements the first stage-two correction only. The artistic design, mother
prompt, rendering UI and purchase approval logic are unchanged.

For new sessions, `VITE_STUDIO_PRODUCT_IDENTITY_V1=true` together with
`VITE_STUDIO_PIPELINE_V5=true` sends
`product_identity_version: product-identity-v1`. The flag is independent of the
design rule flags. Without explicit V5 it sends nothing. Existing conversations
keep their saved version; disabling the new flag restores the previous selection
for new conversations.

The service contract exposes optional `StudioProductIdentity` on a need and on
each product candidate. It keeps `requested_subtype`, `catalogue_category` and
`observed_subtype` separate. An unknown or ambiguous observed type is null and
carries its source observations; it does not inherit the designer's requested type.
No debug metadata is added to customer-facing flows.

Rollback: the prior backend/frontend `codex/studio-concept-v3` branches remain
available. No catalogue retagging or saved-conversation migration occurs. Backend
ADR0052 documents the resolver, actual catalogue snapshots and stage boundaries.

Validation: TypeScript and ESLint pass; 29 focused tests in five service/view
files pass, including independent flag selection and legacy presentation. All
tests use fixtures. No paid model request or image generation was executed.
Local model workers remain stopped.
