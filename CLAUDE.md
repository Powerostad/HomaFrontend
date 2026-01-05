# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HOMA is an AI-powered furniture visualization platform for Persian (Farsi) RTL users. Users upload photos of their rooms and see how products look in their space. This is the React frontend of a full-stack application.

## Development Commands

```bash
npm run dev          # Start dev server (port 3000, auto-opens browser)
npm run build        # Production build: tsc && vite build
npm run lint         # ESLint with zero-warning policy
npm run type-check   # TypeScript validation only (tsc --noEmit)
npm run clean        # Clear Vite cache and dist
```

## Architecture

### Routing (src/App.tsx)
React Router with page-based navigation under a shared `<Layout>` wrapper:
- `/` - Product landing page
- `/try-on/*` - Simple visualization flow (upload → progress → result)
- `/studio/*` - Complex redesign flow with project management
- `/explore`, `/shop` - Product catalog
- `/store/:slug` - Store pages with `/store/:slug/product/:productId`
- `/account/*` - User gallery and settings
- `/login` - Authentication

### State Management (src/context/)
Split context architecture with backwards-compatible facade:

```
AppProviders (src/context/AppProviders.tsx)
├── SessionProvider  - Session ID, KPI tracking, errors
├── AuthProvider     - User authentication state
├── ProductProvider  - Product selection, variants, catalog
├── UploadProvider   - File upload, visualized image URL
├── StudioProvider   - Studio mode, projects
└── FeedbackProvider - User feedback, pending actions
```

**For new code**, use specific hooks: `useAuth()`, `useProduct()`, `useUpload()`, `useStudio()`, `useFeedback()`, `useSession()`.

**Legacy** `useApp()` is maintained for backwards compatibility but deprecated.

### Path Aliases (vite.config.ts + tsconfig.json)
```
@/          → ./src/
@components → ./src/components/
@pages      → ./src/pages/
@context    → ./src/context/
@utils      → ./src/utils/
@styles     → ./src/styles/
@types      → ./src/types/
@layout     → ./src/layout/
@data       → ./src/data/
```

### Design System (src/styles/)
Tailwind CSS v4 with custom design tokens in `tokens.css`. **Always use semantic tokens**:

| Category | Usage |
|----------|-------|
| Surfaces | `bg-surface-page`, `bg-surface-default`, `bg-surface-elevated` |
| Content | `text-content-primary`, `text-content-secondary`, `text-content-muted` |
| Brand | `bg-brand-primary` (#E31E24), `bg-brand-secondary` (#F5E6D3) |
| Borders | `border-subtle`, `border-default`, `border-strong` |
| Z-Index | `z-modal` (500), `z-toast` (700), `z-loader` (9999) |

**Never use hardcoded values** like `bg-[#F7F7F5]` or `z-[9999]`.

### Component Organization
- `src/components/ui/` - shadcn/ui Radix primitives (Button, Dialog, etc.)
- `src/components/` - Feature components (FileUpload, ProductGallery, Header, Footer)
- `src/components/{account,store,studio,figma}/` - Domain-specific components
- `src/pages/` - Page components organized by feature

## Key Conventions

### Language & RTL
- All UI text in Persian (Farsi)
- Font: Vazirmatn (loaded via CDN)
- HTML `direction: rtl` is set globally in `globals.css`

### Error Messages (Persian Only)
**CRITICAL: All error messages shown to users MUST be in Persian.**

- Never display English error messages in the UI (e.g., "Failed to fetch", "Network Error")
- Use `translateErrorMessage()` from `@/utils/apiClient` to convert browser errors to Persian
- All catch blocks should use Persian fallback messages: `'خطای ناشناخته'` (unknown error)
- Common Persian error patterns:
  - Connection: `'خطا در برقراری ارتباط با سرور'`
  - Timeout: `'زمان درخواست به پایان رسید'`
  - Server: `'خطای داخلی سرور'`
  - Unknown: `'خطای ناشناخته'`

### Animation Library
Uses `motion` (v11.15.0), not `framer-motion`. Same API but lighter bundle.

### Layout Component
`Layout.tsx` wraps all routes. In development mode, it renders debug overlays:
- `AdminDashboard` - Dev-only debugging panel
- `BrandColors` - Design token reference

### Error Boundary
`ErrorBoundary.tsx` wraps the entire app in `App.tsx` for error recovery.

### Vendor Chunking
Build splits into separate chunks: `react-vendor`, `ui-vendor` (motion), `radix-vendor`.
