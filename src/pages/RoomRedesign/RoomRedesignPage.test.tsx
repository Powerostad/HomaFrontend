// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RoomRedesignPage } from './RoomRedesignPage';

vi.mock('@/components/Header', () => ({ Header: () => <header>Shared HOMA header</header> }));
vi.mock('./components/SessionDiagnostics', () => ({ SessionDiagnostics: () => <button>diagnostics</button> }));
vi.mock('./components/workspace', () => ({ ImageToolbar: () => null, useImageActions: () => ({ modals: null }) }));
vi.mock('./components/ExecutionPanel', () => ({ ExecutionPanel: () => <div>Canonical report</div> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'rtl', language: 'fa' } }) }));
vi.mock('./hooks/useRedesignChat', () => ({ useRedesignChat: () => ({ sessionId: 'saved', messages: [], chipGroups: [],
  versions: [{ version_id: 'v1', execution: { purchases: [] } }], originalImage: 'photo.jpg', selectedVersion: undefined,
  viewedId: 'original', busy: false, error: null, status: 'idle', selectVersion: vi.fn(), sendTurn: vi.fn(), selectChip: vi.fn() }) }));

describe('single Studio workspace', () => {
  it('keeps one mounted composer when switching to the latest report while viewing the original photo', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={['/studio/chat/saved']}><Routes><Route path="/studio/chat/:sessionId" element={<RoomRedesignPage />} /></Routes></MemoryRouter>));
      const composer = container.querySelector('textarea');
      expect(container.querySelectorAll('textarea')).toHaveLength(1);
      const plan = container.querySelector<HTMLButtonElement>('[role=tab][data-state=inactive]')!;
      await act(async () => plan.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
      expect(container.textContent).toContain('Canonical report');
      expect(container.querySelector('textarea')).toBe(composer);
      expect(container.querySelector('.redesign-conversation')?.hasAttribute('hidden')).toBe(true);
    } finally { await act(async () => root.unmount()); }
  });
});
