// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { createPublicI18n } from '@/seo/i18n';
import { HomeDecisionSection } from './HomeDecisionSection';

let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(() => {
  if (root) flushSync(() => root?.unmount());
  container?.remove();
});

describe('homepage design and shopping preview', () => {
  it('keeps the chosen item across stages and explains the seller handoff', () => {
    const i18n = createPublicI18n();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    flushSync(() => root?.render(<MemoryRouter><I18nextProvider i18n={i18n}><HomeDecisionSection /></I18nextProvider></MemoryRouter>));
    const stages = container.querySelectorAll<HTMLButtonElement>('[role=group] button');
    expect(stages[0].getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain(i18n.t('landing.experience.panels.design.prompt'));
    flushSync(() => stages[1].click());
    const hotspots = container.querySelectorAll<HTMLButtonElement>('.homa-home-hotspot');
    flushSync(() => hotspots[2].click());
    expect(hotspots[2].getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.homa-home-item-explanation')?.textContent).toBe(i18n.t('landing.experience.items.curtain.reason'));
    expect(container.querySelectorAll('.homa-home-item-options button[aria-pressed=true]')).toHaveLength(1);
    flushSync(() => stages[2].click());
    expect(container.textContent).toContain(i18n.t('landing.experience.panels.shop.seller'));
    expect(container.querySelectorAll('.homa-home-hotspot')).toHaveLength(0);
    expect(container.textContent).toContain(i18n.t('landing.experience.commerce.realProject'));
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/studio');
    flushSync(() => stages[1].click());
    expect(container.querySelectorAll<HTMLButtonElement>('.homa-home-hotspot')[2].getAttribute('aria-pressed')).toBe('true');
  });
});
