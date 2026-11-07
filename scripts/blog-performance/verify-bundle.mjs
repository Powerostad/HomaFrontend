import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

/** Exercise the actual build artifact, not a duplicate implementation of tracking. */
export async function verifyBlogAnalyticsBundle() {
  const dom = new JSDOM('<div data-article-path="/blog/release-test"><a href="/studio">start</a></div>', {
    url: 'https://myhoma.ir/blog/release-test?email=private#secret', runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    window.__APP_CONFIG__ = { VITE_UMAMI_SRC: 'https://tracker.invalid/script.js', VITE_UMAMI_WEBSITE_ID: 'qa-site' };
    const records = [];
    window.umami = { track: (event, data) => {
      const defaults = { website: 'qa-site', url: window.location.href, referrer: 'https://google.com/?q=private' };
      records.push(typeof event === 'function' ? event(defaults) : { name: event, data });
    } };
    window.eval(await readFile('dist/blog-analytics.js', 'utf8'));
    assert.equal(records.length, 0, 'events must wait for tracker readiness');
    const script = window.document.querySelector('script[data-website-id="qa-site"]');
    assert(script, 'runtime analytics configuration must survive the production bundle');
    script.dispatchEvent(new window.Event('load'));
    assert.equal(records.filter(e => e.name === 'article_view').length, 1);
    // Prevent default navigation after the delegated handler has observed the click.
    window.document.addEventListener('click', event => event.preventDefault());
    window.document.querySelector('a').click();
    assert.equal(records.filter(e => e.name === 'studio_cta_click').length, 1);
    assert.equal(records.filter(e => e.name === 'studio_processing_started').length, 0);
    assert(!JSON.stringify(records).match(/private|secret|email|session_id/));
    assert.equal(records.find(e => e.name === 'studio_cta_click').url, '/blog/release-test');
    return { status: 'passed', articleViews: 1, ctaClicks: 1, falseProcessingStarts: 0 };
  } finally { dom.window.close(); }
}
