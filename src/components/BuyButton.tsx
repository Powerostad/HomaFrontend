// frontend/src/components/BuyButton.tsx
import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { apiPost } from '../utils/apiClient';

interface BuyButtonProps {
  productId: string;
  sourceContext: 'product_page' | 'try_on_result' | 'gallery' | 'studio';
  processedImageId?: number;
  redesignSessionId?: string;
  discoveryVisualizationId?: number;
  shopName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

interface TrackingData {
  click_id: string | null;
  tracking_url: string | null;
}

export function BuyButton({
  productId,
  sourceContext,
  processedImageId,
  redesignSessionId,
  discoveryVisualizationId,
  shopName,
  variant = 'default',
  size = 'default',
  className = '',
}: BuyButtonProps) {
  const { t } = useTranslation();
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTrackingUrl = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const response = await apiPost<TrackingData>(
          '/tracking/clicks/',
          {
            product_id: productId,
            source_context: sourceContext,
            processed_image_id: processedImageId || null,
            redesign_session_id: redesignSessionId || null,
            discovery_visualization_id: discoveryVisualizationId || null,
          }
        );

        if (response.success && response.data?.tracking_url) {
          setTrackingUrl(response.data.tracking_url);
        } else {
          // Product has no link
          setTrackingUrl(null);
        }
      } catch (err) {
        console.error('Failed to fetch tracking URL:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackingUrl();
  }, [productId, sourceContext, processedImageId, redesignSessionId, discoveryVisualizationId]);

  // Don't render if no link available or error
  if (!isLoading && (trackingUrl === null || error)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin ml-2" />
        {t('common.loading', 'در حال بارگذاری...')}
      </Button>
    );
  }

  const buttonText = shopName
    ? t('product.buyFrom', `خرید از ${shopName}`, { shop: shopName })
    : t('product.viewInStore', 'مشاهده در فروشگاه');

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <a
        href={trackingUrl!}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-4 w-4 ml-2" />
        {buttonText}
      </a>
    </Button>
  );
}
