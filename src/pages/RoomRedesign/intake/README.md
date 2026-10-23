# Studio entry and progressive onboarding

`/` presents the editorial landing and four room entry points. `/studio` opens
the home/host choice. `/studio/hosts` starts the host journey; it is suitable for
Jabama hosts and other short-stay accommodation, without implying a partnership.
`?audience=home&room=bedroom` can preselect a supported room and open photo input.

The sequence is purpose → room → photo → priorities → visual mood → constraints
→ editable review. Optional questions permit an undecided/designer choice.
Only the final start action hands off to design. Sign-in is deferred to that
action; cancellation preserves the mounted draft. Photos stay in component
memory until handoff, not localStorage. Reloading or leaving clears this draft.

`buildOnboardingPayload` uses the existing `prefs_update` fields. It keeps the
user's note unchanged; selected labels become explicit preferences, never a
fabricated chat message. Budget distinguishes undecided (`null`), no purchases
(`0`) and a positive toman ceiling. Room/style are not invented when undecided.
No changes to design prompts, model routing or product retrieval are required.

`StudioStartPage` also owns `/studio/chat/:sessionId` so URL canonicalization
does not remount the running chat or abort the first command. Existing-session
access remains authenticated. Regression tests cover home and host handoff,
cancelled sign-in, and modal success followed immediately by close.

`public/images/studio/style-atlas.png` is an AI-generated inspiration contact
sheet, not catalogue photography or a promised output. Its four rows are
bedroom, living room, kitchen and balcony. Columns are quiet contemporary,
natural warmth, soft classic and warm urban. `StylePhoto` reuses the same
asset for 16 visual examples. UI explicitly labels these as taste references;
they are not sent to the design model or image renderer as product references.

Run `npx vitest run src/pages/RoomRedesign/intake src/seo/PublicPage.test.tsx`,
`npm run type-check`, and the production Vite build. UI uses existing semantic
tokens, keyboard focus, step progress, reduced-motion support, responsive layouts,
and Persian/English copy. No live paid model calls are necessary for these checks.
