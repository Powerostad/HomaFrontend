import { useTranslation } from 'react-i18next';
import '../../styles/information.css';

type PageId = 'support' | 'privacy' | 'terms';
interface InformationContent {
  title: string;
  summary: string;
  sections: { title: string; paragraphs: string[] }[];
}

export function InformationPage({ page }: { page: PageId }) {
  const { t, i18n } = useTranslation('information');
  const language = i18n.language.startsWith('en') ? 'en' : 'fa';
  const content = t(page, { returnObjects: true }) as InformationContent;
  return (
    <div className="homa-information" lang={language} dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <header>
        <a href="/" className="homa-information-brand" dir="ltr">{t('brand')}</a>
        <a href={`/?lang=${language}`}>{t('home')}</a>
        <a href={`/${page}?lang=${language === 'fa' ? 'en' : 'fa'}`} lang={language === 'fa' ? 'en' : 'fa'}>{language === 'fa' ? 'English' : 'فارسی'}</a>
      </header>
      <nav aria-label={t('navigation')}>
        {(['support', 'privacy', 'terms'] as const).map((id) => (
          <a key={id} href={`/${id}?lang=${language}`} aria-current={id === page ? 'page' : undefined}>
            {t(`${id}Label`)}
          </a>
        ))}
      </nav>
      <main>
        <h1>{content.title}</h1>
        <p className="homa-information-summary">{content.summary}</p>
        {page !== 'support' && <p className="homa-information-notice">{t('draftNotice')}</p>}
        <p className="homa-information-scope">{t('scope')}</p>
        {content.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((text) => <p key={text}>{text}</p>)}
          </section>
        ))}
      </main>
      <footer>
        <p>{t('contact')}: <a href="mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM" dir="ltr">FARBOD.LOTFI@PARSMEHRAGRO.COM</a></p>
        <p>{t('updated')}</p>
      </footer>
    </div>
  );
}
