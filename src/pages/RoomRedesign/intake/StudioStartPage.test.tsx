// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StudioStartPage } from './StudioStartPage';

const state = vi.hoisted(() => ({ isLoggedIn: false, login: vi.fn(), renderChat: vi.fn(), mountChat: vi.fn(), unmountChat: vi.fn(), payload: { image: { dataUrl: 'original' }, prefsUpdate: { room_type: 'bedroom' }, userNote: 'keep my note' } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state }));
vi.mock('./StudioIntake', () => ({ StudioIntake: ({ onStartAnalysis }: { onStartAnalysis: (v: unknown) => void }) => <div><input defaultValue="draft" /><button onClick={() => onStartAnalysis(state.payload)}>confirm</button></div> }));
vi.mock('@/components/ProtectedRoute', () => ({ ProtectedRoute: () => <div>protected</div> }));
vi.mock('../RoomRedesignPage', () => ({ RoomRedesignPage: (props: unknown) => {
  const navigate = useNavigate();
  useEffect(() => { state.mountChat(); return () => { state.unmountChat(); }; }, []);
  state.renderChat(props); return <><button onClick={() => navigate('/studio/chat/new-session', { replace: true })}>canonicalize</button><button onClick={() => navigate('/studio')}>new design</button></>;
} }));
vi.mock('@/components/AuthModal', () => ({ AuthModal: ({ isOpen, onSuccess, onClose }: { isOpen: boolean; onSuccess: (u: object, t: object) => void; onClose: () => void }) => isOpen ? <div><button onClick={onClose}>cancel</button><button onClick={() => { onSuccess({}, {}); onClose(); }}>sign in</button></div> : null }));

describe('deferred Studio sign-in', () => {
  it('retains the draft on cancellation and hands off the same payload after sign-in closes its modal', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    state.isLoggedIn = false; state.renderChat.mockClear(); state.login.mockImplementation(() => { state.isLoggedIn = true; });
    const container = document.createElement('div'), root = createRoot(container);
    const click = async (text: string) => act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === text)!.click());
    try {
      await act(async () => root.render(<MemoryRouter><StudioStartPage /></MemoryRouter>));
      const originalInput = container.querySelector('input')!; originalInput.value = 'edited draft';
      expect(state.renderChat).not.toHaveBeenCalled();
      await click('confirm'); expect(state.renderChat).not.toHaveBeenCalled(); await click('cancel');
      expect(container.querySelector('input')).toBe(originalInput); expect(originalInput.value).toBe('edited draft');
      await click('confirm'); await click('sign in');
      expect(state.renderChat).toHaveBeenCalledWith({ initialIntake: state.payload });
    } finally { await act(async () => root.unmount()); }
  });
  it.each(['/studio', '/studio/hosts'])('keeps the active chat mounted while %s becomes its canonical session URL', async entry => {
    state.isLoggedIn = true; state.mountChat.mockClear(); state.unmountChat.mockClear();
    const container = document.createElement('div'), root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={[entry]}><Routes>
        <Route path="/studio" element={<StudioStartPage />} />
        <Route path="/studio/hosts" element={<StudioStartPage host />} />
        <Route path="/studio/chat/:sessionId" element={<StudioStartPage />} />
      </Routes></MemoryRouter>));
      await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'confirm')!.click());
      await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'canonicalize')!.click());
      expect(state.mountChat).toHaveBeenCalledTimes(1); expect(state.unmountChat).not.toHaveBeenCalled();
      await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'new design')!.click());
      expect(container.textContent).toContain('confirm'); expect(state.unmountChat).toHaveBeenCalledTimes(1);
    } finally { await act(async () => root.unmount()); }
  });
  it('protects an existing session without mounting a chat before sign-in', async () => {
    state.isLoggedIn = false; state.renderChat.mockClear();
    const container = document.createElement('div'), root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={['/studio/chat/existing']}><Routes><Route path="/studio/chat/:sessionId" element={<StudioStartPage />} /></Routes></MemoryRouter>));
      expect(container.textContent).toBe('protected'); expect(state.renderChat).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
});
