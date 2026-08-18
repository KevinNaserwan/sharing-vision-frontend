import assert from 'node:assert';
import { test } from 'node:test';

import {
  filterPostsByStatus,
  finalizeApiBase,
  isBackendDomainHost,
  normalizeApiBase,
  resolveApiBase,
} from '../app-core.js';

test('normalizeApiBase trims trailing slashes', () => {
  assert.strictEqual(normalizeApiBase('https://example.com///'), 'https://example.com');
  assert.strictEqual(normalizeApiBase('/api///'), '/api');
});

test('isBackendDomainHost detects local and be-sharing domain', () => {
  assert.strictEqual(isBackendDomainHost('be-sharing-vision.meetsin.id'), true);
  assert.strictEqual(isBackendDomainHost('http://be-sharing-vision.meetsin.id:8000'), true);
  assert.strictEqual(isBackendDomainHost('127.0.0.1:8000'), true);
  assert.strictEqual(isBackendDomainHost('https://othersite.com'), false);
});

test('finalizeApiBase maps backend domain to /api on Vercel', () => {
  assert.strictEqual(
    finalizeApiBase('https://be-sharing-vision.meetsin.id:8000', { isVercel: true }),
    '/api',
  );
  assert.strictEqual(
    finalizeApiBase('https://be-sharing-vision.meetsin.id:8000', { isLocal: true }),
    'https://be-sharing-vision.meetsin.id:8000',
  );
  assert.strictEqual(finalizeApiBase('/api', { isLocal: true }), 'http://127.0.0.1:8000');
});

test('resolveApiBase respects query parameter first', () => {
  const result = resolveApiBase({
    host: 'example.com',
    search: '?api=http://query.local:8000',
    metaBase: '/api',
    windowBase: 'http://window.local:8000',
  });
  assert.strictEqual(result, 'http://query.local:8000');
});

test('resolveApiBase falls back to /api on production', () => {
  const result = resolveApiBase({
    host: 'dashboard.example.com',
    search: '',
  });
  assert.strictEqual(result, '/api');
});

test('filterPostsByStatus returns matching posts', () => {
  const posts = [
    { id: 1, status: 'publish' },
    { id: 2, status: 'draft' },
    { id: 3, status: 'publish' },
  ];
  const published = filterPostsByStatus(posts, 'publish');
  assert.strictEqual(published.length, 2);
  assert.deepStrictEqual(published.map((item) => item.id), [1, 3]);
});
