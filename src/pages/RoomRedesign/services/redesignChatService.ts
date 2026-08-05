/**
 * Service layer for the conversational Room Redesign chat backend
 * (`/api/recommendations/chat/`).
 *
 * - `createChatSession()` / `loadChatSession()` use the shared `apiClient`.
 * - `streamChatTurn()` runs the SSE `turn` endpoint via `sseClient` and dispatches
 *   typed events to the supplied handlers.
 *
 * The `Backend*` interfaces below are the exact JSON shapes the backend emits
 * (see backend `apps/recommendations/chat/harness/runner.py`). Prices are in
 * Toman and products carry no `unique_link` unless the backend exposes it.
 */
import { apiGet, apiPost } from '@/utils/apiClient';
import { appConfig } from '@/config/appConfig';
import { runSseStream, type SseEvent } from './sseClient';

// --------------------------------------------------------------------------- //
// Backend event payload shapes
// --------------------------------------------------------------------------- //
export interface SessionEvent {
  id: string;
}

export interface SayEvent {
  delta: string;
}

export interface BackendQuestion {
  id: string;
  text_fa: string;
  chips: string[];
  recommended_chip?: string;
  allow_open_chat?: boolean;
  open_chat_label_fa?: string;
}

export interface QuestionsEvent {
  questions: BackendQuestion[];
}

export interface BackendProduct {
  product_id: number;
  name: string;
  category_fa?: string;
  price_toman?: number;
  description?: string;
  ai_description?: string;
  score?: number;
  rerank_score?: number;
  match_notes?: string[];
  image_path?: string;
  image_url?: string;
  /** Present only once the backend exposes it (see plan §6); optional for safety. */
  unique_link?: string;
}

export interface BackendResultScores {
  impact_score?: number;
  purchase_priority?: string;
  [k: string]: unknown;
}

export interface BackendResultItem {
  category_code: string;
  category_fa: string;
  reason_fa: string;
  scene_id: string | null;
  scene_label_fa: string;
  products: BackendProduct[];
  selected_product_id: number | null;
  scores: BackendResultScores;
  match_status: string;
  needed_but_unavailable: boolean;
  unavailable_reason_fa: string;
  related_issue_ids: string[];
}

export interface BackendExistingDecision {
  existing_item_id: string;
  item_name_fa: string;
  pin_label_fa?: string;
  current_role: string;
  decision: string;
  decision_reason_fa: string;
  action_instruction_fa: string;
  scene_id: string | null;
  scene_label_fa: string;
  /** Pin position on the room photo (percent of frame, 0-100). 0 = unplaced. */
  x?: number;
  y?: number;
  [k: string]: unknown;
}

/** One room_analysis issue (layout / harmony / function / surface). Ids vary by kind. */
export interface BackendRoomIssue {
  issue_id?: string;
  conflict_id?: string;
  function_issue_id?: string;
  surface_issue_id?: string;
  issue_type?: string;
  evidence_fa?: string;
  severity?: string;
  /** Short Persian pin caption + position (percent of frame, 0-100). 0 = unplaced. */
  label_fa?: string;
  pin_label_fa?: string;
  x?: number;
  y?: number;
}

export interface BackendRoomAnalysis {
  layout_issues?: BackendRoomIssue[];
  harmony_conflicts?: BackendRoomIssue[];
  function_issues?: BackendRoomIssue[];
  functional_issues?: BackendRoomIssue[];
  surface_issues?: BackendRoomIssue[];
  surface_finish_issues?: BackendRoomIssue[];
  [k: string]: unknown;
}

export interface BackendScene {
  id: string;
  label_fa: string;
  diagnosis_fa: string;
  primary_image_id?: string;
  room_analysis?: BackendRoomAnalysis;
  [k: string]: unknown;
}

export interface ResultEvent {
  message_fa: string;
  items: BackendResultItem[];
  existing_item_decisions: BackendExistingDecision[];
  layout_actions: unknown[];
  surface_changes: unknown[];
  scenes: BackendScene[];
  prefs: unknown;
}

export interface ImageEvent {
  url: string;
  scene_id: string;
  scene_label_fa: string;
}

/** Server is about to auto-render the primary scene (wow moment). No image yet. */
export interface RenderPendingEvent {
  scene_id: string;
  scene_label_fa: string;
}

/** Transient progress hint for the live loading screen (not persisted). */
export interface StageEvent {
  key?: string;
  label_fa: string;
}

export interface StreamTurnHandlers {
  onSession?: (e: SessionEvent) => void;
  onSay?: (delta: string) => void;
  onQuestions?: (e: QuestionsEvent) => void;
  onResult?: (e: ResultEvent) => void;
  onImage?: (e: ImageEvent) => void;
  onRenderPending?: (e: RenderPendingEvent) => void;
  /** Live backend phase label (Persian) for the analysis loading screen. */
  onStage?: (e: StageEvent) => void;
  /** Localized (Persian) error message. */
  onError?: (message: string) => void;
  /** Stream closed (success or handled error). Not called on abort. */
  onDone?: () => void;
}

export interface StreamTurnParams {
  sessionId: string;
  text: string;
  images: string[];
  prefsUpdate?: unknown;
  idempotencyKey: string;
}

// --------------------------------------------------------------------------- //
// Session create / load (plain JSON via apiClient)
// --------------------------------------------------------------------------- //
export interface CreateSessionResult {
  success: boolean;
  data?: { sessionId: string; status: string };
  error?: string;
}

export async function createChatSession(): Promise<CreateSessionResult> {
  const res = await apiPost<{ session_id: string; status: string }>(
    '/recommendations/chat/sessions/',
    {},
  );
  if (res.success && res.data) {
    return { success: true, data: { sessionId: res.data.session_id, status: res.data.status } };
  }
  return { success: false, error: res.error || 'خطا در ایجاد گفتگو' };
}

