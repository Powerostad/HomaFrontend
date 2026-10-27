import { describe, expect, it } from 'vitest';
import { composeIntakeText } from './composeIntakeText';
import type { HomaIntakePayload } from './intakeTypes';

const photo: HomaIntakePayload = {
  image: { dataUrl: 'data:image/png;base64,AA==', width: 1000, height: 1000, source: 'gallery' },
  goals: [], createdAt: 'now',
};

describe('user-authored intake text boundary', () => {
  it.each([undefined, '', ' \n\t '])('does not invent a request for an empty note: %s', (userNote) => {
    expect(composeIntakeText({ ...photo, userNote })).toBe('');
  });
  it('does not translate selections into user-authored prose', () => {
    expect(composeIntakeText({ ...photo, roomType: 'living_room', goals: ['warmer', 'modernize'] })).toBe('');
  });
  it('preserves only the typed note, including internal whitespace', () => {
    expect(composeIntakeText({ ...photo, roomType: 'bedroom', goals: ['declutter'], userNote: '  keep  the rug\nچراغ را تغییر بده  ' }))
      .toBe('keep  the rug\nچراغ را تغییر بده');
  });
});
