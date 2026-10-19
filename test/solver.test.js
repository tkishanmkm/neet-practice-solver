'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { solveQuestion } = require('../solver');
test('calculates motional emf when values are explicit', () => {
  const out = solveQuestion('Calculate motional emf for magnetic field B = 2 tesla, length L = 1 m, speed v = 8 m/s.');
  assert.equal(out.status, 'success');
  assert.equal(out.answer, '16 V');
});
test('does not guess aromaticity without molecule details', () => {
  const out = solveQuestion('Is this molecule aromatic according to Hückel rule?');
  assert.equal(out.status, 'needs_context');
  assert.equal(out.answer, null);
});
test('unsupported question asks for context', () => {
  const out = solveQuestion('Which option is correct for this diagram?');
  assert.equal(out.status, 'needs_context');
  assert.equal(out.answer, null);
});
test('missing emf values do not produce a guessed answer', () => {
  const out = solveQuestion('Calculate motional emf.');
  assert.equal(out.status, 'needs_context');
  assert.equal(out.answer, null);
});
