# Repository Guidelines

## Project Structure & Module Organization

This is a React 18, TypeScript, Vite, and Tailwind CSS v4 frontend. Application
code lives in `src/`: route-level screens are under `src/pages/`, shared feature
components under `src/components/`, and reusable Radix/shadcn primitives under
`src/components/ui/`. Keep state in the focused providers and hooks in
`src/context/`; API and realtime clients belong in `src/services/`. Shared
utilities, types, translations, and design tokens live in `src/utils/`,
`src/types/`, `src/i18n/`, and `src/styles/`. Static assets are in `public/`;
build-time scripts are in `scripts/`. Co-locate tests with their source as
`*.test.ts` or `*.test.tsx`.

## Build, Test, and Development Commands

- `npm ci` installs the locked dependency set.
- `npm run dev` starts Vite on port 3000 and opens the app.
- `npm run type-check` runs strict TypeScript validation without emitting files.
- `npm run lint` runs ESLint with a zero-warning gate.
- `npm test` runs the Vitest suite once.
- `npm run build` regenerates the sitemap, type-checks, and creates `dist/`.
- `npm run preview` serves the production build locally.

## Coding Style & Naming Conventions

Follow nearby code and use two-space indentation for new TypeScript and TSX.
Components and files use `PascalCase`; hooks use `useCamelCase`; utilities and
variables use `camelCase`. Prefer configured aliases such as `@/`, `@components`,
and `@utils` over deep relative imports. Keep components focused and reuse
existing UI primitives before adding variants or dependencies. User-facing copy
must use the translation system; Persian is the default. For UI work, read and
follow `DESIGN.md`; use semantic tokens instead of raw colors or z-index values.

## Testing Guidelines

Vitest is the test runner; add `// @vitest-environment jsdom` when DOM APIs are
required. Test externally visible behavior and edge cases, especially parsers,
formatters, state transitions, and error recovery. Add a focused regression test
for non-trivial bug fixes. No coverage threshold is configured, so prioritize
meaningful checks over broad snapshots.

## Commit & Pull Request Guidelines

History generally follows Conventional Commit subjects such as
`feat(redesign): ...`, `fix(basket): ...`, and `docs: ...`. Use an imperative,
concise subject with a scope when useful. Pull requests should explain the user
impact, link the issue or backend contract, list verification commands, and
include before/after screenshots for visual changes. Call out configuration,
API, localization, or migration implications explicitly.
