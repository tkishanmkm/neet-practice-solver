import assert from 'node:assert';
import { describe, it } from 'node:test';
import { solveQuestion } from '../solver.js';

describe('solveQuestion - Motional EMF', () => {
  it('solves motional EMF: 2 T * 1 m * 8 m/s => 16 V', () => {
    const result = solveQuestion('A conductor of length 1 m moves at 8 m/s perpendicular to a magnetic field of 2 T. Calculate the motional EMF.');
    assert.strictEqual(result.status, 'success');
    assert.ok(result.answer.includes('16'));
    assert.ok(result.explanation.includes('2'));
    assert.ok(result.explanation.includes('1'));
    assert.ok(result.explanation.includes('8'));
  });

  it('returns needs_context for motional EMF with missing values', () => {
    const result = solveQuestion('Calculate the motional EMF for a conductor in a magnetic field.');
    assert.strictEqual(result.status, 'needs_context');
    assert.strictEqual(result.answer, null);
  });
});

describe('solveQuestion - Hückel Rule', () => {
  it('returns needs_context when electron count is not stated', () => {
    const result = solveQuestion('Is this molecule aromatic? Apply Hückel\'s rule.');
    assert.strictEqual(result.status, 'needs_context');
    assert.strictEqual(result.answer, null);
    assert.ok(result.explanation.toLowerCase().includes('electron') || result.explanation.toLowerCase().includes('context'));
  });

  it('identifies aromatic with explicit pi count', () => {
    const result = solveQuestion('Does benzene satisfy Hückel\'s 4n+2 rule? It has 6 pi electrons.');
    assert.strictEqual(result.status, 'success');
    assert.ok(result.explanation.toLowerCase().includes('aromatic') || result.explanation.toLowerCase().includes('hückel'));
  });
});

describe('solveQuestion - Unsupported/Ambiguous', () => {
  it('returns needs_context for unsupported question types', () => {
    const result = solveQuestion('What is the capital of France?');
    assert.strictEqual(result.status, 'needs_context');
    assert.strictEqual(result.answer, null);
  });

  it('returns needs_context for empty question', () => {
    const result = solveQuestion('');
    assert.strictEqual(result.status, 'needs_context');
    assert.strictEqual(result.answer, null);
  });

  it('returns needs_context for null question', () => {
    const result = solveQuestion(null);
    assert.strictEqual(result.status, 'needs_context');
    assert.strictEqual(result.answer, null);
  });
});

describe('solveQuestion - Ohm\'s Law', () => {
  it('solves Ohm\'s law when two values given', () => {
    const result = solveQuestion('A circuit has a resistance of 10 ohms and a current of 2 A. Find the voltage using Ohm\'s law.');
    assert.strictEqual(result.status, 'success');
    assert.ok(result.answer.includes('20'));
  });
});

describe('solveQuestion - Electric Power', () => {
  it('solves electric power P=VI when V and I are given', () => {
    const result = solveQuestion('A device has voltage 12 V and current 3 A. Calculate the electric power.');
    assert.strictEqual(result.status, 'success');
    assert.ok(result.answer.includes('36'));
  });
});

describe('solveQuestion - Lens Formula', () => {
  it('solves lens formula when signs and values are explicit', () => {
    const result = solveQuestion('Use lens formula 1/f=1/v-1/u with u=-20 cm and v=60 cm. Find f.');
    assert.strictEqual(result.status, 'success');
  });
});
