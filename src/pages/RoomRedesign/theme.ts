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
  warningBg: 'rgba(252,111,32,0.12)', // warning tint (badges)
  danger: '#5D0D02', // feedback-bad
  dangerBg: 'rgba(93,13,2,0.10)', // danger tint (badges)

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
  accentGreenBorder: '#3E946033', // user bubble / rendering-indicator border (20%)
  accentGreenTrack: '#3E946022', // rendering progress-bar track (13%)

  // ── Workspace skin (shared by desktop columns AND mobile sheet) ──────
  // Single source of truth so both surfaces read identical. The "warm
  // editorial / white-mat print" language: warm beige canvas, white-matted
  // image, glass chrome, hairline panels.
  canvas: 'radial-gradient(120% 90% at 50% 0%, #F3EFE7 0%, #ECE7DD 100%)', // hero canvas bg
  canvasSolid: '#ECE7DD', // flat fallback (empty states)
  panel: '#FBFAF7', // assistant / side-panel surface (lighter than card white)
  tabTrackBg: '#EFEBE3', // segmented-tab track / nav dock track
  chipHoverBg: '#F4F1EA', // quick-edit chip hover
  hoverOverlay: 'rgba(28,28,26,0.06)', // icon-button hover wash
  darkOverlay: 'rgba(0,0,0,0.55)', // remove-photo / scrim button bg
  modalCloseBg: 'rgba(255,255,255,0.90)', // modal close button bg

  // Frame / mat (applied to the <img> so pins overhang, never clipped)
  matBorder: '10px solid #FFFFFF',
  matRadius: 18,
  miniMatBorder: '4px solid #FFFFFF', // history thumb mat

  // Glass surface (image toolbar, mobile header buttons, nav dock)
  glassBg: 'rgba(255,255,255,0.85)',
  glassBlur: 'blur(12px)',

  // Shadows
  frameShadow: '0 18px 50px -20px rgba(28,28,26,0.28), 0 2px 8px rgba(28,28,26,0.06)',
  toolbarShadow: '0 8px 24px -12px rgba(28,28,26,0.25)',
  activePillShadow: '0 1px 4px rgba(28,28,26,0.12)', // active tab / nav pill
  thumbShadow: '0 1px 3px rgba(28,28,26,0.10)',
  bubbleShadow: '0 1px 3px rgba(28,28,26,0.05)',
  sheetShadow: '0 -10px 30px rgba(0,0,0,0.12)',
  footerShadow: '0 -6px 16px rgba(0,0,0,0.05)',
  navShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
  pinPillShadow: '0 4px 14px rgba(0,0,0,0.16)',
  pinDotShadow: '0 1px 4px rgba(0,0,0,0.4)',

  // Pins / annotation overlay
  pinConnector: 'rgba(255,255,255,0.9)',
  pinConnectorGlow: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))',
  canvasScrim: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 100%)',

  // Version rail (mobile overlay thumbs)
  versionBadgeInactive: 'rgba(0,0,0,0.45)',

  // Misc
  impactBarEmpty: '#D8DAD3',
  sheetRadius: 28,
} as const;

/**
 * The white-mat "print" frame as a ready style object — applied to the <img>
 * itself (PinnedImage `imageStyle`) so annotation pins, which are siblings of
 * the img, overhang the mat and are never clipped. Shared by the desktop canvas
 * and any matted preview surface.
 */
export const FRAME = {
  borderRadius: RD.matRadius,
  border: RD.matBorder,
  boxShadow: RD.frameShadow,
  backgroundColor: '#FFFFFF',
} as const;
