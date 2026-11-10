import { describe, expect, it } from 'vitest';
import { restoredUserText } from './userText';
import { rebuildSessionView } from './transformers';
import type { SessionPayload } from './redesignChatService';

const fallback = 'یک تغییر سبک با حفظ بیشتر وسایل برای این فضا طراحی کن و تصویر پیشنهادی را نشان بده.';
describe('legacy automatic intake is not user speech', () => {
  it('hides only the exact retired first-photo fallback', () => {
    expect(restoredUserText(fallback, true)).toBe('');
    expect(restoredUserText(fallback, false)).toBe(fallback);
    expect(restoredUserText(fallback, true, 'user')).toBe(fallback);
    expect(restoredUserText('مبل را نگه دار', true)).toBe('مبل را نگه دار');
  });
  it('keeps the original photo while removing the fabricated bubble text on reload', () => {
    const payload: SessionPayload = { session_id: 'session', status: 'active', title: '',
      turns: [{ role: 'user', text: fallback, images: ['photo'] },
        { role: 'user', text: 'سبک را عوض کن' }] };
    const result = rebuildSessionView(payload);
    expect(result.messages[0]).toMatchObject({ role: 'user', text: '', imageUrl: 'photo' });
    expect(result.messages[1].text).toBe('سبک را عوض کن');
    expect(payload.turns[0].text).toBe(fallback); // immutable saved audit
  });
});
