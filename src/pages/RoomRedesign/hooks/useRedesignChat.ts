/**
 * Live state machine for the conversational Room Redesign chat.
 *
 * Owns the session id, the streamed message list, preference chips, product
 * results, impact rows, diagnostic issues, and any inline-rendered preview
 * images. `RoomRedesignPage` consumes this and stays a thin orchestrator.
 *
 * Concurrency: the backend serializes turns per session, so we block a new
 * `sendTurn` while one is `creating`/`streaming`. The in-flight stream is
 * aborted on unmount / `reset()`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/utils/analytics';
import {
  createChatSession,
  streamChatTurn,
  requestRender,
  loadChatSession,
  extractRenderImages,
  type ImageEvent,
  type QuestionsEvent,
  type ResultEvent,
  type SessionPayload,
  type StageEvent,
} from '../services/redesignChatService';
import {
  categoriesFromResult,
  chipGroupsFromQuestions,
  findingsFromResult,
  impactsFromResult,
  issuesFromResult,
  pinsFromResult,
  productsFromResult,
  rebuildSessionView,
  type ExistingIssue,
  type RebuiltSession,
  type RedesignCategory,
  type RedesignProductWithMeta,
  type RoomFinding,
} from '../services/transformers';
import type { AnnotationPin, ChatEventKind, ChatMessage, ChipGroup, ImpactItem, RoomVersion } from '../types';

export type ChatStatus = 'idle' | 'creating' | 'streaming' | 'rendering' | 'error';

export interface SendTurnArgs {
  text: string;
  images?: string[];
}

export interface UseRedesignChat {
  sessionId: string | null;
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  products: RedesignProductWithMeta[];
  /** Products grouped by design category (the guided shopping plan). */
  categories: RedesignCategory[];
  impacts: ImpactItem[];
  existingIssues: ExistingIssue[];
  /** Photo pins (gaps + goods) for the active scene, anchored at x/y percent. */
  pins: AnnotationPin[];
  /** All gaps + goods for the active scene (incl. unplaced) for the detail text list. */
  findings: RoomFinding[];
  previewImage: string | null;
  versions: RoomVersion[];
  activeVersion: number;
  status: ChatStatus;
  /** Live backend phase label (Persian) for the analysis loading screen; null between turns. */
  stage: string | null;
  error: string | null;
  /** True once a `result` has arrived (products/impacts are meaningful). */
  hasResult: boolean;
  /** True while the initial session is being loaded from the DB (resume `?s=`). */
  hydrating: boolean;
  /** True while creating a session or streaming a turn. */
  busy: boolean;
  sendTurn: (args: SendTurnArgs) => Promise<void>;
  selectChip: (groupId: string, chipId: string) => void;
  /** Request an explicit async render (Celery) and poll until the image lands. */
  renderScene: (instructions?: string) => Promise<void>;
  setActiveVersion: (n: number) => void;
  reset: () => void;
}

let seq = 0;
const nextId = (p: string): string => `${p}:${Date.now().toString(36)}:${(seq++).toString(36)}`;

// Persist the chat session id so a render in flight (Celery, server-side) can be
// resumed after a frontend reload / reopen — the result lives in the DB.
const SESSION_KEY = 'homa_redesign_session';

/** setTimeout as an abortable promise (resolves early on abort). */
const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

