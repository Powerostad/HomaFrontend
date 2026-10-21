// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRedesignChat } from './useRedesignChat';
import * as service from '../services/redesignChatService';

vi.mock('../services/redesignChatService', () => ({ createChatSession: vi.fn(), loadChatSession: vi.fn(), loadChatSessionStatus: vi.fn(),
  streamChatTurn: vi.fn(), requestRender: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (s: string) => s, useSiteTranslation: () => ({ siteText: (s: string) => s }) }));
vi.mock('../services/transformers', () => ({ chipGroupsFromQuestions: () => [], rebuildSessionView: () => ({ messages: [], chipGroups: [], versions: [] }) }));

let root: Root;
let container: HTMLDivElement;
let chat: ReturnType<typeof useRedesignChat>;
const version: service.DesignVersion = { version_id: 'rh1', base_version_id: 'original', image_url: 'https://site/image',
  explanation: '', execution: null, legacy_incomplete: false };
const operation = (status = 'running', id = 'render'): service.DesignOperation => ({ operation_id: id, kind: 'render', status, idempotency_key: 'key' });
function payload(operations: service.DesignOperation[] = [], versions: service.DesignVersion[] = []): service.SessionPayload {
  return { session_id: 'session', status: operations.some(o => o.status === 'running') ? 'rendering' : 'active',
    title: '', turns: [], original_image: 'original-photo', operations, versions };
}
function Harness({ path = 'session' }: { path?: string }) {
  const state = useRedesignChat(path);
  useEffect(() => { chat = state; });
  return null;
}
async function flush() { await act(async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); }); }
async function mount() { await act(async () => { root.render(<Harness />); }); await flush(); }
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks(); sessionStorage.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); root = createRoot(container);
  vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload() });
  vi.mocked(service.loadChatSessionStatus).mockImplementation((sid) => service.loadChatSession(sid));
});
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); });

