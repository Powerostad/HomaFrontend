import { useSiteTranslation } from '@/i18n/siteCopy';
import './studio-landing.css';

/** Separate destinations, not an audience toggle inside the design form. */
export function AudienceNavigation({ host = false }: { host?: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  return <nav className="landing-audience-nav" aria-label={copy('مسیرهای هُما')}>
    <a href="/" aria-current={!host ? 'page' : undefined}>{copy('هُما برای خانه')}</a>
    <a href="/hosts" aria-current={host ? 'page' : undefined}>{copy('هُما برای میزبان‌ها')}</a>
  </nav>;
}
