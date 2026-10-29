# Mobile Studio intake V10

Home Studio has four steps: room selection (living/bedroom, immediate advance),
photo upload and explicit confirmation, optional verbatim note, optional inspiration.
Hosts retain the legacy flow. Existing result, products, basket and model decisions are unchanged.
The approved existing V9 visual tokens remain authoritative; the supplied V10 defines the intake behavior.

## API
The existing chat.turn prefs_update object accepts optional inspiration_image (validated image data URL).
It is normalized by the existing photo downscaler, stored as a separate ConversationState field,
and excluded from room image IDs, inventories and the explicit preference JSON sent in prompts.
Multimodal text input labels it as inspiration, not an actual room. No inspiration is synthesized.
No new endpoint, model, render contract or SQL migration is needed. Backend must ship before frontend.

## Processing
Existing polling/WebSocket, operation recovery and render retry remain in use.
StudioDiscovery waits for actual result readiness and successful Before/After image preload.
HomaLoadingExperience reveals actual analysis through existing loadingSlides, one finding at a time.
Its timers only present inspiration/findings, never determine job completion. Error copy distinguishes render.
Analysis-only/export results retain their existing completion action. Local R&D/API choice remains available.

## Verification
Automated intake/loader tests and backend reference isolation tests run without paid model calls.
Browser checks exercised room -> upload -> confirmation -> optional note skip -> inspiration preview,
using public sample assets at 320x640, 375x667 and 390x844; no horizontal overflow observed.
Real paid generation, authentication interruption and mobile OS keyboard/camera require live-device verification.
No production deployment or merge is authorized by this brief; both PRs remain draft.
