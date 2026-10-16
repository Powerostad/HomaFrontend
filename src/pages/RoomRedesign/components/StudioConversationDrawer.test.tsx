// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { StudioConversationDrawer } from './StudioConversationDrawer';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'rtl' } }) }));
vi.mock('./ConversationPanel', () => ({ ConversationPanel: () => <textarea aria-label="Message" /> }));

it('keeps the mobile composer inside the visual viewport and removes keyboard listeners on close', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const viewport = Object.assign(new EventTarget(), { height: 768, offsetTop: 0 });
  const remove = vi.spyOn(viewport, 'removeEventListener');
  const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = { compact: true, onOpenChange: vi.fn(), messages: [], chipGroups: [], busy: false,
    statusText: '', value: '', onChange: vi.fn(), onSend: vi.fn(), onSelectChip: vi.fn() };
  try {
    await act(async () => root.render(<StudioConversationDrawer {...props} open />));
    const drawer = document.querySelector<HTMLDivElement>('.studio-conversation-drawer')!;
    expect(document.activeElement).not.toBe(drawer.querySelector('textarea'));
    viewport.height = 420;
    await act(async () => viewport.dispatchEvent(new Event('resize')));
    expect(drawer.style.getPropertyValue('--studio-visible-height')).toBe('420px');
    expect(drawer.style.getPropertyValue('--studio-keyboard-offset')).toBe(`${Math.max(0, window.innerHeight - 420)}px`);
    await act(async () => root.render(<StudioConversationDrawer {...props} open={false} />));
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['resize', 'scroll']));
  } finally {
    await act(async () => root.unmount());
    container.remove();
    if (original) Object.defineProperty(window, 'visualViewport', original);
    else Reflect.deleteProperty(window, 'visualViewport');
  }
});
