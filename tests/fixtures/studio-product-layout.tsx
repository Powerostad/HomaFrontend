import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RecommendationCard } from '../../src/pages/Studio/result/RecommendationCard';
import type { CategoryGroup } from '../../src/pages/Studio/result/types';
import '../../src/i18n/config';
import '../../src/styles/globals.css';
import '../../src/pages/Studio/result/studio-result.css';

// Isolated presentation fixture: all interactions remain local; no API requests.
const group: CategoryGroup = {
  itemId: 2, category: 'rug', categoryDisplay: 'فرش بزرگ کم‌رنگ بافت‌دار کرم و طوسی',
  recommendationReasonFa: 'تثبیت محدوده نشیمن با مقیاس استاندارد و ایجاد توازن خنثی و شیک در برابر مبل آبی تیره.',
  designRationaleFa: 'استفاده از فرش بزرگ با رنگ‌های خنثی و بافت ملایم برای ایجاد حس تعادل و دلبازی در فضا.',
  recommendedSize: '', quantity: 1, placements: [], positionInImage: null, actionStatus: 'available',
  interventionTier: 'quick_win', impactLevel: 'high', products: [
    { id: 'main', category: 'rug', name: 'فرش ماشینی ۱۰۰۰ شانه زمینه کرم طوسی', image: '/images/studio/preset-warm-living.webp', price: 4350000, uniqueLink: 'fixture-main', persianReason: 'بافت باکیفیت و رنگ خنثی، مناسب فضاهای مدرن و مینیمال.' },
    { id: 'alt-1', category: 'rug', name: 'فرش ساده بافت‌دار پرز روشن', image: '/images/studio/example-good.webp', price: 4200000, uniqueLink: 'fixture-alt-1' },
    { id: 'alt-2', category: 'rug', name: 'فرش مدرن وینتیج طوسی کرم', image: '/images/studio/preset-warm-living.webp', price: 5500000, uniqueLink: 'fixture-alt-2' },
    { id: 'alt-3', category: 'rug', name: 'گزینه‌های بیشتر در جزئیات محصول', image: '', price: 0, priceUnknown: true },
  ],
};
function Preview() {
  const [selected, setSelected] = useState(new Set<string>());
  const [quantity, setQuantity] = useState(1);
  const [why, setWhy] = useState(false);
  const [opened, setOpened] = useState('');
  return <main className="studio-result-page" style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
    <RecommendationCard group={{ ...group, quantity }} tier="quick_win" isTopPriority priorityRank={1} stepNumber={2}
      isWhyExpanded={why} isSaved={false} basketProductIds={selected} onToggleWhy={() => setWhy(!why)}
      onProductClick={product => setOpened(product.name)} onToggleSaved={() => {}}
      onUpdateQuantity={setQuantity} onToggleBasketProduct={id => setSelected(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; })} />
    <p role="status">{opened}</p>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
