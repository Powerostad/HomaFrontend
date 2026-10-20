import { siteText } from '@/i18n/siteCopy';
/**
 * Service layer for the conversational Room Redesign chat backend
 * (`/api/recommendations/chat/`).
 *
 * - `createChatSession()` / `loadChatSession()` use the shared `apiClient`.
 * - `streamChatTurn()` sends a `chat.turn` command over the chat WebSocket and
 *   dispatches the same typed events to the supplied handlers.
 *
 * The `Backend*` interfaces below are the exact JSON shapes the backend emits
 * (see backend `apps/recommendations/chat/harness/runner.py`). Prices are in
 * Toman and products carry no `unique_link` unless the backend exposes it.
 */
import { apiGet, apiPost } from '@/utils/apiClient';
import { runChatCommand, type ChatErrorKind, type ChatSocketEvent } from './chatWebSocket';
import type { MotherProduct, StudioMotherDocument } from './motherDocument';

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
  recommendation_reason_fa?: string;
  allow_open_chat?: boolean;
  open_chat_label_fa?: string;
}

export interface QuestionsEvent {
  questions: BackendQuestion[];
}

export interface BackendProduct {
  search_version?: 'studio-search-v2';
  candidate?: StudioCandidate;
  variant_options?: { variant_id: number | null; price_rial: number | null; details: StudioCandidate }[];
  product_id: number;
  name: string;
  category_fa?: string;
  price_toman?: number | null;
  price_rial?: number | null;
  merchant_name?: string;
  merchant_url?: string;
  merchant_destination?: string;
  catalog_checked_at?: string;
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

export interface StudioProductIdentity {
  version: 'product-identity-v1';
  requested_subtype: string;
  expected_subtype: string;
  expected_label_fa: string;
  catalogue_category: string | null;
  status: 'resolved' | 'category_unavailable' | 'unmapped';
  mapping_source: 'subtype_alias' | 'need_family_alias' | 'exact_catalogue_code' | 'unmapped';
  observed_subtype: string | null;
  observed_status: 'unobserved' | 'observed' | 'unknown' | 'ambiguous';
  observed_candidates: string[];
  observations: { subtype: string; source: 'catalogue_fact' | 'catalogue_title' | 'catalogue_category'; source_ref: string }[];
}

export interface StudioCandidate {
  product_identity?: StudioProductIdentity;
  variant_id: number | null;
  variant_label: string;
  dimensions_cm: Record<string, number>;
  quantity: number;
  catalog_revision?: string | null;
  order_quote?: StudioOrderQuote | null;
  eligibility: 'eligible' | 'needs_verification' | 'rejected';
  purchase_status: 'ready' | 'needs_verification' | 'unavailable';
  known_total_rial: number | null;
  verification_reasons: string[];
  missing_costs: string[];
}
export interface StudioOrderQuote {
  status: 'quoted' | 'needs_verification';
  sales_unit?: 'piece' | 'pair' | 'pack' | 'roll' | 'm' | 'm2' | 'litre';
  order_quantity?: number;
  demand_quantity?: string;
  demand_unit?: string;
  required_with_waste?: string;
  supplied_quantity?: string;
  reason?: string;
}
export type ReviewKind = 'wrong_size' | 'wrong_style' | 'verify_specification' | 'request_alternative';

export interface BackendResultScores {
  impact_score?: number;
  purchase_priority?: string;
  [k: string]: unknown;
}

export interface BackendResultItem {
  mother_product?: MotherProduct | null;
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
  studio_document?: StudioMotherDocument | null;
  render_verification?: { status: string };
  id: string;
  label_fa: string;
  diagnosis_fa: string;
  primary_image_id?: string;
  room_analysis?: BackendRoomAnalysis;
  [k: string]: unknown;
}

export interface ResultEvent {
  execution?: ExecutionPlan;
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
  operation_id?: string;
}

/** Transient progress hint for the live loading screen (not persisted). */
export interface StageEvent {
  parallel?: boolean;
  key?: string;
  label_fa: string;
}

export interface StageProgress {
  status: 'running' | 'succeeded' | 'failed';
  label_fa: string;
  started_at: string;
  finished_at?: string;
}
export interface ProductReadyEvent {
  item_id: string;
  scene_id: string;
  category: string;
  status: string;
  products: { product_id: number; variant_id: number | null; name: string; image_url: string }[];
  review_count: number;
  provisional: boolean;
}
export interface WorkflowPreview {
  operation_id?: string;
  status?: string;
  revision?: number;
  progress?: Record<string, StageProgress>;
  deadline_at?: string;
  previews?: {
    analysis_ready?: { analysis: unknown; provisional: boolean; revised?: boolean };
    design_ready?: { studio_documents: Record<string, StudioMotherDocument>; provisional: boolean };
    products_ready?: Record<string, ProductReadyEvent>;
  };
}

export interface StreamTurnHandlers {
  onAnalysisReady?: (e: NonNullable<NonNullable<WorkflowPreview['previews']>['analysis_ready']>) => void;
  onDesignReady?: (e: NonNullable<NonNullable<WorkflowPreview['previews']>['design_ready']>) => void;
  onProductsReady?: (e: ProductReadyEvent) => void;
  onSession?: (e: SessionEvent) => void;
  onSay?: (delta: string) => void;
  onQuestions?: (e: QuestionsEvent) => void;
  onResult?: (e: ResultEvent) => void;
  onImage?: (e: ImageEvent) => void;
  onRenderPending?: (e: RenderPendingEvent) => void;
  /** Live backend phase label (Persian) for the analysis loading screen. */
  onStage?: (e: StageEvent) => void;
  /** Render worker lifecycle event, including its operation identity. */
  onRenderEvent?: (e: ChatSocketEvent) => void;
  /** The live socket ended after a command had been accepted. */
  onConnectionLost?: () => void;
  /** Localized (Persian) error message. `kind` classifies transport failures
   *  (`network`/`http`/`auth`) so the caller can recover vs. surface. */
  onError?: (message: string, kind?: ChatErrorKind) => void;
  /** Stream closed (success or handled error). Not called on abort. */
  onDone?: () => void;
}

export interface StreamTurnParams {
  sessionId: string;
  text: string;
  images: string[];
  prefsUpdate?: unknown;
  baseVersionId?: string;
  action?: 'chat' | 'preview_product' | 'select_product' | 'retry_search' | 'review_product';
  itemId?: string;
  productId?: number;
  variantId?: number | null;
  placementId?: string | null;
  reviewKind?: ReviewKind;
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
    {
      ...(import.meta.env.VITE_STUDIO_SEARCH_V2 === 'true'
        ? { design_version: 'studio-design-v2', search_version: 'studio-search-v2' } : {}),
      ...(import.meta.env.VITE_STUDIO_PIPELINE_V5 === 'true'
        ? { design_version: 'studio-design-v2', pipeline_version: 'studio-pipeline-v5' }
        : import.meta.env.VITE_STUDIO_PIPELINE_V4 === 'true'
        ? { design_version: 'studio-design-v2', pipeline_version: 'studio-pipeline-v4' }
        : import.meta.env.VITE_STUDIO_PIPELINE_V3 === 'true'
        ? { design_version: 'studio-design-v2', pipeline_version: 'studio-pipeline-v3' } : {}),
      ...(import.meta.env.VITE_STUDIO_PIPELINE_V5 === 'true'
        ? (import.meta.env.VITE_STUDIO_PRODUCT_TAXONOMY_V1 === 'true' || import.meta.env.VITE_STUDIO_RULES_V3 === 'true') ? { rules_version: 'studio-rules-v3' }
          : import.meta.env.VITE_STUDIO_RULES_V2 === 'true' ? { rules_version: 'studio-rules-v2' } : {}
        : {}),
      ...(import.meta.env.VITE_STUDIO_PIPELINE_V5 === 'true' && import.meta.env.VITE_STUDIO_PRODUCT_TAXONOMY_V1 === 'true'
        ? { product_taxonomy_version: 'product-taxonomy-v1' } : {}),
      ...(import.meta.env.VITE_STUDIO_PIPELINE_V5 === 'true' && import.meta.env.VITE_STUDIO_PRODUCT_IDENTITY_V1 === 'true'
        ? { product_identity_version: 'product-identity-v1' } : {}),
    },
  );
  if (res.success && res.data) {
    return { success: true, data: { sessionId: res.data.session_id, status: res.data.status } };
  }
  return { success: false, error: res.error || siteText("خطا در ایجاد گفتگو") };
}

