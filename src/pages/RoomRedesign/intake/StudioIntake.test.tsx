// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioIntake } from './StudioIntake';

const flow = vi.hoisted(() => ({ image: null as null | { dataUrl: string }, preparing: false, imageTooSmall: false,
  error: null, roomType: undefined, goals: new Set(), note: '', pickImage: vi.fn(), setNote: vi.fn(),
  setRoomType: vi.fn(), toggleGoal: vi.fn(), buildPayload: vi.fn() }));
vi.mock('./useIntakeFlow', () => ({ useIntakeFlow: () => flow }));
vi.mock('@/components/Header', () => ({ Header: () => <header>Shared HOMA header</header> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'rtl' } }) }));
afterEach(() => { vi.clearAllMocks(); flow.image = null; flow.preparing = false; });

describe('photo-first Studio entry', () => {
  it('has a shared header and photo upload, with no second chat composer', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); const root = createRoot(container);
    const onStart = vi.fn();
    try {
      await act(async () => root.render(<MemoryRouter><StudioIntake onStartAnalysis={onStart} /></MemoryRouter>));
      expect(container.querySelectorAll('header')).toHaveLength(1);
      expect(container.querySelector('textarea')).toBeNull();
      expect(container.querySelectorAll('input[type=file]')).toHaveLength(2);
      expect(onStart).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
  it('submits the original typed intake contract only on explicit confirmation', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    flow.image = { dataUrl: 'data:image/jpeg;base64,photo' };
    const payload = { image: flow.image, roomType: 'living_room', goals: ['warmer'], userNote: 'keep the rug', createdAt: 'now' };
    flow.buildPayload.mockReturnValue(payload);
    const onStart = vi.fn(); const container = document.createElement('div'); const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter><StudioIntake onStartAnalysis={onStart} /></MemoryRouter>));
      expect(onStart).not.toHaveBeenCalled();
      await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(onStart).toHaveBeenCalledWith({ ...payload, prefsUpdate: { room_type: 'living_room', goals: ['warmer'], preserved_items: undefined, style: undefined } });
      flow.preparing = true;
      await act(async () => root.render(<MemoryRouter><StudioIntake onStartAnalysis={onStart} /></MemoryRouter>));
      await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(onStart).toHaveBeenCalledTimes(1);
    } finally { await act(async () => root.unmount()); }
  });
});
