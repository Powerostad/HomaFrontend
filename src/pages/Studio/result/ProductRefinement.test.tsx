// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductRefinement } from './ProductRefinement';
import type { Product } from '../components/ProductDetailSheet';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, args?: { name?: string }) => args?.name ? `About ${args.name}` : key, i18n:{ dir:() => 'rtl' } }) }));
const product: Product = { id:'rug/7', name:'Warm rug', image:'', price:100, category:'rug' };
let root: Root;
let container: HTMLDivElement;
const submit = vi.fn(async () => true);
beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  submit.mockReset().mockResolvedValue(true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(<ProductRefinement product={product} busy={false} onSubmit={submit} />));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const click = async (key: string) => { await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === `studioProductEdit.${key}`)!.click()); };
async function type(text: string) {
  await act(async () => {
    const input = container.querySelector('textarea')!;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles:true }));
  });
}
describe('product-specific request', () => {
  it('opens, prefills a replacement and cancels without sending; reopening preserves the draft', async () => {
    await click('title');
    expect(container.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
    await click('alternative');
    expect(submit).not.toHaveBeenCalled();
    await click('cancel'); await click('title');
    expect(container.querySelector('textarea')!.value).toBe('studioProductEdit.alternative');
    expect(submit).not.toHaveBeenCalled();
  });
  it('sends the selected product and only visible context plus the user text', async () => {
    await click('title'); await type('Lighter color\n  wood'); await click('send');
    expect(submit).toHaveBeenCalledExactlyOnceWith(product, 'About Warm rug\nLighter color\n  wood');
    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('[role=status]')?.textContent).toBe('studioProductEdit.sent');
  });
  it('keeps the request editable after a rejection or transport error and blocks empty input', async () => {
    await click('title'); await type('  ');
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true })));
    expect(submit).not.toHaveBeenCalled();
    await type('Not this rug'); submit.mockRejectedValueOnce(new Error('offline')); await click('send');
    expect(container.querySelector('textarea')!.value).toBe('Not this rug');
    expect(container.querySelector('[role=alert]')).not.toBeNull();
  });
  it('prevents duplicate submissions and disables actions while another turn is busy', async () => {
    await click('title'); await type('Smaller rug');
    let resolve!: (value:boolean) => void;
    submit.mockImplementationOnce(() => new Promise<boolean>(done => { resolve = done; }));
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    });
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => resolve(false));
    expect(container.querySelector('textarea')!.value).toBe('Smaller rug');
    await act(async () => root.render(<ProductRefinement product={product} busy onSubmit={submit} />));
    expect(container.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
  });
});
