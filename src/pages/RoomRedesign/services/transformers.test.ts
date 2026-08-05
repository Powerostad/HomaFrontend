import { describe, expect, it } from 'vitest';
import { chipGroupsFromQuestions } from './transformers';

describe('redesign question choices', () => {
  it('keeps three suggestions, marks the recommendation, and adds open chat', () => {
    const [group] = chipGroupsFromQuestions({
      questions: [{
        id: 'q',
        text_fa: 'از کجا شروع کنیم؟',
        chips: ['محصول', 'چیدمان', 'نور', 'اضافی'],
        recommended_chip: 'چیدمان',
        allow_open_chat: true,
      }],
    });

    expect(group.chips).toHaveLength(4);
    expect(group.chips[1].icon).toBe('check');
    expect(group.chips[3].id).toContain('open-chat');
    expect(group.selectedId).toBe('q#0:1');
  });
});
