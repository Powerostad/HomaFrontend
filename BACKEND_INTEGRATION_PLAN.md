# Backend Integration Plan - HOMA Frontend

## Overview

This document outlines a phased approach to connect the HOMA frontend to the Django backend API. Login and logout are already implemented. This plan covers all remaining features.

**Current Status:**
- ✅ Authentication (OTP login/logout) - COMPLETE
- ⏳ Everything else - PENDING

**API Base URL:** `http://localhost:8000/api`

---

## Phase 1: User Profile & Gallery (Foundation)

**Priority:** HIGH
**Estimated Effort:** 1-2 days
**Dependencies:** Authentication (already complete)

### 1.1 User Profile

**Files to Modify:**
- `src/services/authService.ts` - Already has profile methods
- `src/context/AuthContext.tsx` - Update profile state management
- Create `src/pages/Account/ProfilePage.tsx` (if needed)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/profile/` | Fetch user profile |
| PUT | `/users/profile/` | Update user name |

**Implementation Steps:**

1. **Verify existing profile methods work:**
   ```typescript
   // Already in authService.ts
   getProfile(): Promise<UserProfile>
   updateProfile(data: { name: string }): Promise<UserProfile>
   ```

2. **Add profile fetch on login:**
   - After successful OTP verification, fetch full profile
   - Store in AuthContext user state

3. **Create profile edit UI** (if not exists):
   - Display phone number (read-only)
   - Editable name field
   - Save button triggers `updateProfile()`

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone_number": "+989123456789",
    "name": "کاربر",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 1.2 User Gallery

**Files to Modify:**
- Create `src/services/galleryService.ts`
- `src/pages/Account/GalleryPage.tsx` - Replace mock data
- `src/context/` - Consider adding GalleryContext or use React Query

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/gallery/` | Fetch all user visualizations |

**Implementation Steps:**

1. **Create Gallery Service:**
   ```typescript
   // src/services/galleryService.ts
   import { apiGet } from '@/utils/apiClient';

   export interface GalleryItem {
     id: number;
     product_id: number;
     product_name: string;
     product_category: string;
     customer_image_path: string;
     result_image_path: string;
     score: 1 | 2 | 3 | null; // 1=Good, 2=Neutral, 3=Bad
     created_at: string;
     claimed_at: string | null;
   }

   export async function fetchGallery(): Promise<GalleryItem[]> {
     const response = await apiGet<{ data: GalleryItem[] }>('/users/gallery/');
     return response.data;
   }
   ```

2. **Update GalleryPage.tsx:**
   - Replace `MOCK_GALLERY` with API call
   - Add loading skeleton
   - Add empty state
   - Add error handling with retry

3. **Image URL Construction:**
   ```typescript
   // Use the image serving endpoint
   const getImageUrl = (path: string, width?: number) => {
     const base = `${API_BASE_URL}/products/images/${path}`;
     return width ? `${base}?w=${width}` : base;
   };
   ```

**UI States to Handle:**
- Loading: Show skeleton cards
- Empty: "هنوز تصویری ذخیره نشده" with CTA to try-on
- Error: "خطا در دریافت گالری" with retry button

---

## Phase 2: Product Catalog & Stores

**Priority:** HIGH
**Estimated Effort:** 2-3 days
**Dependencies:** None (public endpoints)

### 2.1 Shop/Store List

