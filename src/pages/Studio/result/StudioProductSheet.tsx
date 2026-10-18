import { useTranslation } from 'react-i18next';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatPriceFromRial } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import type { RefineProduct } from './ProductRefinement';

/** A single portal above the workspace: photo first, one contextual action. */
export function StudioProductSheet({ product, isOpen, onClose, isAlternative, onMakePrimary, isInBasket, onToggleBasket, onPreview, previewBusy = false }: {
  product: Product; isOpen: boolean; onClose: () => void;
  isAlternative: boolean; onMakePrimary: () => void;
  isInBasket: boolean; onToggleBasket: () => void;
  onRefineProduct?: RefineProduct; onPreview?: () => void; previewBusy?: boolean;
}) {
  const { t, i18n } = useTranslation();
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="studio-selection-sheet" dir={i18n.dir()}>
      <header className="studio-selection-sheet-heading"><DialogTitle>{product.category || t('studioProductLayout.details')}</DialogTitle><DialogDescription className="sr-only">{product.name}</DialogDescription></header>
      <div className="studio-selection-sheet-scroll">
        <AuthenticatedImage src={product.image} alt={product.name} className="studio-selection-sheet-image" />
        <div className="studio-selection-sheet-copy"><h2>{product.name}</h2><strong>{product.priceUnknown ? t('redesignJourney.unpriced') : formatPriceFromRial(product.price, true)}</strong>
          <div className="studio-selection-sheet-description">
            {product.description && <p>{product.description}</p>}
            {product.persianReason && <p>{product.persianReason}</p>}
            {product.matchHighlights?.map(text => <p key={text}>{text}</p>)}
            {!isAlternative && onPreview && <Button variant="outline" disabled={previewBusy} onClick={onPreview}>{t('redesignJourney.preview')}</Button>}
          </div>
        </div>
      </div>
      <footer className="studio-selection-sheet-footer">
        {isAlternative ? <Button onClick={onMakePrimary}>{t('studioProductLayout.makePrimary')}</Button> : <Button onClick={onToggleBasket} aria-pressed={isInBasket} disabled={!product.uniqueLink}>{t(isInBasket ? 'studio.result.v2.card.removeFromBasket' : 'studio.result.v2.card.addToBasketShort')}</Button>}
        {product.link && <a href={product.link} target="_blank" rel="noopener noreferrer">{t('product.viewInStore')}</a>}
      </footer>
    </DialogContent>
  </Dialog>;
}
