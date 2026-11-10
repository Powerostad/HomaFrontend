import type { ExecutionPlan } from '@/pages/RoomRedesign/services/redesignChatService';
import type { SessionStatus } from '@/services/studioService';
import type { DiscoveryReview } from '@/pages/RoomRedesign/services/discoveryReview';

export type LoadingMoment = 'comparison' | 'moodboard' | 'room' | 'decisions' | 'finishing';
export interface LoadingDecision { id: string; label: string; instruction: string }
export interface LoadingSlide { id: string; label: string; observation: string; suggestion?: string }

/** Each real observation stays paired with its own design response. */
export function loadingSlides(review: DiscoveryReview, decisions: LoadingDecision[]): LoadingSlide[] {
  const slides: LoadingSlide[] = [];
  const shown = new Set<string>();
  const append = (slide: LoadingSlide) => {
    const key = slide.observation.replace(/\s+/g, ' ').trim();
    if (!key || shown.has(key)) return;
    shown.add(key);
    if (slide.suggestion) shown.add(slide.suggestion.replace(/\s+/g, ' ').trim());
    slides.push(slide);
  };
  if (review.summary) append({ id: 'summary', label: 'نقطهٔ قوت فضای شما', observation: review.summary });
  review.findings.filter(item => item.isObservation).forEach(item => append({
    id: item.id, label: 'آنچه در فضای شما دیده‌ایم', observation: item.observation, suggestion: item.suggestion,
  }));
  decisions.forEach(item => append({ id: item.id, label: item.label, observation: item.instruction }));
  if (review.direction) append({ id: 'direction', label: 'مسیر طراحی شما', observation: review.direction });
  return slides;
}

/** Presentation phases never establish backend readiness. */
export function loadingMoment(input: {
  introduction: 'comparison' | 'moodboard' | 'complete'; analysisReady: boolean;
  photoAvailable: boolean; hasPlan: boolean; stageKey?: string | null;
}): LoadingMoment {
  if (input.introduction !== 'complete') return input.introduction;
  if (!input.analysisReady || !input.photoAvailable) return 'moodboard';
  if (['render', 'finalize'].includes(input.stageKey || '')) return 'finishing';
  return input.hasPlan ? 'decisions' : 'room';
}

export function legacyLoadingState(status: SessionStatus | null) {
  return {
    analysisReady: ['generating', 'matching', 'ready'].includes(status || ''),
    stageKey: status === 'generating' || status === 'retrying' ? 'render'
      : status === 'matching' ? 'search' : 'analyze',
  };
}

const labels: Record<string, string> = {
  keep: 'حفظ', keep_with_styling: 'حفظ و هماهنگ‌سازی', move: 'جابه‌جایی',
  remove: 'حذف', replace: 'تعویض', add: 'تکمیل',
};

/** Read only decisions that were actually produced, not assumed shopping steps. */
export function loadingDecisions(plan: ExecutionPlan | null): LoadingDecision[] {
  if (!plan) return [];
  const output: LoadingDecision[] = [];
  for (const [scene, document] of Object.entries(plan.studio_documents || {})) {
    if (!document || typeof document !== 'object') continue;
    const rows = (document as unknown as Record<string, unknown>).existing_items_decision;
    if (!Array.isArray(rows)) continue;
    rows.forEach((row: Record<string, unknown>, index: number) => {
      const instruction = typeof row.action_instruction === 'string' ? row.action_instruction.trim() : '';
      const decision = typeof row.decision === 'string' ? row.decision.toLowerCase() : '';
      if (instruction && labels[decision]) output.push({ id: `${scene}:${index}`, label: labels[decision], instruction });
    });
  }
  if (!output.length) {
    plan.free_actions.forEach((row, index) => {
      if (row.instruction_fa?.trim()) output.push({ id: `free:${index}`, label: 'اصلاح چیدمان', instruction: row.instruction_fa });
    });
    plan.surface_actions.forEach((row, index) => {
      if (row.change_fa?.trim()) output.push({ id: `surface:${index}`, label: 'نور و سطوح', instruction: row.change_fa });
    });
  }
  return output;
}
