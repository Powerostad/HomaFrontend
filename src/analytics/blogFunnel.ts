import { umamiEditorialEvent } from '../utils/umami';

const KEY = 'homa_blog_intent_v1';
const STARTED = 'homa_blog_started_v1';
const TTL = 30 * 60 * 1000;
type Intent = { article_path: string; acquisition: 'google' | 'other'; clicked_at: number };
const startedInMemory = new Set<string>();

export function articlePath(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin) return null;
    const path = url.pathname.replace(/\/$/, '');
    return /^\/blog\/[^/]+$/.test(path) ? path : null;
  } catch { return null; }
}

function acquisition(): Intent['acquisition'] {
  try {
    const host = new URL(document.referrer).hostname;
    return /^(www\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host) ? 'google' : 'other';
  } catch { return 'other'; }
}

/** No query strings, search queries, user identifiers, or product data. */
export function bindArticleAnalytics(root: HTMLElement): () => void {
  const path = articlePath(root.dataset.articlePath || '');
  if (!path) return () => {};
  const source = acquisition();
  umamiEditorialEvent('article_view', { article_path: path, acquisition: source, schema_version: 1 });
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || !root.contains(link)) return;
    const target = new URL(link.getAttribute('href')!, location.href);
    if (target.origin !== location.origin || !/^\/studio(?:\/|$)/.test(target.pathname)) return;
    // Last explicit article CTA in this tab, not every article ever viewed.
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && link.getAttribute('target') !== '_blank') {
      try { sessionStorage.setItem(KEY, JSON.stringify({ article_path: path, acquisition: source, clicked_at: Date.now() })); } catch { /* storage disabled */ }
    }
    umamiEditorialEvent('studio_cta_click', { article_path: path, acquisition: source, schema_version: 1 });
  };
  root.addEventListener('click', click);
  return () => root.removeEventListener('click', click);
}

/** Once per design session, only after backend processing evidence. IDs stay local. */
export function recordStudioProcessingStarted(sessionId: string) {
  if (startedInMemory.has(sessionId)) return;
  let intent: Intent | null = null;
  try {
    const started: string[] = JSON.parse(sessionStorage.getItem(STARTED) || '[]');
    if (Array.isArray(started) && started.includes(sessionId)) return;
    sessionStorage.setItem(STARTED, JSON.stringify([...started.slice(-99), sessionId]));
    intent = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch { /* Storage denied: still count an unattributed start, once in memory. */ }
  startedInMemory.add(sessionId);
  const data: Record<string, unknown> = { schema_version: 1, attribution: 'unattributed' };
  if (intent && typeof intent.article_path === 'string' && articlePath(intent.article_path) && intent.clicked_at <= Date.now()
    && Date.now() - intent.clicked_at <= TTL) {
    Object.assign(data, { attribution: 'article_cta_30m', article_path: intent.article_path, acquisition: intent.acquisition === 'google' ? 'google' : 'other' });
  }
  umamiEditorialEvent('studio_processing_started', data);
}

export function recordDesignStage(sessionId: string, event: string, data: unknown) {
  if (event !== 'stage' || !data || typeof data !== 'object') return;
  const key = (data as { key?: string }).key;
  if (key === 'analyze' || key === 'design') recordStudioProcessingStarted(sessionId);
}
