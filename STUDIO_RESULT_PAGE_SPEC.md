# Studio Result Page — Full Specification for AI Agents

> **Purpose**: This document describes the Studio Result page of the HOMA platform in full detail — architecture, design language, color system, component hierarchy, data flow, and styling conventions — so that an external AI agent can understand and work on this page independently.

---

## 1. Project Context

**HOMA** is an AI-powered furniture visualization platform. Users upload a photo of their room → AI redesigns it with recommended furniture → the **Result Page** shows the redesigned image alongside product recommendations.

- **Language**: Persian (Farsi), RTL layout (`dir="rtl"`)
- **Font**: `Vazirmatn` (loaded via CDN, weights: 300, 400, 500, 700)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Animations**: `motion` library (v11.15.0) — import from `motion/react`, NOT `framer-motion`
- **Icons**: Lucide React
- **Toasts**: Sonner (`toast()`)
- **i18n**: react-i18next with `useTranslation()` hook

---

## 2. File Structure

```
src/pages/Studio/
├── ResultPage.tsx                    ← THIS PAGE (~1175 lines)
├── UploadPage.tsx                    ← Upload step
├── ProgressPage.tsx                  ← Processing step
├── ProjectsDashboard.tsx             ← Projects list
├── ProjectDetailsPage.tsx            ← Project detail
└── components/
    └── ProductDetailSheet.tsx        ← Product modal (~900 lines)
```

**Route**: `/studio/result/:jobId` — the URL param is named `jobId` but maps to `sessionId` internally.

---

## 3. Design Language: "Zara Home Editorial"

The visual style is inspired by high-end fashion editorial layouts (Zara Home). Key characteristics:

### 3.1 Typography Hierarchy

| Element | Size | Weight | Color | Tracking |
|---------|------|--------|-------|----------|
| Page title | `var(--text-h3-size)` | 700 (bold) | `text-foreground` | default |
| Section subtitle | `10px` | 700 | `text-muted-foreground` | `tracking-widest` |
| Category header | `16px` | 700 (bold) | `text-black` | default |
| Product name (top pick) | `13px` | 700 (bold) | `text-black` | `tracking-[0.05em]`, uppercase |
| Product name (alt) | `10px` | 700 (bold) | `text-black` | default |
| Price (top pick) | `18px` | 700 (bold) | `text-black` | `tracking-tighter`, tabular-nums |
| Price (alt) | `11px` | 700 (bold) | `text-black` | `tracking-tighter`, tabular-nums |
| Total price | `26px` | 700 (bold) | `text-black` | `tracking-tighter`, tabular-nums |
| Currency ("تومان") | `9-10px` | 700 | `text-black/40` | `tracking-widest`, uppercase |
| Metadata labels | `10px` | 700 (bold) | `text-black/40` | `tracking-wide` |
| CTA button text | `9-11px` | 700 (bold) | varies | `tracking-[0.2-0.3em]`, uppercase |
| "Curated" label | `10px` | 500 (medium) | `text-black/30` | `tracking-wide`, uppercase |
| Footer credit | `9px` | 500 (medium) | `text-black/20` | `tracking-[0.5em]`, uppercase |

**Font family**: Always set explicitly via `style={{ fontFamily: 'var(--font-family-vazirmatn)' }}` on text elements.

### 3.2 Visual Principles

1. **Minimal borders** — use `border-black/[0.05]` or `border-black/[0.06]` (nearly invisible)
2. **No rounded corners on product cards** — sharp rectangular frames
3. **Grayscale filter on images** — `grayscale-[0.2]` default, removes on hover (`group-hover:grayscale-0`)
4. **Scale on hover** — images scale 5% (`group-hover:scale-105`) with 700-1000ms transition
5. **Glassmorphic overlays** — `bg-black/10 backdrop-blur-xl border border-white/20` for floating UI over images
6. **Dot separators** — small circles (`w-0.5 h-0.5 rounded-full bg-black/20`) between metadata items

---

## 4. Design Token System

All design values come from `src/styles/tokens.css`. **Never use hardcoded colors.**

### 4.1 Color Tokens

