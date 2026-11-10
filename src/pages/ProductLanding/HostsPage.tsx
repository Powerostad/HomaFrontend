import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useSeo } from '@/hooks/useSeo';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { HostsLandingContent } from './HostsLandingContent';

export function HostsLandingPage() {
  const { siteText: copy } = useSiteTranslation();
  useSeo({ title: copy('طراحی اقامتگاه برای میزبان‌ها | هُما'), description: copy('از عکس آگهی تا راحتی مهمان؛ طراحی فضا با توجه به بودجه، دوام وسایل و نگهداری روزمره.') });
  return <><Header /><main><HostsLandingContent /></main><Footer /></>;
}
