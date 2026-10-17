// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionDiagnostics, JsonValue, HandoffDetails } from './SessionDiagnostics';
import { loadSessionDiagnostics, refreshSessionExpenses, type SessionDiagnosticsReport } from '../services/redesignChatService';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (v:unknown) => v, siteText:(v:string) => v }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t:(key:string) => key, i18n:{ language:'en', dir:() => 'ltr' } }) }));
vi.mock('../services/redesignChatService', () => ({ loadSessionDiagnostics:vi.fn(), refreshSessionExpenses:vi.fn(), loadStudioPerformance:vi.fn(async () => ({ success:true, data:{ summary:null } })) }));
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
  vi.mocked(refreshSessionExpenses).mockResolvedValue({ success:true, data:{ expenses:report.expenses } });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function open() {
  await act(async () => root.render(<SessionDiagnostics sessionId="owner-session" />));
  await act(async () => container.querySelector('button')!.click());
}
describe('private session diagnostics', () => {
  it('copies the exact prompt including internal whitespace and acknowledges failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{ writeText } });
    const prompt = 'natural linen\n  preserve these spaces';
    await act(async () => root.render(<JsonValue value={prompt} />));
    await act(async () => container.querySelector('button')!.click());
    expect(writeText).toHaveBeenCalledWith(prompt);
    expect(container.textContent).toContain('studioReport.copied');
    writeText.mockRejectedValueOnce(new Error('denied'));
    await act(async () => container.querySelector('button')!.click());
    expect(container.querySelector('[role=status]')?.textContent).toBe('studioReport.copyError');
  });
  it('combines performance with prompts inline and clears content when collapsed', async () => {
    await open();
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(container.textContent).toContain('studioPerformance.hint');
    expect(container.textContent).toContain('EXACT OUTPUT');
    await act(async () => container.querySelector<HTMLButtonElement>('.studio-report-trigger')!.click());
    expect(container.textContent).not.toContain('EXACT OUTPUT');
  });
  it('separates canonical output, actual image input and execution amendments', async () => {
    await act(async () => root.render(<HandoffDetails value={{ stage:'image_input', canonical_document:{ full:'MOTHER_OUTPUT' }, actual_prompt:'ACTUAL_SENT_PROMPT', execution_amendments:[{ path:'/add_new_products', reason:'purchase_disabled' }] }} />));
    expect(container.querySelectorAll('details')).toHaveLength(3);
    expect(container.textContent).toContain('MOTHER_OUTPUT');
    expect(container.textContent).toContain('ACTUAL_SENT_PROMPT');
    expect(container.textContent).toContain('purchase_disabled');
  });
  it('shows an explicit oversized-audit marker instead of an empty comparison', async () => {
    await act(async () => root.render(<HandoffDetails value={{ stage:'image_input', truncated:true, sha256:'digest' }} />));
    expect(container.querySelectorAll('details')).toHaveLength(0);
    expect(container.textContent).toContain('"truncated": true');
  });
  it('loads and reconciles receipts only on open, preserving exact escaped output', async () => {
    await act(async () => root.render(<SessionDiagnostics sessionId="owner-session" />));
    expect(loadSessionDiagnostics).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button')!.click());
    expect(loadSessionDiagnostics).toHaveBeenCalledWith('owner-session');
    expect(document.body.textContent).toContain('EXACT OUTPUT <script>test</script>');
    expect(document.body.querySelector('script')).toBeNull();
    expect(refreshSessionExpenses).toHaveBeenCalledExactlyOnceWith('owner-session');
    expect(document.body.textContent).toContain('studioDiagnostics.unknown');
  });
  it('refreshes saved provider billing automatically and on explicit click', async () => {
    vi.mocked(refreshSessionExpenses).mockResolvedValue({ success:true, data:{ expenses:{ ...report.expenses, known_usd:'0.125', status:'partial' } } });
    await open();
    const button = [...document.body.querySelectorAll('button')].find(b => b.textContent === 'studioDiagnostics.refresh')!;
    await act(async () => button.click());
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(2);
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
