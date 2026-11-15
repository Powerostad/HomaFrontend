// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionPlan } from './redesignChatService';
import { journeyFindings, prepareResultImages, journeyPending, journeySeen, markJourneyPending, markJourneySeen } from './resultJourney';
const plan = (documents: unknown): ExecutionPlan => ({ purchases: [], free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: [], studio_documents: documents as ExecutionPlan['studio_documents'] });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('canonical result journey mapping', () => {
  it('persists an unfinished loading journey for refresh/resume without replaying a completed one', () => {
    localStorage.clear();
    markJourneyPending('resume'); expect(journeyPending('resume')).toBe(true); expect(journeySeen('resume')).toBe(false);
    markJourneySeen('resume'); expect(journeySeen('resume')).toBe(true); expect(journeyPending('resume')).toBe(false);
    markJourneyPending('resume'); expect(journeySeen('resume')).toBe(true);
  });
  it('keeps evidence, decisions and reasons distinct without inventing missing fields', () => {
    const source = plan({ room: { room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: 'path', evidence: 'میز در مسیر است.' }] } },
      existing_items_decision: [{ existing_item_id: 'table', item_name: 'میز', decision: 'move', related_issue_ids: ['path'], action_instruction: 'میز جابه‌جا شود.', decision_reason: 'مسیر باز می‌شود.' },
        { existing_item_id: 'bed', item_name: 'تخت', decision: 'keep', action_instruction: 'تخت حفظ شود.' }],
    } });
    const before = JSON.stringify(source);
    expect(journeyFindings(source)).toEqual([
      expect.objectContaining({ title: 'میز', kind: 'move', before: 'میز در مسیر است.', recommendation: 'میز جابه‌جا شود.', reason: 'مسیر باز می‌شود.' }),
      expect.objectContaining({ title: 'تخت', kind: 'keep', before: '', reason: '' }),
    ]);
    expect(JSON.stringify(source)).toBe(before);
  });
  it('handles empty/partial analysis and does not manufacture findings from product prices', () => {
    expect(journeyFindings(null)).toEqual([]);
    expect(journeyFindings(plan({ room: {} }))).toEqual([]);
    const source = plan({}); source.purchases = [{ item_id: 'bed', category: 'bedding', quantity: 1, relation: 'similar', reason_fa: '', product: { product_id: 1, name: 'Bed' }, alternatives: [] }];
    expect(journeyFindings(source)).toEqual([]);
  });
  it('links only stable same-scene product identities and keeps separate rooms apart', () => {
    const document = { room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: 'same', evidence: 'اتاق اول' }] } }, product_recommendations: [{ item_id: 'rug', product_name_generic: 'فرش', related_issue_ids: ['same'], why_needed: 'دلیل واقعی', shopping_attributes: { replace_existing: true } }] };
    const source = plan({ first: document, second: { ...document, room_analysis: {} } });
    source.purchases = [{ item_id: 'line', source_item_id: 'first:rug', category: 'rug', quantity: 1, reason_fa: '', relation: 'concept', product: null, alternatives: [] }];
    const actual = journeyFindings(source);
    expect(actual[0]).toMatchObject({ kind: 'replace', before: 'اتاق اول', purchaseKey: 'first:rug|' });
    expect(actual[1].purchaseKey).toBeUndefined(); expect(actual[1].before).toBe('');
  });
});
describe('decoded result assets', () => {
  const install = () => {
    const images: { src: string; onload?: () => void; onerror?: () => void; naturalWidth: number; decode: ReturnType<typeof vi.fn> }[] = [];
    class FakeImage { src = ''; naturalWidth = 800; onload?: () => void; onerror?: () => void; decode = vi.fn(async () => {}); constructor() { images.push(this); } }
    vi.stubGlobal('Image', FakeImage); return images;
  };
  it('waits for BOTH original and result decoding and deduplicates URLs', async () => {
    const images = install(); const done = vi.fn();
    const promise = prepareResultImages(['before', 'after', 'after'], new AbortController().signal).then(done);
    images[0].onload!(); await Promise.resolve(); expect(done).not.toHaveBeenCalled();
    images[1].onload!(); await promise; expect(done).toHaveBeenCalledOnce(); expect(images).toHaveLength(2);
  });
  it('bounds slow downloads and cancels safely on route change', async () => {
    vi.useFakeTimers(); install();
    const controller = new AbortController(); const cancelled = prepareResultImages(['one'], controller.signal);
    controller.abort(); await expect(cancelled).rejects.toThrow('cancelled');
    const slow = prepareResultImages(['two'], new AbortController().signal, 100);
    const result = expect(slow).rejects.toThrow('timeout'); vi.advanceTimersByTime(100); await result;
  });
  it('does not reveal failed or undecodable media', async () => {
    const images = install(); const failed = prepareResultImages(['bad'], new AbortController().signal);
    images[0].onerror!(); await expect(failed).rejects.toThrow('unavailable');
    const undecodable = prepareResultImages(['bad2'], new AbortController().signal);
    images[1].decode.mockRejectedValueOnce(new Error()); images[1].onload!(); await expect(undecodable).rejects.toThrow('decode');
  });
});
