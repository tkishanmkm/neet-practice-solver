# NEET Practice Solver

A small, stateless NEET-style practice helper. It provides transparent, limited rule-based calculations and asks for more context when a question is not supported. No database or Supabase is used, and question history is not stored.

## Local setup

Requirements: Node.js 20 or later.

```sh
npm install
npm test
npm run check
npm start
```

Open `http://localhost:3000`. Health endpoint: `GET /health`. Solver endpoint: `POST /solve` with JSON such as `{"question":"Calculate motional emf for magnetic field B = 2 tesla, length L = 1 m, speed v = 8 m/s."}`.

## Current supported reasoning

- Motional emf using ε = B L v when the required values are explicitly stated.
- Limited Ohm's law calculations when the requested unknown and two known values are explicit.
- Hückel-rule explanation, but not a molecule-specific aromaticity verdict without molecular context.
- Unsupported or ambiguous prompts return `needs_context`; the solver does not invent an answer.

This is a transparent rule-based prototype, not a general AI model. Check results against trusted study material. Image questions, diagrams, broad factual recall and multi-step problems are not generally supported yet.

## Deploy to Render

The included `render.yaml` defines a free Node web service. In Render, create a new Blueprint or Web Service connected to this repository, use branch `main`, build command `npm install`, start command `npm start`, and health path `/health`. Render free services may sleep after inactivity; health pings do not guarantee continuous uptime.

## Scope and privacy

- No database, no Supabase, no accounts, no persistent question history.
- The app only solves text submitted directly to this app.
- It does not control a browser, submit answers to live competitions/exams, manipulate scores, or intentionally produce scheduled wrong answers/skips.
- A limited solver may be wrong; always verify the explanation.
