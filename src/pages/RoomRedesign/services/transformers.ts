/**
 * Map backend chat events → the frontend Room Redesign view types.
 *
 * Called by `hooks/useRedesignChat.ts`. Key conventions:
 * - Backend prices are Toman; the UI helper `formatPriceFromRial` expects Rial,
 *   so we multiply by 10 here (`priceRial = price_toman * 10`).
 * - Backend `questions[].chips` are plain strings (no id/icon).
 * - Backend `impact_score` is 1..10; the impact bars are 1..5, so we halve.
 * - The analysis emits x/y pin coordinates (percent of frame) on room_analysis
 *   issues (gaps) and existing_item_decisions (goods when kept); `pinsFromResult`
 *   turns those into `AnnotationPin`s for the active scene.
 */
import type {
  BackendProduct,
  BackendRoomIssue,
  ImageEvent,
  QuestionsEvent,
  ResultEvent,
  SessionPayload,
} from './redesignChatService';
import type { AnnotationPin, ChatMessage, ChipGroup, CostLevel, ImpactItem, RedesignProduct, RoomVersion } from '../types';

/** A product card plus the metadata the basket / selection needs. */
export interface RedesignProductWithMeta extends RedesignProduct {
  productId: number;
  uniqueLink: string;
  categoryCode: string;
  sceneId: string | null;
}

