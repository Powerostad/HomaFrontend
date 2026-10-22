// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { preflight, runLiveArm, readLiveArm, type RuntimeInfo } from './liveComparison';
import { newCase } from './comparison';
vi.mock('@/utils/apiClient', () => ({ getStoredTokens: () => ({ access: 'test-token' }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const runtime = (profile: 'server' | 'local'): RuntimeInfo => ({ profile, revision: 'revision', image_generation: false, catalogue: 'same', products: 4, model: 'gpt-6-luna', prompt: profile });
const response = (data: unknown) => ({ ok: true, json: async () => ({ success: true, data }) });
function localMode() { vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'studio-local'); vi.stubGlobal('location', new URL('http://127.0.0.1:3000/studio/compare')); }
it('preflights both runtimes before spending and rejects enabled images or unequal catalogues', async () => {
  localMode();
  const fetch = vi.fn(async (url: string) => response(runtime(url.includes('/server/') ? 'server' : 'local'))); vi.stubGlobal('fetch', fetch);
  expect(await preflight()).toMatchObject({ A: { profile: 'server' }, B: { profile: 'local' } });
  expect(fetch).toHaveBeenCalledTimes(2);
  fetch.mockImplementation(async () => response({ ...runtime('server'), image_generation: true }));
  await expect(preflight()).rejects.toThrow('runtime_mismatch');
});
it('submits one text turn with identical input, never sends render, and reads saved outputs', async () => {
  localMode();
  const sent: { type: string; payload: { images: string[]; text: string } }[] = [];
  class Socket {
    onopen?: () => void; onmessage?: (e: { data: string }) => void; onerror?: () => void; onclose?: () => void;
    constructor() { queueMicrotask(() => this.onopen?.()); }
    send(text: string) { const frame = JSON.parse(text); sent.push(frame); queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ type: 'chat.done', request_id: frame.request_id }) })); }
    close() {}
  }
  vi.stubGlobal('WebSocket', Socket);
  const fetch = vi.fn(async (url: string) => response(url.endsWith('/ws-ticket/') ? { ticket: 'ticket' } : url.endsWith('/sessions/') ? { session_id: 'session' } : { session_id: 'session', turns: [], operations: [{ kind: 'text_turn', status: 'succeeded' }], status: 'active' }));
  vi.stubGlobal('fetch', fetch);
  const item = { ...newCase(), brief: 'same brief', originalImage: 'data:image/jpeg;base64,YQ==' };
  const output = vi.fn();
  await Promise.all((['A', 'B'] as const).map(key => runLiveArm(key, item, runtime(key === 'A' ? 'server' : 'local'), vi.fn(), output)));
  expect(sent).toHaveLength(2);
  expect(sent.every(frame => frame.type === 'chat.turn' && frame.payload.text === item.brief && frame.payload.images[0] === item.originalImage)).toBe(true);
  expect(output).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls.some(([url]) => url.includes('/render'))).toBe(false);
});

it('keeps a known pre-model failure failed when no operation row could be saved', async () => {
  localMode();
  vi.stubGlobal('fetch', vi.fn(async () => response({ session_id: 'saved', status: 'active', turns: [], operations: [] })));
  const result = await readLiveArm('A', { sessionId: 'saved', status: 'failed', stage: '', startedAt: '2026-10-23', runtime: runtime('server') });
  expect(result.run.status).toBe('failed');
  expect(result.arm.status).toBe('failed');
});