**Files to Modify:**
- Create `src/services/shopService.ts`
- `src/pages/Explore/index.tsx` - Replace mock stores
- Create `src/pages/Store/StorePage.tsx` (if needed)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/shops/list/` | List all active shops |

**Query Parameters:**
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)
- `search` - Search by shop name

**Implementation Steps:**

1. **Create Shop Service:**
   ```typescript
   // src/services/shopService.ts
   import { apiGet } from '@/utils/apiClient';

   export interface Shop {
     id: number;
     shop_name: string;
     username: string;
     logo_url: string | null;
     product_count: number;
     created_at: string;
   }

   export interface ShopListResponse {
     count: number;
     next: string | null;
     previous: string | null;
     results: Shop[];
   }

   export async function fetchShops(params?: {
     page?: number;
     page_size?: number;
     search?: string;
   }): Promise<ShopListResponse> {
     const queryParams = new URLSearchParams();
     if (params?.page) queryParams.set('page', String(params.page));
     if (params?.page_size) queryParams.set('page_size', String(params.page_size));
     if (params?.search) queryParams.set('search', params.search);

     const url = `/shops/list/${queryParams.toString() ? '?' + queryParams : ''}`;
     const response = await apiGet<{ data: ShopListResponse }>(url);
     return response.data;
   }
   ```

2. **Update ExplorePage:**
   - Fetch shops on mount
   - Implement search with debounce
   - Add infinite scroll or pagination
   - Replace `MOCK_STORES` completely

---

### 2.2 Product List (Public)

**Files to Modify:**
- Create `src/services/productService.ts`
- Update product listing pages
- `src/pages/Store/StorePage.tsx`

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/products/` | List all products with filters |
| GET | `/products/{unique_link}/` | Get single product details |

**Query Parameters for `/products/`:**
- `page`, `page_size` - Pagination
- `search` - Search in name/description
- `category` - Filter by category
- `price_min`, `price_max` - Price range (Rials)
- `shop` - Filter by shop name
- `sort` - `newest`, `oldest`, `price_asc`, `price_desc`

**Implementation Steps:**

1. **Create Product Service:**
   ```typescript
   // src/services/productService.ts
   import { apiGet } from '@/utils/apiClient';

   export interface Product {
     id: number;
     name: string;
     description: string;
     category: string;
     price: number;
     image_path: string;
     unique_link: string;
     link: string | null;
     extra_details: Record<string, string>;
     created_at?: string;
   }

   export interface ProductListResponse {
     count: number;
     next: string | null;
     previous: string | null;
     results: Product[];
   }

   export async function fetchProducts(params?: {
     page?: number;
     page_size?: number;
     search?: string;
     category?: string;
     shop?: string;
     price_min?: number;
     price_max?: number;
     sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
   }): Promise<ProductListResponse> {
     // Build query string...
     const response = await apiGet<{ data: ProductListResponse }>(`/products/?${query}`);
     return response.data;
   }

   export async function fetchProduct(uniqueLink: string): Promise<Product> {
     const response = await apiGet<{ data: Product }>(`/products/${uniqueLink}/`);
     return response.data;
   }
   ```

2. **Update ProductContext:**
   - Load product from API when navigating to product page
   - Cache loaded products to avoid refetching

3. **Product Image URLs:**
   ```typescript
   // Helper for product images with resizing
   export function getProductImageUrl(imagePath: string, options?: {
     width?: number;
     height?: number;
     quality?: number;
   }): string {
     const params = new URLSearchParams();
     if (options?.width) params.set('w', String(options.width));
     if (options?.height) params.set('h', String(options.height));
     if (options?.quality) params.set('q', String(options.quality));

     const base = `${API_BASE_URL}/products/images/${imagePath}`;
     return params.toString() ? `${base}?${params}` : base;
   }
   ```

---

### 2.3 Product Landing Page

**Files to Modify:**
- `src/pages/ProductLanding/Page.tsx`
- Product detail component

**Implementation:**
- Fetch product by `unique_link` from URL params
- Display: name, description, price, image, extra_details
- Show shop info
- "امتحان در خانه" button → Navigate to try-on upload

---

## Phase 3: Try-On Flow (Core Feature)

**Priority:** CRITICAL
**Estimated Effort:** 3-4 days
**Dependencies:** Phase 2 (Product data), Authentication

### 3.1 Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Upload    │───▶│   Progress   │───▶│   Result    │
│   Page      │    │    Page      │    │    Page     │
└─────────────┘    └──────────────┘    └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ POST upload │    │  Poll status │    │ GET result  │
│ /process/   │    │  (optional)  │    │ image URL   │
└─────────────┘    └──────────────┘    └─────────────┘
```

### 3.2 Upload & Process

**Files to Modify:**
- Create `src/services/visualizationService.ts`
- `src/pages/TryOn/UploadPage.tsx`
- `src/context/UploadContext.tsx`

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/products/{unique_link}/process/` | Upload image and start AI processing |

