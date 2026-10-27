// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { StudioProductSheet } from './StudioProductSheet';
import { fetchProduct } from '@/services/productService';
import type { APIProduct } from '@/types/apiProduct';

vi.mock('@/services/productService', () => ({ fetchProduct: vi.fn() }));
vi.mock('@/components/figma/AuthenticatedImage', () => ({ AuthenticatedImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h3>{children}</h3>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ i18n: { dir: () => 'rtl', language: 'fa' },
  t: (_key: string, fallback: string) => fallback || _key }) }));

const product = { id: 'one', uniqueLink: 'one', name: 'ست روتختی', category: 'روتختی', price: 20000,
  image: 'https://merchant.test/cover.jpg?v=1', description: 'VISION_TEXT_MUST_NOT_APPEAR', persianReason: 'برای هماهنگی با اتاق شما' };
const props = { product, isOpen: true, onClose: vi.fn(), isAlternative: false, onMakePrimary: vi.fn(), isInBasket: false, onToggleBasket: vi.fn() };

describe('merchant product details', () => {
  it('shows every source specification and photo, separate from design reasoning', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.mocked(fetchProduct).mockResolvedValue({ success: true, data: { id: 'one', shopName: 'فروشگاه مرجع',
      galleryImages: ['https://merchant.test/cover.jpg', 'https://merchant.test/back.jpg', 'https://merchant.test/detail.jpg'],
      merchantDetails: { description: 'توضیحات اصلی فروشنده', specifications: Array.from({ length: 12 }, (_, i) => ({ label: `ویژگی ${i}`, value: `مقدار ${i}` })) },
    } as APIProduct });
    const node = document.createElement('div'); const root = createRoot(node);
    try {
      await act(async () => root.render(<StudioProductSheet {...props} />));
      expect(node.querySelectorAll('dl > div')).toHaveLength(12);
      expect(node.textContent).toContain('توضیحات اصلی فروشنده');
      expect(node.textContent).toContain('در طرح شما');
      expect(node.textContent).not.toContain('VISION_TEXT_MUST_NOT_APPEAR');
      const thumbnails = node.querySelectorAll<HTMLButtonElement>('.studio-merchant-thumbnails button');
      expect(thumbnails).toHaveLength(3);
      await act(async () => thumbnails[2].click());
      expect(node.querySelector('.studio-selection-sheet-image')?.getAttribute('src')).toBe('https://merchant.test/detail.jpg');
      expect(thumbnails[2].getAttribute('aria-pressed')).toBe('true');
      expect(fetchProduct).toHaveBeenCalledWith('one', { signal: expect.any(AbortSignal) });
    } finally { await act(async () => root.unmount()); }
  });

  it('keeps purchase controls and a retry on detail failure without exposing vision text', async () => {
    vi.mocked(fetchProduct).mockResolvedValue({ success: false });
    const node = document.createElement('div'); const root = createRoot(node);
    try {
      await act(async () => root.render(<StudioProductSheet {...props} />));
      expect(node.textContent).toContain('مشخصات کامل محصول بارگذاری نشد');
      expect(node.textContent).not.toContain('VISION_TEXT_MUST_NOT_APPEAR');
      const retry = Array.from(node.querySelectorAll('button')).find(button => button.textContent === 'تلاش دوباره')!;
      const before = vi.mocked(fetchProduct).mock.calls.length;
      await act(async () => retry.click());
      expect(vi.mocked(fetchProduct).mock.calls.length).toBe(before + 1);
    } finally { await act(async () => root.unmount()); }
  });
});