```css
/* Brand */
--color-brand-primary: #E31E24;       /* "Homa Red" — accent, badges, saved state */
--color-brand-secondary: #F5E6D3;     /* Cream — secondary backgrounds */

/* Surfaces */
--color-surface-page: #F7F7F5;        /* Page background → Tailwind: bg-surface-page */
--color-surface-default: #FFFFFF;     /* Cards/modals → bg-surface-default or bg-card */
--color-surface-elevated: #FDFDFB;    /* Elevated elements */
--color-surface-muted: #F2F2F7;       /* Disabled backgrounds */
--color-surface-inverse: #080808;     /* Dark backgrounds */

/* Text */
--color-content-primary: #1a1a1a;     /* Main text → text-content-primary */
--color-content-secondary: #6B7280;   /* Secondary → text-content-secondary */
--color-content-muted: #9CA3AF;       /* Placeholder/disabled */
--color-content-inverse: #FFFFFF;     /* On dark backgrounds */
--color-content-brand: #E31E24;       /* Brand-colored text → text-accent */

/* Borders */
--color-border-default: rgba(0,0,0,0.03);  /* Subtle borders */
--color-border-subtle: #E9E9E6;             /* Light borders */
--color-border-strong: rgba(0,0,0,0.1);     /* Visible borders */

/* Interactive */
--color-interactive-primary: #111111;        /* Button backgrounds */
--color-interactive-primary-hover: #0B0B0B;
--color-interactive-destructive: #FF383C;

/* Feedback */
--color-feedback-success: #00312D;
--color-feedback-warning: #FC6F20;
--color-feedback-error: #5D0D02;
```

### 4.2 Effects & Radius

```css
/* Glass effects */
--glass-light: rgba(255,255,255,0.8);
--glass-dark: rgba(0,0,0,0.6);
--blur-sm: 4px;  --blur-md: 12px;  --blur-lg: 24px;  --blur-xl: 40px;

/* Shadows */
--shadow-sm: 0px 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0px 4px 12px rgba(0,0,0,0.10);
--shadow-lg: 0px 8px 24px rgba(0,0,0,0.12);
--shadow-xl: 0px 16px 44px rgba(0,0,0,0.10);

/* Radius */
--radius-sm: 8px;  --radius-md: 12px;  --radius-lg: 16px;
--radius-xl: 20px;  --radius-2xl: 24px;  --radius-3xl: 28px;
--radius-button: 18px;  --radius-button-pill: 100px;  --radius-full: 9999px;
```

### 4.3 Z-Index Hierarchy (as used in ResultPage)

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Desktop sidebar | `z-50` | Right panel with products |
| Mobile card overlay | `z-30` | Scrolling card over image |
| Mobile action buttons | `z-20` | Buttons overlaid on hero |
| Fullscreen modal | `z-[1000]` | Full-bleed image view |
| Loading overlay | `z-[2000]` | Session loading spinner |
| Exit/Download modals | `z-[3000]` | Glassmorphic dialog boxes |

---

## 5. Page Layout Architecture

### 5.1 Desktop Layout (md+ breakpoint)

