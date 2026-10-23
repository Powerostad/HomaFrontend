// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { StudioImageExport } from './StudioImageExport';
import { apiGet, apiPost, fetchAuthenticatedImage } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), fetchAuthenticatedImage: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (s: string) => s, useSiteTranslation: () => ({ siteText: (s: string) => s }) }));

it.each(['zip', 'html'] as const)('downloads saved %s inputs without posting a model request or repeatedly fetching', async (format) => {
  vi.clearAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(apiGet).mockResolvedValue({ success: true, data: { mode: 'export', exports: [{ export_id: 'saved', created_at: '2026-10-22T00:00:00Z', reference_count: 3 }] } });
  vi.mocked(fetchAuthenticatedImage).mockResolvedValue('blob:archive');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<StudioImageExport sessionId="owned-session" busy={false} />));
    expect(apiGet).toHaveBeenCalledTimes(1);
    const button = [...container.querySelectorAll('button')].find(b => b.textContent === `دانلود ${format.toUpperCase()}`)!;
    await act(async () => button.click());
    expect(fetchAuthenticatedImage).toHaveBeenCalledWith(expect.stringContaining(`owned-session/image-export/?download=saved&file_format=${format}`));
    expect(click).toHaveBeenCalledOnce();
    expect(apiPost).not.toHaveBeenCalled();
    expect(apiGet).toHaveBeenCalledTimes(1);
  } finally { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); }
});