export interface LoadSessionResult {
  success: boolean;
  statusCode?: number;
  data?: unknown;
  error?: string;
}

/** Account-owned, server-persisted conversations, separate from legacy Studio jobs. */
export interface ChatSessionListItem {
  id: string;
  title: string;
  status: 'active' | 'rendering' | 'failed';
  turn_count: number;
  created_at: string;
  updated_at: string;
}

export async function listChatSessions(): Promise<{ success: boolean; sessions: ChatSessionListItem[] }> {
  const result = await apiGet<{ sessions: ChatSessionListItem[] }>('/recommendations/chat/sessions/');
  return { success: result.success, sessions: result.success ? result.data?.sessions ?? [] : [] };
}

/** Resume payload (re-presigned image URLs). Used to resume/hydrate a session. */
export async function loadChatSession(sessionId: string, versionId?: string): Promise<LoadSessionResult> {
  const res = await apiGet<unknown>(`/recommendations/chat/sessions/${sessionId}/${versionId ? `?version_id=${encodeURIComponent(versionId)}` : ''}`);
  if (res.success) return { success: true, data: res.data };
  return { success: false, statusCode: res.statusCode, error: res.error || siteText("خطا در بارگذاری گفتگو") };
}

/** Lightweight watchdog: never sends the base64 upload or refreshes the catalogue. */
export async function loadChatSessionStatus(sessionId: string): Promise<LoadSessionResult> {
  const res = await apiGet(`/recommendations/chat/sessions/${sessionId}/?status_only=1`);
  return res.success ? { success: true, data: res.data }
    : { success: false, statusCode: res.statusCode, error: res.error };
}