```
┌─────────────────────────────────────────────────────────┐
│                    FULL SCREEN (h-screen)                │
│  ┌─────────────────────────────┬──────────────────────┐  │
│  │     LEFT PANEL              │   RIGHT PANEL        │  │
│  │     (flex-1)                │   (w-[450px])        │  │
│  │                             │                      │  │
│  │   [Redesigned Room Image]   │  Title: تحلیل هوشمند │  │
│  │   Full-bleed, bg-zinc-900   │                      │  │
│  │                             │  [Product List]      │  │
│  │   Floating action buttons:  │  - Category groups   │  │
│  │   ← Back                    │  - Top picks (170px) │  │
│  │   ♥ Save  ⬇ Download       │  - Alternatives      │  │
│  │   ↗ Share                   │                      │  │
│  │                             │  [Collection Summary] │  │
│  │   [Before/After Toggle]     │  Total price + CTA   │  │
│  │   [View Fullscreen Button]  │                      │  │
│  └─────────────────────────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- Left panel: `flex-1 h-full bg-zinc-900 relative overflow-hidden`
- Right panel: `w-[450px] h-full bg-card z-50 overflow-y-auto border-l border-border scrollbar-hide`

### 5.2 Mobile Layout (< md breakpoint)

```
┌───────────────────────┐
│ [Header]              │
│ [ContextBar]          │
├───────────────────────┤
│                       │
│ [Hero Image: 65vh]    │
│  Floating buttons     │
│  over image           │
│                       │
├───────────────────────┤  ← -mt-8 overlap with rounded-t-[32px]
│ [Scrolling Card]      │
│  bg-card              │
│  rounded-t-[32px]     │
│  shadow-[0_-12px_     │
│    40px_rgba...]      │
│                       │
│  [Product List]       │
│  [Collection Summary] │
│  [CTA Button]         │
│                       │
└───────────────────────┘
```

---

## 6. Component Hierarchy

```
StudioResultPage
├── Header (mobile only)
├── ContextBar (mobile only, shows breadcrumb + total price)
│
├── Desktop Layout (hidden md:flex)
│   ├── Right Panel (sidebar)
│   │   ├── Title section ("Studio Result" / "تحلیل هوشمند فضا")
│   │   └── InsightContent (isDesktop=true)
│   │       ├── CategoryGroup[] (product grid)
│   │       ├── InlineFeedbackWidget
│   │       └── Collection Summary + Finalize CTA
│   └── Left Panel (hero image)
│       ├── AuthenticatedImage (result)
│       ├── AuthenticatedImage (original, toggled)
│       └── Floating Actions (back, save, download, share, before/after, fullscreen)
│
├── Mobile Layout (md:hidden)
│   ├── Hero Image (65vh)
│   │   ├── AuthenticatedImage (result)
│   │   ├── Original image (toggled)
│   │   └── Action overlay (back, save, download, fullscreen)
│   └── Scrolling Card (-mt-8 overlap)
│       └── InsightContent (isDesktop=false)
│
├── Fullscreen Overlay (AnimatePresence, z-[1000])
│   ├── Drag-to-dismiss container
│   ├── Before/After images
│   ├── Top action bar (close, download, bookmark)
│   └── Bottom toggle (before/after)
│
├── ProductDetailSheet (modal, opened on product click)
├── Exit Decision Modal (z-[3000])
├── Download Ready Modal (z-[3000])
├── Loading Overlay (z-[2000])
└── AuthModal (login required)
```

---

## 7. Data Model

### 7.1 Session Data (from API)

```typescript
interface RedesignSession {
  id: string;                          // UUID
  status: 'pending' | 'analyzing' | 'generating' | 'matching' | 'ready' | 'failed';
  roomImageUrl: string | null;         // Original uploaded room photo
  redesignedImageUrl: string | null;   // AI-generated result image
  items: SessionItem[];                // Detected room elements
}

interface SessionItem {
  id: number;
  type: string;                       // 'rug', 'sofa', 'lamp', etc.
  category: string;                   // Internal category key
  categoryDisplay: string;            // Persian display: 'فرش و قالی'
  fitReasoningFa: string;            // AI reasoning in Persian
  recommendedSize: string;            // e.g., '2x3 متر'
  quantity: number;                   // How many needed
  placement: string;                  // Where in room: 'وسط اتاق'
  matchedProducts: MatchedProduct[];  // AI-matched products
}

interface MatchedProduct {
  id: number;
  name: string;
  imageUrl: string;
  matchScore: number;
  price: number;                      // In RIAL (divide by 10 for Toman)
  category?: string;
  categoryDisplay?: string;
  shopName?: string;
  persianReason?: string;             // AI reasoning in Persian
  matchHighlights?: string[];         // Match tags
  description?: string;
  link?: string;                      // External product URL
  uniqueLink?: string;               // Homa internal product ID
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: SizePriceInfo[];
  priceRange?: { min: number; max: number } | null;
  isPromoted?: boolean;
}
```

### 7.2 UI Data Structures

```typescript
// Products grouped by detected room element category
interface CategoryGroup {
  category: string;
  categoryDisplay: string;         // Persian name shown in UI
  itemId: number;
  fitReasoningFa: string;         // AI reasoning
  recommendedSize: string;
  quantity: number;
  placement: string;
  products: Product[];             // [0] = top pick, [1..n] = alternatives
}

