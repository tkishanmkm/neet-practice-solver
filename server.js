'use strict';
const path = require('node:path');
const express = require('express');
const { solveQuestion } = require('./solver');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb', strict: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.post('/solve', (req, res) => {
  const question = req.body && req.body.question;
  if (typeof question !== 'string' || question.trim().length < 5 || question.length > 8000) {
    return res.status(400).json({ status: 'invalid_input', answer: null, explanation: 'Enter a question between 5 and 8,000 characters.', confidence: 0 });
  }
  return res.json(solveQuestion(question.trim()));
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
