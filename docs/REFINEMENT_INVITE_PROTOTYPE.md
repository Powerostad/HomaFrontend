# Design refinement invitation — local prototype

Open `http://127.0.0.1:3000/studio?preview=refinement` in the existing
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
- Navigation and drawer labels change to refinement wording using an entirely
  independent translation instance. Shared translation resources are unchanged.
- All code is under the existing development-only preview import. The normal
  result page, production routing, backend and API contracts are unchanged.

Tests cover example draft insertion, editing, preserving the draft when reopened,
manual submission and translation isolation. Browser inspection/screenshots were
unavailable because local browser control is disabled in Work settings. The
local route responds successfully; visual approval remains with the user before
any production integration.