// UI Product (transformed from MatchedProduct)
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  store?: string;
  hotspot?: { x: number; y: number };
  persianReason?: string;
  matchHighlights?: string[];
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  uniqueLink?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
  matchScore?: number;
  isPromoted?: boolean;
}
```

---

## 8. State Management

### 8.1 Context Hooks Used

```typescript
const { selectedFile } = useApp();                         // Global: uploaded file (File object)
const { isLoggedIn, isInitialized, login } = useAuth();    // Auth state
const { activeSession, activeSessionId, loadSession, clearActiveSession } = useStudio();  // Studio session
const { t } = useTranslation();                             // i18n
```

### 8.2 Local State (18 useState hooks)

| State | Type | Purpose |
|-------|------|---------|
| `originalImage` | `string \| null` | Original room image (data URL or API URL) |
| `showOriginal` | `boolean` | Toggle before/after view |
| `isSaved` | `boolean` | Bookmark/save state |
| `selectedProduct` | `Product \| null` | Opens ProductDetailSheet when set |
| `isFullScreen` | `boolean` | Fullscreen overlay visibility |
| `isAuthModalOpen` | `boolean` | Login modal visibility |
| `showExitDecision` | `boolean` | Exit confirmation dialog |
| `isLoading` | `boolean` | Session data loading |
| `topPickUrls` | `Record<string, string>` | Pre-fetched tracking URLs |
| `preparedDownloadData` | `PreparedDownload \| null` | Download blob data |
| `showDownloadReady` | `boolean` | Download confirmation dialog |
| `isDownloading` | `boolean` | Download in progress |

### 8.3 Computed/Memoized Values

```typescript
// Result image URL (API or fallback)
const resultImage = useMemo(() => activeSession?.redesignedImageUrl || FALLBACK, [activeSession]);

// Products grouped by category
const categoryGroups = useMemo<CategoryGroup[]>(() => {
  return activeSession.items.filter(hasProducts).map(itemToCategoryGroup);
}, [activeSession]);

// Flat product list
const displayProducts = useMemo(() => categoryGroups.flatMap(g => g.products), [categoryGroups]);

// Total = sum of first product (top pick) price per category
const totalPrice = categoryGroups.reduce((acc, g) => acc + (g.products[0]?.price || 0), 0);

