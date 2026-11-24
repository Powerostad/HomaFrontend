// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { createPublicI18n } from '@/seo/i18n';
import { HomeHero } from './HomeHero';

let root: Root;
let container: HTMLDivElement;
afterEach(() => {
  flushSync(() => root.unmount());
  container.remove();
});

function renderHero() {
  const onStart = vi.fn();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  flushSync(() => root.render(<MemoryRouter><I18nextProvider i18n={createPublicI18n()}><HomeHero onStudioStart={onStart} /></I18nextProvider></MemoryRouter>));
  return onStart;
}

describe('hero space gallery', () => {
  it('compares the supplied pair and resets to after when switching spaces', () => {
    renderHero();
    const slides = container.querySelectorAll<HTMLButtonElement>('.hh-slides button');
    flushSync(() => slides[1].click());
    expect(container.querySelector('img')?.src).toContain('bedroom-after.webp');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/studio?room=bedroom');
    flushSync(() => container.querySelector<HTMLButtonElement>('.hh-comparison button')?.click());
    expect(container.querySelector('img')?.src).toContain('bedroom-before.webp');
    flushSync(() => slides[2].click());
    expect(container.querySelector('img')?.src).toContain('living-after.webp');
    expect(container.querySelectorAll('.hh-slides [aria-pressed=true]')).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('wraps navigation and keeps the host and studio destinations distinct', () => {
    const onStart = renderHero();
    flushSync(() => container.querySelector<HTMLButtonElement>('.hh-arrows button')?.click());
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/hosts');
    flushSync(() => container.querySelector<HTMLAnchorElement>('a')?.click());
    expect(onStart).not.toHaveBeenCalled();
    flushSync(() => container.querySelectorAll<HTMLButtonElement>('.hh-arrows button')[1].click());
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/studio');
    flushSync(() => container.querySelector<HTMLAnchorElement>('a')?.click());
    expect(onStart).toHaveBeenCalledOnce();
  });
});
