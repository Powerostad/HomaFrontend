// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { format, fromSession, imageSource, localSessionId, newCase, numberOrNull, parseArm, parseCases, replaceArm, totals, vote, type ComparisonArm } from './comparison';
import type { SessionPayload } from '../RoomRedesign/services/redesignChatService';

const session: SessionPayload = { session_id: 'session', status: 'active', title: '', turns: [], current_execution: null };
const arm = (): ComparisonArm => fromSession(session);
describe('paired Studio comparison', () => {
  it('never treats missing or incomplete costs as zero or missing products as a successful search', () => {
    const result = arm();
    expect(result.cost.knownUsd).toBeNull();
    expect(result.timing.elapsedMs).toBeNull();
    expect(result.status).toBe('partial');
    expect(numberOrNull(false)).toBeNull();
    expect(numberOrNull('')).toBeNull();
    expect(numberOrNull('0')).toBe(0);
  });
  it('does not present an older image as a new failed run result', () => {
    const result = fromSession({ ...session, status: 'failed', current_execution: { purchases: [], free_actions: [{ instruction_fa: 'OLD DESIGN', reason_fa: '' }], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'unknown', unknown_cost_item_ids: [] }, versions: [{ version_id: 'old', base_version_id: 'original', image_url: 'https://example.test/old.png', execution: null, explanation: '', legacy_incomplete: false }] });
    expect(result.status).toBe('failed');
    expect(result.resultImage).toBeNull();
    expect(result.design).not.toContain('OLD DESIGN');
  });
  it('keeps blind order stable, counts actual sources, and clears votes after input changes', () => {
    let item = newCase(0.9); item.arms = { A: arm(), B: arm() };
    item = vote(item, 'design', item.order[0], 'better layout', 'judge');
    expect(item.order).toEqual(['B', 'A']);
    expect(item.votes.design?.blind).toBe(true);
    expect(totals([item], 'design')).toMatchObject({ B: 1, A: 0 });
    item.revealed = true;
    item = vote(item, 'products', 'neither', 'wrong sizes', 'judge');
    expect(item.votes.products?.blind).toBe(false);
    const next = replaceArm(item, 'B', arm());
    expect(next.votes).toEqual({});
    expect(next.order).toEqual(item.order);
    expect(next.revealed).toBe(true);
  });
  it('round-trips cases and votes without accepting executable image URLs', () => {
    const item = vote(newCase(0.1), 'image', 'unassessed', 'not rendered', 'judge');
    expect(parseCases(JSON.parse(JSON.stringify({ format, cases: [item] })))[0]).toEqual(item);
    expect(imageSource('javascript:alert(1)')).toBeNull();
    expect(imageSource('data:image/svg+xml;base64,AA==')).toBeNull();
    expect(() => parseArm({ products: [], design: 'invented success' })).toThrow();
    expect(() => parseCases({ format: 'something-else', cases: [item] })).toThrow();
  });
  it('accepts a render input packet without inventing prices, runtime or image output', () => {
    const prompt = 'AUTHORITATIVE FINAL RENDER PROMPT (verbatim):\nکامل\n\nIMAGE EXECUTION INPUT:\n{"design_guidance":{"value":"unchanged"}}\n\nExecution contract: preserve';
    const result = parseArm({ format: 'homa-image-export-v1', prompt, metadata: { session_id: 'saved' }, references: [{ selections: [{ name: 'فرش', variant_label: 'شش متری' }] }] });
    expect(result.prompt).toBe(prompt);
    expect(result.products[0]).toMatchObject({ name: 'فرش', variant: 'شش متری', priceToman: null });
    expect(result.resultImage).toBeNull();
    expect(result.cost.knownUsd).toBeNull();
    expect(result.document).toEqual({ design_guidance: { value: 'unchanged' } });
  });
  it('only extracts IDs for local reads and does not turn server URLs into local IDs', () => {
    const id = '4971832f-e660-4cb0-b64e-1118532780a8';
    expect(localSessionId(id)).toBe(id);
    expect(localSessionId(`http://127.0.0.1:3000/studio/chat/${id}`)).toBe(id);
    expect(() => localSessionId(`https://openai.parsmehragro.com/studio/chat/${id}`)).toThrow('local_only');
  });
});
