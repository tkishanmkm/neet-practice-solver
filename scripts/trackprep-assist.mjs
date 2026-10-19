#!/usr/bin/env node
'use strict';

// Local, user-controlled TrackPrep study assistant.
// Google OAuth is completed by the account owner in the visible browser.
// This tool does not click answers, submit forms, or manipulate results.
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const { solveQuestion } = require('../solver.js');
const readline = await import('node:readline/promises');
const { stdin, stdout } = await import('node:process');
const rl = readline.createInterface({ input: stdin, output: stdout });

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm install --no-save playwright');
  console.error('Then install the browser once: npx playwright install chromium');
  process.exit(1);
}

const profile = new URL('../.trackprep-profile/', import.meta.url).pathname;
const context = await chromium.launchPersistentContext(profile, { headless: false });
const page = context.pages()[0] || await context.newPage();
try {
  await page.goto('https://www.trackprep.in/zap', { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('\nA visible browser has opened. Complete Google sign-in yourself if prompted.');
  console.log('Do not paste passwords, cookies, OAuth tokens, or recovery codes into this terminal.');
  console.log('Use this only for permitted practice sessions. CAPTCHA/security challenges are not bypassed.\n');
  await rl.question('When one ordinary practice question is visible, press Enter here (Ctrl+C to stop). ');
  while (true) {
    const pageText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
    console.log('\n--- Visible page text (first 5000 characters) ---\n' + pageText.slice(0, 5000) + '\n--- end page text ---\n');
    const question = (await rl.question('Paste the exact question and options here (blank to skip this scan; Ctrl+C to stop): ')).trim();
    if (question) {
      const seconds = 25 + Math.floor(Math.random() * 21);
      console.log(`Study interval: ${seconds} seconds. Try solving independently while you wait.`);
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      const result = solveQuestion(question);
      console.log('\n--- Solver result ---');
      console.log('Status: ' + result.status);
      console.log('Answer: ' + (result.answer ?? 'No answer — more context needed'));
      console.log('Explanation: ' + result.explanation);
      console.log('Confidence: ' + (result.confidence > 0 ? Math.round(result.confidence * 100) + '%' : 'not rated'));
      console.log('Review the reasoning. You must choose and submit answers yourself.\n');
    }
    await rl.question('After you manually review/answer/skip and move to the next question, press Enter to scan again. ');
  }
} catch (error) {
  console.error('Browser assistant stopped:', error instanceof Error ? error.message : String(error));
} finally {
  rl.close();
  await context.close().catch(() => {});
}