'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDuckDuckGo, researchQuestion } = require('../research');

test('parses public search result title, URL and snippet', () => {
  const html = '<a class="result__a" href="https://example.org/topic">Topic &amp; Answer</a><a class="result__snippet">A useful snippet for this topic.</a>';
  const results = parseDuckDuckGo(html);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Topic & Answer');
  assert.equal(results[0].url, 'https://example.org/topic');
  assert.match(results[0].snippet, /useful snippet/);
});

test('rejects non-http URLs from search results', () => {
  const html = '<a class="result__a" href="javascript:alert(1)">Bad</a><a class="result__snippet">Unsafe URL.</a>';
  assert.deepEqual(parseDuckDuckGo(html), []);
});

test('invalid research question returns validation result without network access', async () => {
  const result = await researchQuestion('  ');
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.results.length, 0);
});