// Alternatives = same-category products excluding the selected one
const productAlternatives = useMemo(() => findAlternatives(selectedProduct, categoryGroups), [...]);
```

---

## 9. Key Behaviors

### 9.1 Auth Flow
1. Wait for `isInitialized` (auth check from localStorage)
2. If not logged in → show `AuthModal`
3. On success → `login(user, tokens)` → close modal → load session
4. If dismissed without login → navigate to `/studio/upload`

### 9.2 Session Loading
1. Extract `jobId` from URL params (renamed to `sessionId`)
2. If `activeSession` is missing or different → call `loadSession(sessionId)`
3. Show loading overlay during fetch
4. On error → show Persian toast error

### 9.3 Before/After Toggle
- Two overlapping images with opacity transitions (700ms)
- Result image: `opacity-100` when `!showOriginal`
- Original image: `opacity-100` when `showOriginal`
- Desktop: blur + scale effect on hidden image
- Mobile: simple opacity switch (500ms)

### 9.4 Product Click Flow
1. Click product card → `handleProductClick(product)`
2. Enriches product with category-level `fitReasoningFa`
3. Sets `selectedProduct` → opens `ProductDetailSheet`
4. Tracks analytics event

### 9.5 Finalize List ("نهایی‌سازی لیست")
- Opens all top-pick product pages in new tabs
- Uses pre-fetched tracking URLs (from `/tracking/clicks/` API)
- Falls back to `product.link` if tracking URL unavailable

### 9.6 Two-Phase Download (Chrome compatibility)
- **Phase 1**: `prepareDownload()` — async, converts image to blob
- **Phase 2**: User clicks "ذخیره تصویر" in modal → `triggerDownload()` or `triggerShare()`
- Mobile prioritizes native share API, falls back to download

### 9.7 Fullscreen Mode
- Full-bleed image in `z-[1000]` overlay
- Background: `bg-[#121212]`
- Drag-to-dismiss: vertical drag > 100px closes
- Has its own before/after toggle
- Gradient overlay: `from-black/40 via-transparent to-black/60`

---

## 10. Product Display Pattern

### 10.1 Category Group Layout

For each detected room element:

```
[Category Header] ─── (horizontal line)
[Metadata: quantity • size • placement]

┌──────────────────────────────────────────────┐
│ ┌─────────┐  Product Name                    │
│ │         │  Category • Store                 │
│ │  170px  │                                   │
│ │  3:4    │  ۱,۵۰۰,۰۰۰ تومان               │
│ │ aspect  │                                   │
│ │         │  [جزییات محصول] ← CTA button      │
│ └─────────┘                                   │
│  "انتخاب هُما" badge (top-right of image)     │
└──────────────────────────────────────────────┘

┌──────┐ ┌──────┐ ┌──────┐  ← Alternatives (100px wide, 3:4 aspect)
│      │ │      │ │      │
│      │ │      │ │      │
└──────┘ └──────┘ └──────┘
  Name     Name     Name
  Price    Price    Price
```

### 10.2 "انتخاب هُما" (Homa Pick) Badge
```html
<div class="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 flex items-center gap-1.5">
  <div class="w-1 h-1 rounded-full bg-accent" />  <!-- Red dot -->
  <span class="text-[7px] font-bold text-black uppercase tracking-[0.2em]">
    انتخاب هُما
  </span>
</div>
```

### 10.3 Collection Summary
At the bottom of product list:
- Left: "Collection Summary" label + product count
- Right: Total price in large bold
- Full-width black CTA button: "نهایی‌سازی لیست"
- Footer: "Studio Homa • Editorial Selection"

---

## 11. ProductDetailSheet Component

A modal/sheet that opens when any product is clicked.

### 11.1 Props
```typescript
interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (originalId: string, newProduct: Product) => void;
  alternatives?: Product[];
  redesignSessionId?: string;
}
```

### 11.2 Three Tabs
1. **مشخصات** (Details): Image, name, price, specs, sizes, description, service badges
2. **چرا این؟** (Why This?): AI reasoning (`persianReason`), match highlights as tags
3. **جایگزین‌ها** (Alternatives): Horizontal scrollable alternatives with labels

### 11.3 Sticky Footer
```
┌─────────────────────────────────────────┐
│  Price display          [Buy] [Details] │
└─────────────────────────────────────────┘
```

### 11.4 Glassmorphic Styling
```css
background-color: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.4);
```

---

## 12. Floating Action Buttons

All floating buttons use this glassmorphic style:

### Desktop (over image)
```
w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl
border border-white/20 text-white
hover:bg-black/20 transition-all active:scale-90
```

### Mobile (over hero)
```
w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl
border border-white/10 text-white active:scale-90
```

### Saved/Active State
```
bg-white border-white text-accent  (text-accent = #E31E24)
```

---

## 13. Modal/Dialog Styling

All modals (exit, download) share this pattern:

**Backdrop**: `bg-black/10 backdrop-blur-md`

**Card**:
```
bg-white/40 backdrop-blur-2xl
border border-white/20
rounded-[32px]
p-8
max-w-[340px]
shadow-[0_24px_80px_rgba(0,0,0,0.15)]
```

**Primary button**: `bg-black text-white rounded-full h-[56px] font-bold text-[14px]`
**Secondary button**: `bg-white/20 text-black border border-white/20 rounded-full h-[56px]`

---

## 14. Important Utilities

### Price Formatting
```typescript
import { formatPriceFromRial, formatPriceStartingFrom, toLocalizedDigits } from '@/utils/formatters';

formatPriceFromRial(15000000)         // '۱,۵۰۰,۰۰۰ تومان'
formatPriceFromRial(15000000, false)  // '۱,۵۰۰,۰۰۰' (no suffix)
formatPriceStartingFrom(5000000)      // 'از ۵۰۰,۰۰۰ تومان'
toLocalizedDigits(3)                  // '۳'
```

**CRITICAL**: Backend stores prices in **Rial**. Display in **Toman** (÷ 10). Always use `formatPriceFromRial()`.

### Image Component
```typescript
<AuthenticatedImage
  src={imageUrl}         // Relative path or full URL
  alt="description"
  imageWidth={400}       // Optimization width
  imageQuality={80}      // JPEG quality
  className="..."
/>
```
This component handles authenticated image serving from the internal CDN.

### Download Utilities
```typescript
import { prepareDownload, triggerDownload, triggerShare, getDownloadErrorMessage } from '@/utils/downloadUtils';
```

---

## 15. Analytics Events

```typescript
import {
  trackStudioResultViewed,    // { session_id, product_count, category_count }
  trackStudioResultAction,    // { action: 'download'|'save'|'before_after'|'fullscreen', session_id }
  trackStudioProductClicked,  // { session_id, product_id, product_name, category, is_top_pick }
} from '@/analytics/events';
```

---

## 16. Path Aliases

```
@/          → ./src/
@components → ./src/components/
@pages      → ./src/pages/
@context    → ./src/context/
@utils      → ./src/utils/
@styles     → ./src/styles/
@types      → ./src/types/
@layout     → ./src/layout/
```

---

## 17. Before/After Toggle Styling

### Desktop (floating at bottom of image)
```
Container: p-1 bg-black/25 backdrop-blur-3xl rounded-full border border-white/5 shadow-xl
Active tab: bg-white/95 text-black, rounded-full, px-5 py-1.5, text-[12px] font-medium
Inactive tab: text-white/40 hover:text-white
Transition: duration-500
```

### Fullscreen
```
Container: p-1 bg-black/30 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl
Active tab: bg-white text-black, rounded-full, px-8 h-10, text-[12px] font-bold
Inactive tab: text-white/40 hover:text-white
```

---

## 18. Dark Mode Support

Tokens automatically adjust in `.dark` class:
```css
.dark {
  --color-surface-page: #1C1C1E;
  --color-surface-default: #2C2C2E;
  --color-content-primary: #FFFFFF;
  --color-border-default: rgba(255,255,255,0.1);
}
```

Modal cards switch to: `dark:bg-black/40 dark:border-white/10`

---

## 19. Key Persian Text Strings

| Key | Persian | English equivalent |
|-----|---------|-------------------|
| Title | تحلیل هوشمند فضا | Smart Space Analysis |
| Section header | محصولات پیشنهادی | Suggested Products |
| "Curated" | Curated | (English in UI) |
| Top pick badge | انتخاب هُما | Homa Pick |
| CTA button | جزییات محصول | Product Details |
| Before | قبل | Before |
| After | بعد | After |
| Fullscreen | مشاهده تمام صفحه | View Fullscreen |
| Finalize | نهایی‌سازی لیست | Finalize List |
| Currency | تومان | Toman |
| Save & Exit | ذخیره و خروج | Save & Exit |
| Confirm | تایید و بازگشت | Confirm & Return |
| Cancel | انصراف | Cancel |
| Loading | در حال بارگذاری... | Loading... |
| Download ready | تصویر آماده است | Image is Ready |
| Save image | ذخیره تصویر | Save Image |
| Quantity | {{amount}} عدد | X items |
| Size | سایز: {{size}} | Size: X |
| Placement | جایگاه: {{placement}} | Placement: X |
| Products in list | {{count}} محصول در لیست نهایی | X products in final list |
| Footer | Studio Homa • Editorial Selection | (English in UI) |

---

## 20. Quick Reference: Color Usage Map

| UI Element | Tailwind Class | Actual Color |
|------------|---------------|--------------|
| Page background | `bg-background` | `#F7F7F5` |
| Cards/sidebar | `bg-card` | `#FFFFFF` |
| Image background | `bg-zinc-900` | `#18181b` |
| Fullscreen bg | `bg-[#121212]` | `#121212` |
| Brand accent | `text-accent` / `bg-accent` | `#E31E24` |
| Primary text | `text-black` | `#000000` |
| Secondary text | `text-black/40` | `rgba(0,0,0,0.4)` |
| Muted text | `text-black/30` | `rgba(0,0,0,0.3)` |
| Very muted | `text-black/20` | `rgba(0,0,0,0.2)` |
| Borders (subtle) | `border-black/[0.05]` | `rgba(0,0,0,0.05)` |
| Borders (light) | `border-black/[0.06]` | `rgba(0,0,0,0.06)` |
| Glass overlay | `bg-black/10 backdrop-blur-xl` | Semi-transparent |
| Button (primary) | `bg-black text-white` | `#000 / #FFF` |
| Button (ghost) | `border border-black/10 text-black` | Transparent |
| Product frame bg | `bg-black/[0.02]` | Nearly transparent |
| Mobile card shadow | `shadow-[0_-12px_40px_rgba(0,0,0,0.08)]` | Subtle upward |
