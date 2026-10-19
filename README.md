# NEET Practice Solver

A stateless NEET practice question solver API that uses limited rule-based patterns to analyze and respond to NEET-style questions. **No database, no Supabase, no question history stored.**

## Project Purpose

This project provides a simple, stateless API for practicing NEET (National Eligibility cum Entrance Test) questions. It accepts a question as input and returns a best-effort analysis including status, answer, explanation, and confidence level based on built-in pattern matching rules. It is designed for educational practice only and does **not** automate live TrackPrep submissions, competition rankings, or any external platform interactions.

## Local Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start the server
npm start
```

The server will be available at `http://localhost:3000` (or the port specified by `PORT`).

## API Example

```bash
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the capital of France?"}'
```

Expected response:

```json
{
  "status": "success",
  "answer": "Paris",
  "explanation": "Paris is the capital and most populous city of France.",
  "confidence": 0.95
}
```

## Supported Patterns

The solver uses a limited set of rule-based pattern matching. It can recognize:
- Multiple-choice questions with labeled options (a, b, c, d / A, B, C, D)
- Straight factual recall questions
- Basic NEET-style biology, chemistry, and physics questions

It does **not** support image-based questions, complex multi-step derivations, or questions requiring external knowledge beyond its built-in rules.

## Limitations

- **No database / No Supabase**: The solver is entirely stateless and does not store any data.
- **No question history**: Each question is processed independently; no history is kept between requests.
- **Rule-based only**: The solver uses a fixed set of patterns; it is not a machine learning model.
- **No automated submissions**: This project does not automate live TrackPrep submissions, competition rankings, or any browser-based interactions.
- **Unsupported questions**: Some questions may need additional context and cannot be fully answered without further information. Nothing is stored after processing.

## Render Deployment

This project can be deployed on [Render](https://render.com) using the included `render.yaml` configuration file. Click the button below or use the Render dashboard to deploy:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Or use the CLI:

```bash
render deploy
```

## Disclaimer

This tool is for **educational practice purposes only**. It does not replace formal study materials, and its answers should be verified against standard NEET preparation resources. It does not interact with any live examination or competition platforms.