**Request:** `multipart/form-data`
- `customer_image`: File (JPEG/PNG, max 10MB)

**Response:**
```json
{
  "status": "success",
  "image_path": "processed/results/uuid.jpg",
  "image_id": 123,
  "shop_credits_remaining": 99,
  "message": "Image processed successfully"
}
```

**Implementation Steps:**

1. **Create Visualization Service:**
   ```typescript
   // src/services/visualizationService.ts
   import { apiUpload } from '@/utils/apiClient';

   export interface ProcessingResult {
     status: string;
     image_path: string;
     image_id: number;
     shop_credits_remaining: number;
     message: string;
   }

   export async function processVisualization(
     productUniqueLink: string,
     customerImage: File,
     onProgress?: (percent: number) => void
   ): Promise<ProcessingResult> {
     const formData = new FormData();
     formData.append('customer_image', customerImage);

     const response = await apiUpload<ProcessingResult>(
       `/products/${productUniqueLink}/process/`,
       formData,
       onProgress
     );

     return response;
   }
   ```

2. **Update UploadPage.tsx:**
   ```typescript
   const handleConfirmUpload = async () => {
     if (!selectedFile || !product) return;

     setIsUploading(true);
     try {
       const result = await processVisualization(
         product.unique_link,
         selectedFile,
         (progress) => setUploadProgress(progress)
       );

       // Store result in context
       setVisualizationResult(result);

       // Navigate to progress page
       navigate('/try-on/progress');
     } catch (error) {
       // Handle errors (show Persian message)
       toast.error(translateErrorMessage(error.message));
     } finally {
       setIsUploading(false);
     }
   };
   ```

3. **Update UploadContext:**
   - Add `visualizationResult` state
   - Add `processingImageId` for tracking

### 3.3 Progress Page

**Files to Modify:**
- `src/pages/TryOn/ProgressPage.tsx`

**Current Behavior:**
- Shows 3-phase animation over ~9 seconds
- Navigates to result when complete

**Integration Approach:**

Since the API processes synchronously (returns result directly), the progress page serves as a UX buffer. Two options:

**Option A: Keep Current Animation (Recommended)**
- The POST `/process/` call is made from UploadPage
- ProgressPage just shows animation while waiting
- When API response arrives, navigate to result

**Option B: Show Real Progress**
- Would require backend changes to return processing stages
- Not currently supported by API

**Implementation (Option A):**
```typescript
// In UploadPage - start processing before navigation
const handleUpload = async () => {
  // Start API call
  const processingPromise = processVisualization(product.unique_link, file);

  // Store promise in context
  setProcessingPromise(processingPromise);

  // Navigate to progress page immediately
  navigate('/try-on/progress');
};

// In ProgressPage
useEffect(() => {
  const resolveProcessing = async () => {
    try {
      const result = await processingPromise;
      setVisualizationResult(result);
      navigate('/try-on/result');
    } catch (error) {
      navigate('/try-on/error');
    }
  };

  resolveProcessing();
}, []);
```

### 3.4 Result Page

**Files to Modify:**
- `src/pages/TryOn/ResultPage.tsx`

**Current State:**
- Uses mock Unsplash image
- Shows hardcoded product recommendations
- Has before/after slider, download, share, save

**Implementation Steps:**

1. **Display Real Result Image:**
   ```typescript
   const resultImageUrl = getProductImageUrl(visualizationResult.image_path, {
     width: 1200 // High quality for result
   });
   ```

2. **Before/After Slider:**
   - "Before" = Original customer upload (need to store locally or fetch)
   - "After" = Result from API

3. **Download Functionality:**
   ```typescript
   const handleDownload = async () => {
     const imageUrl = getProductImageUrl(visualizationResult.image_path);
     const response = await fetch(imageUrl);
     const blob = await response.blob();

     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = `homa-tryon-${visualizationResult.image_id}.jpg`;
     link.click();

     trackKPI('download');
   };
   ```

