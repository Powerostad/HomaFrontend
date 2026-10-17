// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DesktopHeroPanel, type HeroMarker } from './HeroImagePanel';

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
