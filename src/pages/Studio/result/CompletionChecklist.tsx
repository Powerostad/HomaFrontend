import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useEffect, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import type { CompletionChecklistItem } from './types';

interface CompletionChecklistProps {
  sessionId?: string;
  items: CompletionChecklistItem[];
  checkedIds: Set<number>;
  onToggleItem: (id: number) => void;
}

/** Sourcing choices stay separate from purchasable products and invoice totals. */
export function CompletionChecklist({ items, checkedIds, onToggleItem, sessionId }: CompletionChecklistProps) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const storage = `homa.studio.self-sourcing:${sessionId || 'draft'}`;
  const [selfSource, setSelfSource] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(storage) || '[]'); } catch { return []; }
  });
  useEffect(() => { try { sessionStorage.setItem(storage, JSON.stringify(selfSource)); } catch { /* optional local intentions */ } }, [storage, selfSource]);
  if (!items.length) return null;
  const selected = items.filter(item => checkedIds.has(item.id)).length;
  return <section className="studio-sourcing" dir={siteDirection()} aria-label={siteText('تکمیل پازل چیدمان')}>
    <header className="studio-sourcing-heading"><h3>{siteText('تکمیل پازل چیدمان')}</h3><small>{siteValue(selected)}/{siteValue(items.length)}</small></header>
    <p>{siteText('این موارد در تصویر طراحی شما دیده می‌شن اما در انبار هُما موجود نیستن. موارد مورد نظرتون رو انتخاب کنید تا تیم ما برای تهیه‌شون مشاوره بده.')}</p>
    <div className="studio-sourcing-list">
      {items.map(item => <article key={item.id} className="studio-sourcing-item">
        <header>{item.imageUrl && <AuthenticatedImage src={item.imageUrl} alt="" loading="lazy" />}<h4>{siteValue(item.name)}</h4></header>
        {item.aiReasoning && <p>{siteValue(item.aiReasoning)}</p>}
        {!!item.specifications?.length && <ul className="studio-sourcing-specifications">{item.specifications.map((spec, index) => <li key={index}>{siteValue(spec)}</li>)}</ul>}
        <div className="studio-sourcing-actions">
          <Button variant={selfSource.includes(String(item.id)) ? 'default' : 'outline'} aria-pressed={selfSource.includes(String(item.id))} onClick={() => {
            if (checkedIds.has(item.id)) onToggleItem(item.id);
            setSelfSource(previous => previous.includes(String(item.id)) ? previous.filter(id => id !== String(item.id)) : [...previous, String(item.id)]);
          }}>{siteText(selfSource.includes(String(item.id)) ? 'لغو تهیهٔ شخصی' : 'خودم تهیه می‌کنم')}</Button>
          <Button variant={checkedIds.has(item.id) ? 'default' : 'outline'} aria-pressed={checkedIds.has(item.id)} aria-label={checkedIds.has(item.id) ? siteText('حذف {{v0}} از انتخاب', {v0:item.name}) : siteText('انتخاب {{v0}} برای مشاوره', {v0:item.name})} onClick={() => { setSelfSource(previous => previous.filter(id => id !== String(item.id))); onToggleItem(item.id); }}>
            {checkedIds.has(item.id) ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}{siteText(checkedIds.has(item.id) ? 'لغو پیگیری هما' : 'هما پیگیری کند')}
          </Button>
          {item.webSearchQuery && <a href={'https://www.google.com/search?q=' + encodeURIComponent(item.webSearchQuery)} target="_blank" rel="noopener noreferrer"><Search size={14} aria-hidden="true" />{siteText('جست‌وجو')}</a>}
        </div>
      </article>)}
    </div>
    <p>{siteText('این انتخاب‌ها فقط در برنامهٔ شما ذخیره می‌شوند؛ برای پیگیری، فرم مشاوره را جداگانه بررسی و تأیید کن.')}</p>
  </section>;
}