/** A diagnostic row derived from an existing-item decision (no coordinates). */
export interface ExistingIssue {
  id: string;
  label: string;
  decision: string;
  reason: string;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function transformProduct(
  p: BackendProduct,
  categoryCode: string,
  sceneId: string | null,
): RedesignProductWithMeta {
  return {
    id: String(p.product_id),
    productId: p.product_id,
    name: p.name,
    subtitle: p.category_fa || '',
    priceRial: (p.price_toman || 0) * 10, // backend Toman → Rial for formatPriceFromRial
    imageUrl: p.image_url || '',
    uniqueLink: p.unique_link || '',
    categoryCode,
    sceneId,
  };
}

/** Flatten all items' products into one de-duped list (by product_id). */
export function productsFromResult(result: ResultEvent): RedesignProductWithMeta[] {
  const seen = new Set<number>();
  const out: RedesignProductWithMeta[] = [];
  for (const item of result.items || []) {
    for (const p of item.products || []) {
      if (seen.has(p.product_id)) continue;
      seen.add(p.product_id);
      out.push(transformProduct(p, item.category_code, item.scene_id));
    }
  }
  return out;
}

function costFromPriority(priority?: string): CostLevel {
  switch ((priority || '').toLowerCase()) {
    case 'must_have':
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

/** One impact row per result item, ranked by impact_score (desc). */
export function impactsFromResult(result: ResultEvent): ImpactItem[] {
  const items = [...(result.items || [])].sort(
    (a, b) => (b.scores?.impact_score ?? 0) - (a.scores?.impact_score ?? 0),
  );
  return items.map((item, i) => ({
    id: `${item.category_code}:${item.scene_id ?? 'na'}`,
    rank: i + 1,
    title: item.reason_fa || item.category_fa,
    impact: clamp(Math.round((item.scores?.impact_score ?? 2) / 2), 1, 5),
    cost: costFromPriority(item.scores?.purchase_priority),
  }));
}

// --------------------------------------------------------------------------- //
// Category grouping (the "guided shopping plan")
//
// The backend already returns ONE result item per design category (فرش / پرده /
// …) carrying its own reason_fa, scores (impact + purchase_priority) and a
// products[] list. We preserve that grouping instead of flattening it, so each
// category renders as a card: problem → recommended change → matching products.
// --------------------------------------------------------------------------- //

/** Normalised design-category buckets (drive the per-card icon + ordering fallback). */
export type DesignCategoryKey =
  | 'rug'
  | 'curtain'
  | 'bedding'
  | 'lighting'
  | 'accessory'
  | 'wall'
  | 'plant'
  | 'furniture'
  | 'other';

/** How essential the category is to the redesign (drives the priority badge). */
export type CategoryPriority = 'essential' | 'recommended' | 'optional' | 'next';

export interface RedesignCategory {
  id: string;
  categoryCode: string;
  /** Normalised bucket for the icon (backend `title` is shown verbatim). */
  key: DesignCategoryKey;
  /** Persian category name (category_fa), shown as the card title. */
  title: string;
  /** Why this change matters (reason_fa). */
  reason: string;
  priority: CategoryPriority;
  /** 1..5 impact bars (backend impact_score 1..10 → /2). */
  impact: number;
  /** Starting cost band from the cheapest product, or null when unavailable. */
  cost: CostLevel | null;
  sceneId: string | null;
  products: RedesignProductWithMeta[];
  /** Needed for the room but no product matched — show the reason, no carousel. */
  unavailable: boolean;
  unavailableReason: string;
  /** 1-based display order (essential first). */
  rank: number;
}

/**
 * Infer a normalised design category from a product OR a backend category item.
 * Backend `category_code`/`category_fa` win; otherwise we keyword-match the
 * Persian/English name. Isolated + side-effect free so it's trivially testable.
 */
export function getProductDesignCategory(input: {
  categoryCode?: string | null;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
}): DesignCategoryKey {
  const hay = [input.categoryCode, input.title, input.name, input.subtitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/فرش|قالی|گلیم|rug|carpet/.test(hay)) return 'rug';
  if (/پرده|حریر|توری|blind|curtain|drape|sheer/.test(hay)) return 'curtain';
  if (/روتخت|کوسن|شال|بالش|لحاف|روبالش|cushion|pillow|throw|duvet|bedspread|bedding/.test(hay)) return 'bedding';
  if (/نور|چراغ|آباژور|لامپ|لوستر|نورپرداز|lamp|light|sconce|chandelier/.test(hay)) return 'lighting';
  if (/گیاه|گلدان|سبزه|plant|planter|greenery/.test(hay)) return 'plant';
  if (/تابلو|آینه|قاب|ساعت دیوار|دیوار|wall|mirror|art|frame|poster|clock/.test(hay)) return 'wall';
  if (/مبل|صندلی|میز|کنسول|نیمکت|راحتی|furniture|chair|table|console|bench|stool|sofa/.test(hay)) return 'furniture';
  if (/شمع|وازه|گلدان تزئین|سینی|کتاب|دکور|تزئین|accessor|vase|tray|candle|decor|object/.test(hay)) return 'accessory';
  return 'other';
}

function priorityFromPurchase(p?: string): CategoryPriority {
  switch ((p || '').toLowerCase()) {
    case 'must_have':
    case 'essential':
    case 'high':
      return 'essential';
    case 'recommended':
    case 'medium':
      return 'recommended';
    case 'nice_to_have':
    case 'optional':
    case 'low':
      return 'optional';
    case 'next':
    case 'later':
    case 'future':
      return 'next';
    default:
      return 'recommended';
  }
}

/** Starting-cost band from the cheapest in-stock product (Toman thresholds). */
function costFromProducts(products: RedesignProductWithMeta[]): CostLevel | null {
  const prices = products.map((p) => p.priceRial).filter((v) => v > 0);
  if (prices.length === 0) return null;
  const toman = Math.min(...prices) / 10;
  if (toman < 2_000_000) return 'low';
  if (toman < 8_000_000) return 'medium';
  return 'high';
}

const PRIORITY_WEIGHT: Record<CategoryPriority, number> = {
  essential: 0,
  recommended: 1,
  optional: 2,
  next: 3,
};

/**
 * Group the result into ordered category cards: available categories first, then
 * by priority (essential → next), then by impact (desc). One card per backend item.
 */
export function categoriesFromResult(result: ResultEvent): RedesignCategory[] {
  const cats = (result.items || []).map((item) => {
    const seen = new Set<number>();
    const products: RedesignProductWithMeta[] = [];
    for (const p of item.products || []) {
      if (seen.has(p.product_id)) continue;
      seen.add(p.product_id);
      products.push(transformProduct(p, item.category_code, item.scene_id));
    }
    const title = item.category_fa || products[0]?.subtitle || 'پیشنهاد';
    const impactScore = item.scores?.impact_score ?? 0;
    return {
      id: `${item.category_code}:${item.scene_id ?? 'na'}`,
      categoryCode: item.category_code,
      key: getProductDesignCategory({ categoryCode: item.category_code, title, name: products[0]?.name }),
      title,
      reason: item.reason_fa || '',
      priority: priorityFromPurchase(item.scores?.purchase_priority),
      impact: clamp(Math.round(impactScore / 2) || 1, 1, 5),
      cost: costFromProducts(products),
      sceneId: item.scene_id,
      products,
      unavailable: !!item.needed_but_unavailable || products.length === 0,
      unavailableReason: item.unavailable_reason_fa || '',
      _impactScore: impactScore,
    };
  });

  cats.sort((a, b) => {
    if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
    if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    }
    return b._impactScore - a._impactScore;
  });

  return cats.map(({ _impactScore, ...c }, i) => {
    void _impactScore;
    return { ...c, rank: i + 1 };
  });
}

/** Preference / clarifying questions → chip groups (chips are strings). */
export function chipGroupsFromQuestions(evt: QuestionsEvent): ChipGroup[] {
  return (evt.questions || []).map((q, gi) => {
    const groupId = `${q.id || 'q'}#${gi}`;
    return {
      id: groupId,
      question: q.text_fa,
      chips: (q.chips || []).map((label, i) => ({ id: `${groupId}:${i}`, label })),
    };
  });
}

/** Existing-item decisions → a flat issue list (the detailed gaps/goods text). */
export function issuesFromResult(result: ResultEvent): ExistingIssue[] {
  return (result.existing_item_decisions || []).map((d) => ({
    id: d.existing_item_id,
    label: d.item_name_fa,
    decision: d.decision,
    reason: d.decision_reason_fa,
  }));
}

/** Decisions that mean "this is good, keep it" → green finding. */
const KEEP_DECISIONS = new Set(['keep', 'keep_and_style']);

/** A gap (problem) or good (strength) found in the room, with optional photo position. */
export interface RoomFinding {
  id: string;
  label: string;
  /** Ultra-short caption for the pin chip (1-2 words). Fallback to abbreviated label if not provided. */
  pinLabel: string;
  /** 'bad' = gap/problem (red), 'good' = strength to keep (green). */
  status: 'good' | 'bad';
  /** Full Persian explanation (evidence_fa / decision_reason_fa). */
  description: string;
  /** Pin position, percent of frame (0-100). 0/0 means unplaced (text-only). */
  x: number;
  y: number;
}

function issueId(i: BackendRoomIssue): string {
  return i.issue_id || i.conflict_id || i.function_issue_id || i.surface_issue_id || '';
}

/**
 * Abbreviate a Persian string to ~1-2 words / max ~16 chars for pin labels.
 * Fallback for old sessions that lack pin_label_fa.
 */
function shortLabel(text: string): string {
  if (!text) return '';
  // Take the first ~16 chars or up to the first space after 10 chars.
  let truncated = text.slice(0, 16);
  if (text.length > 16) {
    const spaceIdx = text.indexOf(' ', 10);
    if (spaceIdx > 0 && spaceIdx < 20) {
      truncated = text.slice(0, spaceIdx);
    }
  }
  return truncated;
}

/**
 * Normalize a model-emitted coordinate to a 0-100 percent. The LLM ignores the
 * "0-100" instruction and variously returns a 0-1 fraction, a 0-100 percent, or
 * a 0-1000 grounding value, so infer the scale from magnitude.
 */
function toPercent(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v <= 1) return clamp(v * 100, 0, 100); // 0-1 fraction
  if (v <= 100) return clamp(v, 0, 100); // already percent
  return clamp(v / 10, 0, 100); // 0-1000 grounding scale
}

function isPlaced(x: number, y: number): boolean {
  // 0/0 is the backend "unplaced" sentinel — keep as text-only, no pin.
  return x > 0 || y > 0;
}


/**
 * Collect the room's gaps + goods for the active scene from the existing analysis:
 *  - GAPs from room_analysis issues — label_fa caption, evidence_fa detail.
 *  - GOODs from existing items the AI decided to keep — item_name_fa + reason.
 * Returns every finding (placed or not) for the detail text list; `pinsFromResult`
 * filters to the placed subset for the photo overlay.
 */
export function findingsFromResult(result: ResultEvent, activeSceneId: string | null): RoomFinding[] {
  const scenes = result.scenes || [];
  const scene = (activeSceneId && scenes.find((s) => s.id === activeSceneId)) || scenes[0];
  if (!scene) return [];
  const findings: RoomFinding[] = [];

  // GAPs — room_analysis issue lists. The backend dumps both `function_issues`/
  // `functional_issues` (and surface_issues/surface_finish_issues) with identical
  // content, so dedupe by issue id.
  const ra = scene.room_analysis || {};
  const issueGroups: BackendRoomIssue[][] = [
    ra.layout_issues || [],
    ra.harmony_conflicts || [],
    [...(ra.function_issues || []), ...(ra.functional_issues || [])],
    [...(ra.surface_issues || []), ...(ra.surface_finish_issues || [])],
  ];
  const seen = new Set<string>();
  for (const group of issueGroups) {
    for (const issue of group) {
      const id = issueId(issue);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      const label = issue.label_fa || issue.issue_type || '';
      const description = issue.evidence_fa || '';
      if (!label && !description) continue;
      findings.push({
        id: `gap:${id || findings.length}`,
        label,
        pinLabel: issue.pin_label_fa || shortLabel(label),
        status: 'bad',
        description,
        x: toPercent(issue.x ?? 0),
        y: toPercent(issue.y ?? 0),
      });
    }
  }

  // GOODs — existing items the AI kept (for the active scene).
  for (const d of result.existing_item_decisions || []) {
    if (!KEEP_DECISIONS.has(d.decision)) continue;
    if (d.scene_id && scene.id && d.scene_id !== scene.id) continue;
    if (!d.item_name_fa && !d.decision_reason_fa) continue;
    findings.push({
      id: `good:${d.existing_item_id}`,
      label: d.item_name_fa,
      pinLabel: d.pin_label_fa || shortLabel(d.item_name_fa),
      status: 'good',
      description: d.decision_reason_fa || '',
      x: toPercent(d.x ?? 0),
      y: toPercent(d.y ?? 0),
    });
  }

  return findings;
}

/** The placed subset of findings → photo pins. The pin shows only the short pinLabel. */
export function pinsFromResult(result: ResultEvent, activeSceneId: string | null): AnnotationPin[] {
  return findingsFromResult(result, activeSceneId)
    .filter((f) => isPlaced(f.x, f.y))
    .map((f) => ({
      id: f.id,
      label: f.pinLabel,
      status: f.status,
      x: f.x,
      y: f.y,
      description: f.description,
    }));
}

// --------------------------------------------------------------------------- //
// Full session rehydration (resume after reload / reopen)
// --------------------------------------------------------------------------- //
/** The complete view state rebuilt from a persisted session's render turns. */
export interface RebuiltSession {
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  products: RedesignProductWithMeta[];
  categories: RedesignCategory[];
  impacts: ImpactItem[];
  issues: ExistingIssue[];
  pins: AnnotationPin[];
  findings: RoomFinding[];
  versions: RoomVersion[];
  previewImage: string | null;
  /** 1-based index of the latest version (0 if none). */
  activeVersion: number;
  /** Most recent scene id seen (for a follow-up render). */
  lastSceneId: string | null;
  hasResult: boolean;
}

let rebuildSeq = 0;

/**
 * Reconstruct the full conversation view from a persisted session payload so a
 * reload/reopen restores messages, chips, products and rendered versions — not
 * just the images. The backend stores every emitted event in `turns[].events`,
 * so this replays them the same way the live SSE stream builds state:
 *  - `say` deltas concatenate into one assistant bubble per assistant turn;
 *  - `questions` set the pending chips (cleared by any later user turn);
 *  - `result` replaces products/impacts/issues (latest wins);
 *  - `image` events append versions (the uploaded photo is seeded as version 1).
 */
export function rebuildSessionView(payload: SessionPayload): RebuiltSession {
  const messages: ChatMessage[] = [];
  let chipGroups: ChipGroup[] = [];
  let products: RedesignProductWithMeta[] = [];
  let categories: RedesignCategory[] = [];
  let impacts: ImpactItem[] = [];
  let issues: ExistingIssue[] = [];
  let pins: AnnotationPin[] = [];
  let findings: RoomFinding[] = [];
  const versions: RoomVersion[] = [];
  let lastSceneId: string | null = null;
  let hasResult = false;

  const pushVersion = (url: string, sceneId: string | null) => {
    const index = versions.length + 1;
    if (sceneId) lastSceneId = sceneId;
    versions.push({
      id: `ver:${sceneId ?? 'na'}:${index}`,
      index,
      imageUrl: url,
      thumbUrl: url,
      pins: [],
    });
  };

  for (const turn of payload.turns || []) {
    if (turn.role === 'user') {
      const u = turn as { text?: string; images?: string[] };
      // Seed the uploaded photo as the "before" version (parity with live flow).
      const firstImage = u.images?.[0];
      if (firstImage && versions.length === 0) pushVersion(firstImage, null);
      messages.push({
        id: `u:r:${rebuildSeq++}`,
        role: 'user',
        text: (u.text || '').trim(),
        imageUrl: firstImage,
      });
      // A new user turn answers / supersedes any pending chips.
      chipGroups = [];
      continue;
    }

    // assistant turn — replay its events
    let assistantText = '';
    for (const ev of turn.events || []) {
      const data = (ev.data ?? {}) as unknown;
      switch (ev.event) {
        case 'say': {
          const d = data as { delta?: string };
          if (typeof d.delta === 'string') assistantText += d.delta;
          break;
        }
        case 'questions':
          chipGroups = chipGroupsFromQuestions(data as QuestionsEvent);
          break;
        case 'result': {
          const r = data as ResultEvent;
          products = productsFromResult(r);
          categories = categoriesFromResult(r);
          impacts = impactsFromResult(r);
          issues = issuesFromResult(r);
          hasResult = true;
          const sceneId = r.items?.[0]?.scene_id ?? r.scenes?.[0]?.id ?? null;
          if (sceneId) lastSceneId = sceneId;
          findings = findingsFromResult(r, sceneId);
          pins = pinsFromResult(r, sceneId);
          break;
        }
        case 'image': {
          const im = data as ImageEvent;
          if (im.url) pushVersion(im.url, im.scene_id ?? null);
          break;
        }
        default:
          break;
      }
    }
    if (assistantText.trim()) {
      messages.push({ id: `a:r:${rebuildSeq++}`, role: 'assistant', text: assistantText });
    }
  }

  return {
    messages,
    chipGroups,
    products,
    categories,
    impacts,
    issues,
    pins,
    findings,
    versions,
    previewImage: versions.length ? versions[versions.length - 1].imageUrl : null,
    activeVersion: versions.length,
    lastSceneId,
    hasResult,
  };
}
