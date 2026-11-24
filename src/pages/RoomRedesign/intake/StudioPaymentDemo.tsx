import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { StudioIntake } from './StudioIntake';
import type { IntakeImage } from './intakeTypes';

const packageCredits = 10;
const packagePriceToman = 149_000;
const designCredits = 2;
const storageKey = 'homa.studio.payment-demo.v1';
const orderParam = 'demoOrder';
const sampleImage: IntakeImage = {
  dataUrl: '/images/home-hero/cabin-before.webp', width: 1080, height: 810, source: 'gallery',
};
const sampleResult = '/images/home-hero/cabin-after.webp';

type Outcome = 'paid' | 'failed' | 'cancelled';
type DemoWallet = {
  balance: number;
  delivered: boolean;
  order: { id: string; status: 'pending' | Outcome } | null;
};

function readWallet(): DemoWallet {
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const state = JSON.parse(saved) as DemoWallet | null;
      if (state && Number.isSafeInteger(state.balance) && state.balance >= 0 && typeof state.delivered === 'boolean') return state;
    }
  } catch { /* The demo also works with storage disabled. */ }
  return { balance: 0, delivered: false, order: null };
}

export default function StudioPaymentDemo() {
  const { siteText: copy, siteLocale, siteDirection } = useSiteTranslation();
  const [params, setParams] = useSearchParams();
  const [wallet, setWallet] = useState(readWallet);
  const current = useRef(wallet);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const renderRequest = useRef<HTMLImageElement | null>(null);
  const purchaseButton = useRef<HTMLButtonElement>(null);
  const number = new Intl.NumberFormat(siteLocale());
  const gatewayOpen = wallet.order?.status === 'pending' && wallet.order.id === params.get(orderParam);

  useEffect(() => () => {
    if (!renderRequest.current) return;
    renderRequest.current.onload = null;
    renderRequest.current.onerror = null;
    renderRequest.current = null;
  }, []);

  function save(next: DemoWallet) {
    current.current = next;
    setWallet(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }

  function buy() {
    const state = current.current;
    const order = state.order?.status === 'pending'
      ? state.order : { id: crypto.randomUUID(), status: 'pending' as const };
    save({ ...state, order });
    const destination = new URLSearchParams(params);
    destination.set(orderParam, order.id);
    setParams(destination, { replace: true });
  }

  function returnFromGateway(status: Outcome) {
    const state = current.current;
    if (state.order?.status !== 'pending' || state.order.id !== params.get(orderParam)) return;
    save({ ...state, balance: state.balance + (status === 'paid' ? packageCredits : 0), order: { ...state.order, status } });
    const destination = new URLSearchParams(params);
    destination.delete(orderParam);
    setParams(destination, { replace: true });
  }

  function buildSample() {
    if (renderRequest.current || current.current.delivered || current.current.balance < designCredits) return;
    const image = new Image();
    renderRequest.current = image;
    setRendering(true);
    setRenderError(false);
    image.onload = () => {
      const state = current.current;
      save({ ...state, balance: state.balance - designCredits, delivered: true });
      renderRequest.current = null;
      setRendering(false);
    };
    image.onerror = () => {
      renderRequest.current = null;
      setRendering(false);
      setRenderError(true);
    };
    image.src = sampleResult;
  }

  const receipt = wallet.order?.status;
  const offer = copy('{{count}} اعتبار طراحی · {{price}} تومان', {
    count: number.format(packageCredits), price: number.format(packagePriceToman),
  });
  const receiptMessage = receipt === 'paid' ? copy('{{count}} اعتبار آزمایشی اضافه شد.', { count: number.format(packageCredits) })
    : receipt === 'failed' ? copy('پرداخت آزمایشی ناموفق بود. موجودی تغییری نکرد.')
      : receipt === 'cancelled' ? copy('پرداخت آزمایشی لغو شد.') : '';

  return <>
    <StudioIntake demoReview={{ sampleImage, actions: (
      <section className="mt-5 grid gap-3 rounded-xl border border-border-subtle bg-surface-default p-4" aria-label={copy('اعتبار آزمایشی')}>
        <h2 className="font-semibold">{copy('اعتبار آزمایشی')}</h2>
        <p className="text-sm text-content-secondary">{copy('این مسیر نمونه است و مبلغی برداشت نمی‌شود.')}</p>
        <p role="status" className="text-sm">
          {copy('موجودی اعتبار: {{count}}', { count: number.format(wallet.balance) })}
          {receiptMessage && <span className="mt-1 block">{receiptMessage}</span>}
        </p>
        {wallet.delivered ? <figure>
          <img className="w-full rounded-lg" src={sampleResult} alt={copy('طرح نمونهٔ اتاق')} />
          <figcaption className="mt-2 text-sm">{copy('طرح نمونه آماده شد. {{count}} اعتبار مصرف شد.', { count: number.format(designCredits) })}</figcaption>
        </figure> : <p className="text-sm">{copy('هزینهٔ ساخت طرح نمونه: {{count}} اعتبار', { count: number.format(designCredits) })}</p>}
        {renderError && <p role="alert" className="text-sm">{copy('طرح نمونه باز نشد. اعتبار کم نشد. دوباره امتحان کن.')}</p>}
        <div className="grid gap-2">
          {!wallet.delivered && wallet.balance >= designCredits &&
            <Button type="button" className="min-h-11" disabled={rendering} onClick={buildSample}>
              {copy(rendering ? 'در حال آماده‌سازی طرح نمونه…' : 'ساخت طرح نمونه')}
            </Button>}
          <Button ref={purchaseButton} type="button" className="min-h-11" variant={wallet.balance >= designCredits ? 'outline' : 'default'} onClick={buy}>
            {copy('خرید آزمایشی')} · {offer}
          </Button>
        </div>
      </section>
    ) }} />
    <Dialog open={gatewayOpen} onOpenChange={open => { if (!open) returnFromGateway('cancelled'); }}>
      <DialogContent dir={siteDirection()} className="text-start"
        onCloseAutoFocus={event => { event.preventDefault(); purchaseButton.current?.focus(); }}>
        <DialogTitle className="pe-8">{copy('درگاه آزمایشی هما')}</DialogTitle>
        <DialogDescription>{copy('نتیجهٔ پرداخت فرضی را انتخاب کن. به درگاه بانکی وصل نمی‌شوی.')}</DialogDescription>
        <p className="rounded-lg bg-surface-muted p-3 text-sm font-medium">{offer}</p>
        <div className="grid gap-2">
          <Button type="button" className="min-h-11" onClick={() => returnFromGateway('paid')}>{copy('شبیه‌سازی پرداخت موفق')}</Button>
          <Button type="button" className="min-h-11" variant="outline" onClick={() => returnFromGateway('failed')}>{copy('شبیه‌سازی پرداخت ناموفق')}</Button>
          <Button type="button" className="min-h-11" variant="ghost" onClick={() => returnFromGateway('cancelled')}>{copy('انصراف و بازگشت')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
