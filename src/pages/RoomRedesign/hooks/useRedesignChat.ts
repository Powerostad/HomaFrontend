import { useCallback, useEffect, useRef, useState } from 'react';
import { createChatSession, loadChatSession, requestRender, streamChatTurn, type DesignOperation, type DesignVersion, type SessionPayload, type StreamTurnParams } from '../services/redesignChatService';
import { rebuildSessionView, chipGroupsFromQuestions } from '../services/transformers';
import type { ChatMessage, ChipGroup } from '../types';

const RECONCILE_MAX_ATTEMPTS = 90;
const RECONCILE_MAX_MS = 180_000;
const GENERIC_PROCESSING_ERROR = 'پردازش ناموفق بود. دوباره تلاش کن.';

function localizedFailure(value: unknown): string {
  return typeof value === 'string' && /[؀-ۿ]/.test(value)
    ? value
    : GENERIC_PROCESSING_ERROR;
}

export interface SendTurnArgs {
  text: string;
  images?: string[];
  prefsUpdate?: unknown;
  action?: 'chat' | 'preview_product';
  itemId?: string;
  productId?: number;
}
export function useRedesignChat(path?: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chipGroups, setChipGroups] = useState<ChipGroup[]>([]);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [viewedId, setViewedId] = useState('original');
  const [readyId, setReadyId] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [hydrating, setHydrating] = useState(!!path);
  const sidRef = useRef<string | null>(null);
  const viewedRef = useRef('original');
  const following = useRef(true);
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const intent = useRef<StreamTurnParams | null>(null);
  const pendingArgs = useRef<SendTurnArgs | null>(null);
  const completed = useRef(false);
  const operation = useRef<DesignOperation | null>(null);
  const versionsRef = useRef<DesignVersion[]>([]);
  const renderOperationId = useRef<string | null>(null);
  const generation = useRef(0);

  const apply = useCallback((data: SessionPayload) => {
    const rebuilt = rebuildSessionView(data);
    setMessages(rebuilt.messages);
    setChipGroups(rebuilt.chipGroups);
    setOriginalImage(data.original_image || rebuilt.versions[0]?.imageUrl || null);
    const next = data.versions?.length ? data.versions : rebuilt.versions.slice(1).map(v => ({ version_id: v.id, base_version_id: 'original', image_url: v.imageUrl, explanation: '', execution: null, legacy_incomplete: true }));
    if (versionsRef.current.length && next.length > versionsRef.current.length && !following.current) setReadyId(next[next.length - 1].version_id);
    versionsRef.current = next;
    setVersions(next);
    if (following.current && next.length) {
      viewedRef.current = next[next.length - 1].version_id;
      setViewedId(viewedRef.current);
    }
  }, []);

  const reconcile = useCallback(async (
    sid: string,
    signal: AbortSignal,
    key?: string,
    waitForCompletion = true,
  ) => {
    const deadline = Date.now() + RECONCILE_MAX_MS;
    for (let i = 0; i < RECONCILE_MAX_ATTEMPTS && Date.now() < deadline && !signal.aborted; i++) {
      if (sidRef.current !== sid) return;
      const loaded = await loadChatSession(sid, viewedRef.current);
      if (signal.aborted || sidRef.current !== sid) return;
      if (!loaded.success) { setError(loaded.error || 'ارتباط برقرار نشد'); break; }
      const data = loaded.data as SessionPayload;
      apply(data);
      const ops = data.operations || [];
      const tracked = key ? ops.find(o => o.idempotency_key === key || o.operation_id === key) : undefined;
      const active = ops.find(o => o.status === 'running');
      const child = ops.find(o => o.operation_id === tracked?.render_operation_id);
      const failed = child?.status === 'failed' ? child : tracked?.status === 'failed' ? tracked : !key ? ops[0]?.status === 'failed' ? ops[0] : undefined : undefined;
      if (failed) { operation.current = failed; setError(localizedFailure(failed.error)); break; }
      if (!active) {
        if (key && !tracked) { setError('وضعیت درخواست مشخص نیست؛ دوباره بررسی کن.'); break; }
        operation.current = null; completed.current = true;
        setStatus('idle'); setError(null); setStage(null); locked.current = false;
        return;
      }
      operation.current = active;
      setStatus(active.kind === 'render' ? 'rendering' : 'streaming');
      if (!waitForCompletion) return;
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 2000);
        signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
    if (!signal.aborted && sidRef.current === sid) { setStatus('error'); locked.current = false; }
  }, [apply]);

  useEffect(() => {
    if (path && sidRef.current === path && controller.current && !controller.current.signal.aborted) return;
    generation.current += 1;
    controller.current?.abort();
    sidRef.current = path || null; setSessionId(path || null);
    setMessages([]); setVersions([]); versionsRef.current = []; setChipGroups([]);
    setOriginalImage(null); setError(null); setUnavailable(false); setStatus('idle'); locked.current = false;
    viewedRef.current = 'original'; following.current = true; setViewedId('original');
    operation.current = null; intent.current = null; renderOperationId.current = null;
    if (!path) { setHydrating(false); return; }
    const ac = new AbortController(); controller.current = ac; setHydrating(true);
    void (async () => {
      const loaded = await loadChatSession(path);
      if (ac.signal.aborted) return;
      setHydrating(false);
      if (!loaded.success) { setUnavailable(loaded.statusCode === 403 || loaded.statusCode === 404); setStatus('error'); setError(loaded.error || 'این گفتگو در دسترس نیست.'); return; }
      try {
        const saved = sessionStorage.getItem(`redesign-view:${path}`);
        if (saved && (saved === 'original' || (loaded.data as SessionPayload).versions?.some(v => v.version_id === saved))) { viewedRef.current = saved; setViewedId(saved); following.current = saved === (loaded.data as SessionPayload).versions?.slice(-1)[0]?.version_id; }
      } catch { /* optional view memory */ }
      apply(loaded.data as SessionPayload);
      locked.current = true;
      await reconcile(path, ac.signal);
    })();
  }, [path, apply, reconcile]);
  useEffect(() => () => controller.current?.abort(), []);

  const selectVersion = useCallback((id: string) => {
    viewedRef.current = id; setViewedId(id);
    if (id === versionsRef.current[versionsRef.current.length - 1]?.version_id) setReadyId(null);
    try { sessionStorage.setItem(`redesign-view:${sidRef.current}`, id); } catch { /* optional view memory */ }
    following.current = id === versionsRef.current[versionsRef.current.length - 1]?.version_id || (!versionsRef.current.length && id === 'original');
    const sid = sidRef.current;
    if (sid) void loadChatSession(sid, id).then(load => {
      if (load.success && sidRef.current === sid && viewedRef.current === id) {
        const data = load.data as SessionPayload;
        if (data.versions) { setVersions(data.versions); versionsRef.current = data.versions; }
      }
    });
  }, []);

  const execute = useCallback(async (params: StreamTurnParams): Promise<boolean> => {
    const ac = new AbortController();
    controller.current?.abort();
    controller.current = ac;
    const commandGeneration = ++generation.current;
    const isCurrent = () => generation.current === commandGeneration
      && sidRef.current === params.sessionId
      && !ac.signal.aborted;
    completed.current = false;
    locked.current = true; setError(null); setStage(null); setStatus('streaming');
    const messageId = crypto.randomUUID();
    setChipGroups([]);
    const transport = await streamChatTurn(params, {
      onSay: delta => {
        if (!isCurrent()) return;
        setMessages(old => old.some(m => m.id === messageId)
          ? old.map(m => m.id === messageId ? { ...m, text: m.text + delta } : m)
          : [...old, { id: messageId, role: 'assistant', text: delta }]);
      },
      onStage: event => { if (isCurrent()) setStage(event.label_fa); },
      onQuestions: event => { if (isCurrent()) setChipGroups(chipGroupsFromQuestions(event)); },
      onRenderPending: event => {
        if (!isCurrent()) return;
        renderOperationId.current = event.operation_id || null;
        setStatus('rendering');
      },
      onRenderEvent: event => {
        if (!isCurrent()) return;
        if (event.operationId && renderOperationId.current && event.operationId !== renderOperationId.current) return;
        if (event.operationId) renderOperationId.current = event.operationId;
        if (event.event === 'image' || event.event === 'error') {
          void reconcile(params.sessionId, ac.signal, event.operationId || params.idempotencyKey);
        }
      },
      onConnectionLost: () => {
        if (isCurrent()) void reconcile(params.sessionId, ac.signal, renderOperationId.current || params.idempotencyKey);
      },
      onError: message => { if (isCurrent()) setError(message); },
    }, ac.signal);
    if (!isCurrent()) return false;
    await reconcile(params.sessionId, ac.signal, params.idempotencyKey, !transport.ok);
    return transport.ok || completed.current;
  }, [reconcile]);

  const sendTurn = useCallback(async (args: SendTurnArgs) => {
    if (locked.current || unavailable) return false;
    // Resolve uncertainty before accepting another edit.
    if (operation.current?.status === 'running') return false;
    pendingArgs.current = args;
    locked.current = true; setStatus('creating');
    let sid = sidRef.current;
    if (!sid) {
      const created = await createChatSession();
      if (!created.success || !created.data) { setError(created.error || 'خطا در ایجاد گفتگو'); setStatus('error'); locked.current = false; return false; }
      sid = created.data.sessionId; sidRef.current = sid; setSessionId(sid);
    }
    const params: StreamTurnParams = { ...args, sessionId: sid, images: args.images || [], baseVersionId: viewedRef.current, idempotencyKey: crypto.randomUUID() };
    intent.current = params;
    if (args.images?.[0]) setOriginalImage(args.images[0]);
    setMessages(old => [...old, { id: params.idempotencyKey, role: 'user', text: args.text, imageUrl: args.images?.[0] }]);
    return execute(params);
  }, [execute, unavailable]);

  const retry = useCallback(async () => {
    const sid = sidRef.current;
    if (locked.current) return;
    if (!sid) { if (pendingArgs.current) await sendTurn(pendingArgs.current); return; }
    locked.current = true;
    controller.current?.abort();
    const ac = new AbortController(); controller.current = ac;
    const retryGeneration = ++generation.current;
    const isCurrent = () => generation.current === retryGeneration
      && sidRef.current === sid
      && !ac.signal.aborted;
    const loaded = await loadChatSession(sid, viewedRef.current);
    if (!loaded.success) { setError(loaded.error || 'ارتباط برقرار نشد'); locked.current = false; return; }
    const ops = (loaded.data as SessionPayload).operations || [];
    const active = ops.find(o => o.status === 'running');
    const failed = ops.find(o => o.operation_id === operation.current?.operation_id) || ops.find(o => o.idempotency_key === intent.current?.idempotencyKey) || ops[0];
    if (active) { await reconcile(sid, ac.signal, active.operation_id); return; }
    if (failed?.status === 'failed' && failed.kind === 'render') {
      renderOperationId.current = failed.operation_id;
      const result = await requestRender({
        sessionId: sid,
        idempotencyKey: failed.idempotency_key,
        signal: ac.signal,
        onEvent: event => {
          if (!isCurrent()) return;
          if (event.operationId && renderOperationId.current && event.operationId !== renderOperationId.current) return;
          if (event.operationId) renderOperationId.current = event.operationId;
          if (event.event === 'say') {
            const data = event.data as { delta?: unknown };
            if (typeof data?.delta === 'string') setStage(data.delta.trim());
          }
          if (event.event === 'image' || event.event === 'error') {
            void reconcile(sid, ac.signal, event.operationId || failed.operation_id);
          }
        },
        onConnectionLost: () => {
          if (isCurrent()) void reconcile(sid, ac.signal, failed.operation_id);
        },
      });
      if (!isCurrent()) return;
      if (!result.success) { setError(result.error || 'خطا در ساخت تصویر'); locked.current = false; return; }
      setStatus('rendering');
      // A non-terminal ack must retain an operation identity for live pushes;
      // fall back to the durable session state if an older server cannot supply it.
      if (result.terminal || !result.operationId) await reconcile(sid, ac.signal, failed.operation_id);
    } else if (failed?.status === 'failed' || (!failed && intent.current)) {
      if (intent.current) await execute(intent.current);
      else {
        setError('جزئیات درخواست قبلی مشخص نیست؛ دوباره تلاش کن.');
        locked.current = false;
      }
    } else { await reconcile(sid, ac.signal); }
  }, [execute, reconcile, sendTurn]);

  const selectChip = (groupId: string, chipId: string) => {
    if (chipId.endsWith(':open-chat')) { window.dispatchEvent(new Event('homa-redesign-focus-composer')); return; }
    const label = chipGroups.find(g => g.id === groupId)?.chips.find(c => c.id === chipId)?.label;
    if (label) void sendTurn({ text: label });
  };
  return { sessionId, messages, chipGroups, versions, originalImage, viewedId, selectVersion, selectedVersion: versions.find(v => v.version_id === viewedId), status, stage, error, unavailable, hydrating, busy: ['creating', 'streaming', 'rendering'].includes(status), sendTurn, selectChip, retry, newVersionReady: !!readyId && viewedId !== readyId };
}
