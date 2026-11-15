import { describe, expect, it } from 'vitest';
import { buildDiscoveryReview } from './discoveryReview';
import { journeyFindings } from './resultJourney';
import type { ExecutionPlan } from './redesignChatService';

const document = {
  pipeline_version: 'homa-design-first-v1',
  design_diagnosis: { key_issues: [{ issue_id: 'real-issue', evidence: 'نور کنار تخت کافی نیست.' }] },
  user_facing_summary: { positive_diagnosis: 'چوب‌های اتاق شخصیت خوبی دارند.', main_improvement_idea: 'نور لایه‌ای با حفظ تخت' },
  existing_items_decision: [{ existing_item_id: 'bed', item_name: 'تخت', visible_evidence: 'تخت در تصویر دیده می‌شود.',
    related_issue_ids: ['real-issue'], decision: 'keep_and_style', action_instruction: 'تخت حفظ شود.', decision_reason: 'قاب مناسب است.' }],
};

describe('isolated accommodation Design-First presentation', () => {
  it('shows real director observations in the existing progressive loading UI', () => {
    const review = buildDiscoveryReview({ studio_documents: { room: document } });
    expect(review.summary).toBe(document.user_facing_summary.positive_diagnosis);
    expect(review.findings).toEqual([{ id: 'room:design:real-issue', track: 'idea', observation: 'نور کنار تخت کافی نیست.',
      suggestion: 'تخت حفظ شود.', isObservation: true }]);
  });
  it('pairs final actions with the original observation in the result journey', () => {
    const plan = { studio_documents: { room: document }, purchases: [] } as unknown as ExecutionPlan;
    expect(journeyFindings(plan)[0].before).toBe('نور کنار تخت کافی نیست.');
    expect(journeyFindings(plan)[0].recommendation).toBe('تخت حفظ شود.');
  });
  it('does not interpret unversioned legacy documents as new director output', () => {
    const review = buildDiscoveryReview({ studio_documents: { room: { ...document, pipeline_version: undefined } } });
    expect(review.findings).toHaveLength(0);
  });
});
