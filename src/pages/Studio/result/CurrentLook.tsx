import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ShoppingBag, X } from 'lucide-react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatPriceFromRial } from '@/utils/formatters';
import type { StudioResultViewState } from './viewState';

/** Saved selection only. Opening this sheet never changes a product or requests AI. */
export function CurrentLook({ state }: { state: StudioResultViewState }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const groups = state.categoryGroups.filter(group => group.actionStatus === 'available' && group.products.length);
  const selected = groups.flatMap(group => group.products.filter(product => state.basketProductIds.has(product.id)));
  const unknown = selected.some(product => product.priceUnknown);
  return <Dialog open={open} onOpenChange={setOpen}>
    <div className="studio-current-look" dir={i18n.dir()}>
      <div><p>{t('studioBenchmark.currentLook')}</p><strong>{t('studioBenchmark.selectionCount', { count: selected.length })}</strong><span>{selected.length ? `${unknown ? t('studioBenchmark.knownSubtotal') + ' ' : ''}${formatPriceFromRial(state.selectedPrice, true)}` : t('studioBenchmark.chooseProducts')}</span></div>
      <DialogTrigger asChild><Button variant="outline"><ShoppingBag size={16} />{t('studioBenchmark.editSelection')}<ChevronDown size={16} /></Button></DialogTrigger>
    </div>
    <DialogContent className="studio-current-look-sheet" dir={i18n.dir()}>
      <DialogHeader><DialogTitle>{t('studioBenchmark.currentLook')}</DialogTitle><DialogDescription>{t('studioBenchmark.selectionHint')}</DialogDescription></DialogHeader>
      <div className="studio-current-look-list">
        {groups.length === 0 && <p>{t('studio.result.v2.noRecommendations')}</p>}
        {groups.map(group => <section key={group.itemId}>
          <h3>{group.categoryDisplay}</h3>
          {group.products.filter((product, index) => index === 0 || state.basketProductIds.has(product.id)).map(product => {
            const inBasket = state.basketProductIds.has(product.id);
            return <article key={product.id}>
              <button className="studio-current-look-product" type="button" onClick={() => { setOpen(false); state.handleProductClick(product); }}>
                <AuthenticatedImage src={product.image} alt={product.name} loading="lazy" />
                <span><strong>{product.name}</strong><small>{product.priceUnknown ? t('redesignJourney.unpriced') : formatPriceFromRial(product.price, true)}</small></span>
              </button>
              <Button variant="outline" disabled={!product.uniqueLink} aria-pressed={inBasket} onClick={() => state.toggleBasketProduct(product.id)}>
                {inBasket ? <Check size={16} /> : <ShoppingBag size={16} />}{t(inBasket ? 'studio.result.v2.card.removeFromBasket' : 'studio.result.v2.card.addToBasketShort')}
              </Button>
            </article>;
          })}
        </section>)}
      </div>
      <DialogClose asChild><Button variant="outline" className="studio-current-look-close"><X size={16} />{t('common.close')}</Button></DialogClose>
    </DialogContent>
  </Dialog>;
}
