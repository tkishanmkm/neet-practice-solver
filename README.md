# NEET Practice Solver

A stateless NEET-style practice helper. It provides transparent rule-based calculations and selected NCERT-style answers. Unknown questions can trigger a bounded public-web search fallback and return source leads plus a Google search link. No database or Supabase is used, and question history is not stored. Web results are not automatically treated as verified answers.

## Local web app

Requirements: Node.js 20 or later.

```sh
npm install
npm test
npm run check
npm start
```

Open `http://localhost:3000`. Health endpoint: `GET /health`. Solver endpoint: `POST /solve` with JSON such as `{"question":"Calculate motional emf for magnetic field B = 2 tesla, length L = 1 m, speed v = 8 m/s."}`. When a rule does not match, `/solve` automatically tries the optional Gemini fallback if configured, then searches public web results; `/research` runs the search stage directly using `{"question":"full question text and choices"}`. Search is capped at six requests per minute per client per running instance. Search results are source leads only, and a Google search URL is included for manual fallback. Search availability and HTML parsing can vary by provider. For a stronger unknown-question fallback, optionally set `GEMINI_API_KEY` in Render's Environment settings (never commit the key); `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. The AI fallback is only attempted after local rules fail, is rate-limited, and returns a suggestion only when its self-reported confidence is at least 0.65. This is not a guarantee of correctness. Check the current Gemini API free-tier limits and data-use terms before enabling it.

## Automatic TrackPrep question observer (local PC)

The optional Playwright helper watches the visible TrackPrep ZAP tab, detects newly visible question text, and prints an answer/explanation when a verified rule matches.

1. Install Playwright locally if needed: `npm install --no-save playwright`
2. Install its browser once: `npx playwright install chromium`
3. Run: `npm run trackprep:watch`
4. In the visible browser it opens, complete TrackPrep Google sign-in yourself if prompted. The local browser profile is separate from TinyFish profiles, so a first local sign-in may be required.
5. Keep the browser and terminal running while practicing. Stop with Ctrl+C.

The observer polls visible page text; it does not click options, submit answers, alter scores, or bypass CAPTCHA/security challenges. It may need selector/extraction adjustments if TrackPrep changes its page layout. The rule-based solver covers only a small verified subset and returns `needs_context` for unsupported or ambiguous questions. Verify explanations against study material.

## Current supported reasoning

- Motional emf using ε = B L v when required values are explicit.
- Limited Ohm's law calculations when the unknown and two known values are explicit.
- Beta-minus decay, seed germination/gibberellin, an isoelectronic ion-size comparison, equal-force spring energy, a projectile flight-time product, a Tollens-negative oxime example, and a basic velocity integral.
- Hückel-rule explanation, but not a molecule-specific aromaticity verdict without molecular context.
- Unsupported or ambiguous prompts return `needs_context`; the solver does not invent an answer.

This is a transparent rule-based prototype, not a general AI model. Image questions, diagrams, broad factual recall and many multi-step problems are not generally supported yet.

## Deploy to Render

The included `render.yaml` defines a free Node web service. The Render web app solves text sent to its `/solve` endpoint. The local TrackPrep observer runs on the user's PC and is **not** hosted on Render, because Render cannot access the local browser's Google OAuth session. Render free services may sleep after inactivity; a web service should not be treated as an always-on browser worker.

## Scope and privacy

- No database, no accounts, no persistent question history.
- The local observer uses a persistent local Playwright browser profile in `.trackprep-profile/`, which is ignored by Git. Never upload that folder, browser cookies, OAuth tokens, passwords, or storage-state files.
- Google authentication stays in the visible browser; never paste passwords or OTPs into the terminal or chat.
- The app does not control a browser on the Render server, submit answers to live competitions/exams, or intentionally misrepresent study results.
- A limited solver may be wrong; always verify the explanation.

## Cloud browser worker prototype (feature branch only)

A separate prototype entry point, `npm run cloud-browser:worker`, starts headless Playwright Chromium, checks the configured TrackPrep URL, and reports basic browser/question-observation status. It never selects or submits answers. The `/worker/status` endpoint intentionally exposes only metadata, not captured question text or answer suggestions. This is a capability test, not a completed unattended bot: Google OAuth login/session persistence is not implemented, and Render Free may sleep or restart without preserving browser state. Do not deploy this worker as a production service until browser installation, access control, authentication, session lifecycle, and free-tier memory usage are validated.
