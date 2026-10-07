import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import copy from '../../i18n/locales/information.fa.json';
import { InformationPage } from './Page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: keyof typeof copy) => copy[key] }),
}));

describe('public HOMA information pages', () => {
  for (const page of ['support', 'privacy', 'terms'] as const) {
    it(`renders ${page} with public navigation and contact details`, () => {
      const html = renderToStaticMarkup(<InformationPage page={page} />);
      expect(html).toContain(`<h1>${copy[page].title}</h1>`);
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM');
      for (const route of ['support', 'privacy', 'terms']) {
        expect(html).toContain(`href="/${route}"`);
      }
      expect(html.includes(copy.draftNotice)).toBe(page !== 'support');
      expect(html).not.toContain('مواردی که پیش از نهایی‌شدن باید تکمیل شوند');
    });
  }
  it('does not misrepresent proposed retention as an active deletion guarantee', () => {
    const html = renderToStaticMarkup(<InformationPage page="privacy" />);
    expect(html).toContain('نه اعلام وضعیت فعلی یا تضمین حذف خودکار');
    expect(html).toContain('۳۰ روز');
    expect(html).toContain('۶ ماه');
  });
});
