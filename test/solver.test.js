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
test('solves beta-minus decay particle X', () => {
  const out = solveQuestion('During β− decay, a neutron inside nucleus converts into proton, electron and X. The particle X is');
  assert.equal(out.status, 'success');
  assert.match(out.answer, /Anti-neutrino/);
});
test('solves seed germination stored food question', () => {
  const out = solveQuestion('During seed germination its stored food is mobilized by: A) ABA B) gibberellin C) ethylene D) cytokinin');
  assert.equal(out.answer, 'Gibberellin');
});
test('solves largest isoelectronic ion question', () => {
  const out = solveQuestion('The element expected to form largest ion to achieve the nearest noble gas configuration is A) F B) N C) Na D) O');
  assert.match(out.answer, /nitrogen/);
});
test('solves equal-force spring energy ratio', () => {
  const out = solveQuestion('Two springs A and B having spring constant KA and KB (KA = 2KB) are stretched by applying force of equal magnitude. If energy stored in spring A is EA then energy stored in B will be');
  assert.equal(out.answer, 'E_B = 2 E_A');
});
test('solves projectile complementary-angle flight time product', () => {
  const out = solveQuestion('A shell is fired from a fixed artillery gun with an initial speed u such that it hits the target on the ground at a distance R from it. If t1 and t2 are the values of the time taken by it to hit the target in two possible ways, the product t1t2 is');
  assert.equal(out.answer, 't₁t₂ = 2R/g');
});
test('solves Tollens-negative oxime compound', () => {
  const out = solveQuestion('An organic compound of molecular formula C3H6O did not give a silver mirror with Tollens reagent, but gave an oxime with hydroxylamine, it may be');
  assert.match(out.answer, /propanone/);
});
test('integrates v = At + Bt² over 1 to 2 seconds', () => {
  const out = solveQuestion('If the velocity of a particle is v = At + Bt², where A and B are constants, then the distance travelled by it between 1 s and 2 s is');
  assert.match(out.answer, /3A\/2 \+ 7B\/3/);
});
