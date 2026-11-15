// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedImage } from './AuthenticatedImage';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (v: unknown) => v, siteText: (v: string) => v }) }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('direct product image loading', () => {
  let root: ReturnType<typeof createRoot>;
  afterEach(() => { act(() => root?.unmount()); document.body.replaceChildren(); });

  it('keeps a lazy image in layout before load, then clears loading state', () => {
    const host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const onLoad = vi.fn();
    act(() => root.render(<AuthenticatedImage src="https://cdn.example/products/table.jpg" alt="table" loading="lazy" onLoad={onLoad} />));
    const img = host.querySelector('img')!;
    expect(img.loading || img.getAttribute('loading')).toBe('lazy');
    expect(img.style.display).not.toBe('none');
    expect(img.getAttribute('aria-busy')).toBe('true');
    act(() => img.dispatchEvent(new Event('load')));
    expect(img.getAttribute('aria-busy')).toBe('false');
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it('recovers when a failed URL is replaced', () => {
    const host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<AuthenticatedImage src="/broken.jpg" alt="table" />));
    act(() => host.querySelector('img')!.dispatchEvent(new Event('error')));
    act(() => root.render(<AuthenticatedImage src="/fixed.jpg" alt="table" loading="lazy" />));
    expect(host.querySelector('img')!.getAttribute('src')).toBe('/fixed.jpg');
    expect(host.querySelector('img')!.style.display).not.toBe('none');
  });
});
