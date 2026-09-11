import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResponseCache } from '../server.mjs';
test('public cache deduplicates requests, expires, evicts and never caches errors/private pages', async () => {
  let time = 0; let calls = 0;
  const cache = createResponseCache(2, 60, () => time);
  const load = async () => { calls++; await Promise.resolve(); return { status: 200, data: { kind: 'product' } }; };
  await Promise.all([cache('/a', load), cache('/a', load)]); assert.equal(calls, 1);
  await cache('/a', load); assert.equal(calls, 1);
  time = 61; await cache('/a', load); assert.equal(calls, 2);
  await cache('/b', load); await cache('/c', load); await cache('/a', load); assert.equal(calls, 5);
  for (const result of [{ status: 503 }, { status: 404 }, { status: 200, data: { kind: 'private' } }]) {
    let reads = 0; const get = async () => { reads++; return result; };
    await cache('/error', get); await cache('/error', get); assert.equal(reads, 2);
  }
});
