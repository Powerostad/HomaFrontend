// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { englishSiteCopy, useSiteTranslation } from './siteCopy';
import extra from './locales/site.en.json';
import fa from './locales/fa.json';
import en from './locales/en.json';
import { FAQPage } from '../pages/FAQ/Page';
import { ContactPage } from '../pages/Contact/Page';
import { OptionalUserNoteInput } from '../pages/RoomRedesign/intake/OptionalUserNoteInput';
import { INTAKE_COPY } from '../pages/RoomRedesign/intake/intakeCopy';
import { translateUiTree } from './siteDictionary';
import { seoFa } from '../seo/content';
import ts from 'typescript';

vi.mock('../components/Header', () => ({ Header: () => null }));
vi.mock('../components/Footer', () => ({ Footer: () => null }));
vi.mock('../hooks/useSeo', () => ({ useSeo: () => undefined }));

async function language(lng: string) {
  const instance = createInstance();
  await instance.use(initReactI18next).init({ lng, fallbackLng: 'fa', resources: { fa: { translation: fa }, en: { translation: en } }, interpolation: { escapeValue: false }, react: { useSuspense: false } });
  return instance;
}
let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(() => { if (root) flushSync(() => root?.unmount()); root = undefined; container?.remove(); });

describe('complete UI localization', () => {
  it('covers every explicit UI-copy call across all source routes', () => {
    const missing: string[] = [];
    const files = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
      for (const [file, content] of Object.entries(files)) {
        if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
        const sf = ts.createSourceFile(file, content as string, ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node) => {
          if (ts.isCallExpression(node) && node.expression.getText(sf) === 'siteText' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
            const key = node.arguments[0].text.replace(/\s+/g, ' ').trim();
            if (/[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/.test(key) && !englishSiteCopy[key]) missing.push(`${file}: ${key}`);
          }
          ts.forEachChild(node, visit);
        };
        visit(sf);
      }
    expect(missing).toEqual([]);
  });
  it('translates every static SEO guide and leaves protocol paths intact', () => {
    const translated = translateUiTree(seoFa);
    expect(JSON.stringify(translated)).not.toMatch(/[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/);
    expect(translated.articles['/ai-interior-design'].cta?.href).toBe('/studio');
  });
  it('preserves every interpolation variable and contains English-only custom translations', () => {
    for (const [source, target] of Object.entries(extra)) {
      expect(target, source).toBeTruthy();
      expect(target, source).not.toMatch(/[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/);
      expect((target.match(/{{[^}]+}}/g) || []).sort(), source).toEqual((source.match(/{{[^}]+}}/g) || []).sort());
    }
  });
  it('covers all intake copy including placeholders and accessibility labels', () => {
    const check = (value: unknown) => {
      if (typeof value === 'string') expect(englishSiteCopy[value], value).toBeTruthy();
      else if (value && typeof value === 'object') Object.values(value).forEach(check);
    };
    check(INTAKE_COPY);
  });
  for (const Page of [FAQPage, ContactPage]) {
    it(`renders ${Page.name} in English using the provider language`, async () => {
      const instance = await language('en');
      const html = renderToStaticMarkup(<I18nextProvider i18n={instance}><Page /></I18nextProvider>);
      expect(html).toContain('dir="ltr"');
      expect(html).not.toMatch(/[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/);
    });
  }
  it('translates the existing form in place without altering user input', async () => {
    const instance = await language('fa');
    function Form() {
      const [note, setNote] = useState('متن شخصی کاربر');
      const { siteText } = useSiteTranslation();
      return <><OptionalUserNoteInput value={note} onChange={setNote} /><span>{siteText('{{v0}} روز پیش', { v0: 3 })}</span></>;
    }
    container = document.createElement('div'); document.body.append(container);
    root = createRoot(container);
    flushSync(() => root?.render(<I18nextProvider i18n={instance}><Form /></I18nextProvider>));
    const textarea = container.querySelector('textarea')!;
    expect(textarea.placeholder).toBe(INTAKE_COPY.review.notePlaceholder);
    await instance.changeLanguage('en');
    flushSync(() => root?.render(<I18nextProvider i18n={instance}><Form /></I18nextProvider>));
    expect(container.querySelector('textarea')).toBe(textarea);
    expect(textarea.value).toBe('متن شخصی کاربر');
    expect(textarea.placeholder).toBe(englishSiteCopy[INTAKE_COPY.review.notePlaceholder]);
    expect(container.textContent).toContain('3 days ago');
  });
});