4. **Save to Gallery:**
   - Result is automatically saved in backend (ProcessedImage record)
   - UI just confirms it's saved
   - "مشاهده در گالری" button → navigate to `/account/gallery`

5. **Vote/Rating:**
   ```typescript
   // POST /products/vote/
   export async function voteVisualization(imageId: number, vote: 1 | 2 | 3): Promise<void> {
     await apiPost('/products/vote/', {
       image_id: imageId,
       vote: vote // 1=Good, 2=Neutral, 3=Bad
     });
   }
   ```

---

## Phase 4: Studio Flow (Advanced Feature)

**Priority:** MEDIUM
**Estimated Effort:** 3-4 days
**Dependencies:** Phase 3 (similar architecture)

### 4.1 Overview

Studio uses the **Recommendation/Redesign** API for complex room transformations with AI-generated redesigns and product matching.

### 4.2 Create Redesign Session

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/sessions/` | Create redesign session |

**Request:** `multipart/form-data`
- `room_image`: File (JPEG/PNG)
- `room_type`: Optional (`living_room`, `bedroom`, etc.)
- `preferred_style`: Optional (`modern`, `traditional`, `persian`, etc.)
- `preferred_colors`: Optional array
- `user_notes`: Optional (max 500 chars)

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "pending"
  }
}
```

### 4.3 Poll Session Status

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/recommendations/sessions/{session_id}/` | Get session status |

**Status Values:**
- `pending` → `analyzing` → `generating` → `matching` → `ready`
- `failed` (error case)

**Implementation:**
```typescript
// src/services/studioService.ts
export async function pollSessionStatus(
  sessionId: string,
  onStatusChange: (status: string) => void
): Promise<RedesignSession> {
  const poll = async (): Promise<RedesignSession> => {
    const response = await apiGet(`/recommendations/sessions/${sessionId}/`);
    const session = response.data;

    onStatusChange(session.status);

    if (session.status === 'ready' || session.status === 'failed') {
      return session;
    }

    // Wait 2 seconds and poll again
    await new Promise(resolve => setTimeout(resolve, 2000));
    return poll();
  };

  return poll();
}
```

### 4.4 Session Result

**Ready Response includes:**
```json
{
  "session_id": "uuid",
  "status": "ready",
  "redesigned_image_url": "https://...",
  "items": [
    {
      "item_id": 1,
      "item_type": "rug",
      "description": {...},
      "matched_products": [
        {
          "id": 123,
          "name": "فرش مدرن",
          "image_url": "...",
          "match_score": 0.85,
          "price": 1500000
        }
      ],
      "tryon_status": "pending",
      "tryon_image_url": null
    }
  ]
}
```

### 4.5 Try-On from Redesign

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/sessions/{session_id}/items/{item_id}/tryon/` | Try product on redesigned room |

**Request:**
```json
{
  "product_id": 123,
  "selected_size": "200x300" // For rugs only
}
```

### 4.6 List User Sessions

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/recommendations/sessions/list/` | List user's redesign sessions |

**Update StudioContext:**
- Replace localStorage with API calls
- Fetch sessions on mount
- Create session via API
- Delete session via API

---

## Phase 5: Discovery Flow (Product-First)

**Priority:** MEDIUM
**Estimated Effort:** 2-3 days
**Dependencies:** Phase 2

### 5.1 Overview

Discovery is an alternative flow where users upload a room photo and get AI-matched product recommendations without full redesign.

### 5.2 Create Discovery Session

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/discover/` | Start discovery |

**Request:** `multipart/form-data`
- `room_image`: File
- `categories`: Optional array (`rug`, `furniture`, `bedspread`)
- `user_notes`: Optional

### 5.3 Discovery Result

**Response includes:**
```json
{
  "session_id": "uuid",
  "status": "ready",
  "room_analysis": {
    "room_type": "living_room",
    "detected_style": "modern",
    "color_palette": ["beige", "cream"],
    "search_queries": ["modern beige rug", ...]
  },
  "products": [
    {
      "id": 123,
      "name": "Persian Rug",
      "match_score": 0.87,
      "image_url": "...",
      "price": 15000000
    }
  ]
}
```