describe('Studio persisted-result recovery', () => {
  it.each([undefined, 'review_product'] as const)('follows a new design after viewing an older version (%s)', async action => {
    const first = { ...version, execution: { purchases: [{ item_id: 'old' }] } as unknown as service.ExecutionPlan };
    const second = { ...version, version_id: 'dv-new', base_version_id: 'rh1', image_pending: true,
      execution: { purchases: [{ item_id: 'new' }] } as unknown as service.ExecutionPlan };
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([], [first]) });
    await mount();
    act(() => chat.selectVersion('rh1'));
    await flush();
    let key = '';
    vi.mocked(service.streamChatTurn).mockImplementation(async (params, handlers) => {
      key = params.idempotencyKey;
      handlers.onResult?.({ design_version_id: 'dv-new', execution: second.execution } as service.ResultEvent);
      return { ok: true };
    });
    vi.mocked(service.loadChatSession).mockImplementation(async () => ({ success: true,
      data: payload([{ ...operation('succeeded', 'text'), kind: 'text_turn', idempotency_key: key }], [first, second]) }));
    await act(async () => { await chat.sendTurn({ text: 'change the lamp', action }); });
    expect(chat.viewedId).toBe('dv-new');
    expect(chat.versions.map(v => v.execution?.purchases[0].item_id)).toEqual(['old', 'new']);
    expect(service.streamChatTurn).toHaveBeenCalledOnce();
  });
  it('keeps the safe server failure stage, cause, attempts and tracking reference after reconnect', async () => {
    const message = 'مرحلهٔ تحلیل و طراحی ناموفق بود. پاسخ مدل دربارهٔ حفظ یا تعویض یک وسیله تناقض داشت. تعداد تلاش‌های این مرحله: 3. شناسهٔ پیگیری: operation-123';
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([
      { ...operation('failed'), kind: 'text_turn', error: message },
    ]) });
    await mount();
    expect(chat.status).toBe('error');
    expect(chat.error).toBe(message);
    expect(service.streamChatTurn).not.toHaveBeenCalled();
    expect(service.requestRender).not.toHaveBeenCalled();
  });
  it('polls compact status without reloading unchanged image/history payloads', async () => {
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([operation()]) });
    vi.mocked(service.loadChatSessionStatus).mockResolvedValue({ success: true, data: { operations: [operation()], status: 'active' } });
    await mount();
    expect(service.loadChatSession).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(service.loadChatSession).toHaveBeenCalledTimes(2);
    expect(service.loadChatSessionStatus).toHaveBeenCalledTimes(4);
    expect(service.requestRender).not.toHaveBeenCalled();
  });
  it('polls until a render finishes even when the terminal push never arrives', async () => {
    await mount();
    let key = '';
    vi.mocked(service.streamChatTurn).mockImplementation(async (params, handlers) => {
      key = params.idempotencyKey;
      handlers.onRenderPending?.({ scene_id: 'sc1', scene_label_fa: '', operation_id: 'render' });
      return { ok: true };
    });
    vi.mocked(service.loadChatSession).mockImplementation(async () => ({ success: true, data: payload([
      { operation_id: 'text', kind: 'text_turn', idempotency_key: key, status: 'succeeded', render_operation_id: 'render' },
      operation(),
    ]) }));
    let sending: Promise<boolean>;
    await act(async () => { sending = chat.sendTurn({ text: 'edit' }); });
    expect(chat.status).toBe('rendering');
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([
      { operation_id: 'text', kind: 'text_turn', idempotency_key: key, status: 'succeeded', render_operation_id: 'render' },
      operation('succeeded'),
    ], [version]) });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); }); await flush();
    expect(chat.viewedId).toBe('rh1');
    expect(chat.status).toBe('idle'); expect(chat.error).toBeNull();
    expect(await sending!).toBe(true);
    expect(service.streamChatTurn).toHaveBeenCalledOnce();
  });
  it('announces the first ready image while deliberately viewing Original', async () => {
    await mount();
    act(() => chat.selectVersion('original'));
    await flush();
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([], [version]) });
    await act(async () => { await chat.retry(); });
    expect(chat.viewedId).toBe('original');
    expect(chat.newVersionReady).toBe(true);
  });
  it('survives a transient recovery request failure without generating another image', async () => {
    vi.mocked(service.loadChatSession).mockResolvedValueOnce({ success: true, data: payload([operation()]) })
      .mockResolvedValueOnce({ success: false, statusCode: 500, error: 'temporary network failure' })
      .mockResolvedValue({ success: true, data: payload([operation('succeeded')], [version]) });
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); }); await flush();
    expect(chat.status).toBe('idle'); expect(chat.viewedId).toBe('rh1');
    expect(service.requestRender).not.toHaveBeenCalled();
  });
  it('ignores late snapshots after unmount and cancels further polling', async () => {
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([operation()]) });
    await mount();
    await act(async () => root.unmount());
    const count = vi.mocked(service.loadChatSession).mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(service.loadChatSession).toHaveBeenCalledTimes(count);
    root = createRoot(container);
  });
  it('shows an actual persisted worker failure instead of retrying generation automatically', async () => {
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([{ ...operation('failed'), error: 'خطای تولید تصویر' }]) });
    await mount();
    expect(chat.status).toBe('error'); expect(chat.error).toBe('خطای تولید تصویر');
    expect(service.requestRender).not.toHaveBeenCalled();
  });
  it('restores a failed opening after reload and only retries its existing key on explicit action', async () => {
    const failed: service.DesignOperation = { operation_id: 'opening', kind: 'text_turn',
      status: 'failed', idempotency_key: 'saved-opening-key', base_version_id: 'original', error: 'تحلیل ناموفق بود' };
    vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([failed]) });
    await mount();
    expect(chat.originalImage).toBe('original-photo');
    expect(chat.status).toBe('error');
    expect(service.streamChatTurn).not.toHaveBeenCalled();
    vi.mocked(service.streamChatTurn).mockImplementation(async () => {
      vi.mocked(service.loadChatSession).mockResolvedValue({ success: true,
        data: payload([{ ...failed, status: 'succeeded', error: '' }]) });
      return { ok: true };
    });
    await act(async () => { await chat.retry(); });
    expect(service.streamChatTurn).toHaveBeenCalledOnce();
    expect(vi.mocked(service.streamChatTurn).mock.calls[0][0]).toEqual({
      sessionId: 'session', idempotencyKey: 'saved-opening-key', text: '', images: [], baseVersionId: 'original',
    });
    expect(service.requestRender).not.toHaveBeenCalled();
    expect(chat.status).toBe('idle');
    expect(chat.error).toBeNull();
  });
  it('keeps the failed user message visible when the server has not committed an opening turn', async () => {
    await mount();
    vi.mocked(service.streamChatTurn).mockImplementation(async params => {
      vi.mocked(service.loadChatSession).mockResolvedValue({ success: true, data: payload([{
        operation_id: 'opening', kind: 'text_turn', status: 'failed', idempotency_key: params.idempotencyKey,
        error: 'تحلیل ناموفق بود',
      }]) });
      return { ok: false };
    });
    await act(async () => { await chat.sendTurn({ text: 'Keep my sofa', images: ['original-photo'] }); });
    expect(chat.status).toBe('error');
    expect(chat.messages).toEqual([expect.objectContaining({ role: 'user', text: 'Keep my sofa', imageUrl: 'original-photo' })]);
    expect(service.streamChatTurn).toHaveBeenCalledOnce();
    expect(service.requestRender).not.toHaveBeenCalled();
  });
});
