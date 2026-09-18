import { useCallback, useEffect, useRef, useState } from 'react';
import { createChatSession, loadChatSession, requestRender, streamChatTurn, type DesignOperation, type DesignVersion, type SessionPayload, type StreamTurnParams } from '../services/redesignChatService';
import { rebuildSessionView, chipGroupsFromQuestions } from '../services/transformers';
import type { ChatMessage, ChipGroup } from '../types';

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

  const reconcile = useCallback(async (sid: string, signal: AbortSignal, key?: string) => {
    for (let i = 0; i < 150 && !signal.aborted; i++) {
      const loaded = await loadChatSession(sid, viewedRef.current);
      if (signal.aborted) return;
      if (!loaded.success) { setError(loaded.error || 'ارتباط برقرار نشد'); break; }
      const data = loaded.data as SessionPayload;
      apply(data);
      const ops = data.operations || [];
      const tracked = key ? ops.find(o => o.idempotency_key === key || o.operation_id === key) : undefined;
      const active = ops.find(o => o.status === 'running');
      const child = ops.find(o => o.operation_id === tracked?.render_operation_id);
      const failed = child?.status === 'failed' ? child : tracked?.status === 'failed' ? tracked : !key ? ops[0]?.status === 'failed' ? ops[0] : undefined : undefined;
      if (failed) { operation.current = failed; setError(failed.error || 'پردازش ناموفق بود. دوباره تلاش کن.'); break; }
      if (!active) {
        if (key && !tracked) { setError('وضعیت درخواست مشخص نیست؛ دوباره بررسی کن.'); break; }
        operation.current = null; completed.current = true;
        setStatus('idle'); setError(null); setStage(null); locked.current = false;
        return;
      }
      operation.current = active;
      setStatus(active.kind === 'render' ? 'rendering' : 'streaming');
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 2000);
        signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
    if (!signal.aborted) { setStatus('error'); locked.current = false; }
  }, [apply]);

  useEffect(() => {
    if (path && sidRef.current === path && controller.current && !controller.current.signal.aborted) return;
    controller.current?.abort();
    sidRef.current = path || null; setSessionId(path || null);
    setMessages([]); setVersions([]); versionsRef.current = []; setChipGroups([]);
    setOriginalImage(null); setError(null); setUnavailable(false); setStatus('idle'); locked.current = false;
    viewedRef.current = 'original'; following.current = true; setViewedId('original');
    operation.current = null; intent.current = null;
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

  const execute = useCallback(async (params: StreamTurnParams) => {
    const ac = new AbortController(); controller.current?.abort(); controller.current = ac;
    completed.current = false;
    locked.current = true; setError(null); setStage(null); setStatus('streaming');
    const messageId = crypto.randomUUID();
    setChipGroups([]);
    await streamChatTurn(params, {
      onSay: delta => setMessages(old => old.some(m => m.id === messageId) ? old.map(m => m.id === messageId ? { ...m, text: m.text + delta } : m) : [...old, { id: messageId, role: 'assistant', text: delta }]),
      onStage: event => setStage(event.label_fa),
      onQuestions: event => setChipGroups(chipGroupsFromQuestions(event)),
      onRenderPending: () => setStatus('rendering'),
      onError: message => setError(message),
    }, ac.signal);
    if (!ac.signal.aborted) await reconcile(params.sessionId, ac.signal, params.idempotencyKey);
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
    await execute(params);
    return completed.current;
  }, [execute, unavailable]);

  const retry = useCallback(async () => {
    const sid = sidRef.current;
    if (locked.current) return;
    if (!sid) { if (pendingArgs.current) await sendTurn(pendingArgs.current); return; }
    locked.current = true;
    const ac = new AbortController(); controller.current = ac;
    const loaded = await loadChatSession(sid, viewedRef.current);
    if (!loaded.success) { setError(loaded.error || 'ارتباط برقرار نشد'); locked.current = false; return; }
    const ops = (loaded.data as SessionPayload).operations || [];
    const active = ops.find(o => o.status === 'running');
    const failed = ops.find(o => o.operation_id === operation.current?.operation_id) || ops.find(o => o.idempotency_key === intent.current?.idempotencyKey) || ops[0];
    if (active) { await reconcile(sid, ac.signal, active.operation_id); return; }
    if (failed?.status === 'failed' && failed.kind === 'render') {
      const result = await requestRender({ sessionId: sid, idempotencyKey: failed.idempotency_key });
      if (!result.success) { setError(result.error || 'خطا در ساخت تصویر'); locked.current = false; return; }
      await reconcile(sid, ac.signal, failed.operation_id);
    } else if (failed?.status === 'failed' || (!failed && intent.current)) {
      await execute(intent.current || { sessionId: sid, text: '', images: [], idempotencyKey: failed.idempotency_key, baseVersionId: failed.base_version_id });
    } else { await reconcile(sid, ac.signal); }
  }, [execute, reconcile, sendTurn]);

  const selectChip = (groupId: string, chipId: string) => {
    if (chipId.endsWith(':open-chat')) { window.dispatchEvent(new Event('homa-redesign-focus-composer')); return; }
    const label = chipGroups.find(g => g.id === groupId)?.chips.find(c => c.id === chipId)?.label;
    if (label) void sendTurn({ text: label });
  };
  return { sessionId, messages, chipGroups, versions, originalImage, viewedId, selectVersion, selectedVersion: versions.find(v => v.version_id === viewedId), status, stage, error, unavailable, hydrating, busy: ['creating', 'streaming', 'rendering'].includes(status), sendTurn, selectChip, retry, newVersionReady: !!readyId && viewedId !== readyId };
}
