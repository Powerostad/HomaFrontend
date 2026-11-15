import { expect, it } from 'vitest';
import { durationParts, stageKey } from './diagnosticFormatting';

it('formats durations for reading and leaves unknown duration unknown', () => {
  expect(durationParts(null)).toBeNull();
  expect(durationParts(125400)).toEqual({ minutes: 2, seconds: 5 });
  expect(durationParts(1200)).toEqual({ minutes: 0, seconds: 1.2 });
  expect(durationParts(119999)).toEqual({ minutes: 2, seconds: 0 });
  expect(stageKey('handoff-analysis-server_scene_design_refine-1')).toBe('design');
  expect(stageKey('handoff-analysis-server_scene_analysis-1')).toBe('analysis');
  expect(stageKey('studio.render')).toBe('image');
});
