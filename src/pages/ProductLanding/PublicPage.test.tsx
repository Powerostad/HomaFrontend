import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it } from 'vitest';
import { createPublicI18n } from '@/seo/i18n';
import { ProductLandingContent } from './PublicPage';

describe('shared homepage document', () => {
  it.each(['fa', 'en', 'ar', 'tr'])('renders the complete landing in %s without API data', async language => {
    const i18n = createPublicI18n();
    await i18n.changeLanguage(language);
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <I18nextProvider i18n={i18n}><ProductLandingContent /></I18nextProvider>
      </StaticRouter>,
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('href="/studio"');
    expect(html).toContain('href="/studio?room=bedroom"');
    expect(html).toContain('href="/hosts"');
    expect(html).toContain('href="/blog/"');
    expect(html).toContain('href="/blog/rug-size-before-pattern"');
    expect(html).toContain('href="/blog/choose-curtains-for-your-room"');
    expect(html).toContain('href="/blog/cozy-bedroom-without-new-bed"');
    expect(html).toContain(`aria-label="${i18n.t('landing.home.compareLabel')}"`);
    expect(html).not.toMatch(/landing\.(home|hero|decision|experience)\./);
    expect(html).toContain('id="design-to-shop"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain('id="home-faq"');
    expect(html.match(/<details>/g)).toHaveLength(4);
  });
});
