// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ConversationPanel } from './ConversationPanel';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t:(key:string) => key }) }));
describe('chat composer', () => {
  it('keeps the next draft editable but prevents duplicate sends while processing', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const onSend = vi.fn();
    try {
      await act(async () => root.render(<ConversationPanel messages={[]} chipGroups={[]} busy statusText="Working" value="My next change" onChange={() => undefined} onSend={onSend} onSelectChip={() => undefined} />));
      const input = container.querySelector('textarea')!;
      expect(input.value).toBe('My next change');
      expect(input.disabled).toBe(false);
      expect(container.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
      await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true })));
      expect(onSend).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
});
