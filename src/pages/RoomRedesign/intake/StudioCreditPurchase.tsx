import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { apiGet, apiPost } from '@/utils/apiClient';

const endpoint = '/payments/sizpay';
const paymentAction = 'https://rt.sizpay.ir/Route/Payment';
type Offer = { code: string; price_irr: number; credits: number; balance: number };
type Receipt = { status: string; credits: number; balance?: number };
type Payment = { action: string; fields: Record<'MerchantID' | 'TerminalID' | 'Token', string> };

export function StudioCreditPurchase() {
  const { siteText: copy, siteLocale } = useSiteTranslation();
  const [params] = useSearchParams();
  const purchaseId = params.get('creditPurchase');
  const [offer, setOffer] = useState<Offer>();
  const [receipt, setReceipt] = useState<Receipt>();
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const pending = useRef(false);
  const number = new Intl.NumberFormat(siteLocale());

  useEffect(() => {
    const controller = new AbortController();
    void apiGet<Offer>(endpoint + '/offer/', undefined, { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) setOffer(response.data);
    });
    if (purchaseId && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(purchaseId)) {
      void apiGet<Receipt>(endpoint + '/status/' + purchaseId + '/', undefined, { signal: controller.signal }).then(response => {
        if (!controller.signal.aborted) setReceipt(response.data ?? { status: 'unknown', credits: 0 });
      });
    } else if (purchaseId) setReceipt({ status: 'unknown', credits: 0 });
    return () => controller.abort();
  }, [purchaseId]);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      pending.current = false;
      setPaying(false);
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  async function buy() {
    if (!offer || pending.current) return;
    pending.current = true;
    setPaying(true);
    setError('');
    const { code, price_irr, credits } = offer;
    const result = await apiPost<Payment>(endpoint + '/checkout/', { code, price_irr, credits });
    if (!result.data || result.data.action !== paymentAction) {
      pending.current = false;
      setPaying(false);
      if (result.statusCode === 409) {
        setOffer((await apiGet<Offer>(endpoint + '/offer/')).data);
        setError('مشخصات بسته تغییر کرده. قیمت و تعداد اعتبار جدید را بررسی کن.');
      } else setError('درگاه پرداخت باز نشد. دوباره امتحان کن.');
      return;
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentAction;
    for (const key of ['MerchantID', 'TerminalID', 'Token'] as const) {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = key;
      field.value = result.data.fields[key];
      form.appendChild(field);
    }
    document.body.append(form);
    form.submit();
    form.remove();
  }

  if (!offer && !purchaseId) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-3 text-sm" aria-label={copy('خرید اعتبار طراحی')}>
      {receipt && (
        <p role="status" className="mb-3">
          {receipt.status === 'paid'
            ? copy('{{count}} اعتبار به حساب اضافه شد.', { count: number.format(receipt.credits) })
            : copy('پرداخت تأیید نشده است. اگر مبلغ کسر شده، وضعیت را با پشتیبانی پیگیری کن.')}
        </p>
      )}
      {offer && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-default p-4">
          <div>
            <p>{copy('موجودی اعتبار: {{count}}', { count: number.format(receipt?.balance ?? offer.balance) })}</p>
            <p className="mt-1 font-medium">{copy('{{count}} اعتبار طراحی', { count: number.format(offer.credits) })} · {copy('{{price}} تومان', { price: number.format(offer.price_irr / 10) })}</p>
            <p className="mt-1 text-content-secondary">{copy('هر اعتبار برای یک بار ساخت تصویر طراحی مصرف می‌شود.')}</p>
          </div>
          <Button type="button" onClick={buy} disabled={paying}>
            {copy(paying ? 'در حال اتصال به درگاه…' : 'خرید اعتبار طراحی')}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2">{copy(error)}</p>}
    </section>
  );
}