export interface SessionExpenses {
  receipts?: { request_id: string; kind: string; model?: string; stage?: string;
    turn_index?: number | null; attempt?: number | null; usd: string;
    paid_toman?: string | null; grant_toman?: string | null }[];
  token_estimate?: {
    status: 'complete' | 'partial' | 'unavailable';
    lower_usd: string | null;
    upper_usd: string | null;
    estimated_calls: number;
    unknown_calls: number;
    stages: { stage: string; calls: number; estimated_calls: number; unknown_calls: number; low: string; high: string }[];
  };
  status: 'pending' | 'partial' | 'settled' | 'unavailable';
  known_usd: string | null;
  text_usd: string | null;
  image_usd: string | null;
  known_paid_toman: string | null;
  known_grant_toman: string | null;
  unknown_calls: number;
  pending_receipts: number;
  checked_at: string | null;
  refresh_status?: 'cooldown' | 'unavailable';
}
export interface StudioPerformanceReport {
  status: 'ready' | 'pending' | 'unavailable' | 'incomplete';
  runs: { id: string; workflow: string; status: string; duration_ms: number | null }[];
  spans: { id: string; name: string; duration_ms: number; status: string }[];
  summary: { trace_elapsed_timestamp_ms: number | null; api_calls: number; estimated_cost_usd: number | null; tokens: Record<string, number | null> } | null;
}
export const loadStudioPerformance = (sessionId: string) => apiGet<StudioPerformanceReport>(
  `/recommendations/chat/sessions/${encodeURIComponent(sessionId)}/performance/`,
);

export interface SessionDiagnosticsReport {
  session_id: string;
  expenses: SessionExpenses;
  documents: unknown[];
  versions: unknown[];
  traces: { id: number; turn_index: number | null; step_name: string; payload_name: string; model: string; status: string; [key: string]: unknown }[];
  next_before: number | null;
}
export const loadSessionDiagnostics = (sessionId: string, before?: number) => apiGet<SessionDiagnosticsReport>(
  `/recommendations/chat/sessions/${encodeURIComponent(sessionId)}/diagnostics/${before ? `?before=${before}` : ''}`,
);
export const refreshSessionExpenses = (sessionId: string) => apiPost<{ expenses: SessionExpenses }>(
  `/recommendations/chat/sessions/${encodeURIComponent(sessionId)}/diagnostics/`, {},
);

