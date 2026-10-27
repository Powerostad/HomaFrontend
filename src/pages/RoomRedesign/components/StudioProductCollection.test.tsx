// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionPlan } from '../services/redesignChatService';
import { StudioProductCollection } from './StudioProductCollection';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value, siteText: (value: string) => value }) }));
vi.mock('react-i18next', async importOriginal => ({
  ...await importOriginal<typeof import('react-i18next')>(),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fa' } }),
}));
const items: ExecutionPlan['purchases'] = [
  { item_id: 'lamp', category: 'lighting', quantity: 1, reason_fa: 'Warm light', relation: 'similar',
    product: { product_id: 1, name: 'Lamp', price_rial: null, merchant_url: 'javascript:alert(1)' },
    alternatives: [{ product_id: 2, name: 'Alternative', merchant_url: 'https://example.com/product' }] },
  { item_id: 'rug', category: 'rugs', quantity: 1, reason_fa: 'Texture', relation: 'concept', product: null, alternatives: [] },
];

describe('Studio product collection', () => {
  it('filters locally and keeps preview actions attached to the correct item and product', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const preview = vi.fn();
    const render = (busy = false) => root.render(<StudioProductCollection items={items} busy={busy} onPreview={preview} />);
    try {
      await act(async () => render());
      expect(container.querySelectorAll('article')).toHaveLength(2);
      expect(container.textContent).toContain('studioCollection.noPhoto');
      expect(container.textContent).toContain('redesignJourney.unpriced');
      expect(container.querySelector('a[href^="javascript"]')).toBeNull();
      const lighting = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'lighting')!;
      await act(async () => lighting.click());
      expect(container.querySelectorAll('article')).toHaveLength(1);
      expect(preview).not.toHaveBeenCalled();
      const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.studio-product-actions button, .studio-swap-option'));
      await act(async () => buttons[1].click());
      expect(preview).toHaveBeenCalledWith('lamp', 2);
      await act(async () => render(true));
      expect(Array.from(container.querySelectorAll<HTMLButtonElement>('.studio-product-actions button, .studio-swap-option')).every(button => button.disabled)).toBe(true);
    } finally { await act(async () => root.unmount()); }
  });
  it('does not carry an empty category filter into a different version', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
      await act(async () => root.render(<StudioProductCollection items={items} busy={false} onPreview={vi.fn()} />));
      await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'lighting')!.click());
      await act(async () => root.render(<StudioProductCollection items={[items[1]]} busy={false} onPreview={vi.fn()} />));
      expect(container.querySelectorAll('article')).toHaveLength(1);
      expect(container.textContent).toContain('rugs');
    } finally { await act(async () => root.unmount()); }
  });
});
