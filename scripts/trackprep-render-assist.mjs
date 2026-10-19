#!/usr/bin/env node
'use strict';

// Local Playwright observer + Render-hosted solver API.
// Opens a separate persistent Chromium profile; it does not connect to or modify Brave/Edge.
// It never clicks answer choices, submits forms, or advances/skips questions.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { solveQuestion } = require('../solver.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const profileDir = path.join(root, '.trackprep-profile');
const appUrl = (process.env.SOLVER_API_URL || 'https://neet-practice-solver.onrender.com').replace(/\/$/, '');
const targetUrl = process.env.TRACKPREP_URL || 'https://www.trackprep.in/zap';
const pollMs = Math.max(1200, Number.parseInt(process.env.POLL_MS || '1800', 10));
const seen = new Set();
let stopped = false;

const clean = value => String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

async function solveRemotely(question) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(appUrl + '/solve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Render API returned HTTP ' + response.status);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const context = await chromium.launchPersistentContext(profileDir, {
  headless: false,
  viewport: { width: 1365, height: 900 },
  args: ['--disable-dev-shm-usage']
});
const page = context.pages()[0] || await context.newPage();

async function handleQuestion(text) {
  const signature = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seen.has(signature)) return;
  seen.add(signature);
  if (seen.size > 500) seen.delete(seen.values().next().value);

  console.log('\n' + '='.repeat(72));
  console.log('VISIBLE QUESTION DETECTED');
  console.log(text.slice(0, 1800));
  try {
    let result;
    try {
      result = await solveRemotely(text);
      console.log('\nSolver source: Render API');
    } catch (error) {
      console.warn('\nRender request failed; using local rule solver only: ' + error.message);
      result = solveQuestion(text);
      console.log('Solver source: local rules (no web fallback)');
    }
    console.log('STATUS: ' + (result.status || 'unknown'));
    console.log('ANSWER SUGGESTION: ' + (result.answer || 'No verified answer — needs more context'));
    console.log('EXPLANATION: ' + (result.explanation || result.note || 'No explanation returned.'));
    console.log('CONFIDENCE: ' + (result.confidence ? Math.round(result.confidence * 100) + '%' : 'not rated'));
    if (result.research?.results?.length) {
      console.log('RESEARCH LEADS:');
      for (const item of result.research.results.slice(0, 3)) {
        console.log('- ' + (item.title || 'Source') + ' — ' + (item.url || 'URL unavailable'));
      }
    }
    console.log('Review the question and choose any answer yourself. No option was clicked and no question was submitted.');
  } finally {
    console.log('='.repeat(72));
  }
}

try {
  console.log('Checking Render solver health: ' + appUrl + '/health');
  try {
    const health = await fetch(appUrl + '/health');
    console.log('Render health HTTP ' + health.status + ': ' + (await health.text()).slice(0, 500));
  } catch (error) {
    console.warn('Render health check failed: ' + error.message);
  }

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('\nPlaywright observer is running in its own Chromium profile.');
  console.log('Complete sign-in yourself in the opened browser if required.');
  console.log('The profile is stored locally in .trackprep-profile/ and is git-ignored.');
  console.log('New visible question text will be sent to Render /solve; supported local rules are used if Render is unavailable.');
  console.log('The helper will not click choices, submit answers, auto-skip questions, or bypass site controls.');
  console.log('Press Ctrl+C in this terminal to stop. Keep this process running while using it.\n');

  while (!stopped && !page.isClosed()) {
    const data = await page.evaluate(() => {
      const visible = el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const cleanText = value => String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const selectors = 'main,article,[role="article"],section';
      const candidates = Array.from(document.querySelectorAll(selectors))
        .filter(visible)
        .map(el => ({ el, text: cleanText(el.innerText || el.textContent) }))
        .filter(item => item.text.length >= 35 && item.text.length <= 3500)
        .filter(item => /\?|\b(?:which|what|calculate|find|determine|correct|incorrect|true|false|value|velocity|force|energy|atom|molecule|plant|cell|equation|statement|option|question)\b/i.test(item.text))
        .map(item => {
          const lines = item.text.split('\n').map(line => line.trim()).filter(Boolean);
          const options = lines.filter(line => /^(?:\(?[A-E]\)?[.)]?\s+|option\s+[A-E]\b)/i.test(line));
          const rect = item.el.getBoundingClientRect();
          return { ...item, optionCount: options.length, top: rect.top, height: rect.height };
        })
        .sort((a, b) => b.optionCount - a.optionCount || a.text.length - b.text.length);
      const chosen = candidates.find(item => item.top < window.innerHeight && item.top + item.height > 0);
      if (chosen) {
        const signature = chosen.text.toLowerCase().replace(/\s+/g, ' ').trim();
        if (window.__trackprepLastStudyScroll !== signature) {
          chosen.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.__trackprepLastStudyScroll = signature;
        }
      }
      return { title: document.title, url: location.href, bodyText: cleanText(document.body?.innerText).slice(0, 700), question: chosen?.text || '' };
    }).catch(() => ({ title: '', url: page.url(), bodyText: '', question: '' }));

    if (/sign in|log in|login/i.test(data.title) || /sign in to your account|login using otp/i.test(data.bodyText)) {
      console.log('Sign-in may be required. Complete it manually in the open browser; no credentials are collected by this script.');
    } else if (data.question) {
      await handleQuestion(clean(data.question));
    }
    await page.waitForTimeout(pollMs);
  }
} catch (error) {
  console.error('Observer stopped: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await context.close().catch(() => {});
}
