import { describe, expect, it } from 'vitest';
import { classifyAcquisition, sanitizeLandingPath } from './acquisition';
describe('organic acquisition', () => {
  it('classifies known sources without recording query values', () => {
    expect(classifyAcquisition('https://myhoma.ir/gallery?phone=secret', 'https://www.google.com/search?q=room')).toEqual({ landing_path: '/gallery', acquisition_source: 'organic_search', referrer_host: 'www.google.com' });
    expect(classifyAcquisition('https://myhoma.ir/', 'https://chatgpt.com/c/private').acquisition_source).toBe('ai_referral');
    expect(classifyAcquisition('https://myhoma.ir/?utm_source=secret', '').acquisition_source).toBe('campaign');
    expect(classifyAcquisition('https://myhoma.ir/', 'https://evilgoogle.com/').acquisition_source).toBe('referral');
  });
  it('redacts private identifiers and unknown routes', () => {
    expect(sanitizeLandingPath('/s/private-token')).toBe('/s');
    expect(sanitizeLandingPath('/studio/result/123')).toBe('/studio');
    expect(sanitizeLandingPath('/unknown-secret')).toBe('/other');
  });
});
