# TrackPrep browser-worker integration plan

## Current state

The existing NEET Practice Solver is a small Express application. It has a rule-based solver for a narrow set of text questions and a 25–45 second paced mode in its own UI. It does not currently connect to TrackPrep, use a general-purpose AI model, or control a browser.

Public routes inspected:
- https://www.trackprep.in/auth — displays Google sign-in.
- https://www.trackprep.in/zap — redirects unauthenticated visitors to /auth?next=%2Fzap.

The public pages do not reveal the authenticated question-page DOM or prove that browser automation is permitted. Do not guess selectors or send automated clicks until an authorized practice session can be inspected.

## Safe implementation sequence

1. Use a remote browser session that the account owner opens and authenticates through Google's normal OAuth UI. Never collect the Google password, OAuth tokens, or browser cookies in the solver UI, source code, GitHub, or logs.
2. Inspect one ordinary practice question after login and identify accessible DOM labels for question text, options, feedback, next-question controls, and any video interruption. Stop if the site presents a CAPTCHA, blocks automation, or requires an unsupported security challenge.
3. Capture a question and options, then send only the question text to a solver. The current solver supports only limited calculations and must return needs_context for unsupported questions; do not auto-submit guesses.
4. In the first release, keep answer selection and progression user-confirmed until selector reliability and the site's automation rules are verified.
5. Support a configurable 25–45 second study interval, pause/stop controls, and transparent local counters for answered, skipped, and incorrect questions.
6. If the user chooses a practice pattern of 18 normal questions followed by either 2 skips or 2 intentionally wrong practice attempts, treat it as an explicit study exercise and label it in the user's private practice log. Do not conceal the pattern or misrepresent it as an accurate performance record.
7. Keep Google authentication in the browser's supported sign-in flow. Do not expose session state through HTTP endpoints or persist credentials in application logs.
8. For PC-off operation, use a supported cloud browser/worker with persistent storage only if available on the selected free tier. Render free web services can sleep and should not be treated as an always-on browser worker. Do not promise unattended operation until a real cloud browser, session persistence, and runtime budget are verified.

## Free-tier and deployment constraints

- The existing Render free web service is not proof that a persistent browser worker can run continuously.
- A Playwright browser can materially increase memory and build size; test separately before changing the production service.
- Do not add paid APIs or paid infrastructure without approval.
- Do not deploy credentials, OAuth client secrets, cookies, or storage-state JSON to the public repository.
- Add automated tests for question extraction, unsupported questions, pacing bounds, stop/pause behavior, and session-state expiry before enabling any automated action.

## Acceptance criteria before unattended automation

- Owner completes Google OAuth directly in the browser.
- Session remains valid without copying credentials to the application.
- Question and options are extracted accurately on several question types.
- Solver returns a grounded answer or safely abstains.
- Any submission/next action is limited to a permitted ordinary practice flow and can be stopped immediately.
- A video interruption does not cause accidental answer submission.
- Cloud worker survives restarts within the free-tier limits, or the UI clearly explains why it is offline.