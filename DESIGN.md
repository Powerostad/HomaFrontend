# HOMA

## Mission
Create implementation-ready, token-driven UI guidance for HOMA that is optimized for consistency, accessibility, and fast delivery across content site.

## Brand
- Product/brand: HOMA
- URL: https://myhoma.ir/
- Audience: readers and knowledge seekers
- Product surface: content site

## Style Foundations
- Visual style: structured, tokenized, content-first
- Main font style: `font.family.primary=Vazirmatn`, `font.family.stack=Vazirmatn, Vazirmatn, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=10px`, `font.size.sm=11px`, `font.size.md=12px`, `font.size.lg=13px`, `font.size.xl=16px`, `font.size.2xl=18px`, `font.size.3xl=20px`, `font.size.4xl=42px`
- Color palette: `color.text.primary=#1a1a1a`, `color.text.secondary=#6b7280`, `color.text.tertiary=oklab(0.217785 0.00000996143 0.00000435114 / 0.8)`, `color.text.inverse=oklab(0 0 0 / 0.4)`, `color.surface.base=#000000`, `color.surface.muted=#ffffff`, `color.surface.raised=#f7f7f5`, `color.surface.strong=oklab(0.975576 -0.000703991 0.00255448 / 0.9)`, `color.border.default=#e9e9e6`, `color.focus.ring=oklab(0.632035 -0.0553006 -0.194042 / 0.5)`
- Spacing scale: `space.1=4px`, `space.2=8px`, `space.3=12px`, `space.4=24px`, `space.5=32px`, `space.6=40px`, `space.7=48px`, `space.8=64px`
- Radius/shadow/motion tokens: `radius.xs=2px` | `motion.duration.instant=150ms`, `motion.duration.fast=200ms`, `motion.duration.normal=500ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (8), buttons (6), lists (3), navigation (1).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
