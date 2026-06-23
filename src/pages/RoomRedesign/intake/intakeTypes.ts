/**
 * Types + constants for the Homa pre-analysis intake flow.
 *
 * The intake flow (photo → optional context → loading) runs BEFORE the
 * conversational redesign screen. It collects one required room photo plus
 * optional context, then hands a typed `HomaIntakePayload` to RoomRedesignPage
 * which composes the first chat turn from it.
 *
 * English enum values are internal only — the UI always shows the Persian
 * labels below; the composer (composeIntakeText) maps them back to Persian.
 */

/** Single-select room/category for the space. */
export type RoomType =
  | 'bedroom'
  | 'living_room'
  | 'kitchen'
  | 'balcony'
  | 'full_home'
  | 'not_sure';

/** Multi-select outcome focus for the redesign. */
export type Goal =
  | 'analyze_only'
  | 'low_budget'
  | 'warmer'
  | 'modernize'
  | 'declutter'
  | 'product_recommendations'
  | 'improve_for_rent_or_sale';

/**
 * The captured photo. Stored as a base64 data URL — the redesign chat sends
 * the image inline in the first turn (no separate upload endpoint), matching
 * the existing `chat.sendTurn({ images })` contract.
 */
export interface IntakeImage {
  dataUrl: string;
  width: number;
  height: number;
  source: 'camera' | 'gallery';
}

/** Everything the intake flow hands to the analysis/chat flow. */
export interface HomaIntakePayload {
  image: IntakeImage;
  roomType?: RoomType;
  goals: Goal[];
  userNote?: string;
  createdAt: string; // ISO 8601
}

/**
 * Shape of `location.state` when the intake flow navigates to `/redesign`.
 * RoomRedesignPage reads `intake` once and seeds the first chat turn from it.
 */
export interface RedesignLocationState {
  intake?: HomaIntakePayload;
}

export interface RoomTypeOption {
  value: RoomType;
  label: string;
}

export interface GoalOption {
  value: Goal;
  label: string;
  /** Icon key resolved by the shared <Chip> component (see components/chat.tsx ICONS). */
  icon?: string;
}

/** Single-select room types (Persian labels, label-only chips). */
export const ROOM_TYPES: readonly RoomTypeOption[] = [
  { value: 'bedroom', label: 'اتاق خواب' },
  { value: 'living_room', label: 'پذیرایی' },
  { value: 'kitchen', label: 'آشپزخانه' },
  { value: 'balcony', label: 'بالکن' },
  { value: 'full_home', label: 'خانه کامل' },
  { value: 'not_sure', label: 'مطمئن نیستم' },
] as const;

/** Multi-select goal chips (icons reuse the shared ICONS map). */
export const GOALS: readonly GoalOption[] = [
  { value: 'analyze_only', label: 'فقط تحلیل کن', icon: 'image' },
  { value: 'low_budget', label: 'کم‌هزینه', icon: 'coins' },
  { value: 'warmer', label: 'گرم‌تر و صمیمی‌تر', icon: 'heart' },
  { value: 'modernize', label: 'مدرن‌تر', icon: 'sofa' },
  { value: 'declutter', label: 'مرتب‌تر', icon: 'minimize' },
  { value: 'product_recommendations', label: 'پیشنهاد محصول بده', icon: 'bag' },
  { value: 'improve_for_rent_or_sale', label: 'برای فروش/اجاره بهترش کن', icon: 'tag' },
] as const;
