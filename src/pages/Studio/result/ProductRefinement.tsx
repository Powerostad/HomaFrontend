import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '../components/ProductDetailSheet';

export type RefineProduct = (product: Product, text: string) => Promise<boolean>;

/** No request is made until the user explicitly submits a non-empty message. */
export function ProductRefinement({ product, busy, onSubmit }: { product: Product; busy: boolean; onSubmit: RefineProduct }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const context = t('studioProductEdit.context', { name: product.name });
  const submit = async () => {
    if (!draft.trim() || busy || locked.current) return;
    locked.current = true; setPending(true); setFailed(false); setSent(false);
    try {
      if (await onSubmit(product, `${context}\n${draft.trim()}`)) {
        setDraft(''); setOpen(false); setSent(true);
      } else setFailed(true);
    } catch { setFailed(true); }
    finally { locked.current = false; setPending(false); }
  };
  return <div ref={container} className="studio-product-refinement" dir={i18n.dir()}>
    <Button variant="outline" disabled={busy || pending} aria-expanded={open} aria-controls={id} onClick={() => { setOpen(value => !value); setSent(false); }}><MessageSquare size={16} aria-hidden="true" />{t('studioProductEdit.title')}</Button>
    {sent && <p role="status">{t('studioProductEdit.sent')}</p>}
    {open && <form id={id} onSubmit={event => { event.preventDefault(); void submit(); }} className="studio-product-refinement-form">
      <p className="studio-product-refinement-context">{context}</p>
      <label htmlFor={`${id}-text`}>{t('studioProductEdit.label')}</label>
      <Textarea id={`${id}-text`} autoFocus value={draft} disabled={busy || pending} onChange={event => { setDraft(event.target.value); setFailed(false); }} placeholder={t('studioProductEdit.placeholder')} aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`}>{t('studioProductEdit.hint')}</p>
      <Button type="button" variant="ghost" disabled={busy || pending} onClick={() => { setDraft(t('studioProductEdit.alternative')); setFailed(false); }}>{t('studioProductEdit.alternative')}</Button>
      {failed && <p role="alert">{t('studioProductEdit.failed')}</p>}
      <div className="studio-product-refinement-actions">
        <Button type="submit" disabled={!draft.trim() || busy || pending}>{t(pending ? 'studioProductEdit.sending' : 'studioProductEdit.send')}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => { setOpen(false); container.current?.querySelector('button')?.focus(); }}>{t('studioProductEdit.cancel')}</Button>
      </div>
    </form>}
  </div>;
}
