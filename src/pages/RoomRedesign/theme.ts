/**
 * Scoped palette for the conversational Room Redesign flow.
 *
 * Editorial monochrome identity matching the Studio flow (cream + charcoal +
 * taupe, hairline borders, sharp surfaces). Keys are retained from the earlier
 * green identity so component edits stay minimal; values are repointed to the
 * shared editorial tokens. Applied via inline `style` props (Studio idiom).
 */
export const RD = {
  // Primary / "accent" (now charcoal — Studio has no chromatic accent)
  green: '#1C1C1A', // primary CTA bg / wordmark / charcoal
  greenDeep: '#000000', // pressed / darkest, rank-badge square
  greenMid: '#1C1C1A', // badges / accents → charcoal
  greenSoft: '#00312D', // success / "good" → feedback-good
  greenTintBg: 'rgba(118,118,128,0.12)', // selected-chip / tint → muted
  greenTintBorder: '#EAE8E3', // → editorial hairline
  greenText: '#1C1C1A', // text-on-light → charcoal

  // Status
  warning: '#FC6F20', // feedback-neutral
  danger: '#5D0D02', // feedback-bad

  // Surfaces
  cream: '#FAF9F6', // app/stone background
  sheet: '#FFFFFF', // bottom-sheet surface (white-on-stone)
  card: '#FFFFFF',

  // Ink / text
  ink: '#1C1C1A', // primary text → editorial-charcoal
  inkSoft: '#8C8A84', // secondary → editorial-taupe
  inkMuted: '#6B6965', // tiniest labels (timestamps/captions) — darker for AA contrast
  line: '#EAE8E3', // hairline borders → editorial-hairline
  lineSoft: '#EAE8E3',

  // Accents
  neutralPin: '#9A8C74', // neutral pin dot → editorial-accent
  handle: '#EAE8E3', // sheet drag-handle pill

  // Desktop positive accent (active tab underline, good-status, user bubble,
  // active version thumb, send) — medium green per the desktop design.
  accentGreen: '#3E9460',
  accentGreenBg: '#EAF4EE',
} as const;
