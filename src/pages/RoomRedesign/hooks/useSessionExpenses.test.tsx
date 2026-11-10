// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { useSessionExpenses } from './useSessionExpenses';
import { refreshSessionExpenses, type SessionExpenses } from '../services/redesignChatService';
let owner = 'one';
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: owner } }) }));
vi.mock('../services/redesignChatService', () => ({ refreshSessionExpenses: vi.fn() }));
const pending: SessionExpenses = { status:'pending', known_usd:null, text_usd:null, image_usd:null, known_paid_toman:null, known_grant_toman:null, unknown_calls:0, pending_receipts:1, checked_at:null };
function Probe({ busy = false, session = 'owned', active = true }) {
  const value = useSessionExpenses(session, active, busy);
  return <p>{value?.known_usd ?? 'unknown'}</p>;
}
it('waits for AI completion, bounds delayed receipt lookups and cancels on close', async () => {
  vi.useFakeTimers();
  vi.mocked(refreshSessionExpenses).mockReset().mockResolvedValue({success:true, data:{expenses:pending}});
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () => root.render(<Probe busy />));
    expect(refreshSessionExpenses).not.toHaveBeenCalled();
    await act(async () => root.render(<Probe />));
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(35_000));
    await act(async () => vi.advanceTimersByTimeAsync(35_000));
    await act(async () => vi.advanceTimersByTimeAsync(140_000));
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(3);
    await act(async () => root.render(<Probe session="second" />));
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(4);
    await act(async () => root.render(<Probe session="second" active={false} />));
    await act(async () => vi.advanceTimersByTimeAsync(70_000));
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(4);
  } finally { await act(async () => root.unmount()); vi.useRealTimers(); }
});
it('ignores late private billing responses after an account switch', async () => {
  owner = 'one';
  let resolve!: (value: Awaited<ReturnType<typeof refreshSessionExpenses>>) => void;
  vi.mocked(refreshSessionExpenses).mockReset().mockImplementationOnce(() => new Promise(r => { resolve = r; }))
    .mockResolvedValue({success:true, data:{expenses:pending}});
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Probe />));
    owner = 'two';
    await act(async () => root.render(<Probe />));
    await act(async () => resolve({success:true,data:{expenses:{...pending,known_usd:'999'}}}));
    expect(container.textContent).toBe('unknown');
  } finally { await act(async () => root.unmount()); owner = 'one'; }
});
it('stops after a settled receipt and makes no background polling loop', async () => {
  vi.useFakeTimers();
  vi.mocked(refreshSessionExpenses).mockReset().mockResolvedValue({ success:true, data:{ expenses:{...pending,status:'settled',pending_receipts:0,known_usd:'0.000000001'} } });
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Probe />));
    await act(async () => vi.advanceTimersByTimeAsync(140_000));
    expect(refreshSessionExpenses).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('0.000000001');
  } finally { await act(async () => root.unmount()); vi.useRealTimers(); }
});