export interface LoadSessionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Resume payload (re-presigned image URLs). Used to resume/hydrate a session. */
export async function loadChatSession(sessionId: string): Promise<LoadSessionResult> {
  const res = await apiGet<unknown>(`/recommendations/chat/sessions/${sessionId}/`);
  if (res.success) return { success: true, data: res.data };
  return { success: false, error: res.error || 'خطا در بارگذاری گفتگو' };
}

export async function selectChatProduct(params: {
  sessionId: string;
  category: string;
  productId: number;
}): Promise<{ success: boolean; error?: string }> {
  const res = await apiPost<{ ok: boolean }>('/recommendations/chat/select/', {
    session_id: params.sessionId,
    category: params.category,
    product_id: params.productId,
  });
  return res.success && res.data?.ok
    ? { success: true }
    : { success: false, error: res.error || 'خطا در ذخیره انتخاب محصول' };
}

// --------------------------------------------------------------------------- //
// Explicit async render (Celery): POST returns 202 immediately (no gunicorn
// thread blocked); the worker generates + persists to the session in DB. The
// client polls `GET /chat/sessions/<id>/`, which survives a frontend restart.
// --------------------------------------------------------------------------- //
export interface RenderResult {
  success: boolean;
  status?: string;
  operationStatus?: string;
  error?: string;
}

export async function requestRender(params: {
  sessionId: string;
  sceneId?: string | null;
  instructions?: string | null;
  idempotencyKey: string;
}): Promise<RenderResult> {
  const res = await apiPost<{ session_id: string; status: string; operation_status?: string }>(
    '/recommendations/chat/render/',
    {
      session_id: params.sessionId,
      scene_id: params.sceneId ?? null,
      instructions: params.instructions ?? null,
      idempotency_key: params.idempotencyKey,
    },
  );
  if (res.success) return {
    success: true,
    status: res.data?.status,
    operationStatus: res.data?.operation_status,
  };
  return { success: false, error: res.error || 'خطا در شروع ساخت تصویر' };
}

/** Shape of the GET session payload, for hydration + render polling. */
export interface SessionTurnEvent {
  event: string;
  data?: { url?: string; scene_id?: string; image_object_name?: string };
}
export interface SessionTurn {
  role: string;
  text?: string;
  /** Present on user turns: the data-URL photo(s) the user sent. */
  images?: string[];
  events?: SessionTurnEvent[];
}
export interface SessionPayload {
  session_id: string;
  status: string;
  title: string;
  turns: SessionTurn[];
}

/** All rendered images (presigned) across the session, in order. */
export function extractRenderImages(payload: SessionPayload): { url: string; sceneId: string | null }[] {
  const out: { url: string; sceneId: string | null }[] = [];
  for (const turn of payload.turns || []) {
    for (const ev of turn.events || []) {
      if (ev.event === 'image' && ev.data?.url) {
        out.push({ url: ev.data.url, sceneId: ev.data.scene_id ?? null });
      }
    }
  }
  return out;
}

// --------------------------------------------------------------------------- //
// Streamed turn (SSE)
// --------------------------------------------------------------------------- //
const CHAT_TURN_URL = `${appConfig.apiBaseUrl.replace(/\/$/, '')}/api/recommendations/chat/turn/`;

export async function streamChatTurn(
  params: StreamTurnParams,
  handlers: StreamTurnHandlers,
  signal: AbortSignal,
): Promise<void> {
  const onEvent = (e: SseEvent) => {
    switch (e.event) {
      case 'session':
        handlers.onSession?.(e.data as SessionEvent);
        break;
      case 'say': {
        const d = e.data as SayEvent;
        if (d && typeof d.delta === 'string') handlers.onSay?.(d.delta);
        break;
      }
      case 'questions':
        handlers.onQuestions?.(e.data as QuestionsEvent);
        break;
      case 'result':
        handlers.onResult?.(e.data as ResultEvent);
        break;
      case 'image':
        handlers.onImage?.(e.data as ImageEvent);
        break;
      case 'render_pending':
        handlers.onRenderPending?.(e.data as RenderPendingEvent);
        break;
      case 'stage': {
        const d = e.data as StageEvent;
        if (d && typeof d.label_fa === 'string') handlers.onStage?.(d);
        break;
      }
      case 'error': {
        // Never surface raw backend/technical errors to the user. Keep a Persian
        // (user-facing) message if the backend sent one; otherwise show a generic خطا.
        const d = e.data as { error?: string };
        const raw = d?.error || '';
        const isPersian = /[؀-ۿ]/.test(raw);
        handlers.onError?.(isPersian ? raw : 'خطایی رخ داد. لطفاً دوباره تلاش کن.');
        break;
      }
      default:
        break;
    }
  };

  const result = await runSseStream({
    url: CHAT_TURN_URL,
    body: {
      session_id: params.sessionId,
      text: params.text,
      images: params.images,
      prefs_update: params.prefsUpdate ?? null,
      idempotency_key: params.idempotencyKey,
    },
    signal,
    onEvent,
  });

  if (result.aborted) return; // silent — navigation / unmount

  if (!result.ok) {
    if (result.status === 401) {
      handlers.onError?.('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
    } else {
      // Keep a Persian backend message if present; otherwise a generic one.
      const isPersian = !!result.error && /[؀-ۿ]/.test(result.error);
      handlers.onError?.(isPersian ? (result.error as string) : 'خطا در ارتباط با سرور');
    }
  }
  handlers.onDone?.();
}
