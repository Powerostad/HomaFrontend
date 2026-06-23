/**
 * Frontend types for the conversational Room Redesign flow.
 *
 * These mirror the shapes of the backend chat API (apps/recommendations/chat)
 * loosely — just enough to render the UI. The flow is conversational, moving
 * through phases: analysis → suggestions → preview/feedback. Backend wiring
 * comes in a later step; for now the page is driven by mock data.
 */

export type NavTab = 'analysis' | 'products' | 'basket';

/** Sub-state of the تحلیل فضا (analysis) tab — conversation moves intake → review. */
export type AnalysisState = 'intake' | 'review';

/** Status of a floating annotation pin on the room image. */
export type PinStatus = 'good' | 'warning' | 'bad' | 'neutral';

/** A floating annotation pin overlaid on the room photo. */
export interface AnnotationPin {
  id: string;
  label: string; // Persian label, e.g. "نور خوب"
  status: PinStatus;
  /** Position as % of the image box (measured from left/top). */
  x: number;
  y: number;
  /** Optional 2-line body shown in the richer desktop pin cards. */
  description?: string;
}

export type ChatRole = 'user' | 'assistant';

/** Severity of a system event message (drives icon + colour of the centered pill). */
export type ChatEventKind = 'info' | 'success' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Optional thumbnail (e.g. the room photo the user "sent"). */
  imageUrl?: string;
  /** Optional timestamp label, e.g. "10:30" (desktop chat). */
  time?: string;
  /**
   * 'event' → centered system pill (status/error, not هما's voice).
   * Absent or 'message' → a normal conversational bubble (back-compat for
   * hydrated sessions that persisted plain assistant text).
   */
  kind?: 'message' | 'event';
  /** Only meaningful when kind === 'event'; selects icon + severity tokens. */
  eventKind?: ChatEventKind;
}

/** A checklisted "here's the plan" assistant message (desktop chat). */
export interface ChatPlan {
  id: string;
  title: string; // e.g. "پیشنهاد می‌کنم این مسیر رو بریم"
  items: { icon: string; label: string }[];
}

/** A selectable chip used in question groups / quick edits. */
export interface Chip {
  id: string;
  label: string;
  icon?: string; // lucide icon name key (resolved in component)
}

export interface ChipGroup {
  id: string;
  question: string;
  chips: Chip[];
  selectedId?: string;
}

export type CostLevel = 'low' | 'medium' | 'high';

/** A ranked improvement suggestion (≈ backend PlanItem scores). */
export interface ImpactItem {
  id: string;
  rank: number;
  title: string; // e.g. "پرده سبک‌تر و روشن‌تر"
  impact: number; // 1..5 (visual bars; backend impact_score 1..10 → /2)
  cost: CostLevel;
}

/** A product recommendation card (≈ backend ProductMatch). */
export interface RedesignProduct {
  id: string;
  name: string;
  subtitle: string; // color / size note, e.g. "سفید استخوانی"
  priceRial: number; // stored in Rial; rendered via formatPriceFromRial
  imageUrl: string;
  liked?: boolean;
}

/** One generated render version of the room (≈ backend render_history entry). */
export interface RoomVersion {
  id: string;
  index: number; // 1-based version number
  imageUrl: string;
  thumbUrl: string;
  pins: AnnotationPin[];
}
