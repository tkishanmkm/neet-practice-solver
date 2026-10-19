'use strict';
const path = require('node:path');
const express = require('express');
const { solveQuestion } = require('./solver');
const { researchQuestion } = require('./research');
const { solveWithGemini } = require('./ai-solver');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb', strict: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Per-instance best-effort limit for external calls. It resets on restart and is not
// a replacement for a durable gateway limit; keep the public service's search volume low.
const researchHits = new Map();
function allowResearch(req) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const recent = (researchHits.get(key) || []).filter(t => now - t < 60_000);
  if (recent.length >= 6) { researchHits.set(key, recent); return false; }
  recent.push(now); researchHits.set(key, recent);
  if (researchHits.size > 500) for (const [k, times] of researchHits) if (!times.some(t => now - t < 60_000)) researchHits.delete(k);
  return true;
}

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', solver: 'rules-plus-optional-ai', researchFallback: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY), storage: 'stateless-no-database' }));

async function solveWithFallback(req, question) {
  const ruleResult = solveQuestion(question);
  if (ruleResult.status !== 'needs_context') return ruleResult;
  if (!allowResearch(req)) return { ...ruleResult, research: { status: 'rate_limited', results: [], googleUrl: 'https://www.google.com/search?q=' + encodeURIComponent(question.slice(0, 1800)), note: 'External fallback limit reached: maximum 6 unknown-question fallbacks per minute per client.' }, ai: null };
  let ai = null;
  if (process.env.GEMINI_API_KEY) {
    ai = await solveWithGemini(question);
    if (ai.status === 'ai_suggestion') return { ...ruleResult, status: 'ai_suggestion', answer: ai.answer, explanation: ai.explanation, confidence: ai.confidence, assumptions: ai.assumptions, model: ai.model, verified: false, note: ai.note };
  }
  const research = await researchQuestion(question);
  return { ...ruleResult, ai, research, explanation: ruleResult.explanation + ' Automatic research was attempted. Results are leads, not a verified answer; compare them with the original question and choices.' };
}

app.post('/solve', async (req, res) => {
  const question = req.body && req.body.question;
  if (typeof question !== 'string' || question.trim().length < 5 || question.length > 8000) {
    return res.status(400).json({ status: 'invalid_input', answer: null, explanation: 'Enter a question between 5 and 8,000 characters.', confidence: 0 });
  }
  return res.json(await solveWithFallback(req, question.trim()));
});

app.post('/research', async (req, res) => {
  const question = req.body && req.body.question;
  if (typeof question !== 'string' || question.trim().length < 5 || question.length > 8000) {
    return res.status(400).json({ status: 'invalid_input', results: [], googleUrl: null, note: 'Enter a question between 5 and 8,000 characters.' });
  }
  if (!allowResearch(req)) return res.status(429).json({ status: 'rate_limited', results: [], googleUrl: 'https://www.google.com/search?q=' + encodeURIComponent(question.trim().slice(0, 1800)), note: 'Research limit reached: maximum 6 searches per minute per client.' });
  return res.json(await researchQuestion(question.trim()));
});

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ status: 'invalid_request', answer: null, explanation: 'Request body is too large.', confidence: 0 });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ status: 'invalid_request', answer: null, explanation: 'Request body must be valid JSON.', confidence: 0 });
  return res.status(500).json({ status: 'error', answer: null, explanation: 'Unexpected server error.', confidence: 0 });
});
if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || '3000', 10);
  app.listen(port, '0.0.0.0', () => console.log('NEET Practice Solver listening on ' + port));
}
module.exports = app;
