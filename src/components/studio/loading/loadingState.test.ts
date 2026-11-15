import { describe, expect, it } from 'vitest';
import { legacyLoadingState, loadingDecisions, loadingMoment } from './loadingState';
import type { ExecutionPlan } from '@/pages/RoomRedesign/services/redesignChatService';

describe('real job to V5 moment mapping', () => {
  it('never uses stage text or a rendering hint alone to reveal a room', () => {
    expect(loadingMoment({ introduction: 'complete', analysisReady: false, photoAvailable: true, hasPlan: false, stageKey: 'render' })).toBe('moodboard');
    expect(loadingMoment({ introduction: 'complete', analysisReady: true, photoAvailable: false, hasPlan: true })).toBe('moodboard');
  });
  it('preserves inspiration order regardless of how quickly analysis arrives', () => {
    expect(loadingMoment({ introduction: 'comparison', analysisReady: true, photoAvailable: true, hasPlan: true })).toBe('comparison');
    expect(loadingMoment({ introduction: 'moodboard', analysisReady: true, photoAvailable: true, hasPlan: true })).toBe('moodboard');
    expect(loadingMoment({ introduction: 'complete', analysisReady: true, photoAvailable: true, hasPlan: false })).toBe('room');
    expect(loadingMoment({ introduction: 'complete', analysisReady: true, photoAvailable: true, hasPlan: true })).toBe('decisions');
    expect(loadingMoment({ introduction: 'complete', analysisReady: true, photoAvailable: true, hasPlan: true, stageKey: 'render' })).toBe('finishing');
  });
  it('only treats verified legacy lifecycle boundaries as analysis readiness', () => {
    for (const status of ['pending', 'analyzing', 'retrying', 'failed'] as const) expect(legacyLoadingState(status).analysisReady).toBe(false);
    for (const status of ['generating', 'matching', 'ready'] as const) expect(legacyLoadingState(status).analysisReady).toBe(true);
  });
  it('retains keep, move, remove and replace decisions from the actual mother document', () => {
    const plan = { studio_documents: { room: { existing_items_decision: [
      { decision: 'keep', action_instruction: 'Keep the actual bed' },
      { decision: 'move', action_instruction: 'Move the chair' },
      { decision: 'remove', action_instruction: 'Remove the loose shelf' },
      { decision: 'replace', action_instruction: 'Replace the curtains' },
    ] } }, free_actions: [], surface_actions: [] } as unknown as ExecutionPlan;
    expect(loadingDecisions(plan).map(row => row.instruction)).toEqual(['Keep the actual bed', 'Move the chair', 'Remove the loose shelf', 'Replace the curtains']);
    expect(loadingDecisions(null)).toEqual([]);
  });
});
