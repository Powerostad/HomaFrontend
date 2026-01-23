# Google Lens Search Feature - Design Document

**Date:** 2026-01-23
**Status:** Approved
**Feature:** Allow users to search for products in AI-generated images via Google Lens

---

## Overview

Users viewing AI-generated room redesigns in Studio can draw a box around any item and search for similar products to buy using Google Lens.

## User Flow

```
1. User views AI-generated room redesign on Result page
           ↓
2. Clicks "🔍 جستجو" button (next to Save/Share icons)
           ↓
3. Image enters "Selection Mode" - overlay appears with instructions
           ↓
4. User draws rectangle around the item they want to find
           ↓
5. Selection confirmed → "در حال آماده‌سازی..." loading state
           ↓
6. Frontend crops image using Canvas API
           ↓
7. Cropped blob sent to backend proxy endpoint
           ↓
8. Backend uploads to MinIO → returns presigned public URL (10 min expiry)
           ↓
9. Frontend opens new tab: lens.google.com/uploadbyurl?url=PRESIGNED_URL
           ↓
10. User sees Google Lens results with similar products to buy
```

## Frontend Design

### Selection Mode UI

When user clicks the search button, the image transforms:

```
┌─────────────────────────────────────────────┐
│  ╭─────────────────────────────────────╮    │
│  │     ← لغو          جستجو در گوگل    │    │  ← Top bar with cancel + title
│  ╰─────────────────────────────────────╯    │
│                                             │
│         ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐                │
│         │   User draws    │                 │  ← Draggable selection box
│         │   rectangle     │                 │     (dashed border, semi-transparent fill)
│         └─ ─ ─ ─ ─ ─ ─ ─ ─┘                │
│                                             │
│  ╭─────────────────────────────────────╮    │
│  │  📍 یک کادر دور محصول موردنظر بکشید │    │  ← Instruction toast (bottom)
│  ╰─────────────────────────────────────╯    │
└─────────────────────────────────────────────┘
```

### Visual States

| State | Appearance |
|-------|------------|
| **Selection mode active** | Dark overlay (50% opacity) covers image, instruction appears |
| **Drawing in progress** | Dashed rectangle follows finger/cursor, selection area stays clear |
| **Selection complete** | Solid border on selection, "تأیید و جستجو" button appears |
| **Uploading** | Selection box pulses, spinner in button, "در حال آماده‌سازی..." text |

### Interaction Details

- Touch/click + drag to draw rectangle
- Minimum size enforced (50×50px) to avoid tiny useless crops
- Can redraw by starting a new rectangle (replaces previous)
- Cancel button exits mode without action

### Cropping Logic

```typescript
// Coordinate mapping for CSS-scaled images
Display size: 600×400px (what user sees)
Natural size: 1200×800px (actual image)
Scale factor: 2x

User draws: x=100, y=50, w=200, h=150 (on display)
Actual crop: x=200, y=100, w=400, h=300 (on natural image)
```

### New Frontend Files

| File | Purpose |
|------|---------|
| `components/studio/ImageSearchMode.tsx` | Selection overlay component |
| `utils/imageCrop.ts` | Canvas cropping helper |
| `hooks/useImageSelection.ts` | Selection state & drawing logic |

## Backend Design

### New Endpoint

```
POST /api/v1/utils/temp-image/
Content-Type: multipart/form-data

Request: image file (JPEG/PNG, max 2MB)
Response: { "success": true, "data": { "url": "https://..." } }
```

### Implementation

```python
# apps/core/views/temp_image.py

class TempImageUploadView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return self.error_response(message='تصویر الزامی است')

        # Validate size (max 2MB) and type
        if image.size > 2 * 1024 * 1024:
            return self.error_response(message='حجم تصویر بیش از حد مجاز است')

        # Upload to MinIO temp bucket with 10-min expiry
        filename = f"lens-search/{uuid4()}.jpg"
        url = storage_service.upload_temp_public(image, filename, expires_in=600)

        return self.success_response(data={'url': url})
```

### MinIO Configuration

- Bucket/prefix: `temp/lens-search/`
- Lifecycle rule: Auto-delete objects older than 15 minutes
- Objects uploaded with public-read ACL or presigned URLs

### Rate Limiting

- 10 requests per hour per user (prevents abuse)
- Uses existing Django rate limiting

## Error Handling

| Error | User Message (Persian) | Action |
|-------|------------------------|--------|
| Selection too small | "لطفاً ناحیه بزرگ‌تری انتخاب کنید" | Keep selection mode open |
| Upload fails (network) | "خطا در آپلود تصویر. دوباره تلاش کنید" | Show retry button |
| Upload fails (server) | "سرور موقتاً در دسترس نیست" | Exit mode, show toast |
| Rate limit exceeded | "تعداد درخواست‌ها بیش از حد مجاز. کمی صبر کنید" | Exit mode, show toast |
| Image crop fails | "خطا در پردازش تصویر" | Exit mode, show toast |

### Edge Cases

- **Popup blocked:** Show message "لطفاً پاپ‌آپ را مجاز کنید" with Lens URL as clickable link
- **User on mobile:** Same flow - Lens opens in mobile browser
- **Image not loaded:** Disable search button until AuthenticatedImage loads

## Integration Point

`StudioResultPage.tsx` - Add search button to top actions, render `ImageSearchMode` when active.

## Estimated Scope

- Frontend: ~250-300 lines across 3-4 files
- Backend: ~40 lines (view + URL routing)
- MinIO config: Lifecycle rule (one-time setup)

## Technical Notes

### Why Backend Proxy is Required

Google Lens `uploadbyurl` requires a publicly accessible HTTP URL:
- Browser blob URLs (`blob:http://...`) won't work - they're local
- Data URLs (`data:image/png;base64,...`) are too large and often blocked
- The backend proxy provides a clean, temporary public URL

### Button Placement

- **Desktop:** Top-right area with Save (heart) and Share icons
- **Mobile:** Top overlay with Back, Heart, and Download icons
