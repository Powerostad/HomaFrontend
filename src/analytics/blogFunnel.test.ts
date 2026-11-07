// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { bindArticleAnalytics, recordDesignStage, recordStudioProcessingStarted } from './blogFunnel';
import { umamiEditorialEvent } from '../utils/umami';

vi.mock('../utils/umami', () => ({ umamiEditorialEvent: vi.fn() }));
beforeEach(() => {
  sessionStorage.clear(); vi.clearAllMocks(); vi.useFakeTimers();
  history.replaceState({}, '', '/blog/test?email=private#secret');
  document.body.innerHTML = '<div data-article-path="/blog/test"><a href="/studio">design</a><a href="https://other.test/studio">external</a></div>';
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const bind = () => bindArticleAnalytics(document.querySelector('div')!);
const click = () => {
  // Test listener without performing browser navigation.
  document.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};
it('records an article view and CTA separately; neither is a processing conversion', () => {
  bind(); click();
  expect(vi.mocked(umamiEditorialEvent).mock.calls.map(([name]) => name)).toEqual(['article_view', 'studio_cta_click']);
  expect(JSON.stringify(vi.mocked(umamiEditorialEvent).mock.calls)).not.toMatch(/private|secret|email|session_id/);
});
it('ignores ordinary chat/error stages and counts actual design once across replay', () => {
  bind(); click();
  recordDesignStage('private-session', 'stage', { key: 'intent' });
  recordDesignStage('private-session', 'error', { key: 'design' });
  expect(umamiEditorialEvent).toHaveBeenCalledTimes(2);
  recordDesignStage('private-session', 'stage', { key: 'design' });
  recordDesignStage('private-session', 'stage', { key: 'design' });
  recordStudioProcessingStarted('private-session');
  expect(umamiEditorialEvent).toHaveBeenCalledTimes(3);
  expect(umamiEditorialEvent).toHaveBeenLastCalledWith('studio_processing_started', {
    article_path: '/blog/test', acquisition: 'other', attribution: 'article_cta_30m', schema_version: 1,
  });
  expect(JSON.stringify(vi.mocked(umamiEditorialEvent).mock.calls)).not.toContain('private-session');
});
it('does not attribute a mere view or an expired click to an accepted design', () => {
  bind(); recordStudioProcessingStarted('view-only');
  expect(umamiEditorialEvent).toHaveBeenLastCalledWith('studio_processing_started', { attribution: 'unattributed', schema_version: 1 });
  click(); vi.advanceTimersByTime(31 * 60 * 1000); recordStudioProcessingStarted('two');
  expect(umamiEditorialEvent).toHaveBeenLastCalledWith('studio_processing_started', { attribution: 'unattributed', schema_version: 1 });
});
it('uses the last explicit article CTA; ignores external links and supports unbinding', () => {
  const dispose = bind();
  document.querySelectorAll('a')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(umamiEditorialEvent).toHaveBeenCalledTimes(1);
  dispose(); click();
  expect(umamiEditorialEvent).toHaveBeenCalledTimes(1);
});
it('does not report index/error pages as articles or block processing if storage fails', () => {
  document.querySelector('div')!.dataset.articlePath = '/blog/category/bedding';
  bind(); expect(umamiEditorialEvent).not.toHaveBeenCalled();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => recordStudioProcessingStarted('one')).not.toThrow();
});
it('normalizes stored attribution again before reporting, without sending query strings', () => {
  sessionStorage.setItem('homa_blog_intent_v1', JSON.stringify({ article_path: '/blog/test?email=private#secret', clicked_at: Date.now(), acquisition: 'google' }));
  recordStudioProcessingStarted('normalized-intent');
  expect(umamiEditorialEvent).toHaveBeenLastCalledWith('studio_processing_started', {
    article_path: '/blog/test', acquisition: 'google', attribution: 'article_cta_30m', schema_version: 1,
  });
});
