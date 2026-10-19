'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isLoginPage } = require('../cloud-worker');

test('detects TrackPrep auth redirect even when page title changes', () => {
  assert.equal(isLoginPage({ title: 'TrackPrep', url: 'https://www.trackprep.in/auth?next=%2Fzap', text: 'Continue with Google' }), true);
});

test('detects common login page titles', () => {
  assert.equal(isLoginPage({ title: 'Login | TrackPrep', url: 'https://www.trackprep.in/', text: '' }), true);
  assert.equal(isLoginPage({ title: 'Welcome', url: 'https://example.com/', text: 'Login using OTP' }), true);
});

test('does not mark a normal practice page as login-required', () => {
  assert.equal(isLoginPage({ title: 'TrackPrep ZAP', url: 'https://www.trackprep.in/zap/44628', text: 'Question 1: Calculate velocity.' }), false);
});