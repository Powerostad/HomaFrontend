import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProduct } from '@/services/productService';
import type { APIProduct } from '@/types/apiProduct';
import { useTranslation } from 'react-i18next';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatPriceFromRial } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import type { RefineProduct } from './ProductRefinement';
import { StudioSkuDetails } from './StudioSkuDetails';

/** A single portal above the workspace: photo first, one contextual action. */
export function StudioProductSheet({ product, isOpen, onClose, isAlternative, onMakePrimary, isInBasket, onToggleBasket, onPreview, previewBusy = false }: {
  product: Product; isOpen: boolean; onClose: () => void;
  isAlternative: boolean; onMakePrimary: () => void;
  isInBasket: boolean; onToggleBasket: () => void;
  onRefineProduct?: RefineProduct; onPreview?: () => void; previewBusy?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [detail, setDetail] = useState<{ key: string; data?: APIProduct; failed?: boolean }>();
  const [reload, setReload] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const key = product.uniqueLink || product.id;
  useEffect(() => {
    if (!isOpen) return;
    setPhotoIndex(0);
    if (!product.uniqueLink) return;
    const controller = new AbortController();
    setDetail({ key });
    fetchProduct(product.uniqueLink, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setDetail({ key, data: result.data, failed: !result.success });
    }).catch(() => {
      if (!controller.signal.aborted) setDetail({ key, failed: true });
    });
    return () => controller.abort();
  }, [isOpen, key, product.uniqueLink, reload]);
  const data = detail?.key === key ? detail.data : undefined;
  const seenPhotos = new Set<string>();
  const gallery = [product.image, ...(data?.galleryImages || [])].filter(url => {
    if (!url || seenPhotos.has(url.split('?')[0])) return false;
    seenPhotos.add(url.split('?')[0]); return true;
  });
  const photo = Math.min(photoIndex, Math.max(0, gallery.length - 1));
  const information = data?.merchantDetails;
  const move = (delta: number) => setPhotoIndex((photo + delta + gallery.length) % gallery.length);

  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="studio-selection-sheet" dir={i18n.dir()}>
      <header className="studio-selection-sheet-heading"><DialogTitle>{product.category || t('studioProductLayout.details')}</DialogTitle><DialogDescription className="sr-only">{product.name}</DialogDescription></header>
      <div className="studio-selection-sheet-scroll">
        <div className="studio-merchant-gallery" role="region" aria-label={t('studioMerchant.gallery', 'تصاویر محصول')}
          onKeyDown={event => {
            if (gallery.length < 2 || event.target !== event.currentTarget) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
            }
          }} tabIndex={gallery.length > 1 ? 0 : undefined}>
          <AuthenticatedImage key={gallery[photo]} src={gallery[photo] || product.image} alt={`${product.name} — ${photo + 1}`} className="studio-selection-sheet-image" />
          {gallery.length > 1 && <>
            <div className="studio-merchant-gallery-controls" dir="ltr">
              <button type="button" onClick={() => move(-1)} aria-label={t('studioMerchant.previousPhoto', 'تصویر قبلی')}><ChevronLeft size={20} /></button>
              <span role="status">{t('studioMerchant.photoCount', '{{current}} از {{total}} تصویر', { current: (photo + 1).toLocaleString(i18n.language), total: gallery.length.toLocaleString(i18n.language) })}</span>
              <button type="button" onClick={() => move(1)} aria-label={t('studioMerchant.nextPhoto', 'تصویر بعدی')}><ChevronRight size={20} /></button>
            </div>
            <div className="studio-merchant-thumbnails" aria-label={t('studioMerchant.selectPhoto', 'انتخاب تصویر محصول')}>
              {gallery.map((url, index) => <button type="button" key={url} aria-pressed={photo === index}
                aria-label={t('studioMerchant.photoNumber', 'تصویر {{number}}', { number: (index + 1).toLocaleString(i18n.language) })} onClick={() => setPhotoIndex(index)}>
                <AuthenticatedImage src={url} alt="" loading="lazy" />
              </button>)}
            </div>
          </>}
        </div>
        <div className="studio-selection-sheet-copy"><h2>{product.name}</h2><strong>{product.priceUnknown ? t('redesignJourney.unpriced') : formatPriceFromRial(product.price, true)}</strong>
          <StudioSkuDetails product={product} />
          {data?.shopName && <p className="studio-merchant-store">{t('studioMerchant.store', 'فروشگاه')}: {data.shopName}</p>}
          {!!product.uniqueLink && !data && (detail?.key !== key || !detail.failed) && <p role="status">{t('studioMerchant.loading', 'در حال دریافت مشخصات و تصاویر محصول…')}</p>}
          {detail?.key === key && detail.failed && <div className="studio-merchant-error" role="status">
            <p>{t('studioMerchant.loadError', 'مشخصات کامل محصول بارگذاری نشد.')}</p>
            <Button variant="outline" onClick={() => setReload(value => value + 1)}>{t('studioMerchant.retry', 'تلاش دوباره')}</Button>
          </div>}
          {information && <>
            {information.specifications.length > 0 && <section className="studio-merchant-section">
              <h3>{t('studioMerchant.specifications', 'مشخصات محصول')}</h3>
              <dl className="studio-merchant-specifications">{information.specifications.map(row =>
                <div key={row.label}><dt>{row.label}</dt><dd dir="auto">{row.value}</dd></div>)}</dl>
            </section>}
            {information.description && <section className="studio-merchant-section">
              <h3>{t('studioMerchant.description', 'توضیحات محصول')}</h3>
              <p className="studio-merchant-description" dir="auto">{information.description}</p>
            </section>}
            {!information.description && !information.specifications.length && <p>{t('studioMerchant.noDetails', 'اطلاعات بیشتری از فروشگاه ثبت نشده است.')}</p>}
          </>}
          <div className="studio-selection-sheet-description studio-merchant-section">
            {product.persianReason && <><h3>{t('studioMerchant.inYourDesign', 'در طرح شما')}</h3><p>{product.persianReason}</p></>}
            {!isAlternative && onPreview && <Button variant="outline" disabled={previewBusy} onClick={onPreview}>{t('redesignJourney.preview')}</Button>}
          </div>
        </div>
      </div>
      <footer className="studio-selection-sheet-footer">
        {isAlternative ? <Button onClick={onMakePrimary}>{t('studioProductLayout.makePrimary')}</Button> : <Button onClick={onToggleBasket} aria-pressed={isInBasket} disabled={!product.uniqueLink || (!!product.purchaseStatus && product.purchaseStatus !== 'ready' && !isInBasket)}>{t(isInBasket ? 'studio.result.v2.card.removeFromBasket' : 'studio.result.v2.card.addToBasketShort')}</Button>}
        {product.link && <a href={product.link} target="_blank" rel="noopener noreferrer">{t('product.viewInStore')}</a>}
      </footer>
    </DialogContent>
  </Dialog>;
}
