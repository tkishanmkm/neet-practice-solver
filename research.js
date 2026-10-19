'use strict';

const SEARCH_TIMEOUT_MS = 7000;
const MAX_RESULTS = 5;

function cleanText(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}

function safeUrl(raw) {
  try {
    const u = new URL(raw);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'NEET-Practice-Solver/1.0 (educational question research)', 'accept-language': 'en-US,en;q=0.8' }
    });
    if (!response.ok) throw new Error('Search provider returned HTTP ' + response.status);
    return await response.text();
  } finally { clearTimeout(timer); }
}

function parseDuckDuckGo(html) {
  const results = [];
  const re = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>)/gi;
  let m;
  while ((m = re.exec(html)) && results.length < MAX_RESULTS) {
    let url = m[1].replace(/&amp;/g, '&');
    const redirect = url.match(/[?&]uddg=([^&]+)/);
    if (redirect) { try { url = decodeURIComponent(redirect[1]); } catch {} }
    url = safeUrl(url);
    const title = cleanText(m[2]);
    const snippet = cleanText(m[3] || m[4] || '');
    if (url && title && snippet) results.push({ title: title.slice(0, 240), url, snippet: snippet.slice(0, 700) });
  }
  return results;
}

async function researchQuestion(question) {
  const q = String(question || '').trim().replace(/\s+/g, ' ').slice(0, 1800);
  if (q.length < 5) return { status: 'invalid_input', results: [], googleUrl: null, note: 'Provide the full question text.' };
  const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(q);
  const ddgUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
  try {
    const html = await fetchWithTimeout(ddgUrl);
    const results = parseDuckDuckGo(html);
    if (results.length) return { status: 'research_results', provider: 'DuckDuckGo HTML search', results, googleUrl, note: 'Search results are evidence leads, not a verified answer. Compare the source with the full question and choices.' };
    return { status: 'no_results', provider: 'DuckDuckGo HTML search', results: [], googleUrl, note: 'No parseable results returned. Open the Google search link to review results manually.' };
  } catch (error) {
    return { status: 'search_unavailable', provider: 'DuckDuckGo HTML search', results: [], googleUrl, note: 'Automatic web search is unavailable right now (' + (error.name === 'AbortError' ? 'timeout' : 'provider/network error') + '). Open the Google search link to review results manually.' };
  }
}

module.exports = { researchQuestion, parseDuckDuckGo };
