#!/usr/bin/env node
'use strict';

// User-controlled study assistant: observes visible question text and explains answers.
// It does not click answer options, submit forms, or bypass sign-in/security challenges.
const { createRequire } = await import('node:module');
const { fileURLToPath } = await import('node:url');
const require = createRequire(import.meta.url);
const { solveQuestion } = require('../solver.js');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm install --no-save playwright');
  console.error('Then install Chromium once: npx playwright install chromium');
  process.exit(1);
}

const profile = fileURLToPath(new URL('../.trackprep-profile/', import.meta.url));
const context = await chromium.launchPersistentContext(profile, { headless: false });
const page = context.pages()[0] || await context.newPage();
const seen = new Set();
let lastState = '';
let stopped = false;

function clean(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

try {
  await page.goto('https://www.trackprep.in/zap', { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('\nTrackPrep observer is running in the visible browser.');
  console.log('Complete Google sign-in yourself if prompted. Do not enter credentials in this terminal.');
  console.log('New visible question cards will be solved automatically when supported.');
  console.log('No answer options will be clicked and nothing will be submitted. Press Ctrl+C to stop.\n');

  while (!stopped) {
    if (page.isClosed()) break;
    const scan = await page.evaluate(() => {
      const visible = el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
      };
      const body = (document.body?.innerText || '').trim();
      const raw = Array.from(document.querySelectorAll('article, [role="article"], section, main div, main, div'))
        .filter(visible)
        .map(el => ({ text: (el.innerText || '').trim() }))
        .filter(x => x.text.length >= 35 && x.text.length <= 2200)
        .map(x => {
          const labels = (x.text.match(/^\s*[A-D](?:[.)]|\s{1,})\s*\S/gm) || []).length;
          const questionSignal = /\?|\b(?:during|which|what|calculate|find|if the|the element|an organic compound|two springs|a shell|velocity)\b/i.test(x.text);
          return { text: x.text, labels, questionSignal };
        })
        .filter(x => x.labels >= 2 || x.questionSignal)
        .sort((a, b) => b.labels - a.labels || a.text.length - b.text.length);
      const picked = [];
      for (const item of raw) {
        const text = item.text.replace(/\n{3,}/g, '\n\n');
        if (picked.some(p => p.text === text || p.text.includes(text))) continue;
        // Avoid adding a larger wrapper when it only duplicates one already picked.
        if (picked.some(p => text.includes(p.text) && p.labels >= item.labels && p.text.length < text.length)) continue;
        picked.push({ text, labels: item.labels });
      }
      const cards = picked.filter(x => x.questionSignal || x.labels >= 2).slice(0, 12).map(x => x.text);
      return { title: document.title, body, cards };
    }).catch(() => ({ title: '', body: '', cards: [] }));

    const url = page.url();
    if (/\/auth(?:\?|$)|login|sign-in/i.test(url) || /sign in to your account|login using otp/i.test(scan.body.slice(0, 500))) {
      const state = 'login:' + url;
      if (state !== lastState) {
        console.log('\nLOGIN REQUIRED in the visible browser: ' + url);
        console.log('Complete Google sign-in manually in that browser. The observer will keep watching this tab after sign-in.');
        lastState = state;
      }
      await page.waitForTimeout(1200);
      continue;
    }

    if (!scan.cards.length) {
      const state = 'no-cards:' + url + ':' + scan.title;
      if (state !== lastState) {
        console.log('\nNo question card detected yet. Page: ' + scan.title + ' (' + url + ')');
        console.log('Keep the ordinary practice question visible; the observer is scanning automatically.');
        lastState = state;
      }
      await page.waitForTimeout(1200);
      continue;
    }

    for (const rawText of scan.cards) {
      const text = clean(rawText);
      if (text.length < 35) continue;
      const hasQuestionSignal = /\?|\b(?:during|which|what|calculate|find|if the|the element|an organic compound|two springs|a shell|velocity)\b/i.test(text);
      if (!hasQuestionSignal) continue;
      const signature = text.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(signature)) continue;
      seen.add(signature);
      if (seen.size > 500) seen.delete(seen.values().next().value);

      console.log('\n' + '='.repeat(72));
      console.log('NEW VISIBLE QUESTION');
      console.log(text.slice(0, 1800));
      const out = solveQuestion(text);
      console.log('\nANSWER STATUS: ' + out.status);
      console.log('ANSWER: ' + (out.answer || 'No verified answer — needs more context'));
      console.log('EXPLANATION: ' + out.explanation);
      console.log('CONFIDENCE: ' + (out.confidence ? Math.round(out.confidence * 100) + '%' : 'not rated'));
      console.log('Review the explanation and make any study choices yourself.');
      console.log('='.repeat(72));
      lastState = 'questions';
    }

    await page.waitForTimeout(1200);
  }
} catch (error) {
  console.error('Browser observer stopped:', error instanceof Error ? error.message : String(error));
} finally {
  await context.close().catch(() => {});
}