### 5.4 Visualize Product

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/discover/{session_id}/visualize/{product_id}/` | Visualize product in room |

### 5.5 Refine Search

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/discover/{session_id}/refine/` | Refine with new query |

---

## Phase 6: Social Gallery (Social Proof)

**Priority:** LOW
**Estimated Effort:** 1-2 days
**Dependencies:** Phase 3

### 6.1 Submit to Gallery

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/recommendations/gallery/submit/` | Submit try-on for moderation |

**Request:**
```json
{
  "session_id": "uuid",
  "item_id": 123
}
```

### 6.2 View Product Gallery

**API Endpoint:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/recommendations/gallery/product/{product_id}/` | Get approved images |

**Public endpoint** - No auth required. Shows how other users styled the product.

---

## Implementation Checklist

### Phase 1: User Profile & Gallery
- [ ] Verify `getProfile()` and `updateProfile()` work
- [ ] Create `src/services/galleryService.ts`
- [ ] Update `GalleryPage.tsx` to fetch from API
- [ ] Add loading/error/empty states
- [ ] Test gallery image URLs with resize params

### Phase 2: Product Catalog
- [ ] Create `src/services/shopService.ts`
- [ ] Create `src/services/productService.ts`
- [ ] Update `ExplorePage` to fetch shops
- [ ] Implement search with debounce
- [ ] Update product pages to fetch from API
- [ ] Create image URL helper with resize support

### Phase 3: Try-On Flow
- [ ] Create `src/services/visualizationService.ts`
- [ ] Update `UploadPage` with real upload
- [ ] Handle upload progress
- [ ] Update `ProgressPage` to wait for API
- [ ] Update `ResultPage` with real image
- [ ] Implement download functionality
- [ ] Implement vote/rating
- [ ] Add error handling for all failure cases

### Phase 4: Studio Flow
- [ ] Create `src/services/studioService.ts`
- [ ] Implement session creation
- [ ] Implement status polling
- [ ] Update `StudioContext` to use API
- [ ] Display matched products
- [ ] Implement try-on from redesign

### Phase 5: Discovery Flow
- [ ] Add discovery endpoints to service
- [ ] Create discovery UI flow
- [ ] Implement product matching display
- [ ] Implement visualization requests

### Phase 6: Social Gallery
- [ ] Add gallery submission
- [ ] Show product gallery on product pages

---

## Error Handling Standards

All API errors should be handled consistently:

```typescript
try {
  const result = await apiCall();
} catch (error) {
  if (error.status === 401) {
    // Token expired - AuthContext handles refresh
  } else if (error.status === 402) {
    // Insufficient credits
    toast.error('اعتبار فروشگاه کافی نیست');
  } else if (error.status === 429) {
    // Rate limited
    toast.error('تعداد درخواست‌ها بیش از حد مجاز است');
  } else {
    // Generic error
    toast.error(translateErrorMessage(error.message));
  }
}
```

---

## Testing Checklist

For each phase, verify:

1. **Happy Path:** Feature works with valid data
2. **Loading States:** Skeleton/spinner shows during fetch
3. **Empty States:** Proper message when no data
4. **Error States:** User-friendly Persian error messages
5. **Auth Required:** Protected routes redirect properly
6. **Token Refresh:** API calls work after token expires
7. **Mobile:** All features work on mobile viewport
8. **RTL:** Layout correct for Persian text

---

## Environment Setup

Ensure `.env` has:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
```

For production:
```
VITE_API_BASE_URL=https://api.homa.ir/api
VITE_API_TIMEOUT=60000
```

---

## Notes

- All user-facing text must be in Persian
- All error messages must be translated using `translateErrorMessage()`
- Image URLs should use the resize endpoint for performance
- Rate limits: 5 AI processing requests per hour per user
- JWT access token expires in 30 minutes (auto-refresh handles this)
