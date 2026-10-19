'use strict';
const form = document.querySelector('#solve-form');
const question = document.querySelector('#question');
const button = document.querySelector('#solve-button');
const count = document.querySelector('#char-count');
const notice = document.querySelector('#notice');
const pacedMode = document.querySelector('#paced-mode');
const resultPanel = document.querySelector('#result');
const resultTitle = document.querySelector('#result-title');
const answer = document.querySelector('#answer');
const explanation = document.querySelector('#explanation');
const confidence = document.querySelector('#confidence');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
question.addEventListener('input', () => { count.textContent = question.value.length + ' / 8000'; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = question.value.trim();
  if (text.length < 5) { notice.textContent = 'Please enter a question with at least 5 characters.'; question.focus(); return; }
  if (/motivational video|motivation video|youtube\.com\/(?:watch|shorts)|youtu\.be\//i.test(text)) {
    resultPanel.hidden = true;
    notice.textContent = 'Skipped: this appears to be motivational-video content, not a practice question.';
    return;
  }
  button.disabled = true;
  resultPanel.hidden = true;
  try {
    let delay = 0;
    if (pacedMode.checked) {
      delay = 25000 + Math.floor(Math.random() * 20001);
      let remaining = Math.ceil(delay / 1000);
      notice.textContent = 'Study interval: ' + remaining + ' seconds. Try solving it yourself before revealing the result.';
      const ticker = setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        notice.textContent = remaining ? 'Study interval: ' + remaining + ' seconds. Try solving it yourself before revealing the result.' : 'Preparing explanation…';
      }, 1000);
      await wait(delay);
      clearInterval(ticker);
    }
    button.textContent = 'Solving…';
    notice.textContent = 'Analyzing the question…';
    const response = await fetch('/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.explanation || 'Request failed.');
    resultTitle.textContent = data.status === 'success' ? 'Suggested answer' : 'More information needed';
    answer.textContent = data.answer || 'No answer provided';
    explanation.textContent = data.explanation || 'No explanation available.';
    confidence.textContent = data.confidence > 0 ? 'Confidence: ' + Math.round(data.confidence * 100) + '%' : 'Confidence not rated';
    resultPanel.hidden = false;
    notice.textContent = data.status === 'success' ? 'Review the reasoning and verify it against study material.' : 'The solver did not guess; add missing details and try again.';
  } catch (error) {
    notice.textContent = error instanceof Error ? error.message : 'Unable to solve right now. Please retry.';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Start practice question <span aria-hidden="true">→</span>';
  }
});
