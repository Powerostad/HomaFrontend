// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionDiagnostics, JsonValue } from './SessionDiagnostics';
import { loadSessionDiagnostics, refreshSessionExpenses, type SessionDiagnosticsReport } from '../services/redesignChatService';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (v:unknown) => v, siteText:(v:string) => v }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t:(key:string) => key, i18n:{ language:'en', dir:() => 'ltr' } }) }));
vi.mock('../services/redesignChatService', () => ({ loadSessionDiagnostics:vi.fn(), refreshSessionExpenses:vi.fn() }));
let owner = 'owner-1';
vi.mock('@/context/AuthContext', () => ({ useAuth:() => ({ user:{ id:owner } }) }));
let root:Root;
let container:HTMLDivElement;
const report:SessionDiagnosticsReport = {
  session_id:'owner-session', documents:[{ document:{ room_analysis:'EXACT OUTPUT <script>test</script>' } }], versions:[], traces:[], next_before:null,
  expenses:{ status:'unavailable', known_usd:null, text_usd:null, image_usd:null, known_paid_toman:null, known_grant_toman:null, unknown_calls:1, pending_receipts:0, checked_at:null },
};
beforeEach(() => {
  vi.resetAllMocks();
  owner = 'owner-1';
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  vi.mocked(loadSessionDiagnostics).mockResolvedValue({ success:true, data:report });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function open() {
  await act(async () => root.render(<SessionDiagnostics sessionId="owner-session" />));
  await act(async () => container.querySelector('button')!.click());
}
describe('private session diagnostics', () => {
  it('loads only on open, preserves exact escaped output and never refreshes billing automatically', async () => {
    await act(async () => root.render(<SessionDiagnostics sessionId="owner-session" />));
    expect(loadSessionDiagnostics).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button')!.click());
    expect(loadSessionDiagnostics).toHaveBeenCalledWith('owner-session');
    expect(document.body.textContent).toContain('EXACT OUTPUT <script>test</script>');
    expect(document.body.querySelector('script')).toBeNull();
    expect(refreshSessionExpenses).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('studioDiagnostics.unknown');
  });
  it('refreshes saved provider billing only on explicit click', async () => {
    vi.mocked(refreshSessionExpenses).mockResolvedValue({ success:true, data:{ expenses:{ ...report.expenses, known_usd:'0.125', status:'partial' } } });
    await open();
    const button = [...document.body.querySelectorAll('button')].find(b => b.textContent === 'studioDiagnostics.refresh')!;
    await act(async () => button.click());
    expect(refreshSessionExpenses).toHaveBeenCalledExactlyOnceWith('owner-session');
    expect(document.body.textContent).toContain('0.125 USD');
  });
  it('shows a failed load instead of an invented report; JSON cannot execute HTML', async () => {
    vi.mocked(loadSessionDiagnostics).mockResolvedValue({ success:false });
    await open();
    expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => root.render(<JsonValue value={{ raw:'<img src=x onerror=alert(1)>' }} />));
    expect(container.querySelector('img')).toBeNull();
  });
  it('clears private output when switching accounts', async () => {
    await open();
    expect(document.body.textContent).toContain('EXACT OUTPUT');
    owner = 'owner-2';
    vi.mocked(loadSessionDiagnostics).mockResolvedValue({ success:false });
    await act(async () => root.render(<SessionDiagnostics sessionId="owner-session" />));
    expect(document.body.textContent).not.toContain('EXACT OUTPUT');
  });
});
