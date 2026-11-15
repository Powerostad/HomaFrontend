import { useTranslation } from 'react-i18next';
import { HeroSection } from './HeroSection';
import { HomeDecisionSection } from './HomeDecisionSection';

export function HomeIntro({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <nav className="homa-home-nav homa-home-shell" aria-label={t('landing.experience.navigation')}>
        <div>
          <a href="#design-to-shop">{t('landing.experience.nav.designShop')}</a>
          <a href="#how-it-works">{t('landing.experience.nav.how')}</a>
          <a href="#home-examples">{t('landing.experience.nav.examples')}</a>
          <a href="#home-faq">{t('landing.experience.nav.questions')}</a>
        </div>
        <a href="/hosts">{t('landing.experience.nav.hosts')}</a>
      </nav>
      <HeroSection onGetStarted={onStudioStart} />
      <HomeDecisionSection onStudioStart={onStudioStart} />
    </>
  );
}