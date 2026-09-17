import { describe, expect, it } from 'vitest';
import {
  isRedesignSessionId,
  removeLegacyRedesignParams,
  shouldCanonicalizeSessionPath,
  shouldResetRedesignView,
  shouldSeedIntake,
} from './redesignRouteState';

const SESSION_ID = '00000000-0000-4000-8000-000000000000';

describe('redesign route state', () => {
  it('accepts only UUID session path segments', () => {
    expect(isRedesignSessionId(SESSION_ID)).toBe(true);
    expect(isRedesignSessionId('intake')).toBe(false);
    expect(isRedesignSessionId('session-id')).toBe(false);
    expect(isRedesignSessionId(undefined)).toBe(false);
  });

  it('canonicalizes only an active intake session that has just been created', () => {
    expect(shouldCanonicalizeSessionPath({
      hasIntakePayload: true,
      routeSessionId: undefined,
      chatSessionId: SESSION_ID,
      previousRouteSessionId: undefined,
    })).toBe(true);
    expect(shouldCanonicalizeSessionPath({
      hasIntakePayload: false,
      routeSessionId: undefined,
      chatSessionId: SESSION_ID,
      previousRouteSessionId: undefined,
    })).toBe(false);
    expect(shouldCanonicalizeSessionPath({
      hasIntakePayload: true,
      routeSessionId: SESSION_ID,
      chatSessionId: SESSION_ID,
      previousRouteSessionId: undefined,
    })).toBe(false);
    expect(shouldCanonicalizeSessionPath({
      hasIntakePayload: true,
      routeSessionId: undefined,
      chatSessionId: SESSION_ID,
      previousRouteSessionId: SESSION_ID,
    })).toBe(false);
  });

  it('recognizes every conversation path change as a new view boundary', () => {
    expect(shouldResetRedesignView(SESSION_ID, SESSION_ID)).toBe(false);
    expect(shouldResetRedesignView(undefined, SESSION_ID)).toBe(true);
    expect(shouldResetRedesignView(SESSION_ID, undefined)).toBe(true);
    expect(shouldResetRedesignView(SESSION_ID, '11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('allows a retry to seed a clean root intake again', () => {
    expect(shouldSeedIntake({
      didConsumeIntake: false,
      hasIntakePayload: true,
      routeSessionId: undefined,
      messageCount: 0,
    })).toBe(true);
    expect(shouldSeedIntake({
      didConsumeIntake: true,
      hasIntakePayload: true,
      routeSessionId: undefined,
      messageCount: 0,
    })).toBe(false);
    expect(shouldSeedIntake({
      didConsumeIntake: false,
      hasIntakePayload: true,
      routeSessionId: SESSION_ID,
      messageCount: 0,
    })).toBe(false);
    expect(shouldSeedIntake({
      didConsumeIntake: false,
      hasIntakePayload: true,
      routeSessionId: undefined,
      messageCount: 1,
    })).toBe(false);
  });

  it('removes retired session and phase query parameters without dropping tab', () => {
    const cleaned = removeLegacyRedesignParams(new URLSearchParams('s=old-session&phase=suggestions&tab=products'));
    expect(cleaned.toString()).toBe('tab=products');
  });
});
