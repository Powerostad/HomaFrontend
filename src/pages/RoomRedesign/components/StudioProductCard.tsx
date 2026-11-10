import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial } from '@/utils/formatters';
import { ExternalLink, Image, ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BackendProduct } from '../services/redesignChatService';
import { MessageText } from './ConversationPanel';

/** One catalogue presentation for the selected product and its alternatives. */
export function StudioProductCard({ product, busy, onPreview, compact = false, rank }: {
  product: BackendProduct; busy: boolean; onPreview: () => void; compact?: boolean; rank?: number;
}) {
  const { siteValue } = useSiteTranslation();
  const { t, i18n } = useTranslation();
  const rial = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
  const checked = product.catalog_checked_at ? new Date(product.catalog_checked_at) : null;
  if (compact) return <button type="button" className="studio-swap-option" data-recommended={rank != null && rank <= 3 || undefined}
    disabled={busy || product.candidate?.eligibility === 'rejected'} onClick={onPreview} aria-label={`${t('redesignJourney.preview')}: ${siteValue(product.name)}`}>
    <span className="studio-swap-image"><AuthenticatedImage src={product.image_url || ''} alt="" loading="lazy" /></span>
    <span className="studio-swap-label">{rank != null && rank <= 3 && <span className="studio-swap-tag">{t('studioProductLayout.suggestionNumber', 'پیشنهاد')} {rank.toLocaleString(i18n.language)}</span>}</span>
    <strong>{rial != null && rial > 0 ? formatPriceFromRial(rial) : t('redesignJourney.unpriced')}</strong>
    <span className="studio-swap-name" title={siteValue(product.name)}>{siteValue(product.name)}</span>
  </button>;
  return <div className="studio-catalogue-card">
    <div className="studio-product-media">
      {product.image_url ? <AuthenticatedImage src={product.image_url} alt={siteValue(product.name)} loading="lazy" decoding="async" />
        : <div className="studio-product-missing"><Image size={28} aria-hidden="true" /><span>{t('studioCollection.noPhoto')}</span></div>}
    </div>
    <div className="studio-product-info">
      {product.merchant_name && <p className="studio-product-merchant">{siteValue(product.merchant_name)}</p>}
      <h4>{siteValue(product.name)}</h4>
      {product.candidate && <p>{siteValue(product.candidate.variant_label)} · {t(`studioV2.purchase.${product.candidate.purchase_status}`)}</p>}
      <p className="studio-product-price">{siteValue(rial != null && rial > 0 ? formatPriceFromRial(rial) : t('redesignJourney.unpriced'))}</p>
      <div className="studio-product-actions">
        <Button disabled={busy || product.candidate?.eligibility === 'rejected'} onClick={onPreview}><ScanLine size={16} aria-hidden="true" />{t('redesignJourney.preview')}</Button>
        {product.merchant_url && /^https?:\/\//i.test(product.merchant_url) && <Button asChild variant="outline"><a href={product.merchant_url} target="_blank" rel="noopener noreferrer">{t(product.merchant_destination === 'shop' ? 'redesignJourney.shop' : 'redesignJourney.merchant')}<ExternalLink size={16} aria-hidden="true" /></a></Button>}
      </div>
      {(product.description || product.ai_description || checked) && <details className="studio-product-details">
        <summary>{t('studioChat.details')}</summary>
        <MessageText text={siteValue(product.description || product.ai_description || '')} />
        {checked && !Number.isNaN(checked.getTime()) && <p className="studio-caption">{t('redesignJourney.checked')} {checked.toLocaleString(i18n.language)}</p>}
      </details>}
    </div>
  </div>;
}
