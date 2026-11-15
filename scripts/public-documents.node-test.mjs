import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentRoute } from '../public-documents.mjs';
test('unknown and removed catalogue routes are real 404s', () => {
  for (const path of ['/not-real', '/store/digikala', '/store/x/product/y', '/studio/preview', '/studio/model-compare', '/studio/chat/a/extra', '/studio/chat/a%2Fb']) assert.equal(documentRoute(path).status, 404, path);
});
test('existing Studio, account, basket and legacy URLs remain valid and private', () => {
  for (const path of ['/studio', '/studio/chat/a', '/studio/result/one', '/studio/project/two', '/studio/hosts', '/redesign/old', '/basket', '/account/gallery/5', '/s/shared', '/try-on/item/upload']) {
    assert.equal(documentRoute(path).status, 200, path);
    assert.equal(documentRoute(path).public, false, path);
  }
});
test('public pages stay public and aliases retain navigation', () => {
  for (const path of ['/', '/hosts', '/explore', '/faq', '/contact', '/collaboration']) assert.equal(documentRoute(path).public, true);
  assert.deepEqual(documentRoute('/gallery'), { status: 308, location: '/explore' });
});
