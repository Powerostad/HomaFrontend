import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPublicShowcase, fetchPublicShowcaseGroups, fetchPublicCategories, type PublicShowcaseProduct, type PublicShowcaseCategory, type PublicShowcaseGroup } from '@/services/publicShowcaseService';
import { formatPriceFromRial } from '@/utils/formatters';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useSeo } from '@/hooks/useSeo';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Button } from '@/components/ui/button';

export function PublicShowcase() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<PublicShowcaseProduct[]>([]);
  const [groups, setGroups] = useState<PublicShowcaseGroup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get('category') || '');
  const [categories, setCategories] = useState<PublicShowcaseCategory[]>([]);
  useEffect(() => {
    const back = () => setCategory(new URLSearchParams(window.location.search).get('category') || '');
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  const choose = (code: string) => {
    const url = new URL(window.location.href);
    if (code) url.searchParams.set('category', code); else url.searchParams.delete('category');
    setStatus('loading');
    window.history.pushState(null, '', url);
    setCategory(code);
  };
  const flatten = (nodes: PublicShowcaseCategory[], depth = 0): { node: PublicShowcaseCategory; depth: number }[] => nodes.flatMap(node => [{ node, depth }, ...flatten(node.children, depth + 1)]);
  const selectedRoot = categories.find(root => flatten([root]).some(x => x.node.code === category));
  useSeo({ title: i18n.language.startsWith('en') ? 'Product inspiration' : 'ایده‌های انتخاب محصول', description: '' });
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setRows([]);
    setGroups([]);
    const load = async () => category
      ? { rows: await fetchPublicShowcase(controller.signal, category), groups: [] }
      : { rows: [], groups: await fetchPublicShowcaseGroups(controller.signal) };
    Promise.all([load(), fetchPublicCategories(controller.signal)]).then(([data, tree]) => {
      if (!controller.signal.aborted) { setRows(data.rows); setGroups(data.groups); setCategories(tree); setStatus('ready'); }
    }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt, category]);
  return <><Header /><main className="max-w-7xl mx-auto px-5 md:px-12 py-12 md:py-20" dir={i18n.dir()}>
    <h1 className="text-2xl md:text-4xl font-light text-content-primary mb-10">{t('publicShowcase.title', 'ایده‌هایی برای فضای تو')}</h1>
    <nav aria-label={t('publicShowcase.categories', 'دسته‌بندی محصولات')} className="flex gap-3 overflow-x-auto pb-2 mb-6 md:flex-wrap">
      {[{ code: '', label: t('publicShowcase.all', 'همه دسته‌ها'), children: [] }, ...categories].map(node => <a key={node.code} href={`/explore${node.code ? `?category=${encodeURIComponent(node.code)}` : ''}`} aria-current={node.code === (selectedRoot?.code || '') ? 'page' : undefined} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); choose(node.code); } }} className={`inline-flex shrink-0 whitespace-nowrap min-h-11 items-center px-4 py-2 border rounded-full text-sm transition-colors ${node.code === (selectedRoot?.code || '') ? 'bg-content-primary text-content-inverse border-content-primary' : 'border-border-subtle text-content-primary'}`}>{node.label}</a>)}
    </nav>
    {selectedRoot && selectedRoot.children.length > 0 && <label className="flex flex-wrap items-center gap-3 mb-8 text-sm">{t('publicShowcase.subcategory', 'زیردسته')}<select aria-label={t('publicShowcase.subcategory', 'زیردسته')} value={category} onChange={event => choose(event.target.value)} className="min-h-11 max-w-full border border-border-subtle rounded-lg bg-surface-default px-4 py-2 text-content-primary">{flatten([selectedRoot]).map(({ node, depth }) => <option key={node.code} value={node.code}>{depth === 0 ? `${t('publicShowcase.all', 'همه دسته‌ها')} · ${node.label}` : `${'— '.repeat(depth - 1)}${node.label}`}</option>)}</select></label>}
    {status === 'loading' && <p role="status">{t('publicShowcase.loading', 'در حال دریافت تصاویر…')}</p>}
    {status === 'error' && <div role="status"><p>{t('publicShowcase.error', 'تصاویر فعلاً بارگذاری نشدند.')}</p><Button variant="outline" className="mt-4" onClick={() => setAttempt(x => x + 1)}>{t('publicShowcase.retry', 'تلاش دوباره')}</Button></div>}
    {status === 'ready' && rows.length === 0 && groups.length === 0 && <p role="status">{t('publicShowcase.empty', 'در این دسته فعلاً تصویری برای نمایش نداریم.')}</p>}
    {status === 'ready' && !category && <div className="space-y-14 md:space-y-20">{groups.map(group => <section key={group.category.code} aria-labelledby={`category-${group.category.code}`}>
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-4 mb-6">
        <h2 id={`category-${group.category.code}`} className="text-xl md:text-2xl font-light text-content-primary">{group.category.label}</h2>
        <a href={`/explore?category=${encodeURIComponent(group.category.code)}`} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); choose(group.category.code); } }} className="inline-flex items-center min-h-11 text-sm underline underline-offset-4 shrink-0">{t('publicShowcase.viewCategory', 'دیدن این دسته')}</a>
      </div>
      <PhotoGrid rows={group.results} />
    </section>)}</div>}
    {status === 'ready' && category && <PhotoGrid rows={rows} />}
  </main><Footer /></>;
}

function PhotoGrid({ rows }: { rows: PublicShowcaseProduct[] }) {
  const { t } = useTranslation();
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-8 md:gap-y-12">
    {rows.map(row => <figure key={row.image_url} className="min-w-0">
        <div className="aspect-[4/5] bg-surface-default overflow-hidden"><ImageWithFallback src={row.image_url} alt={t('publicShowcase.photo', 'تصویر محصول')} className="w-full h-full object-contain" loading="lazy" /></div>
        <figcaption className="text-content-primary text-sm md:text-base mt-3">{row.price === null ? t('publicShowcase.unpriced', 'قیمت اعلام نشده') : formatPriceFromRial(row.price, true)}</figcaption>
      </figure>)}
    </div>;
}
