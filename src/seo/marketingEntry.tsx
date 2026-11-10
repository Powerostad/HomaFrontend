import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { I18nextProvider } from 'react-i18next';
import { SeoProductLandingPage } from '../pages/ProductLanding/PublicPage';
import { HostsLandingContent } from '../pages/ProductLanding/HostsLandingContent';
import { PublicChromeHeader } from './PublicChrome';
import { Footer } from '../components/Footer';
import { createPublicI18n } from './i18n';
import { escapeHtml } from './metadata';
import { AppProvider } from '../context/AppContext';
import { ContactPage } from '../pages/Contact/Page';
import { FAQPage } from '../pages/FAQ/Page';
import { CollaborationPage } from '../pages/Collaboration/Page';

const pages = {
  '/': { title: 'هما؛ طراحی داخلی خانه با هوش مصنوعی', description: 'عکس فضای خود را به هما بده؛ طراحی متناسب با اتاق، ایده‌های چیدمان و پیشنهاد محصولات را یکجا ببین.' },
  '/hosts': { title: 'طراحی اقامتگاه برای میزبان‌ها | هُما', description: 'از عکس آگهی تا راحتی مهمان؛ طراحی فضای اقامتگاه با هما.' },
  '/contact': { title: 'تماس با هما', description: 'راه‌های تماس با پشتیبانی استودیو و تیم هما.' },
  '/faq': { title: 'سؤال‌های متداول هما', description: 'پاسخ پرسش‌های رایج دربارهٔ طراحی، تصاویر و استفاده از هما.' },
  '/collaboration': { title: 'همکاری با هما', description: 'درخواست همکاری فروشگاه‌ها و برندها با هما.' },
};

/** Existing public components only; never catalogues or user sessions. */
export function renderMarketingDocument(path: keyof typeof pages, template: string) {
  const page = pages[path];
  const i18n = createPublicI18n();
  const content = path === '/' ? <SeoProductLandingPage /> : path === '/hosts' ? <><PublicChromeHeader /><div className="h-[64px] md:h-[80px]" /><main><HostsLandingContent /></main><Footer /></> : path === '/contact' ? <ContactPage staticDocument /> : path === '/faq' ? <FAQPage staticDocument /> : <CollaborationPage staticDocument />;
  const markup = renderToStaticMarkup(<StaticRouter location={path}><I18nextProvider i18n={i18n}><AppProvider>{content}</AppProvider></I18nextProvider></StaticRouter>);
  const canonical = `https://myhoma.ir${path}`;
  const schema = JSON.stringify([{ '@context': 'https://schema.org', '@type': 'Organization', name: 'HOMA | هما', url: 'https://myhoma.ir', logo: 'https://myhoma.ir/icons/homa-icon-512.png' }, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'HOMA | هما', url: 'https://myhoma.ir', inLanguage: 'fa-IR' }]).replace(/</g, '\\u003c');
  const head = `<title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://myhoma.ir/images/seo/homa-preview.png"><meta name="twitter:card" content="summary_large_image">${path === '/' ? `<script type="application/ld+json">${schema}</script>` : ''}`;
  return template.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta[^>]+(?:name="description"|property="og:[^"]+")[^>]*>/gi, '').replace(/<link[^>]+rel="canonical"[^>]*>/gi, '').replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
}
