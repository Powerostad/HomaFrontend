import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { languages, updateDocumentLanguage } from '@/i18n/config';

export function HomeNavigation({ utilities }: { utilities?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [overPhoto, setOverPhoto] = useState(true);
  useEffect(() => {
    const update = () => setOverPhoto(window.scrollY < window.innerHeight * .82);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const links = [
    ['#buying-problem', t('landing.experience.nav.designShop')],
    ['#design-steps', t('landing.experience.nav.how')],
    ['/blog/', t('landing.experience.examples.all')],
    ['/hosts', t('landing.experience.nav.hosts')],
    ['#pricing', t('landing.experience.nav.pricing')],
  ];
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <header className={'homa-editorial-header' + (overPhoto ? ' is-over-photo' : '')}>
      <a href="/" className="homa-editorial-brand" aria-label="HOMA">HOMA</a>
      <nav className="homa-editorial-desktop-nav" aria-label={t('landing.experience.navigation')}>
        {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <div className="homa-editorial-utilities">
        <span className="homa-editorial-account">{utilities}</span>
        <Dialog.Trigger className="homa-editorial-menu-trigger" aria-label={t('nav.menu')}><Menu size={25} strokeWidth={1.3} /></Dialog.Trigger>
      </div>
    </header>
    <Dialog.Portal>
      <Dialog.Overlay className="homa-editorial-menu-overlay" />
      <Dialog.Content className="homa-editorial-menu" aria-describedby={undefined} dir={['fa', 'ar'].includes(i18n.language) ? 'rtl' : 'ltr'}>
        <div className="homa-editorial-menu-top"><span className="homa-editorial-brand">HOMA</span><Dialog.Close aria-label={t('common.close')}><X size={28} strokeWidth={1.2} /></Dialog.Close></div>
        <Dialog.Title className="sr-only">{t('nav.menu')}</Dialog.Title>
        <nav aria-label={t('landing.experience.navigation')}>
          {[...links, ['#home-faq', t('landing.experience.nav.questions')], ['/studio', t('landing.experience.start')]].map(([href, label]) =>
            <Dialog.Close key={href} asChild><a href={href}>{label}<ArrowLeft size={25} strokeWidth={1.2} /></a></Dialog.Close>)}
        </nav>
        <div className="homa-editorial-menu-bottom">
          <select aria-label={t('language.select')} value={i18n.language} onChange={event => {
            const language = event.currentTarget.value;
            const url = new URL(window.location.href);
            url.searchParams.set('lang', language);
            window.history.replaceState(window.history.state, '', url);
            void i18n.changeLanguage(language);
            updateDocumentLanguage(language);
          }}>{languages.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}</select>
          <a href="/account/gallery">{t('nav.myProjects')}</a><a href="/basket">{t('basket.title')}</a><a href="/support">{t('landing.experience.faq.support')}</a>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
