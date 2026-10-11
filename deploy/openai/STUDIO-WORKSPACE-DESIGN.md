# HOMA Studio — photo-first conversational workspace

## Scope and visual reference

Rebuild the primary `/studio` entry and `/studio/chat/:sessionId` workspace.
References: the site's `Header`, landing `HeroSection`, non-chat
`StudioUploadPage` and `StudioResultPage` (especially the image-led hero).
The legacy non-chat routes remain accessible; they are not another chat panel.

The user wants one understandable design conversation, a large room image,
clear recommendations and persistent account-owned sessions. No mother prompt,
model, renderer, retrieval schema or account permissions change in this release.

## Design decisions

Palette reuses tokens: page #F7F7F5, white #FFFFFF, warm stone #FAF9F6,
primary action #111111, body #1A1A1A, secondary text #6B7280.
Use the site's Vazirmatn for Persian, Inter for English and the existing HOMA
wordmark. Warmth comes from room photography, not an unrelated chat theme.

Two considered layouts:

```
A (chosen):                    B (not chosen):
[shared HOMA header]           [shared HOMA header]
[design title / account tools] [room image]
[ROOM IMAGE] [single panel]    [chat] [design report]
             chat/guide/items
```

B still presents parallel text panels and makes the product/report compete
with the conversation. A keeps the room as the visual anchor and displays only
one active text surface. On small screens, room then workspace stack vertically;
there is no second mobile composer and no hidden room/chat toggle.

Entry is a real upload/review flow, not an imitation conversation. Its sample
photo is explicitly labelled as an example and is never sent to the backend.
Actual selected photos use object-fit contain. Optional preferences live in one
expandable form section. Only explicit confirmation starts the first turn.

## Contracts kept intact

- `StudioIntake` uses `useIntakeFlow` and `HomaIntakePayload` unchanged.
- File preparation, HEIC conversion, decoding and 8 MiB limit remain unchanged.
- Small photos warn without blocking; camera and gallery are separate inputs.
- Room, goals, note, preserved items, style and budget keep their original types.
- `composeIntakeText` and `useRedesignChat` still own the actual API flow.
- Server session identity is immediately canonicalized into the resumable URL.
- Original and version images remain selectable; original comparison does not
  remove the latest report. A selected older version shows its own report.
- One `ConversationPanel` stays mounted across tabs, preserving scroll and draft.
- Product preview uses the existing typed action and returns to conversation.
- Canonical mother summaries, rationale, placement, concept/real-product labels,
  prices, budget caveats and alternatives remain visible in `ExecutionPanel`.
- Private prompt output/cost report and account archive remain accessible.

## Essential verification only

TypeScript, production build, scoped lint and 14 focused regression tests.
Visual fixture covers desktop Persian/English, 320px Persian entry/workspace/
products and the existing non-chat Studio as reference. No paid image or real
session creation is performed. Fixtures are clearly illustrative, not model
quality verification. The screenshot script blocks API/AI traffic, intercepts
development-only modules in an isolated browser and is not part of the bundle.

Screenshots are kept locally under ignored `reports/studio-design/`.
Run Vite on 127.0.0.1:5181 and then:

```
node scripts/capture-studio-workspace.mjs <absolute-playwright-package-path>
```

Structural review: hierarchy, grayscale organization, whitespace, subordinate
labels, token spacing, bounded line lengths and flat/appropriate elevation are
improved. New input borders and text use the darker secondary token; no claim
of a complete WCAG audit of the existing shared header/site is made.

## Moving to another domain

No domain is embedded in these components. Navigation and sample images are
root-relative. Carry `StudioIntake`, `RoomRedesignPage`, `ConversationPanel`,
`ExecutionPanel`, `journey.css` and `studioWorkspace` fa/en translations together.
Keep the site's `Header`, UI primitives, language configuration and `tokens.css`.
Preserve the existing runtime API/WS/media origin configuration, proxy routes,
auth origins, CORS/CSRF and resumable `/studio/chat/:sessionId` URLs.
This UI change requires no backend migration and no environment overwrite.

Deploy only isolated OpenAI-Frontend, branch `codex/isolated-development`.
Do not deploy or rewrite original production or backend for this UI release.
