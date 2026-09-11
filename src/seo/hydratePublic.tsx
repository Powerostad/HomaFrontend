import { useEffect, useState, type ComponentType } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { PublicPage } from './PublicPage';
import { createPublicI18n } from './i18n';
import type { PublicPageData, PublicProduct } from './types';

export function hydratePublic() {
  const element = document.getElementById('homa-page-data');
  if (!element?.textContent) return;
  const data = JSON.parse(element.textContent) as PublicPageData;
  const i18n = createPublicI18n();
  function PublicRoot() {
    const [BasketCommerce, setBasketCommerce] = useState<ComponentType<{ product: PublicProduct; variantId: number | null }> | null>(null);
    const [BuyCommerce, setBuyCommerce] = useState<ComponentType<{ product: PublicProduct }> | null>(null);
    useEffect(() => {
      // Hydration completes in Persian before any browser preference is read.
      const updateLanguage = (language: string) => {
        document.documentElement.lang = language;
        document.documentElement.dir = ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr';
        try { localStorage.setItem('i18nextLng', language); } catch { /* storage may be disabled */ }
      };
      i18n.on('languageChanged', updateLanguage);
      try { const language = localStorage.getItem('i18nextLng'); if (language && ['fa', 'ar', 'en', 'tr'].includes(language)) void i18n.changeLanguage(language); } catch { /* use Persian */ }
      let removeCtaTracking = () => {};
      let active = true;
      void import('../utils/umami').then(async ({ umamiTrack }) => {
        const events = await import('../analytics/events');
        if (data.product) events.trackProductViewed({ product_id: data.product.unique_link, product_name: data.product.name, shop_slug: data.product.shop_slug, product_category: data.product.category_display });
        else if (data.shop) events.trackStoreViewed({ store_slug: data.shop.slug, store_name: data.shop.shop_name });
        const clicked = (event: MouseEvent) => {
          const link = event.target instanceof Element ? event.target.closest('a') : null;
          if (!link) return;
          const path = new URL(link.href).pathname;
          if (data.product && path.startsWith('/try-on/')) events.trackTryOnCtaClicked({ product_id: data.product.unique_link, source: data.path });
          if (path === '/studio/upload' || path === '/explore') umamiTrack('acquisition_cta_clicked', { source_path: data.path, destination_path: path, funnel: path === '/studio/upload' ? 'ai_tool' : 'shopping' });
        };
        if (active) { document.addEventListener('click', clicked); removeCtaTracking = () => document.removeEventListener('click', clicked); }
      });
      void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: false }));
      if (data.product) void import('./PublicCommerce').then(({ PublicBasketCommerce, PublicBuyCommerce }) => {
        if (active) {
          setBasketCommerce(() => PublicBasketCommerce);
          setBuyCommerce(() => PublicBuyCommerce);
        }
      });
      return () => { active = false; removeCtaTracking(); i18n.off('languageChanged', updateLanguage); };
    }, []);
    return <BrowserRouter><I18nextProvider i18n={i18n}><PublicPage data={data} renderBasketCommerce={BasketCommerce ? (product, variantId) => <BasketCommerce product={product} variantId={variantId} /> : undefined} renderBuyCommerce={BuyCommerce ? (product) => <BuyCommerce product={product} /> : undefined} /></I18nextProvider></BrowserRouter>;
  }
  hydrateRoot(document.getElementById('root')!, <PublicRoot />);
}
