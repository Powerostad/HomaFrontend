// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { DesktopHeroPanel, MobileHeroSection, type HeroMarker } from './HeroImagePanel';

vi.mock('@/analytics/events', () => ({ trackStudioResultAction: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value, siteText: (value: string) => value, siteDirection: () => 'rtl' }) }));
vi.mock('./types', () => ({ useSimpleTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
vi.mock('@/components/figma/AuthenticatedImage', () => ({ AuthenticatedImage: () => <img alt="room" /> }));

function render(markers: HeroMarker[], showOriginal = false) {
  return renderToStaticMarkup(<DesktopHeroPanel resultImage="render.jpg" originalImage="original.jpg" showOriginal={showOriginal}
    isSaved={false} isDownloading={false} markers={markers} onToggleOriginal={vi.fn()} onToggleSaved={vi.fn()}
    onDownload={vi.fn()} onFullscreen={vi.fn()} onExit={vi.fn()} />);
}

describe('Studio hero marker legend', () => {
  const unplaced: HeroMarker = { itemId: 1, number: 1, label: 'Unplaced recommendation', marker: null };
  const placed: HeroMarker = { itemId: 2, number: 2, label: 'Placed recommendation', marker: { x: 0.5, y: 0.5 } };
  it('does not cover the photo with a legend for recommendations without spatial pins', () => {
    expect(render([unplaced])).not.toContain('studio-hero-marker-legend');
  });
  it('includes only positioned recommendations and hides them on the original photo', () => {
    const html = render([unplaced, placed]);
    expect(html).toContain('studio-hero-marker-legend');
    expect(html).toContain('Placed recommendation');
    expect(html).not.toContain('Unplaced recommendation');
    expect(render([placed], true)).not.toContain('studio-hero-marker-legend');
    expect(render([placed], true)).not.toContain('class="studio-hero-markers"');
  });
});

describe('mobile room photo', () => {
  async function mount(overrides: Partial<ComponentProps<typeof MobileHeroSection>> = {}) {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const props = { resultImage: 'render.jpg', originalImage: 'original.jpg', showOriginal: false,
      isSaved: false, isDownloading: false, showActions: false,
      onToggleOriginal: vi.fn(), onToggleSaved: vi.fn(), onDownload: vi.fn(), onFullscreen: vi.fn(), onExit: vi.fn(), ...overrides };
    await act(async () => root.render(<MobileHeroSection {...props} />));
    return { container, props, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
  }

  it('opens the photo by tapping it and keeps comparison and exit actions separate', async () => {
    const ui = await mount();
    try {
      const photo = ui.container.querySelector<HTMLButtonElement>('.studio-hero-image-open')!;
      expect(photo.getAttribute('aria-label')).toBe('نمای تمام‌صفحه');
      await act(async () => photo.click());
      expect(ui.props.onFullscreen).toHaveBeenCalledTimes(1);
      const comparison = ui.container.querySelectorAll<HTMLButtonElement>('.studio-hero-before-after button');
      expect(comparison[0].getAttribute('aria-pressed')).toBe('true');
      expect(comparison[1].getAttribute('aria-pressed')).toBe('false');
      await act(async () => comparison[1].click());
      expect(ui.props.onToggleOriginal).toHaveBeenCalledWith(true);
      expect(ui.props.onFullscreen).toHaveBeenCalledTimes(1);
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-hero-toolbar button')!.click());
      expect(ui.props.onExit).toHaveBeenCalledTimes(1);
    } finally { await ui.cleanup(); }
  });

  it('does not offer a generated-image viewer or comparison before an image exists', async () => {
    const ui = await mount({ analysisOnly: true });
    try {
      expect(ui.container.querySelector('.studio-hero-image-open')).toBeNull();
      expect(ui.container.querySelector('.studio-hero-fullscreen')).toBeNull();
      expect(ui.container.querySelector('.studio-hero-before-after')).toBeNull();
      expect(ui.container.textContent).toContain('تحلیل اولیه فضا');
    } finally { await ui.cleanup(); }
  });
});
