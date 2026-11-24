import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSiteTranslation } from '@/i18n/siteCopy';
import './pricing-preview.css';

const plans = [
  {
    name: 'Starter',
    price: 500_000,
    credits: 10,
    label: 'طراحی با هوش مصنوعی هما',
    purpose: 'برای وقتی که می‌خوای خودت تغییرات خونه‌ات رو مدیریت کنی.',
    features: ['کانسپت و برنامهٔ تغییرات', 'محصولات متناسب با طرح', 'پشتیبانی استفاده از استودیو'],
    distinction: 'بدون مشاورهٔ انسانی اختصاصی',
  },
  {
    name: 'Pro',
    price: 1_350_000,
    credits: 30,
    label: 'پیشنهاد هما',
    purpose: 'برای وقتی که علاوه بر طراحی با هما، نظر یک طراح داخلی رو هم می‌خوای.',
    features: ['تمام خدمات استودیو Starter', 'یک نوبت مشاوره با طراح داخلی هما', 'بررسی طرح و انتخاب وسایل', 'اولویت‌بندی تغییرات متناسب با بودجه'],
    distinction: 'تصمیم‌گیری با نظر تخصصی طراح',
  },
  {
    name: 'Max',
    price: 2_800_000,
    credits: 80,
    label: 'طراحی با همراهی گسترده‌تر',
    purpose: 'برای طراحی چند فضا و استفاده از نظر طراح در مراحل بیشتری از تغییرات و خرید.',
    features: ['تمام خدمات Pro', 'ظرفیت بیشتر برای طراحی و اصلاح', 'مشاوره در مراحل طراحی، تغییرات و خرید'],
    distinction: 'تعداد و محدودهٔ مشاوره پیش از عرضه مشخص می‌شه.',
  },
] as const;

const deliverables = [
  'تصویر بهبودیافتهٔ فضای خودت، با حفظ وسایل مناسب موجود',
  'برنامهٔ تغییرات',
  'محصولات پیشنهادی',
  'امکان اصلاح طرح',
];

const serviceDetails = [
  {
    title: 'اعتبار کجا مصرف می‌شه؟',
    description: 'شروع طراحی اولیهٔ هر پروژه یک اعتبار مصرف می‌کنه. در ساختار فعلی، اصلاح‌های تصویری همان پروژه اعتبار جداگانه کم نمی‌کنن. شروع پروژهٔ تازه، مصرف جدید دارد.',
  },
  {
    title: 'مشاورهٔ طراح شامل چیه؟',
    description: 'Pro یک نوبت بررسی تخصصی طرح، انتخاب وسایل و اولویت‌بندی تغییرات دارد. Max برای مشاوره در مراحل بیشتری از پروژه در نظر گرفته شده و تعداد و محدودهٔ آن پیش از عرضه مشخص می‌شه. مدت و روش ارائهٔ مشاوره هم پیش از خرید اعلام می‌شه.',
  },
  {
    title: 'پشتیبانی سرویس چه کمکی می‌کنه؟',
    description: 'همهٔ بسته‌ها برای ورود به حساب، استفاده از استودیو، اعتبار، پردازش و خطاهای فنی پشتیبانی دارن.',
  },
  {
    title: 'چه هزینه‌هایی جداست؟',
    description: 'هزینهٔ خرید وسایل و اجرای تغییرات جداست. لینک فروشنده در صورت وجود نمایش داده می‌شه و موجودی محصولات به فروشنده بستگی داره.',
  },
];

export function HomePricing({ standalone = false }: { standalone?: boolean }) {
  const { siteText: t, siteDirection, siteLocale } = useSiteTranslation();
  const number = new Intl.NumberFormat(siteLocale());
  const direction = siteDirection();
  const Title = standalone ? 'h1' : 'h2';
  const Subtitle = standalone ? 'h2' : 'h3';
  const PlanTitle = standalone ? 'h3' : 'h4';

  return (
    <div id="pricing" dir={direction} className="homa-pricing" tabIndex={-1}>
      <section className="homa-pricing__main" aria-labelledby="pricing-title">
        <header className="homa-pricing__intro">
          <Title id="pricing-title" className="homa-pricing__title">{t('تعرفه‌های استودیو هما')}</Title>
        </header>

        <section className="homa-pricing__deliverables" aria-labelledby="pricing-deliverables">
          <Subtitle id="pricing-deliverables" className="homa-pricing__deliverables-title">{t('در هر پروژه چه دریافت می‌کنی؟')}</Subtitle>
          <ul>
            {deliverables.map(item => <li key={item}>{t(item)}</li>)}
          </ul>
        </section>

        <div className="homa-pricing__grid">
          {plans.map(plan => {
            const price = number.format(plan.price);
            const credits = number.format(plan.credits);
            return (
              <article key={plan.name} className="homa-pricing__card" data-plan={plan.name}>
                <div className="homa-pricing__card-top">
                  <Subtitle className="homa-pricing__plan-name"><bdi lang="en">{plan.name}</bdi></Subtitle>
                  <span>{t('{{credits}} اعتبار طراحی', { credits })}</span>
                </div>
                <p className="homa-pricing__label">{t(plan.label)}</p>
                <p className="homa-pricing__price">
                  <strong>{price}</strong>
                  <span>{t('تومان')}</span>
                </p>
                <div className="homa-pricing__card-service">
                  <PlanTitle className="homa-pricing__plan-purpose">{t(plan.purpose)}</PlanTitle>
                  <ul>
                    {plan.features.map(feature => (
                      <li key={feature}>
                        <Check size={15} strokeWidth={2.2} aria-hidden />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="homa-pricing__card-footer">
                  <p className="homa-pricing__distinction">{t(plan.distinction)}</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" className="homa-pricing__choose">
                        {t('انتخاب {{plan}}', { plan: plan.name })}
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir={direction} className="homa-pricing__dialog">
                      <DialogTitle>{t('بستهٔ {{plan}}', { plan: plan.name })}</DialogTitle>
                      <p>{t('{{credits}} اعتبار طراحی · {{price}} تومان', { credits, price })}</p>
                      <DialogDescription>
                        {t('این صفحه پیش‌نمایش قیمت‌گذاری است. خرید در این نسخه فعال نیست.')}
                      </DialogDescription>
                    </DialogContent>
                  </Dialog>
                </div>
              </article>
            );
          })}
        </div>

        <p className="homa-pricing__credit-note">
          {t('هر اعتبار برای شروع طراحی اولیهٔ یک پروژه است. اصلاح‌های همان پروژه اعتبار جداگانه کم نمی‌کنن؛ شروع پروژهٔ تازه، یک اعتبار دیگر مصرف می‌کنه.')}
        </p>

        <p className="homa-pricing__terms">
          {t('پرداخت یک‌باره، بدون تمدید خودکار')}
          <a href="#pricing-details">{t('شرایط بسته‌ها')}</a>
        </p>
      </section>

      <section id="pricing-details" className="homa-pricing__details" aria-labelledby="pricing-details-title">
        <div className="homa-pricing__details-inner">
          <Subtitle id="pricing-details-title" className="homa-pricing__details-title">{t('شرایط بسته‌ها')}</Subtitle>
          <div className="homa-pricing__questions">
            {serviceDetails.map(item => (
              <details key={item.title}>
                <summary>{t(item.title)}</summary>
                <p>{t(item.description)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
