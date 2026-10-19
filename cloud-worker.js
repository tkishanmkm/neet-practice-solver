'use strict';
const express = require('express');
const { chromium } = require('playwright');
const { solveQuestion } = require('./solver');
const app = express();
app.disable('x-powered-by');
const port = Number.parseInt(process.env.PORT || '3000', 10);
const targetUrl = process.env.TRACKPREP_URL || 'https://www.trackprep.in/zap';
const pollMs = Math.max(5000, Number.parseInt(process.env.POLL_MS || '15000', 10));
let browserState = { status: 'starting', checkedAt: null, title: null, url: null, loginRequired: null, lastQuestionAt: null, lastResult: null, error: null };
let stopping = false;
let browser;
let page;
let inspecting = false;
const seen = new Set();
function isLoginPage({ title = '', url = '', text = '' } = {}) {
  return /\/(?:auth|login|signin)(?:[/?#]|$)/i.test(url) || /sign in|log in|login/i.test(title) || /sign in to your account|login using otp/i.test(text);
}
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', worker: 'cloud-browser-prototype', browser: browserState.status, checkedAt: browserState.checkedAt }));
app.get('/worker/status', (_req, res) => res.json({ status: browserState.status, checkedAt: browserState.checkedAt, title: browserState.title, url: browserState.url, loginRequired: browserState.loginRequired, lastQuestionAt: browserState.lastQuestionAt, lastResult: browserState.lastResult ? { status: browserState.lastResult.status, confidence: browserState.lastResult.confidence } : null, error: browserState.error, targetUrl, note: 'Prototype only. No answer selection or submission. Free hosting may sleep and ephemeral storage does not preserve Google sign-in.' }));
async function inspect() {
  if (inspecting || stopping) return;
  inspecting = true;
  try {
    if (!browser) {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      const context = await browser.newContext();
      page = await context.newPage();
      page.setDefaultNavigationTimeout(45000);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
    const result = await page.evaluate(() => {
      const clean = s => String(s || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
      const candidates = Array.from(document.querySelectorAll('main,article,[role="article"],section')).filter(visible).map(el => clean(el.innerText || el.textContent)).filter(t => t.length >= 35 && t.length <= 3500 && /\?|\b(?:which|what|calculate|find|determine|correct|incorrect|velocity|force|energy|atom|molecule|plant|cell|equation|question)\b/i.test(t)).sort((a,b) => a.length-b.length);
      const text = clean(document.body?.innerText).slice(0, 1200);
      return { title: document.title, url: location.href, text, question: candidates[0] || '' };
    });
    result.loginRequired = isLoginPage(result);
    browserState = { ...browserState, status: result.loginRequired ? 'login_required' : 'running', checkedAt: new Date().toISOString(), title: result.title, url: result.url, loginRequired: result.loginRequired, error: null };
    // Do not solve or cache page text when the site has redirected to authentication.
    if (result.loginRequired) return;
    if (result.question) {
      const sig = result.question.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(sig)) {
        seen.add(sig);
        if (seen.size > 100) seen.delete(seen.values().next().value);
        const answer = solveQuestion(result.question);
        browserState.lastQuestionAt = new Date().toISOString();
        browserState.lastResult = { question: result.question.slice(0, 1200), status: answer.status, answer: answer.answer || null, explanation: answer.explanation || null, confidence: answer.confidence || 0 };
        console.log('Visible question observed; solver result:', JSON.stringify({ status: answer.status, confidence: answer.confidence || 0 }));
      }
    }
  } catch (e) {
    browserState = { ...browserState, status: 'error', checkedAt: new Date().toISOString(), error: String(e && e.message || e).slice(0, 500) };
    console.error('Cloud browser inspection failed:', browserState.error);
    if (browser) await browser.close().catch(() => {});
    browser = null; page = null;
  } finally {
    inspecting = false;
  }
}
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => { console.log('Cloud browser prototype listening on', port); inspect(); const timer = setInterval(() => { if (!stopping) inspect(); }, pollMs); const stop = async () => { stopping = true; clearInterval(timer); if (browser) await browser.close().catch(() => {}); process.exit(0); }; process.on('SIGTERM', stop); process.on('SIGINT', stop); });
}
module.exports = { isLoginPage };