export async function selectChatProduct(params: {
  sessionId: string;
  category: string;
  productId: number;
  itemId?: string;
  variantId?: number | null;
  placementId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const res = await runChatCommand({
    type: 'chat.select',
    sessionId: params.sessionId,
    requestId: crypto.randomUUID(),
    payload: {
      session_id: params.sessionId,
      category: params.category,
      product_id: params.productId,
      item_id: params.itemId,
      ...(params.variantId != null ? { variant_id: params.variantId } : {}),
      ...(params.placementId != null ? { placement_id: params.placementId } : {}),
    },
    signal: new AbortController().signal,
  });
  const data = res.data as { ok?: boolean } | undefined;
  return res.ok && data?.ok
    ? { success: true }
    : { success: false, error: res.error || siteText("خطا در ذخیره انتخاب محصول") };
}

// --------------------------------------------------------------------------- //
// Explicit async render: the command is acknowledged on the chat WebSocket;
// the native async worker generates and persists the image in the background.
// --------------------------------------------------------------------------- //
export interface RenderResult {
  success: boolean;
  terminal?: boolean;
  status?: string;
  operationStatus?: string;
  operationId?: string;
  error?: string;
}

export async function requestRender(params: {
  sessionId: string;
  sceneId?: string | null;
  instructions?: string | null;
  idempotencyKey: string;
  signal?: AbortSignal;
  onEvent?: (event: ChatSocketEvent) => void;
  onConnectionLost?: () => void;
}): Promise<RenderResult> {
  const res = await runChatCommand({
    type: 'chat.render',
    sessionId: params.sessionId,
    requestId: crypto.randomUUID(),
    payload: {
      session_id: params.sessionId,
      scene_id: params.sceneId ?? null,
      instructions: params.instructions ?? null,
      idempotency_key: params.idempotencyKey,
    },
    signal: params.signal ?? new AbortController().signal,
    onEvent: params.onEvent,
    onConnectionLost: params.onConnectionLost,
  });
  const data = res.data as { status?: string; operation_id?: string } | undefined;
  if (res.ok) {
    const terminal = typeof data?.status === 'string'
      && ['ready', 'succeeded', 'duplicate', 'completed'].includes(data.status);
    return {
      success: true,
      terminal,
      status: data?.status,
      operationStatus: data?.status,
      operationId: data?.operation_id,
    };
  }
  return { success: false, error: res.error || siteText("خطا در شروع ساخت تصویر") };
}

/** Shape of the GET session payload, for hydration and REST recovery. */
export interface SessionTurnEvent {
  event: string;
  data?: { url?: string; scene_id?: string; image_object_name?: string };
}
export interface SessionTurn {
  role: string;
  text?: string;
  text_origin?: 'user' | 'legacy_auto';
  /** Present on user turns: the data-URL photo(s) the user sent. */
  images?: string[];
  events?: SessionTurnEvent[];
}
export interface SessionPayload {
  workflow?: WorkflowPreview | null;
  design_version?: string;
  search_version?: string;
  session_id: string;
  status: string;
  title: string;
  turns: SessionTurn[];
  versions?: DesignVersion[];
  /** Validated design/retrieval, available before or despite image failure. */
  current_execution?: ExecutionPlan | null;
  current_base_version_id?: string;
  operations?: DesignOperation[];
  original_image?: string | null;
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
// Live turn (WebSocket)
// --------------------------------------------------------------------------- //
export async function streamChatTurn(
  params: StreamTurnParams,
  handlers: StreamTurnHandlers,
  signal: AbortSignal,
): Promise<{ ok: boolean; aborted?: boolean }> {
  const onEvent = (e: ChatSocketEvent) => {
    if (e.operationId && ['image', 'error', 'text_done'].includes(e.event)) handlers.onRenderEvent?.(e);
    switch (e.event) {
      case 'analysis_ready':
        handlers.onAnalysisReady?.(e.data as NonNullable<NonNullable<WorkflowPreview['previews']>['analysis_ready']>);
        break;
      case 'design_ready':
        handlers.onDesignReady?.(e.data as NonNullable<NonNullable<WorkflowPreview['previews']>['design_ready']>);
        break;
      case 'products_ready':
        handlers.onProductsReady?.(e.data as ProductReadyEvent);
        break;
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
        handlers.onError?.(isPersian ? raw : siteText("خطایی رخ داد. لطفاً دوباره تلاش کن."));
        break;
      }
      default:
        break;
    }
  };

  const result = await runChatCommand({
    type: 'chat.turn',
    sessionId: params.sessionId,
    requestId: params.idempotencyKey,
    payload: {
      session_id: params.sessionId,
      ...(params.text.trim() ? { text: params.text, text_origin: 'user' } : {}),
      images: params.images,
      prefs_update: params.prefsUpdate ?? null,
      base_version_id: params.baseVersionId,
      action: params.action ?? 'chat',
      item_id: params.itemId,
      product_id: params.productId,
      ...(params.variantId != null ? { variant_id: params.variantId } : {}),
      ...(params.placementId != null ? { placement_id: params.placementId } : {}),
      review_kind: params.reviewKind,
      idempotency_key: params.idempotencyKey,
    },
    onEvent,
    onConnectionLost: handlers.onConnectionLost,
    signal,
  });

  if (result.aborted) return { ok: false, aborted: true }; // silent — navigation / unmount

  if (!result.ok) {
    if (result.errorKind === 'auth' || result.status === 401) {
      handlers.onError?.(siteText("نشست شما منقضی شده است. لطفاً دوباره وارد شوید."), 'auth');
    } else if (result.errorKind === 'network') {
      handlers.onError?.(result.status === 408
        ? siteText("انتظار برای پاسخ طولانی شد؛ وضعیت درخواست در حال بررسی است.")
        : siteText("اتصال به سرور قطع شد؛ وضعیت درخواست در حال بررسی است."), 'network');
    } else {
      // Keep a Persian backend message if present; otherwise a generic one.
      const isPersian = !!result.error && /[؀-ۿ]/.test(result.error);
      handlers.onError?.(isPersian ? (result.error as string) : siteText("خطا در ارتباط با سرور"), 'server');
    }
  }
  handlers.onDone?.();
  return { ok: result.ok };
}

export interface ExecutionPlan {
  visualization?: { mode: 'concept'; purchase_independent: true };
  rule_findings?: { scene_id: string; rule_id: string; level: 'blocked' | 'warning' | 'repaired'; kind: string; target_id: string; action_id: string; label_fa: string; message_fa: string }[];
  image_review?: { status: string; checks: { aspect: string; status: string; explanation_fa: string }[]; exact_variant_verified: boolean };
  search_version?: 'studio-search-v2';
  purchases: { taxonomy_selection?: { version: 'product-taxonomy-v1'; revision: string; category_code: string; subcategory_code: string; status: 'valid' | 'missing' | 'unknown_code' | 'invalid_parent'; scope_codes: string[]; ancestor_codes?: string[] };
    sourcing_guidance?: { mode: 'external_search'; title_fa: string; explanation_fa: string; search_query: string; specifications_fa: string[]; placement_fa: string; design_preserved: boolean; image_status: 'concept'; catalogue_status: string };
    product_identity?: StudioProductIdentity; item_id: string; source_item_id?: string; canonical_item_id?: string; placement_id?: string | null; selection_status?: string; quantity: number; reason_fa: string; category: string; relation: string; product: BackendProduct | null; alternatives: BackendProduct[]; review_candidates?: BackendProduct[]; retrieval_report?: { status: string; reason_codes: string[] }; mother_product?: MotherProduct | null; placement_instruction_fa?: string; product_role?: string; recommendation_type?: string }[];
  cost_gaps?: { item_id: string; reasons: string[] }[];
  verification_gaps?: { item_id: string; reasons: string[] }[];
  evaluation?: { model_reviews_enabled?: boolean; status: 'accepted' | 'repaired' | 'needs_information' | 'replan_required'; purchase_ready: boolean; checked_at: string; blocked_actions: { action_id: string; kind: string; target_id: string }[];
    visual_review?: { status: string; not_reviewed_count?: number; assessments?: { reference_id: string; status: string; explanation_fa: string }[] };
    coherence?: { status: string; summary_fa: string; assessments: { aspect: string; status: string; explanation_fa: string; item_ids: string[]; source_refs: string[] }[] } };
  review_tasks?: { id: string; item_id: string; placement_id: string | null; route: string; missing_attributes: string[] }[];
  studio_documents?: Record<string, StudioMotherDocument>;
  free_actions: { instruction_fa: string; reason_fa: string }[];
  surface_actions: { change_fa: string; target?: string }[];
  known_subtotal_rial: number;
  budget_ceiling_toman: number | null;
  budget_status: string;
  unknown_cost_item_ids: string[];
}

export interface StudioPurchaseLine {
  item_id: string;
  placement_id?: string | null;
  product_id: number;
  variant_id: number | null;
  quantity: number;
}
export interface PurchaseCheckResult {
  ready: boolean;
  checked_at?: string;
  reasons: { item_id?: string; reason: string }[];
  lines: (StudioPurchaseLine & { product_unique_link: string; unit_price_rial: number })[];
}
export const checkStudioPurchase = (sessionId: string, versionId: string, lines: StudioPurchaseLine[]) =>
  apiPost<PurchaseCheckResult>(`/recommendations/chat/sessions/${encodeURIComponent(sessionId)}/purchase-check/`, { version_id: versionId, lines });
export interface DesignVersion {
  version_id: string;
  base_version_id: string;
  image_url: string;
  explanation: string;
  execution: ExecutionPlan | null;
  legacy_incomplete: boolean;
}
export interface DesignOperation {
  progress?: Record<string, StageProgress>;
  progress_revision?: number;
  deadline_at?: string;
  operation_id: string;
  kind: string;
  status: string;
  idempotency_key: string;
  base_version_id?: string;
  result_version_id?: string;
  render_operation_id?: string;
  error?: string;
}
