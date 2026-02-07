import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../context/AppProviders';
import { useUpload, useProduct } from '../../context/AppProviders';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Header } from '../../components/Header';
import { ContextBar } from '../../components/ContextBar';
import { SizeSelectionModal, type SizeOption } from '../../components/SizeSelectionModal';
import { saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';
import { fetchProduct } from '../../services/productService';
import { apiProductToProduct } from '../../types/apiProduct';
import { trackTryOnUploadViewed, trackFileSelected, trackSizeSelected } from '../../analytics/events';
import { toast } from 'sonner';
import type { Product } from '../../types/product';
import type { APIProduct } from '../../types/apiProduct';

/**
 * Extract available sizes from a product (handles both API and mock formats)
 *
 * @param product - Product from context (could be API or mock format)
 * @returns Array of size options with code and display label
 */
function getAvailableSizes(product: Product | APIProduct | null): SizeOption[] {
  if (!product) return [];

  // Check raw backend format (available_sizes - snake_case from API response)
  // This is the most common case when product comes directly from backend
  const backendProduct = product as unknown as {
    available_sizes?: string[];
    available_sizes_display?: string[];
  };
  if (backendProduct.available_sizes && backendProduct.available_sizes.length > 0) {
    const displayLabels = backendProduct.available_sizes_display;
    return backendProduct.available_sizes.map((code, index) => ({
      code,
      display: displayLabels?.[index] || code,
    }));
  }

  // Check transformed API product format (availableSizes - camelCase)
  const apiProduct = product as APIProduct;
  if (apiProduct.availableSizes && apiProduct.availableSizes.length > 0) {
    const displayLabels = (apiProduct as unknown as { availableSizesDisplay?: string[] }).availableSizesDisplay;
    return apiProduct.availableSizes.map((code, index) => ({
      code,
      display: displayLabels?.[index] || code,
    }));
  }

  // Check mock product format (variants.sizes)
  const mockProduct = product as Product;
  if (mockProduct.variants?.sizes && mockProduct.variants.sizes.length > 0) {
    return mockProduct.variants.sizes
      .filter((s) => s.available)
      .map((s) => ({ code: s.name, display: s.name }));
  }

  return [];
}

export function TryOnUploadPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { t } = useTranslation();
  const { trackKPI } = useSession();
  const { setSelectedFile, setSelectedSize, clearUpload } = useUpload();
  const { product, setProduct } = useProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size selection modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [availableSizes, setAvailableSizes] = useState<SizeOption[]>([]);

  // Product loading state - prevents file selection before product is loaded
  const [isProductLoading, setIsProductLoading] = useState(true);

  /**
   * Clear all upload state when starting a new try-on session.
   * This fixes the bug where the old visualization result persists
   * when switching between products (e.g., completing try-on for product A,
   * going back to shop, then starting try-on for product B would show
   * product A's result during processing).
   */
  useEffect(() => {
    clearUpload();
  }, [clearUpload]);

  /**
   * Load product from URL param on mount
   * Product ID is now always in URL path: /try-on/:productId/upload
   */
  useEffect(() => {
    const loadProduct = async () => {
      // Validate productId from URL
      if (!productId) {
        toast.error(t('errors.productNotFound'));
        setIsProductLoading(false);
        navigate('/explore');
        return;
      }

      // If we already have a product loaded, check if it matches the URL productId
      // The productId in URL could match any of: id, uniqueLink, or unique_link
      if (product) {
        const productIdFromContext = (product as Product)?.id;
        const uniqueLink = (product as unknown as { uniqueLink?: string })?.uniqueLink;
        const unique_link = (product as unknown as { unique_link?: string })?.unique_link;

        // Check if URL productId matches ANY of the product's identifiers
        const isMatch = productId === productIdFromContext ||
                        productId === uniqueLink ||
                        productId === unique_link;

        if (isMatch) {
          saveToStorage(STORAGE_KEYS.TRYON_PRODUCT_ID, productId);
          trackTryOnUploadViewed({ product_id: productId, product_name: product?.name || '' });
          setIsProductLoading(false);
          return;
        }
      }

      // Load product by ID (uniqueLink) from URL via API
      console.log('[TryOnUpload] Loading product from API:', productId);
      setIsProductLoading(true);
      try {
        const result = await fetchProduct(productId);
        if (result.success && result.data) {
          // Transform APIProduct to Product format (sets id = uniqueLink/UUID)
          const productData = apiProductToProduct(result.data);
          setProduct(productData);
          saveToStorage(STORAGE_KEYS.TRYON_PRODUCT_ID, productId);
          trackTryOnUploadViewed({ product_id: productId, product_name: productData.name });
        } else {
          toast.error(result.error || t('errors.productNotFound'));
          navigate('/explore');
        }
      } catch (error) {
        console.error('[TryOnUpload] Failed to load product:', error);
        toast.error(t('errors.loadProductFailed'));
        navigate('/explore');
      } finally {
        setIsProductLoading(false);
      }
    };

    loadProduct();
  }, [productId, product, setProduct, navigate]);

  const EXAMPLES = {
    good: {
      label: t('tryOn.upload.goodExample'),
      image: 'https://images.unsplash.com/photo-1581209410127-8211e90da024?q=80&w=800',
      caption: t('tryOn.upload.goodCaption')
    },
    bad: {
      label: t('tryOn.upload.badExample'),
      reason: t('tryOn.upload.badReason'),
      image: 'https://images.unsplash.com/photo-1715366843673-f21a95ec11cc?q=80&w=800',
      caption: t('tryOn.upload.badCaption')
    }
  };

  /**
   * Handle file selection with size logic:
   * - 0 sizes: proceed without size
   * - 1 size: auto-select and proceed
   * - 2+ sizes: show modal for user selection
   */
  const handleFile = (file: File) => {
    // Guard: Ensure product is loaded before processing file
    if (!product) {
      toast.error(t('tryOn.upload.waitForProduct'));
      console.warn('[Upload] handleFile called with null product');
      return;
    }

    if (file && file.type.startsWith('image/')) {
      if (trackKPI) trackKPI('upload_started', { fileName: file.name, fileSize: file.size });
      trackFileSelected({ file_size: file.size, file_type: file.type, product_id: productId || '' });

      // Debug: Log product details and available sizes
      console.log('[Upload] handleFile called:', {
        productId: (product as unknown as { id?: string | number })?.id,
        productName: product?.name,
        productUniqueLink: (product as unknown as { uniqueLink?: string })?.uniqueLink,
        availableSizes: (product as unknown as { availableSizes?: string[] })?.availableSizes,
        available_sizes: (product as unknown as { available_sizes?: string[] })?.available_sizes,
      });

      // Check for available sizes
      const sizes = getAvailableSizes(product);
      console.log('[Upload] getAvailableSizes result:', { sizes, sizesCount: sizes.length });

      if (sizes.length === 0) {
        // No sizes - proceed without size selection
        setSelectedSize(null);
        setSelectedFile(file);
        navigate(`/try-on/${productId}/progress`);
      } else if (sizes.length === 1) {
        // Single size - auto-select and proceed
        setSelectedSize(sizes[0].code);
        setSelectedFile(file);
        navigate(`/try-on/${productId}/progress`);
      } else {
        // Multiple sizes - show selection modal
        setPendingFile(file);
        setAvailableSizes(sizes);
        setShowSizeModal(true);
      }
    }
  };

  /**
   * Handle size selection from modal
   */
  const handleSizeSelect = (sizeCode: string) => {
    if (pendingFile) {
      trackSizeSelected({ product_id: productId || '', size_code: sizeCode });
      setSelectedSize(sizeCode);
      setSelectedFile(pendingFile);
      setShowSizeModal(false);
      setPendingFile(null);
      navigate(`/try-on/${productId}/progress`);
    }
  };

  /**
   * Handle modal close without selection
   */
  const handleSizeModalClose = () => {
    setShowSizeModal(false);
    setPendingFile(null);
    // Reset file input so user can select again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Inform user they need to re-select
    toast.info(t('tryOn.upload.reselectImage'));
  };

  return (
    <div className="h-screen bg-[#FDFDFB] flex flex-col overflow-hidden relative" dir="rtl">
      
      {/* 1. HEADER & BREADCRUMBS */}
      <div className="relative z-[110] shrink-0 bg-[#FDFDFB] border-b border-black/[0.03]">
        <Header />
        <ContextBar
          items={[
            { label: t('nav.home'), href: '/' },
            { label: t('tryOn.title'), href: '/try-on' },
            { label: t('tryOn.upload.title') }
          ]}
        />
      </div>

      <main className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto relative z-10 overflow-y-auto pb-32 scrollbar-hide bg-[#FDFDFB]">
        
        {/* 2. HERO AREA - Editorial Title with Spacing */}
        <div className="px-6 md:px-16 pt-6 pb-2">
          <div className="space-y-2">
            <h1 className="text-h2 md:text-h1 font-medium text-foreground tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {t('tryOn.upload.title')}
            </h1>
            {product && (
              <p className="text-p text-muted-foreground">
                {t('tryOn.upload.selectImageFor', { productName: product.name })}
              </p>
            )}
            <div className="h-px w-full bg-foreground/[0.05]" />
          </div>
        </div>

        {/* 3. TEACHING SECTION - Editorial Layout (Restored Aspect Ratio) */}
        <div className="px-6 md:px-16 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pt-4">
            {/* GOOD EXAMPLE */}
            <div className="space-y-3">
              <div className="relative aspect-[3/2] bg-white overflow-hidden border border-black/[0.03]">
                <ImageWithFallback src={EXAMPLES.good.image} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-[#E1FF00] px-2 py-1 flex items-center z-20">
                  <span className="text-[10px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{t('tryOn.upload.good')}</span>
                </div>
              </div>
              <p className="text-[13px] text-black/80 font-medium leading-tight">{t('tryOn.upload.good')}: {EXAMPLES.good.caption}</p>
            </div>

            {/* BAD EXAMPLE */}
            <div className="space-y-3">
              <div className="relative aspect-[3/2] bg-white overflow-hidden border border-black/[0.03]">
                <ImageWithFallback src={EXAMPLES.bad.image} className="w-full h-full object-cover grayscale-[0.3]" />
                <div className="absolute top-3 right-3 bg-[#FF4F11] px-2 py-1 flex items-center z-20">
                  <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{t('tryOn.upload.bad')}</span>
                </div>
              </div>
              <p className="text-[13px] text-black/80 font-medium leading-tight">{t('tryOn.upload.bad')}: {EXAMPLES.bad.caption}</p>
            </div>
          </div>
        </div>

        {/* 4. PRESETS SECTION removed - Hairline Divider also removed to tighten space */}

      </main>

      {/* 5. STICKY BOTTOM ACTION BAR - Zara Home Hierarchy */}
      <div className="fixed bottom-0 left-0 right-0 py-6 px-6 md:px-16 bg-[#FDFDFB]/95 backdrop-blur-md border-t border-black/[0.03] z-[120]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-4">
          
          <div className="w-full max-w-[420px] flex flex-col items-center gap-4">
            {/* Primary Actions: Side by Side Grid */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProductLoading}
                  data-ph-capture-attribute-action="take_photo"
                  className={`h-12 text-[12px] font-medium uppercase tracking-[0.1em] transition-all flex items-center justify-center ${
                    isProductLoading
                      ? 'bg-black/50 text-white/70 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-black/90 active:scale-[0.98]'
                  }`}
              >
                  <span>{isProductLoading ? t('common.loading') : t('tryOn.upload.takePhoto')}</span>
              </button>

              <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProductLoading}
                  data-ph-capture-attribute-action="select_gallery"
                  className={`h-12 border text-[12px] font-medium uppercase tracking-[0.1em] transition-all flex items-center justify-center ${
                    isProductLoading
                      ? 'bg-white/50 border-black/5 text-black/50 cursor-not-allowed'
                      : 'bg-white border-black/10 text-black hover:bg-black/[0.02] active:scale-[0.98]'
                  }`}
              >
                  <span>{isProductLoading ? t('common.wait') : t('tryOn.upload.gallery')}</span>
              </button>
            </div>

            {/* Tertiary: Minimal Text Link removed as requested */}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Size Selection Modal (for rugs with multiple sizes) */}
      <SizeSelectionModal
        isOpen={showSizeModal}
        sizes={availableSizes}
        productName={product?.name}
        onSelect={handleSizeSelect}
        onClose={handleSizeModalClose}
      />
    </div>
  );
}