import type { ExecutionPlan } from './redesignChatService';

export type DiscoveryTrack = 'layout' | 'harmony' | 'function' | 'surfaces' | 'idea';
export interface AnalysisPreview { studio_documents: Record<string, unknown> }
export interface DiscoveryFinding {
  id: string;
  track: DiscoveryTrack;
  observation: string;
  suggestion: string;
  /** A recommendation reason is not evidence of a defect in the photo. */
  isObservation: boolean;
}
export interface DiscoveryReview {
  summary: string;
  direction: string;
  findings: DiscoveryFinding[];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(record) : [];
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function ids(value: unknown): string[] { return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; }

/** Read-only presentation of saved mother output. Never changes model input or invents findings. */
export function buildDiscoveryReview(plan: ExecutionPlan | AnalysisPreview | null): DiscoveryReview {
  if (!plan) return { summary: '', direction: '', findings: [] };
  const findings: DiscoveryFinding[] = [];
  const seen = new Set<string>();
  const append = (finding: DiscoveryFinding) => {
    const signature = (finding.observation || finding.suggestion).replace(/\s+/g, ' ').trim();
    if (!signature || seen.has(signature)) return;
    seen.add(signature);
    findings.push(finding);
  };
  const documents = Object.entries(plan.studio_documents || {}).map(([scene, document]) => [scene, record(document)] as const);
  for (const [scene, document] of documents) {
    const analysis = record(document.room_analysis);
    const groups: Array<[DiscoveryTrack, string, Record<string, unknown>[]]> = [
      ['layout', 'issue_id', rows(record(analysis.layout_evaluation).layout_issues)],
      ['harmony', 'conflict_id', rows(record(analysis.harmony_diagnosis).main_conflicts)],
      ['function', 'function_issue_id', rows(record(analysis.function_diagnosis).functional_issues)],
      ['surfaces', 'surface_issue_id', rows(record(analysis.surface_finish_diagnosis).surface_issues)],
    ];
    for (const [track, idKey, issues] of groups) {
      issues.forEach((issue, index) => {
        const id = text(issue[idKey]);
        const observation = text(issue.evidence);
        if (!observation) return;
        const fix = rows(document.layout_fix_plan).find(item => id && item.resolves_issue_id === id);
        const existing = rows(document.existing_items_decision).find(item => id && ids(item.related_issue_ids).includes(id));
        const product = rows(document.product_recommendations).find(item => id && ids(item.related_issue_ids).includes(id));
        append({ id: `${scene}:${track}:${id || index}`, track, observation,
          suggestion: text(fix?.specific_instruction) || text(existing?.action_instruction) || text(product?.placement_instruction) || text(product?.why_needed),
          isObservation: true });
      });
    }
  }
  // Legacy plans may have no diagnostic document. Label their changes as ideas, not observed problems.
  if (!findings.length) {
    ('free_actions' in plan ? plan.free_actions : []).forEach((action, index) => append({ id: `layout:${index}`, track: 'layout',
      observation: action.reason_fa, suggestion: action.instruction_fa, isObservation: false }));
    ('purchases' in plan ? plan.purchases : []).forEach(item => append({ id: `product:${item.item_id}`, track: 'idea',
      observation: item.reason_fa || item.mother_product?.why_needed || '',
      suggestion: item.placement_instruction_fa || item.mother_product?.placement_instruction || '', isObservation: false }));
    ('surface_actions' in plan ? plan.surface_actions : []).forEach((action, index) => append({ id: `surface:${index}`, track: 'surfaces',
      observation: '', suggestion: action.change_fa, isObservation: false }));
  }
  return {
    summary: documents.map(([, document]) => text(record(document.user_facing_summary).positive_diagnosis)).find(Boolean) || '',
    direction: documents.map(([, document]) => text(record(document.user_facing_summary).main_improvement_idea)).find(Boolean) || '',
    findings,
  };
}
