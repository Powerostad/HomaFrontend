import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChatSession, streamChatTurn } from './redesignChatService';
import { apiPost } from '@/utils/apiClient';
import { runChatCommand } from './chatWebSocket';

vi.mock('./chatWebSocket', () => ({ runChatCommand: vi.fn() }));
vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (value: string) => value }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });

it('delivers intermediate analysis without treating it as a completed execution', async () => {
  const onAnalysis = vi.fn(), onResult = vi.fn();
  const preview = { studio_documents: { img0: { room_analysis: { observation: 'accepted' } } } };
  vi.mocked(runChatCommand).mockImplementation(async options => {
    options.onEvent?.({ event: 'analysis', data: preview });
    expect(onAnalysis).toHaveBeenCalledWith(preview);
    expect(onResult).not.toHaveBeenCalled();
    return { ok: true, status: 200 };
  });
  await streamChatTurn({ sessionId: 'session', idempotencyKey: 'request', text: '', images: [] },
    { onAnalysis, onResult }, new AbortController().signal);
});

it('opts new local sessions into V3 and leaves V2 selectable with its flag off', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_SEARCH_V2', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V4', 'false');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V3', 'true');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    search_version: 'studio-search-v2', prompt_split: 'server-split-v1',
  });
  vi.stubEnv('VITE_STUDIO_PIPELINE_V3', 'false');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    search_version: 'studio-search-v2', prompt_split: 'server-split-v1',
  });
  vi.unstubAllEnvs();
});

it('selects partitioned V4 for new sessions while preserving the full-policy V3 option', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_SEARCH_V2', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V3', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V4', 'true');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    search_version: 'studio-search-v2', prompt_split: 'server-split-v1',
  });
  vi.unstubAllEnvs();
});

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
  it('transports exact variant, placement and typed review without fabricated user text', async () => {
    vi.mocked(runChatCommand).mockResolvedValue({ ok: true, status: 200 });
    await streamChatTurn({ sessionId: 'session', idempotencyKey: 'request', text: '', images: [], action: 'review_product',
      itemId: 'sc1:lamp', productId: 12, variantId: 120, placementId: 'left', reviewKind: 'wrong_size' }, {}, new AbortController().signal);
    expect(vi.mocked(runChatCommand).mock.calls[0][0].payload).toMatchObject({ variant_id: 120, placement_id: 'left', review_kind: 'wrong_size' });
    expect(vi.mocked(runChatCommand).mock.calls[0][0].payload).not.toHaveProperty('text');
  });
});

it('keeps taxonomy and identity with V4 without V5 or rule options', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_SEARCH_V2', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V4', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'true');
  vi.stubEnv('VITE_STUDIO_PRODUCT_TAXONOMY_V1', 'true');
  vi.stubEnv('VITE_STUDIO_PRODUCT_IDENTITY_V1', 'true');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    search_version: 'studio-search-v2', prompt_split: 'server-split-v1',
    product_taxonomy_version: 'product-taxonomy-v1', product_identity_version: 'product-identity-v1',
  });
});
