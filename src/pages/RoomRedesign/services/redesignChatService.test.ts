import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChatSession, streamChatTurn } from './redesignChatService';
import { apiPost } from '@/utils/apiClient';
import { runChatCommand } from './chatWebSocket';

vi.mock('./chatWebSocket', () => ({ runChatCommand: vi.fn() }));
vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (value: string) => value }));
afterEach(() => vi.clearAllMocks());

it('enables versioned product identity independently of design rules for new V5 sessions', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'true');
  vi.stubEnv('VITE_STUDIO_PRODUCT_IDENTITY_V1', 'true');
  vi.stubEnv('VITE_STUDIO_RULES_V3', 'false');
  vi.stubEnv('VITE_STUDIO_RULES_V2', 'false');
  try {
    await createChatSession();
    const request = vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1];
    expect(request).toMatchObject({ product_identity_version: 'product-identity-v1' });
    expect(request).not.toHaveProperty('rules_version');
    vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'false');
    await createChatSession();
    expect(vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1]).not.toHaveProperty('product_identity_version');
  } finally { vi.unstubAllEnvs(); }
});

it('selects concept rules ahead of V2 only on explicitly enabled V5 sessions', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'true');
  vi.stubEnv('VITE_STUDIO_RULES_V2', 'true');
  vi.stubEnv('VITE_STUDIO_RULES_V3', 'true');
  try {
    await createChatSession();
    expect(vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1]).toMatchObject({ rules_version: 'studio-rules-v3' });
    vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'false');
    await createChatSession();
    expect(vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1]).not.toHaveProperty('rules_version');
  } finally { vi.unstubAllEnvs(); }
});

it('selects balanced rules only for explicitly enabled V5 sessions', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_RULES_V2', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'true');
  try {
    await createChatSession();
    expect(vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1]).toMatchObject({ rules_version: 'studio-rules-v2' });
    vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'false');
    await createChatSession();
    expect(vi.mocked(apiPost).mock.calls.slice(-1)[0]?.[1]).not.toHaveProperty('rules_version');
  } finally { vi.unstubAllEnvs(); }
});

it('selects V5 explicitly for new sessions with V4 rollback available', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_PIPELINE_V5', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V4', 'true');
  vi.stubEnv('VITE_STUDIO_SEARCH_V2', 'true');
  try {
    await createChatSession();
    expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
      design_version: 'studio-design-v2', search_version: 'studio-search-v2', pipeline_version: 'studio-pipeline-v5',
    });
  } finally { vi.unstubAllEnvs(); }
});

it('opts new local sessions into V3 and leaves V2 selectable with its flag off', async () => {
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { session_id: 'new', status: 'active' } });
  vi.stubEnv('VITE_STUDIO_SEARCH_V2', 'true');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V4', 'false');
  vi.stubEnv('VITE_STUDIO_PIPELINE_V3', 'true');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    design_version: 'studio-design-v2', search_version: 'studio-search-v2', pipeline_version: 'studio-pipeline-v3',
  });
  vi.stubEnv('VITE_STUDIO_PIPELINE_V3', 'false');
  await createChatSession();
  expect(apiPost).toHaveBeenLastCalledWith('/recommendations/chat/sessions/', {
    design_version: 'studio-design-v2', search_version: 'studio-search-v2',
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
    design_version: 'studio-design-v2', search_version: 'studio-search-v2', pipeline_version: 'studio-pipeline-v4',
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
