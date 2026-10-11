// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSessionArchive } from './ChatSessionArchive';
import { listChatSessions, type ChatSessionListItem } from '../services/redesignChatService';

let owner = 'owner-1';
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id:owner } }) }));
vi.mock('../services/redesignChatService', () => ({ listChatSessions:vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t:(key:string) => key, i18n: { language:'en', dir:() => 'ltr' } }) }));
let root:Root;
let container:HTMLDivElement;
const session:ChatSessionListItem = { id:'saved-session', title:'My living room', status:'active', turn_count:3, created_at:'2026-10-10T12:00:00Z', updated_at:'2026-10-11T12:00:00Z' };
async function mount() { await act(async () => { root.render(<MemoryRouter><ChatSessionArchive /></MemoryRouter>); }); }
beforeEach(() => {
  vi.resetAllMocks(); owner = 'owner-1';
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); root = createRoot(container);
  vi.mocked(listChatSessions).mockResolvedValue({ success:true, sessions:[session] });
});
afterEach(async () => { await act(async () => root.unmount()); });
describe('owned conversational archive', () => {
  it('loads server conversations and links to their resumable chat, including failed sessions', async () => {
    vi.mocked(listChatSessions).mockResolvedValue({ success:true, sessions:[session, { ...session, id:'failed-session', status:'failed' }] });
    await mount();
    expect(container.textContent).toContain(session.title);
    expect(container.querySelector('a[href="/studio/chat/saved-session"]')).not.toBeNull();
    expect(container.querySelector('a[href="/studio/chat/failed-session"]')).not.toBeNull();
    expect(container.querySelector('a[href*="demo"]')).toBeNull();
  });
  it('shows an actionable error rather than pretending the archive is empty', async () => {
    vi.mocked(listChatSessions).mockResolvedValue({ success:false, sessions:[] });
    await mount();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('studioChat.archiveError');
    expect(container.textContent).not.toContain('studioChat.archiveEmpty');
  });
  it('ignores a late response after switching accounts and reloads from the new owner', async () => {
    let resolveOld!:(value:{ success:boolean; sessions:ChatSessionListItem[] }) => void;
    vi.mocked(listChatSessions).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
    await mount();
    owner = 'owner-2';
    vi.mocked(listChatSessions).mockResolvedValue({ success:true, sessions:[] });
    await mount();
    await act(async () => resolveOld({ success:true, sessions:[session] }));
    expect(container.textContent).not.toContain(session.title);
    expect(container.textContent).toContain('studioChat.archiveEmpty');
  });
});
