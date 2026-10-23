import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, ImageOff, RefreshCw, Search, SlidersHorizontal, Trash2, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { catalogueAction, catalogueEdit, catalogueFacets, catalogueProduct, catalogueProducts, safeMerchantUrl, toggleSelection,
  type CatalogueAction, type CatalogueFacets, type CataloguePage as ProductPage, type CatalogueProduct } from '@/services/catalogueManagement';
import './catalogue.css';

function ProductPhoto({ product }: { product: CatalogueProduct }) {
  const [failed, setFailed] = useState(false);
  return product.image_url && !failed ? <img src={product.image_url} alt={product.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <ImageOff aria-label={product.name} />;
}

export default function CataloguePage() {
  const { siteText: copy, siteLocale, siteDirection } = useSiteTranslation();
  const [params, setParams] = useSearchParams();
  const [facets, setFacets] = useState<CatalogueFacets | null>(null);
  const [data, setData] = useState<ProductPage | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<CatalogueProduct | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState({ name: '', price: '', category: '' });
  const [moveCategory, setMoveCategory] = useState('');
  const [pendingTrash, setPendingTrash] = useState<number[] | null>(null);
  const [undoIds, setUndoIds] = useState<number[]>([]);
  const detailRequest = useRef(0);
  const key = params.toString();
  const state = params.get('state') || 'active';
  const category = params.get('category') || '';
  const page = Number(params.get('page')) || 1;
  const count = (value: number) => value.toLocaleString(siteLocale());
  const money = (rial: number) => `${count(rial / 10)} ${copy('تومان')}`;
  const change = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries({ ...changes, page: changes.page || '1' }).forEach(([field, value]) => value ? next.set(field, value) : next.delete(field));
    setSelected([]); setParams(next);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (params.get('search') || '')) change({ search });
    }, 350);
    return () => window.clearTimeout(timer);
    // URL updates are handled by the search value and navigation below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  useEffect(() => { setSearch(new URLSearchParams(key).get('search') || ''); setSelected([]); }, [key]);
  useEffect(() => {
    let active = true;
    catalogueFacets().then(result => { if (active) setFacets(result); }).catch(() => { if (active) setError(copy('دسترسی به کاتالوگ ممکن نشد؛ با حساب مجاز وارد شوید.')); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    catalogueProducts(Object.fromEntries(new URLSearchParams(key)), controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(result.count / result.page_size));
        if (page > lastPage) { change({ page: String(lastPage) }); return; }
        setData(result);
      })
      .catch(() => { if (!controller.signal.aborted) setError(copy('دریافت محصولات ناموفق بود. دوباره تلاش کنید یا دسترسی حساب را بررسی کنید.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision]);
  const refresh = () => { setSelected([]); setRevision(value => value + 1); };
  async function act(action: CatalogueAction, ids = selected, target?: string) {
    if (!ids.length || busy) return;
    setBusy(true); setError('');
    try {
      const result = await catalogueAction(ids, action, target);
      if (action === 'trash') setUndoIds(result.ids);
      if (action === 'restore') setUndoIds([]);
      setNotice(`${count(result.updated)} ${copy('محصول به‌روزرسانی شد.')}`);
      setPendingTrash(null); setDetail(null); refresh();
    } catch { setError(copy('تغییر ذخیره نشد؛ دوباره تلاش کنید.')); }
    finally { setBusy(false); }
  }
  async function openDetail(product: CatalogueProduct) {
    const request = ++detailRequest.current;
    setDetail(product); setDetailLoading(true);
    setDraft({ name: product.name, price: String(product.price_rial / 10), category: product.category.code });
    try { const result = await catalogueProduct(product.id); if (request === detailRequest.current) setDetail(result); }
    catch { setError(copy('جزئیات محصول دریافت نشد.')); }
    finally { if (request === detailRequest.current) setDetailLoading(false); }
  }
  async function saveProduct() {
    if (!detail || busy) return;
    const price = Number(draft.price);
    if (!draft.name.trim() || !draft.category || !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(Math.round(price * 10))) return;
    setBusy(true);
    try {
      const result = await catalogueEdit(detail.id, { name: draft.name.trim(), price: Math.round(price * 10), category: draft.category });
      setDetail(result); setNotice(copy('تغییرات محصول ذخیره شد.')); refresh();
    } catch { setError(copy('تغییر ذخیره نشد؛ دوباره تلاش کنید.')); }
    finally { setBusy(false); }
  }
  const roots = facets?.categories.filter(node => !node.parent_code && (node.active || node.count)) || [];
  const children = facets?.categories.filter(node => node.parent_code === category && (node.active || node.count)) || [];
  const pageIds = data?.results.map(product => product.id) || [];
  const allSelected = !!pageIds.length && pageIds.every(id => selected.includes(id));
  return <main className="catalogue-manager" dir={siteDirection()}>
    <header className="catalogue-heading"><div><span className="catalogue-eyebrow">HOMA / {copy('کتابخانهٔ محصولات')}</span><h1>{copy('مدیریت کاتالوگ')}</h1><p>{copy('محصولات را ببینید، دسته‌بندی را اصلاح کنید و انتخاب‌های نامناسب را کنار بگذارید.')}</p></div><Link to="/studio">{copy('بازگشت به استودیو')}<ArrowLeft size={18} /></Link></header>
    <div className="catalogue-workspace"><aside className="catalogue-sidebar">
      <h2>{copy('دسته‌های کاتالوگ')}</h2><button className={!category ? 'chosen' : ''} onClick={() => change({ category: '', subcategory: '' })}>{copy('همهٔ دسته‌ها')}<span>{count((facets?.stats.total || 0) - (facets?.stats.deleted || 0))}</span></button>
      {roots.map(node => <button key={node.code} className={category === node.code ? 'chosen' : ''} onClick={() => change({ category: node.code, subcategory: '' })}>{node.name}<span>{count(node.count || 0)}</span></button>)}
      <p>{copy('تعداد دسته‌ها شامل محصولات فعال و غیرفعالِ خارج از سطل بازیافت است.')}</p>
    </aside><section className="catalogue-main">
      <div className="catalogue-tabs" role="group" aria-label={copy('وضعیت محصولات')}>
        {([['active', 'فعال', facets?.stats.active], ['inactive', 'غیرفعال', facets?.stats.inactive], ['deleted', 'سطل بازیافت', facets?.stats.deleted], ['all', 'همه', facets?.stats.total]] as const).map(([value, label, number]) => <button key={value} className={state === value ? 'chosen' : ''} onClick={() => change({ state: value })}>{value === 'deleted' && <Trash2 size={15} />}{copy(label)}<span>{count(number || 0)}</span></button>)}
      </div>
      <div className="catalogue-filters"><label className="catalogue-search"><Search size={18} /><input aria-label={copy('جست‌وجوی نام یا شناسه')} placeholder={copy('جست‌وجوی نام یا شناسه')} value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label><span>{copy('دسته')}</span><select value={category} onChange={event => change({ category: event.target.value, subcategory: '' })}><option value="">{copy('همهٔ دسته‌ها')}</option>{roots.map(node => <option key={node.code} value={node.code}>{node.name}</option>)}</select></label>
        <label><span>{copy('زیردسته')}</span><select value={params.get('subcategory') || ''} disabled={!category} onChange={event => change({ subcategory: event.target.value })}><option value="">{copy('همهٔ زیردسته‌ها')}</option>{children.map(node => <option key={node.code} value={node.code}>{node.name} ({count(node.count || 0)})</option>)}</select></label>
        <label><span>{copy('تگ‌گذاری تصویری')}</span><select value={params.get('vision') || 'all'} onChange={event => change({ vision: event.target.value })}><option value="all">{copy('همه')}</option><option value="completed">{copy('تصویر بررسی شده')}</option><option value="pending">{copy('تصویر بررسی نشده')}</option></select></label>
        <label><span>{copy('فروشگاه')}</span><select value={params.get('shop') || ''} onChange={event => change({ shop: event.target.value })}><option value="">{copy('همه')}</option>{facets?.shops.map(shop => <option key={shop.shop_id} value={shop.shop_id}>{shop.shop__shop_name}</option>)}</select></label>
        <label><span>{copy('مرتب‌سازی')}</span><select value={params.get('sort') || 'newest'} onChange={event => change({ sort: event.target.value })}><option value="newest">{copy('جدیدترین')}</option><option value="oldest">{copy('قدیمی‌ترین')}</option><option value="price_asc">{copy('ارزان‌ترین')}</option><option value="price_desc">{copy('گران‌ترین')}</option></select></label>
      </div>
      {error && <div className="catalogue-error" role="alert">{error}<button onClick={refresh}>{copy('تلاش دوباره')}</button></div>}
      {notice && <div className="catalogue-notice" role="status">{notice}{!!undoIds.length && <button disabled={busy} onClick={() => void act('restore', undoIds)}><Undo2 size={15} />{copy('بازگردانی حذف اخیر')}</button>}</div>}
      <div className="catalogue-results-heading"><label><input type="checkbox" disabled={loading || !pageIds.length} checked={allSelected} onChange={() => setSelected(allSelected ? [] : pageIds)} />{copy('انتخاب این صفحه')}</label><span aria-live="polite">{loading ? copy('در حال دریافت محصولات…') : `${count(data?.count || 0)} ${copy('محصول')}`}</span><button aria-label={copy('به‌روزرسانی')} onClick={refresh}><RefreshCw size={17} /></button></div>
      {!!selected.length && <div className="catalogue-bulk"><strong>{count(selected.length)} {copy('انتخاب‌شده')}</strong><button disabled={busy} onClick={() => setSelected([])}>{copy('لغو انتخاب')}</button>{state === 'deleted' ? <button disabled={busy} onClick={() => void act('restore')}><Undo2 size={15} />{copy('بازگردانی')}</button> : <><button disabled={busy} onClick={() => void act(state === 'inactive' ? 'activate' : 'deactivate')}>{copy(state === 'inactive' ? 'فعال‌کردن' : 'غیرفعال‌کردن')}</button><button className="danger" disabled={busy} onClick={() => setPendingTrash(selected)}><Trash2 size={15} />{copy('انتقال به سطل بازیافت')}</button></>}
        <select aria-label={copy('دستهٔ مقصد')} value={moveCategory} onChange={event => setMoveCategory(event.target.value)}><option value="">{copy('دستهٔ مقصد')}</option>{facets?.categories.filter(node => node.active).map(node => <option key={node.code} value={node.code}>{node.parent_code ? '— ' : ''}{node.name}</option>)}</select><button disabled={busy || !moveCategory} onClick={() => void act('categorize', selected, moveCategory)}>{copy('انتقال دسته')}</button>
      </div>}
      <div className={`catalogue-grid ${loading ? 'is-loading' : ''}`} aria-busy={loading}>{data?.results.map(product => <article key={product.id} className={`catalogue-card ${selected.includes(product.id) ? 'selected' : ''}`}>
        <div className="catalogue-photo"><button className="catalogue-image-button" aria-label={`${copy('مشاهدهٔ جزئیات')} ${product.name}`} onClick={() => void openDetail(product)}><ProductPhoto product={product} /></button><label className="catalogue-check"><input type="checkbox" aria-label={`${copy('انتخاب')} ${product.name}`} disabled={busy || loading} checked={selected.includes(product.id)} onChange={() => setSelected(previous => toggleSelection(previous, product.id))} />{selected.includes(product.id) && <Check size={13} />}</label><span className={`catalogue-badge ${product.visual_complete ? 'complete' : ''}`}>{copy(product.visual_complete ? 'تصویر بررسی شده' : 'تصویر بررسی نشده')}</span></div>
        <div className="catalogue-card-body"><span className="catalogue-card-meta">{product.category.name} <b>#{product.id}</b></span><button className="catalogue-product-name" onClick={() => void openDetail(product)}>{product.name}</button><strong>{money(product.price_rial)}</strong><div className="catalogue-card-actions"><button onClick={() => void openDetail(product)}><SlidersHorizontal size={15} />{copy('بررسی و ویرایش')}</button><button className="danger" disabled={busy || loading} aria-label={copy(product.deleted_at ? 'بازگردانی' : 'انتقال به سطل بازیافت')} onClick={() => product.deleted_at ? void act('restore', [product.id]) : setPendingTrash([product.id])}>{product.deleted_at ? <Undo2 size={17} /> : <Trash2 size={17} />}</button></div></div>
      </article>)}</div>
      {!loading && !data?.results.length && <div className="catalogue-empty"><Search size={32} /><h2>{copy('محصولی با این فیلترها پیدا نشد.')}</h2><button onClick={() => { setSearch(''); setSelected([]); setParams({}); }}>{copy('پاک‌کردن فیلترها')}</button></div>}
      <nav className="catalogue-pagination" aria-label={copy('صفحه‌بندی')}><button disabled={page <= 1 || loading} onClick={() => change({ page: String(page - 1) })}><ChevronRight size={17} />{copy('قبلی')}</button><span>{copy('صفحه')} {count(page)} / {count(Math.max(1, Math.ceil((data?.count || 0) / (data?.page_size || 24))))}</span><button disabled={loading || page * (data?.page_size || 24) >= (data?.count || 0)} onClick={() => change({ page: String(page + 1) })}>{copy('بعدی')}<ChevronLeft size={17} /></button></nav>
    </section></div>
    <Dialog open={!!pendingTrash} onOpenChange={open => { if (!open && !busy) setPendingTrash(null); }}><DialogContent dir={siteDirection()}><DialogTitle>{copy('انتقال به سطل بازیافت')}</DialogTitle><DialogDescription>{count(pendingTrash?.length || 0)} {copy('محصول از پیشنهادهای جدید کنار گذاشته می‌شود. تصاویر و مشخصات برای بازگردانی حفظ می‌شوند.')}</DialogDescription><div className="catalogue-dialog-actions"><button disabled={busy} onClick={() => setPendingTrash(null)}>{copy('انصراف')}</button><button className="danger" disabled={busy} onClick={() => void act('trash', pendingTrash || [])}>{copy(busy ? 'در حال ذخیره…' : 'انتقال به سطل بازیافت')}</button></div></DialogContent></Dialog>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) { detailRequest.current++; setDetail(null); } }}><DialogContent className="catalogue-detail" dir={siteDirection()}><DialogTitle>{copy('بررسی محصول')}</DialogTitle><DialogDescription>{copy('قیمت در این فرم به تومان است. تغییرات روی کاتالوگ فعلی ذخیره می‌شود.')}</DialogDescription>{error && <p className="danger" role="alert">{error}</p>}{detail && <>
      <div className="catalogue-detail-grid"><div className="catalogue-detail-photo"><ProductPhoto product={detail} /></div><form onSubmit={event => { event.preventDefault(); void saveProduct(); }}><label>{copy('نام محصول')}<input required maxLength={255} value={draft.name} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value }))} /></label><label>{copy('قیمت به تومان')}<input required type="number" min="0" step="0.1" value={draft.price} onChange={event => setDraft(previous => ({ ...previous, price: event.target.value }))} /></label><label>{copy('دسته و زیردسته')}<select required value={draft.category} onChange={event => setDraft(previous => ({ ...previous, category: event.target.value }))}>{facets?.categories.filter(node => node.active || node.code === draft.category).map(node => <option key={node.code} value={node.code}>{node.parent_code ? '— ' : ''}{node.name}</option>)}</select></label><button className="catalogue-primary" disabled={busy}>{copy(busy ? 'در حال ذخیره…' : 'ذخیرهٔ تغییرات')}</button><span>#{detail.id} · {detail.shop}</span>{safeMerchantUrl(detail.merchant_url) && <a href={safeMerchantUrl(detail.merchant_url)} target="_blank" rel="noopener noreferrer">{copy('صفحهٔ فروشنده')}<ExternalLink size={15} /></a>}</form></div>
      <section className="catalogue-description"><h3>{copy('توصیف ثبت‌شده برای جست‌وجو')}</h3><p dir="auto">{detail.description || copy('توصیفی ثبت نشده است.')}</p><p>{copy(detail.visual_complete ? 'این محصول توصیف تصویری دارد.' : 'توصیف این محصول از بررسی تصویر به دست نیامده است.')}</p></section>
      {detailLoading ? <p role="status">{copy('در حال دریافت جزئیات…')}</p> : <><section><h3>{copy('گزینه‌های محصول')}</h3><ul className="catalogue-variants">{detail.variants?.map(variant => <li key={variant.id}><span>{variant.label_fa || variant.sku}</span><b>{variant.price == null ? '—' : money(variant.price)}</b></li>)}</ul></section><details><summary>{copy('مشخصات و تگ‌های کامل')}</summary><pre dir="auto">{JSON.stringify(detail.extra_details, null, 2)}</pre></details></>}
    </>}</DialogContent></Dialog>
  </main>;
}
