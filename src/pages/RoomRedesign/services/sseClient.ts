/**
 * Minimal Server-Sent Events client over `fetch` for the Room Redesign chat.
 *
 * The app otherwise polls; the chat `turn` endpoint is the only SSE consumer.
 * We can't use the browser `EventSource` here because it can't send a POST body
 * or an `Authorization` header, so we read the streamed response body manually.
 *
 * This module is transport-only — it has no chat semantics. It builds auth/locale
 * headers the same way `utils/apiClient.ts` does, POSTs the body, and parses the
 * `event:`/`data:` frames, dispatching each to `onEvent`.
 */
import { getStoredTokens } from '@/utils/apiClient';
import i18n from '@/i18n/config';

export interface SseEvent {
  event: string;
  data: unknown;
}

export interface SseRunOptions {
  /** Absolute URL (the SSE endpoint). */
  url: string;
  /** JSON-serializable request body. */
  body: unknown;
  /** Abort signal — abort is treated as a silent, non-error stop. */
  signal: AbortSignal;
  onEvent: (e: SseEvent) => void;
}

export interface SseRunResult {
  ok: boolean;
  /** HTTP status (0 for network/abort failures before a response). */
  status: number;
  /** Non-localized transport error detail, when `ok` is false. */
  error?: string;
  /** True when the caller aborted — no error should be surfaced. */
  aborted?: boolean;
}

/** Mirror of apiClient.buildHeaders, inlined for the streaming fetch. */
function buildSseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // NOT 'text/event-stream': the chat turn endpoint is a DRF APIView whose
    // content negotiation only matches JSONRenderer, so a strict event-stream
    // Accept header is rejected with 406 before the streaming handler runs.
    // We parse the stream manually, so '*/*' is fine.
    Accept: '*/*',
    'Accept-Language': i18n.language || 'fa',
  };
  try {
    const sessionId = localStorage.getItem('homa_session_id');
    if (sessionId) headers['X-Homa-Session'] = sessionId;
  } catch {
    /* localStorage unavailable */
  }
  const tokens = getStoredTokens();
  if (tokens?.access) headers['Authorization'] = `Bearer ${tokens.access}`;
  return headers;
}

/** Parse one SSE frame (lines between blank lines) into an event. */
function parseSseBlock(block: string): SseEvent | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line || line.startsWith(':')) continue; // blank or comment/keepalive
    const idx = line.indexOf(':');
    const field = idx === -1 ? line : line.slice(0, idx);
    const value = idx === -1 ? '' : line.slice(idx + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

function isAbort(signal: AbortSignal, err: unknown): boolean {
  return signal.aborted || (err instanceof DOMException && err.name === 'AbortError');
}

export async function runSseStream(opts: SseRunOptions): Promise<SseRunResult> {
  const { url, body, signal, onEvent } = opts;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: buildSseHeaders(),
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (isAbort(signal, err)) return { ok: false, status: 0, aborted: true };
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'network error' };
  }

  // 401 is handled by the caller (no silent refresh on a raw streaming fetch).
  if (response.status === 401) return { ok: false, status: 401 };
  if (!response.ok || !response.body) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      /* ignore */
    }
    return { ok: false, status: response.status, error: detail || `HTTP ${response.status}` };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      // stream:true so multi-byte UTF-8 (Persian) split across chunks is preserved.
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evt = parseSseBlock(block);
        if (evt) onEvent(evt);
      }
    }
    buffer += decoder.decode();
    const tail = buffer.trim();
    if (tail) {
      const evt = parseSseBlock(tail);
      if (evt) onEvent(evt);
    }
    return { ok: true, status: response.status };
  } catch (err) {
    if (isAbort(signal, err)) return { ok: false, status: 0, aborted: true };
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'stream error' };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}
