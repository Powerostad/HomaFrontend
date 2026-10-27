# Design refinement invitation — local prototype

Open `http://127.0.0.1:3000/studio?preview=refinement&intro=1&run=onboarding-v1` in the existing
`studio-preview` development mode. This is the current V9 result experience,
not a separate mock application.

Only this preview replaces the generic introduction/chat button with a compact
invitation beneath the room photograph. It uses the approved white V9 surface,
Vazirmatn, existing ink/muted colors and restrained controls. Recommendations,
product rows, inline alternatives and the existing conversation drawer remain.

- The entry-looking button opens the existing drawer and preserves any draft.
- Color, layout and product examples open that drawer with editable sample text.
- No example sends a message automatically or creates a chat/session.
- Explicit send adds a sample local user message. No model, image, recommendation
  or API request is performed by this prototype.
- Ordinary questions are still supported by the same composer.
- A non-modal, dismissible introduction sits above the bottom navigation after
  the real reveal and sequential analysis guide finish. A read-only optional
  result-journey callback supplies readiness; no extra timer simulates completion.
- The introduction is recorded once per local preview profile in this browser,
  even when the page is reloaded before dismissal. A hidden tab does not consume
  its first appearance. These preview keys do not track production accounts.
- The first composer entry has color/layout/lower-price examples using the
  existing question-chip component. Selecting one fills the actual composer
  without sending; closing and reopening does not replay the first-entry guide.
- Navigation and drawer labels change to refinement wording using an entirely
  independent translation instance. Shared translation resources are unchanged.
- Onboarding/copy/storage code is under the existing development-only preview
  import. The result view has one optional lifecycle listener; callers omitting
  it keep existing behavior. Production routing, backend and API contracts are unchanged.

Tests cover example draft insertion, editing, preserving the draft when reopened,
manual submission, translation isolation, once-only persistence, background-tab
deferral, dismissal and real journey readiness. Browser inspection/screenshots were
unavailable because local browser control is disabled in Work settings. The
local route responds successfully; visual approval remains with the user before
any production integration.

Use the shorter URL without `intro=1` to review the result invitation directly
after an already-completed journey. It uses the same once-only onboarding flags.
No image change or instant redesign is promised; the prototype submits only
local sample text and performs no model or render operation.
