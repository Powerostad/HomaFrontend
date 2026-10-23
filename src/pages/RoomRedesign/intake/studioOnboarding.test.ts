import { describe, expect, it } from 'vitest';
import { budgetAmount, buildOnboardingPayload, initialChoices, MOODS } from './studioOnboarding';
import type { HomaIntakePayload } from './intakeTypes';

const payload: HomaIntakePayload = { image: { dataUrl: 'original', width: 1200, height: 900, source: 'gallery' }, goals: [], userNote: 'فقط حرف خود کاربر', createdAt: 'now' };
describe('onboarding preference boundary', () => {
  it('retains photo and note without fabricating a style, budget or room', () => {
    const result = buildOnboardingPayload(payload, initialChoices(''));
    expect(result.image).toBe(payload.image); expect(result.userNote).toBe(payload.userNote);
    expect(result.prefsUpdate).toEqual({ goals: [], preserved_items: [], budget_ceiling: null });
  });
  it('passes explicit host goals, room and style within existing schema limits', () => {
    const choices = { ...initialChoices('?room=bedroom', true), goals: ['guest_comfort', 'warmer'] as const, mood: 'natural', preserved: 'تخت، مبل\nمیز', scope: 'refresh' as const, budgetMode: 'limit' as const, budget: '۲۰٬۰۰۰٬۰۰۰' };
    const result = buildOnboardingPayload(payload, { ...choices, goals: [...choices.goals] });
    expect(result.goals).toEqual(['guest_comfort']);
    expect(result.prefsUpdate).toEqual({ room_type: 'bedroom', goals: ['فضا برای میزبانی اقامت کوتاه‌مدت استفاده می‌شود', 'راحتی بیشتر مهمان', 'تازه‌سازی با حفظ مبلمان اصلی و بدون تغییرات ساختمانی'], preserved_items: ['تخت', 'مبل', 'میز'], style: [MOODS[1].preference], budget_ceiling: 20000000 });
    for (const mood of MOODS) expect(mood.preference.length).toBeLessThanOrEqual(80);
  });
  it('differentiates no purchase from unknown and accepts localized digits', () => {
    expect(buildOnboardingPayload(payload, { ...initialChoices(''), budgetMode: 'none' }).prefsUpdate?.budget_ceiling).toBe(0);
    expect(budgetAmount('١٢،٥٠٠')).toBe(12500);
    for (const value of ['', '0', '-1', '1e6', 'NaN', '1000000000001']) expect(budgetAmount(value)).toBeNull();
  });
  it('whitelists entry parameters and constrains preserved-item lengths', () => {
    expect(initialChoices('?room=anything&audience=anything').room).toBe('not_sure');
    expect(initialChoices('?audience=host&room=balcony').audience).toBe('home');
    expect(initialChoices('?room=balcony', true).audience).toBe('host');
    expect(buildOnboardingPayload(payload, { ...initialChoices(''), preserved: 'a'.repeat(100) }).prefsUpdate?.preserved_items?.[0]).toHaveLength(80);
  });
});
