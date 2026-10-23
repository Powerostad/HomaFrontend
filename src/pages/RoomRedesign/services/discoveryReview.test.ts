import { describe, expect, it } from 'vitest';
import { buildDiscoveryReview } from './discoveryReview';
import type { StudioMotherDocument } from './motherDocument';
import type { ExecutionPlan } from './redesignChatService';

function plan(document?: Partial<StudioMotherDocument>): ExecutionPlan {
  return { purchases: [], free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null,
    budget_status: 'incomplete', unknown_cost_item_ids: [], studio_documents: document ? { room: document as StudioMotherDocument } : {} };
}
describe('saved analysis for progressive discovery', () => {
  it('combines early analysis with later instructions without letting the early preview mask the design', () => {
    const preview = { studio_documents: { room: { room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: '1', evidence: 'مسیر ورودی باریک است.' }] } } } } };
    const later = plan({ room_analysis: {}, layout_fix_plan: [{ resolves_issue_id: '1', specific_instruction: 'میز را از ورودی دور کن.' }] });
    const original = JSON.stringify({ preview, later });
    expect(buildDiscoveryReview(later, preview).findings[0]).toMatchObject({ observation: 'مسیر ورودی باریک است.', suggestion: 'میز را از ورودی دور کن.' });
    expect(JSON.stringify({ preview, later })).toBe(original);
  });
  it('links observations to same-scene actions without modifying or inventing source data', () => {
    const source = plan({
      room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: 'layout-1', evidence: 'مبل مسیر را تنگ کرده است.' }] },
        harmony_diagnosis: { main_conflicts: [{ conflict_id: 'harmony-1', evidence: 'سطوح رنگ نزدیک دارند.' }] } },
      layout_fix_plan: [{ resolves_issue_id: 'layout-1', specific_instruction: 'مبل را کمی جابه‌جا کن.' }],
      existing_items_decision: [{ related_issue_ids: ['harmony-1'], action_instruction: 'کوسن رنگی روی مبل حفظ شود.' }],
    });
    const before = JSON.stringify(source);
    expect(buildDiscoveryReview(source).findings).toEqual([
      expect.objectContaining({ observation: 'مبل مسیر را تنگ کرده است.', suggestion: 'مبل را کمی جابه‌جا کن.', isObservation: true }),
      expect.objectContaining({ observation: 'سطوح رنگ نزدیک دارند.', suggestion: 'کوسن رنگی روی مبل حفظ شود.', isObservation: true }),
    ]);
    expect(JSON.stringify(source)).toBe(before);
  });
  it('does not fabricate evidence, expose type codes as prose or repeat duplicate findings', () => {
    const source = plan({ room_analysis: { layout_evaluation: { layout_issues: [
      { issue_id: '1', issue_type: 'poor_scale_fit' }, { issue_id: '2', evidence: 'شاهد واقعی' }, { issue_id: '3', evidence: 'شاهد واقعی' },
    ] } } });
    expect(buildDiscoveryReview(source).findings).toHaveLength(1);
    expect(JSON.stringify(buildDiscoveryReview(source))).not.toContain('poor_scale_fit');
  });
  it('keeps legacy recommendation reasons labelled as ideas and supports empty/partial documents', () => {
    const source = plan({ room_analysis: {} });
    source.free_actions = [{ reason_fa: 'نور طبیعی مناسب است.', instruction_fa: 'صندلی را نزدیک پنجره بگذار.' }];
    expect(buildDiscoveryReview(source).findings[0].isObservation).toBe(false);
    expect(buildDiscoveryReview(null).findings).toEqual([]);
    expect(buildDiscoveryReview(plan({})).findings).toEqual([]);
  });
  it('does not attach an action from another room with a reused issue ID', () => {
    const source = plan({ room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: '1', evidence: 'شاهد اتاق اول' }] } } });
    source.studio_documents!.other = plan({ room_analysis: {}, layout_fix_plan: [{ resolves_issue_id: '1', specific_instruction: 'تغییر مربوط به اتاق دیگر' }] }).studio_documents!.room;
    expect(buildDiscoveryReview(source).findings[0].suggestion).toBe('');
  });
});
