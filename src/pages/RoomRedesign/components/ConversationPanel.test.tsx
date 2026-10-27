// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ConversationPanel } from './ConversationPanel';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t:(key:string) => key }) }));
describe('chat composer', () => {
  it('never describes a failed or idle opening as still processing', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const props = { messages: [], chipGroups: [], statusText: 'Working', value: '',
      onChange: () => undefined, onSend: () => undefined, onSelectChip: () => undefined };
    try {
      await act(async () => root.render(<ConversationPanel {...props} busy={false} failed />));
      expect(container.textContent).toContain('studioChat.emptyChatFailed');
      expect(container.textContent).not.toContain('studioChat.emptyChatProcessing');
      expect(container.querySelector('[role=status]')).toBeNull();
      await act(async () => root.render(<ConversationPanel {...props} busy failed />));
      expect(container.textContent).toContain('studioChat.emptyChatProcessing');
      expect(container.textContent).not.toContain('studioChat.emptyChatFailed');
      await act(async () => root.render(<ConversationPanel {...props} busy={false} />));
      expect(container.textContent).not.toContain('studioChat.emptyChatProcessing');
      expect(container.textContent).not.toContain('studioChat.emptyChatFailed');
    } finally { await act(async () => root.unmount()); }
  });
  it('fills the editable composer from first-use examples without sending', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const onChange = vi.fn();
    const onSend = vi.fn();
    try {
      await act(async () => root.render(<ConversationPanel messages={[]} chipGroups={[]} busy={false} statusText="" value="" onChange={onChange} onSend={onSend} onSelectChip={vi.fn()} />));
      const examples = container.querySelectorAll('.studio-edit-examples-options button');
      expect(examples).toHaveLength(3);
      await act(async () => (examples[0] as HTMLButtonElement).click());
      expect(onChange).toHaveBeenCalledWith('studio.v9.editExampleColor');
      expect(onSend).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
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
