import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { solveQuestion } from './solver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body limit 16kb
app.use(express.json({ limit: '16kb' }));

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint - simple JSON service description
app.get('/', (req, res) => {
  res.json({
    service: 'NEET Practice Solver',
    description: 'A simple API for solving NEET physics questions including motional EMF, Ohm\'s law, electric power, lens formula, and Hückel\'s rule.',
    endpoints: {
      GET: {
        '/': 'Service description',
        '/health': 'Health check',
      },
      POST: {
        '/solve': 'Solve a NEET question. Body: { "question": "string" }',
      },
    },
    supportedTopics: [
      'Motional EMF (emf = B*L*v)',
      "Ohm's Law (V = IR)",
      'Electric Power (P = VI)',
      'Lens Formula (1/f = 1/v - 1/u)',
      "Hückel's Rule (4n+2 pi-electrons)",
    ],
  });
});

// Solve endpoint
app.post('/solve', (req, res) => {
  try {
    const { question } = req.body;

    // Validate body.question as string length 5..8000
    if (typeof question !== 'string' || question.length > 8000 || question.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Field "question" must be a non-empty string with length between 5 and 8000 characters.',
      });
    }

    if (question.length > 8000) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Question exceeds maximum length of 8000 characters.',
      });
    }

    if (question.length > 8000) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Question exceeds maximum length of 8000 characters.',
      });
    }

    if (question.length > 8000) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Question exceeds maximum length of 8000 characters.',
      });
    }

    const result = solveQuestion(question);
    res.json(result);
  } catch (err) {
    // Generic safe error handling
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request.',
    });
  }
});

// Only listen when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`NEET Practice Solver running on port ${PORT}`);
  });
}

export default app;