export function useRedesignChat(resumeId?: string): UseRedesignChat {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chipGroups, setChipGroups] = useState<ChipGroup[]>([]);
  const [products, setProducts] = useState<RedesignProductWithMeta[]>([]);
  const [categories, setCategories] = useState<RedesignCategory[]>([]);
  const [impacts, setImpacts] = useState<ImpactItem[]>([]);
  const [existingIssues, setExistingIssues] = useState<ExistingIssue[]>([]);
  const [pins, setPins] = useState<AnnotationPin[]>([]);
  const [findings, setFindings] = useState<RoomFinding[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [versions, setVersions] = useState<RoomVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  // Resume (`?s=`) starts in a loading state so the consumer shows a spinner
  // instead of a blank/intake flash until the first DB load resolves.
  const [hydrating, setHydrating] = useState(() => !!resumeId);

  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const statusRef = useRef<ChatStatus>('idle');
  const chipGroupsRef = useRef<ChipGroup[]>([]);
  const versionsLenRef = useRef(0);
  const lastSceneIdRef = useRef<string | null>(null);
  const didHydrateRef = useRef(false);

  const setStatusBoth = useCallback((s: ChatStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const applyChipGroups = useCallback((g: ChipGroup[]) => {
    chipGroupsRef.current = g;
    setChipGroups(g);
  }, []);

  const pushAssistantMessageRef = useRef<(text: string) => void>(() => {});
  const pushEventRef = useRef<(text: string, k: ChatEventKind) => void>(() => {});

  /** Append a rendered version + point the canvas at it. */
  const pushVersion = useCallback((url: string, sceneId: string | null) => {
    const index = versionsLenRef.current + 1;
    versionsLenRef.current = index;
    if (sceneId) lastSceneIdRef.current = sceneId;
    setVersions((prev) => [
      ...prev,
      { id: `ver:${sceneId ?? 'na'}:${index}`, index, imageUrl: url, thumbUrl: url, pins: [] },
    ]);
    setPreviewImage(url);
    setActiveVersion(index);
  }, []);

  /**
   * Apply an authoritative session view (rebuilt from the DB) onto live state.
   * Shared by initial hydration, post-turn reconciliation, and render-landing so
   * the live tab always converges to exactly what a fresh tab would show.
   *
   * - Messages are only REPLACED when the persisted thread is longer (covers an
   *   event the live SSE missed) or `replaceMessages` — never shortened, so a
   *   client-only ack bubble isn't dropped and bubbles don't needlessly remount.
   * - Versions only grow; `focusLatest` jumps the canvas to the newest render
   *   (after a render lands) vs. leaving the user on the version they're viewing.
   */
  const applySessionView = useCallback(
    (view: RebuiltSession, opts?: { focusLatest?: boolean; replaceMessages?: boolean }) => {
      const focusLatest = opts?.focusLatest ?? false;
      const replaceMessages = opts?.replaceMessages ?? false;
      setMessages((prev) => (replaceMessages || view.messages.length > prev.length ? view.messages : prev));
      applyChipGroups(view.chipGroups);
      setProducts(view.products);
      setCategories(view.categories);
      setImpacts(view.impacts);
      setExistingIssues(view.issues);
      setPins(view.pins);
      setFindings(view.findings);
      setHasResult((prev) => prev || view.hasResult);
      if (view.versions.length >= versionsLenRef.current) {
        versionsLenRef.current = view.versions.length;
        if (view.lastSceneId) lastSceneIdRef.current = view.lastSceneId;
        if (view.versions.length > 0) {
          setVersions(view.versions);
          if (focusLatest) {
            setActiveVersion(view.activeVersion);
            setPreviewImage(view.previewImage);
          } else {
            // Don't yank the user off a version they're viewing; just ensure the
            // canvas has an image if it had none.
            setActiveVersion((cur) => (cur === 0 ? view.activeVersion : cur));
            setPreviewImage((cur) => cur ?? view.previewImage);
          }
        }
      }
    },
    [applyChipGroups],
  );

  /** Load the session and reconcile live state from it (SSE is optimistic; the DB
   *  is source of truth). Bails if the turn was aborted OR a newer turn/render has
   *  since taken over (so a late reconcile can't revert fresher optimistic state). */
  const reconcileFromSession = useCallback(
    async (sid: string, controller: AbortController, focusLatest = false): Promise<void> => {
      const load = await loadChatSession(sid);
      if (controller.signal.aborted || abortRef.current !== controller || !load.success) return;
      applySessionView(rebuildSessionView(load.data as SessionPayload), { focusLatest });
    },
    [applySessionView],
  );

  /** Poll the (DB-backed) session until a new render image lands or it fails. */
  const pollForNewImage = useCallback(
    async (sid: string, baseline: number, controller: AbortController) => {
      const evt = pushEventRef.current;
      for (let i = 0; i < 150; i++) {
        // ~5 min at 2s
        await delay(2000, controller.signal);
        if (controller.signal.aborted) return;
        const load = await loadChatSession(sid);
        if (!load.success) {
          setStatusBoth('error');
          evt('این گفت‌وگو منقضی شده یا دیگر در دسترس نیست.', 'error');
          trackEvent('redesign_failure', { error_type: 'expired_session' });
          return;
        }
        const payload = load.data as SessionPayload;
        const imgs = extractRenderImages(payload);
        if (imgs.length > baseline) {
          // Reconcile the whole session (all images + any scene result/pins), not
          // just the one new image, and jump the canvas to the freshest render.
          applySessionView(rebuildSessionView(payload), { focusLatest: true });
          setStatusBoth('idle');
          evt('این نسخه آماده شد', 'success');
          return;
        }
        if (payload.status === 'failed') {
          setStatusBoth('error');
          evt('ساخت تصویر ناموفق بود. دوباره امتحان کن.', 'error');
          return;
        }
        if (payload.status === 'active') {
          // Render finished but produced no image (e.g. no scene to render).
          setStatusBoth('error');
          evt('تصویری ساخته نشد. دوباره امتحان کن.', 'error');
          return;
        }
      }
      setStatusBoth('error');
      evt('ساخت تصویر بیش از حد طول کشید (سرویس پس‌زمینه فعاله؟).', 'error');
    },
    [applySessionView, setStatusBoth],
  );

  /**
   * Recover a turn whose SSE stream dropped (e.g. ERR_NETWORK_CHANGED). The
   * backend keeps running the turn after the client disconnects and persists the
   * full result, so poll the DB-backed session briefly and adopt whatever landed
   * instead of surfacing a transient network error. Falls back to an error only
   * if the turn failed server-side, the session is unreachable, or it times out.
   */
  const recoverFromNetworkDrop = useCallback(
    async (sid: string, baselineTurns: number, controller: AbortController) => {
      const evt = pushEventRef.current;
      for (let i = 0; i < 45; i++) {
        // ~90s at 2s
        await delay(2000, controller.signal);
        if (controller.signal.aborted || abortRef.current !== controller) return;
        const load = await loadChatSession(sid);
        if (!load.success) break; // session unreachable → surface the network error
        const payload = load.data as SessionPayload;
        if (payload.status === 'failed') {
          setStatusBoth('error');
          evt('پردازش ناموفق بود. دوباره تلاش کن.', 'error');
          trackEvent('redesign_failure', { error_type: 'recover_turn_failed' });
          return;
        }
        if ((payload.turns || []).length > baselineTurns) {
          // The turn landed. Reconcile (replacing messages, since the live thread
          // may hold only a partial assistant delta from the dropped stream), then
          // hand off to render polling if a render was auto-enqueued.
          applySessionView(rebuildSessionView(payload), { focusLatest: true, replaceMessages: true });
          if (payload.status === 'rendering') {
            const baseline = extractRenderImages(payload).length;
            setStatusBoth('rendering');
            await pollForNewImage(sid, baseline, controller);
          } else {
            setStatusBoth('idle');
            evt('پاسخ آماده شد', 'success');
          }
          return;
        }
      }
      // Timed out or unreachable — surface the (accurate) network error.
      setStatusBoth('error');
      evt('ارتباط قطع شد. لطفاً اینترنتت رو بررسی کن و دوباره تلاش کن.', 'error');
      trackEvent('redesign_failure', { error_type: 'recover_timeout' });
    },
    [applySessionView, pollForNewImage, setStatusBoth],
  );

  // Abort any in-flight stream/poll when the consumer unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Resume the FULL session from the DB on mount. The backend persists every
  // emitted event (`render_json`), so a reload / reopen restores the entire
  // conversation — messages, chips, products, impacts and rendered versions —
  // not just the images. The session id comes ONLY from the URL (`?s=`, shareable /
  // bookmarkable). If `?s=` is absent, start fresh and clear any stale stored session.
  useEffect(() => {
    if (didHydrateRef.current) return;
    const sid: string | null = resumeId || null;
    if (!sid) {
      // No resumeId from URL — start fresh, clear stale stored session, mark hydrated
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* localStorage unavailable */
      }
      didHydrateRef.current = true;
      setHydrating(false);
      return;
    }
    sessionIdRef.current = sid;
    setSessionId(sid);
    try {
      localStorage.setItem(SESSION_KEY, sid);
    } catch {
      /* localStorage unavailable */
    }
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      const load = await loadChatSession(sid);
      // Aborted (e.g. React StrictMode's mount→unmount→remount probe in dev, or a
      // real unmount): do NOT mark hydrated or clear the id — let the remount retry.
      if (controller.signal.aborted) return;
      if (!load.success) {
        // A stale/invalid id (e.g. deleted session): drop it so the user starts fresh.
        didHydrateRef.current = true;
        setHydrating(false);
        sessionIdRef.current = null;
        setSessionId(null);
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          /* localStorage unavailable */
        }
        return;
      }
      // Successful, non-aborted load — safe to mark hydrated so we don't refetch.
      didHydrateRef.current = true;
      const payload = load.data as SessionPayload;
      applySessionView(rebuildSessionView(payload), { focusLatest: true, replaceMessages: true });
      setHydrating(false);

      // A render may still be running server-side (durable, survives reload).
      if (payload.status === 'rendering') {
        const baseline = extractRenderImages(payload).length;
        setStatusBoth('rendering');
        await pollForNewImage(sid, baseline, controller);
      }
    })();
  }, [resumeId, applySessionView, pollForNewImage, setStatusBoth]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const res = await createChatSession();
    if (res.success && res.data) {
      sessionIdRef.current = res.data.sessionId;
      setSessionId(res.data.sessionId);
      try {
        localStorage.setItem(SESSION_KEY, res.data.sessionId);
      } catch {
        /* localStorage unavailable */
      }
      return res.data.sessionId;
    }
    setError(res.error || 'خطا در ایجاد گفتگو');
    return null;
  }, []);

  const appendAssistantDelta = useCallback((delta: string) => {
    setMessages((prev) => {
      const id = assistantIdRef.current;
      if (id) return prev.map((m) => (m.id === id ? { ...m, text: m.text + delta } : m));
      const newId = nextId('a');
      assistantIdRef.current = newId;
      return [...prev, { id: newId, role: 'assistant', text: delta }];
    });
  }, []);

  const pushAssistantMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId('a'), role: 'assistant', text }]);
  }, []);
  pushAssistantMessageRef.current = pushAssistantMessage;

  // Operational status / errors are NOT هما's conversational voice — push them as
  // centered event pills (distinct severity), never chat bubbles. Strips the old
  // 👇 glyph (the success pill carries an ImageDown icon instead).
  const pushEvent = useCallback((text: string, eventKind: ChatEventKind) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId('ev'), role: 'assistant', text: text.replace('👇', '').trim(), kind: 'event', eventKind },
    ]);
  }, []);
  pushEventRef.current = pushEvent;

  const sendTurn = useCallback(
    async ({ text, images = [] }: SendTurnArgs) => {
      const s = statusRef.current;
      if (s === 'creating' || s === 'streaming' || s === 'rendering') return;
      const trimmed = (text || '').trim();
      const turnStartedAt = performance.now();
      if (images.length) {
        trackEvent('redesign_intake_submitted', { image_count: images.length });
      }

      const userId = nextId('u');
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: trimmed, imageUrl: images[0] },
      ]);
      applyChipGroups([]);
      setError(null);
      setStage(null);
      assistantIdRef.current = null;

      const controller = new AbortController();
      abortRef.current = controller;

      setStatusBoth('creating');
      const sid = await ensureSession();
      if (!sid) {
        setStatusBoth('error');
        pushEvent('خطا در ایجاد گفتگو. دوباره تلاش کن.', 'error');
        return;
      }
      if (controller.signal.aborted) return;

      // Capture the DB turn count so a network drop can tell whether the turn landed.
      const preLoad = await loadChatSession(sid);
      const baselineTurns = preLoad.success ? (preLoad.data as SessionPayload).turns.length : 0;

      setStatusBoth('streaming');
      // Seed the uploaded photo as version 1 (the "before") on the very first
      // turn so the user can track before→after in the version rail.
      if (images[0] && versionsLenRef.current === 0) {
        pushVersion(images[0], null);
      }
      // Track what the turn produced so the chat never goes silent: some turns
      // emit only a `result`/`image` with no assistant `say` text.
      let sawSay = false;
      let sawResult = false;
      let sawImage = false;
      let sawQuestions = false;
      let sawRenderPending = false;
      let recovering = false;
      await streamChatTurn(
        { sessionId: sid, text: trimmed, images, idempotencyKey: nextId('turn') },
        {
          onSay: (delta) => {
            sawSay = true;
            appendAssistantDelta(delta);
          },
          onStage: (e: StageEvent) => setStage(e.label_fa),
          onQuestions: (e: QuestionsEvent) => {
            sawQuestions = true;
            applyChipGroups(chipGroupsFromQuestions(e));
            trackEvent('redesign_choice_seen', {
              choice_count: e.questions?.[0]?.chips?.length ?? 0,
            });
          },
          onResult: (e: ResultEvent) => {
            sawResult = true;
            const sceneId = e.items?.[0]?.scene_id ?? e.scenes?.[0]?.id ?? null;
            if (sceneId) lastSceneIdRef.current = sceneId;
            setProducts(productsFromResult(e));
            setCategories(categoriesFromResult(e));
            setImpacts(impactsFromResult(e));
            setExistingIssues(issuesFromResult(e));
            setPins(pinsFromResult(e, sceneId));
            setFindings(findingsFromResult(e, sceneId));
            setHasResult(true);
            trackEvent('redesign_recommendation_seen', {
              product_count: e.items?.reduce((count, item) => count + (item.products?.length ?? 0), 0) ?? 0,
              category_count: e.items?.length ?? 0,
            });
          },
          onImage: (e: ImageEvent) => {
            sawImage = true;
            pushVersion(e.url, e.scene_id ?? null);
            trackEvent('redesign_render_ready', { duration_ms: Math.round(performance.now() - turnStartedAt) });
          },
          onRenderPending: () => {
            // Server is rendering a scene async (Celery). Poll the DB-backed session
            // until the image lands. Baseline MUST be the backend's render-image count
            // (`extractRenderImages` ignores the user's uploaded "before" photo) — not
            // `versionsLenRef`, which counts that seeded photo and would be off by one,
            // so the first render (count 1) never exceeds baseline (1).
            sawRenderPending = true;
            setStatusBoth('rendering');
            void (async () => {
              const pre = await loadChatSession(sid);
              const baseline = pre.success ? extractRenderImages(pre.data as SessionPayload).length : 0;
              await pollForNewImage(sid, baseline, controller);
            })();
          },
          onError: (msg, kind) => {
            // A render is already in flight (render_pending arrived before the
            // drop); pollForNewImage owns recovery/status, so ignore the stream error.
            if (sawRenderPending) return;
            if (kind === 'network') {
              // The backend keeps running the turn after a client disconnect and
              // persists the result — reconcile it once it lands instead of failing.
              recovering = true;
              void recoverFromNetworkDrop(sid, baselineTurns, controller);
              return;
            }
            setError(msg);
            setStatusBoth('error');
            pushEvent(msg, 'error');
            trackEvent('redesign_failure', { error_type: 'stream' });
          },
          onDone: () => {
            if (statusRef.current === 'error') return;
            // Acknowledge turns that produced output but no assistant text.
            if (!sawSay && !sawQuestions) {
              if (sawImage) {
                pushAssistantMessage('این نسخه رو برات ساختم — توی پیش‌نمایش می‌تونی ببینیش.');
              } else if (sawResult) {
                pushAssistantMessage('چند پیشنهاد تازه برات آماده کردم؛ توی تب محصولات ببین.');
              }
            }
            // A wow render is in flight (pollForNewImage owns status until it
            // lands); don't drop back to idle and cancel the rendering state.
            if (sawRenderPending || recovering) return;
            setStatusBoth('idle');
            // Reconcile from the DB (source of truth): the live SSE is optimistic,
            // so adopt anything it missed — the live tab now matches a fresh tab.
            void reconcileFromSession(sid, controller, false);
          },
        },
        controller.signal,
      );
    },
    [appendAssistantDelta, applyChipGroups, ensureSession, pollForNewImage, pushAssistantMessage, pushEvent, pushVersion, reconcileFromSession, recoverFromNetworkDrop, setStatusBoth],
  );

  const renderScene = useCallback(
    async (instructions?: string) => {
      const sid = sessionIdRef.current;
      if (!sid) return; // need a session — send the first turn (photo) first
      const s = statusRef.current;
      if (s === 'creating' || s === 'streaming' || s === 'rendering') return;

      setError(null);
      setStatusBoth('rendering');
      trackEvent('redesign_render_requested', { has_instructions: Boolean(instructions?.trim()) });

      const controller = new AbortController();
      abortRef.current = controller;

      // Baseline = images already in the session (DB); poll until it grows.
      let baseline = versionsLenRef.current;
      const pre = await loadChatSession(sid);
      if (pre.success) baseline = extractRenderImages(pre.data as SessionPayload).length;

      const res = await requestRender({
        sessionId: sid,
        sceneId: lastSceneIdRef.current,
        instructions,
        idempotencyKey: nextId('render'),
      });
      if (!res.success) {
        setStatusBoth('error');
        pushEvent(res.error || 'خطا در ساخت تصویر', 'error');
        return;
      }
      if (res.operationStatus === 'succeeded') {
        await reconcileFromSession(sid, controller, true);
        setStatusBoth('idle');
        return;
      }
      await pollForNewImage(sid, baseline, controller);
    },
    [pollForNewImage, pushEvent, setStatusBoth],
  );

  const selectChip = useCallback(
    (groupId: string, chipId: string) => {
      const group = chipGroupsRef.current.find((g) => g.id === groupId);
      if (chipId.endsWith(':open-chat')) {
        trackEvent('redesign_choice_answered', { open_chat: true });
        window.dispatchEvent(new Event('homa-redesign-focus-composer'));
        return;
      }
      trackEvent('redesign_choice_answered', { open_chat: false });
      const label = group?.chips.find((c) => c.id === chipId)?.label;
      if (label) void sendTurn({ text: label, images: [] });
    },
    [sendTurn],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionIdRef.current = null;
    assistantIdRef.current = null;
    versionsLenRef.current = 0;
    lastSceneIdRef.current = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* localStorage unavailable */
    }
    setSessionId(null);
    setMessages([]);
    applyChipGroups([]);
    setProducts([]);
    setCategories([]);
    setImpacts([]);
    setExistingIssues([]);
    setPins([]);
    setFindings([]);
    setPreviewImage(null);
    setVersions([]);
    setActiveVersion(0);
    setError(null);
    setStage(null);
    setHasResult(false);
    setHydrating(false);
    setStatusBoth('idle');
  }, [applyChipGroups, setStatusBoth]);

  const busy = status === 'creating' || status === 'streaming' || status === 'rendering';

  return {
    sessionId,
    messages,
    chipGroups,
    products,
    categories,
    impacts,
    existingIssues,
    pins,
    findings,
    previewImage,
    versions,
    activeVersion,
    status,
    stage,
    error,
    hasResult,
    hydrating,
    busy,
    sendTurn,
    selectChip,
    renderScene,
    setActiveVersion,
    reset,
  };
}
