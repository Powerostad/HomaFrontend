// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { StudioImage } from './StudioImage';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it('renews an unreadable signed image once and never starts generation', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container); const onRefresh = vi.fn();
  await act(async () => root.render(<StudioImage image="/saved.png" versionKey="rh1" alt="design" onRefresh={onRefresh} />));
  act(() => { container.querySelector('img')!.dispatchEvent(new Event('error')); });
  expect(onRefresh).toHaveBeenCalledOnce(); expect(container.querySelector('[role=alert]')).not.toBeNull();
  await act(async () => root.render(<StudioImage image="/saved.png?renewed" versionKey="rh1" alt="design" onRefresh={onRefresh} />));
  act(() => { container.querySelector('img')!.dispatchEvent(new Event('error')); });
  expect(onRefresh).toHaveBeenCalledOnce();
  act(() => { container.querySelector('img')!.dispatchEvent(new Event('load')); });
  expect(container.querySelector('[role=alert]')).toBeNull();
  await act(async () => root.unmount());
});
