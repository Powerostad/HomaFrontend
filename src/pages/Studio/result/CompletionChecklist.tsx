import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Check, Plus, Search } from 'lucide-react';
import type { CompletionChecklistItem } from './types';

interface CompletionChecklistProps {
  items: CompletionChecklistItem[];
  checkedIds: Set<number>;
  onToggleItem: (id: number) => void;
}

/** Sourcing choices stay separate from purchasable products and invoice totals. */
export function CompletionChecklist({ items, checkedIds, onToggleItem }: CompletionChecklistProps) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  if (!items.length) return null;
  const selected = items.filter(item => checkedIds.has(item.id)).length;
  return <section className="studio-sourcing" dir={siteDirection()} aria-label={siteText('تکمیل پازل چیدمان')}>
    <header className="studio-sourcing-heading"><h3>{siteText('تکمیل پازل چیدمان')}</h3><small>{siteValue(selected)}/{siteValue(items.length)}</small></header>
    <p>{siteText('این پیشنهادها بخشی از طرح شما هستند. برای تهیهٔ نمونهٔ مناسب، مشخصات و عبارت جست‌وجوی هر مورد را ببینید؛ یا آن را برای مشاورهٔ تهیه انتخاب کنید.')}</p>
    <div className="studio-sourcing-list">
      {items.map(item => <article key={item.id} className="studio-sourcing-item">
        <header>{item.imageUrl && <AuthenticatedImage src={item.imageUrl} alt="" loading="lazy" />}<h4>{siteValue(item.name)}</h4></header>
        {item.aiReasoning && <p>{siteValue(item.aiReasoning)}</p>}
        {item.webSearchQuery && <p>{siteText('عبارت پیشنهادی برای جست‌وجو')}: {siteValue(item.webSearchQuery)}</p>}
        <div className="studio-sourcing-actions">
          <Button variant={checkedIds.has(item.id) ? 'default' : 'outline'} aria-pressed={checkedIds.has(item.id)} aria-label={checkedIds.has(item.id) ? siteText('حذف {{v0}} از انتخاب', {v0:item.name}) : siteText('انتخاب {{v0}} برای مشاوره', {v0:item.name})} onClick={() => onToggleItem(item.id)}>
            {checkedIds.has(item.id) ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}{siteText(checkedIds.has(item.id) ? 'انتخاب شد' : 'می‌خوام تهیه کنم')}
          </Button>
          {item.webSearchQuery && <a href={'https://www.google.com/search?q=' + encodeURIComponent(item.webSearchQuery)} target="_blank" rel="noopener noreferrer"><Search size={14} aria-hidden="true" />{siteText('جست‌وجو')}</a>}
        </div>
      </article>)}
    </div>
  </section>;
}
