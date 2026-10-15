import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChatTurn } from './redesignChatService';
import { runChatCommand } from './chatWebSocket';

vi.mock('./chatWebSocket', () => ({ runChatCommand: vi.fn() }));
vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (value: string) => value }));
afterEach(() => vi.clearAllMocks());

describe('chat transport user text boundary', () => {
  it.each(['', ' \n\t '])('omits empty text without replacing it: %s', async (text) => {
    vi.mocked(runChatCommand).mockResolvedValue({ ok: true, status: 200 });
    const images = ['data:image/png;base64,AA=='];
    await streamChatTurn({ sessionId: 'session', idempotencyKey: 'request', text, images }, {}, new AbortController().signal);
    const command = vi.mocked(runChatCommand).mock.calls[0][0];
    expect(command.payload).not.toHaveProperty('text');
    expect(command.payload).toMatchObject({ images });
  });
  it('sends authored text unchanged', async () => {
    vi.mocked(runChatCommand).mockResolvedValue({ ok: true, status: 200 });
    const text = 'keep  the rug\nچراغ را تغییر بده';
    await streamChatTurn({ sessionId: 'session', idempotencyKey: 'request', text, images: [] }, {}, new AbortController().signal);
    expect(vi.mocked(runChatCommand).mock.calls[0][0].payload).toMatchObject({ text });
  });
  it('uses the product action without inventing a user request', async () => {
    vi.mocked(runChatCommand).mockResolvedValue({ ok: true, status: 200 });
    await streamChatTurn({ sessionId: 'session', idempotencyKey: 'request', text: '', images: [],
      action: 'preview_product', itemId: 'item', productId: 12 }, {}, new AbortController().signal);
    expect(vi.mocked(runChatCommand).mock.calls[0][0].payload).toMatchObject({ action: 'preview_product', item_id: 'item', product_id: 12 });
    expect(vi.mocked(runChatCommand).mock.calls[0][0].payload).not.toHaveProperty('text');
  });
});
