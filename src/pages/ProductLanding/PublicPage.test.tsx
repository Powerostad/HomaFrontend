import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it } from 'vitest';
import { createPublicI18n } from '@/seo/i18n';
import { SeoProductLandingPage } from './PublicPage';

describe('shared homepage document', () => {
  it.each(['fa', 'en', 'ar', 'tr'])('renders the complete landing in %s without API data', async language => {
    const i18n = createPublicI18n();
    await i18n.changeLanguage(language);
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <I18nextProvider i18n={i18n}><SeoProductLandingPage /></I18nextProvider>
      </StaticRouter>,
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(`<h1>${i18n.t('landing.scroll.headline')}</h1>`);
    expect(html).toContain(i18n.t('landing.scroll.line1Body'));
    expect(html).toContain('href="/studio"');
    for (const scene of ['thought', 'showroom', 'photo', 'result']) {
      expect(html).toContain(`/images/home-story/journey-${scene}-1448.webp`);
    }
    expect(html).toContain('id="shopping-confusion"');
    expect(html).toContain('id="design-steps"');
    expect(html).toContain('id="design-for-you"');
    expect(html.match(/class="hj-panel"/g)).toHaveLength(5);
    expect(html).toContain(i18n.t('landing.buyingJourney.assistant.sample'));
    expect(html).toContain(i18n.t('landing.buyingJourney.design.compare'));
    expect(html).toContain('id="design-to-purchase"');
    expect(html).toContain('href="/hosts"');
    expect(html).toContain('href="/blog/"');
    expect(html).toContain('href="/blog/rug-size-before-pattern"');
    expect(html).toContain('href="/blog/choose-curtains-for-your-room"');
    expect(html).toContain('href="/blog/cozy-bedroom-without-new-bed"');
    expect(html).toContain(`aria-label="${i18n.t('landing.home.compareLabel')} —`);
    expect(html).toContain('id="home-shopping"');
    for (const example of ['wardrobe', 'bathroom', 'curtain', 'wallpaper']) {
      expect(html).toContain(i18n.t(`landing.choices.${example}.name`));
    }
    expect(html).toContain('/images/home-story/wardrobe-after.webp');
    expect(html).not.toMatch(/landing\.(home|hero|decision|experience|accessories|beforeBuying|buyingJourney)\./);
    expect(html).toContain('id="design-to-shop"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain(i18n.t('landing.studioExample.previewTitle'));
    expect(html).toContain(i18n.t('landing.studioExample.previewTitleAccent'));
    expect(html).toContain('/images/home-hero/studio-sample-lohals.webp');
    expect(html).not.toContain('studio-workspace-nav');
    expect(html).toContain('id="home-faq"');
    expect(html.match(/<details>/g)).toHaveLength(4);
  });
});
