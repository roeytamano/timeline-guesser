import express from 'express';
import pool from '../db.js';
import { calculateScore } from '../services/scoring.js';

const router = express.Router();

const fallbackQuestions = [
  {
    id: 1,
    title: 'The printing press',
    description: 'A machine that revolutionized the spread of knowledge during the Renaissance era.',
    image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    exact_year: 1450,
    category: 'inventions',
  },
  {
    id: 2,
    title: 'The Moon landing',
    description: 'Humanity reached the Moon for the first time in a historic Apollo mission.',
    image_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
    exact_year: 1969,
    category: 'history',
  },
  {
    id: 3,
    title: 'The first iPhone',
    description: 'Apple introduced the iconic smartphone that redefined mobile computing.',
    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80',
    exact_year: 2007,
    category: 'pop-culture',
  },
  {
    id: 4,
    title: 'The first World Cup',
    description: 'The first official international tournament for national football teams began in Uruguay.',
    image_url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=1200&q=80',
    exact_year: 1930,
    category: 'sports',
  },
];

function getRandomFallbackQuestion() {
  return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
}

router.get('/random', async (_, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No questions found. Seed the database first.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.warn('Database unavailable, using in-memory fallback questions:', error.message);
    return res.json(getRandomFallbackQuestion());
  }
});

router.post('/:id/grade', async (req, res) => {
  const questionId = Number(req.params.id);
  const guess = Number(req.body.guess);

  if (!Number.isFinite(guess)) {
    return res.status(400).json({ message: 'A valid guess is required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [questionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const question = result.rows[0];
    const pointsEarned = calculateScore(question.exact_year, guess);

    return res.json({
      questionId: question.id,
      exactYear: question.exact_year,
      guess,
      pointsEarned,
      difference: Math.abs(question.exact_year - guess),
      isCorrect: guess === question.exact_year,
    });
  } catch (error) {
    console.warn('Database unavailable during grading, using in-memory fallback score:', error.message);
    const fallbackQuestion = fallbackQuestions.find((question) => question.id === questionId) ?? getRandomFallbackQuestion();
    const pointsEarned = calculateScore(fallbackQuestion.exact_year, guess);

    return res.json({
      questionId: fallbackQuestion.id,
      exactYear: fallbackQuestion.exact_year,
      guess,
      pointsEarned,
      difference: Math.abs(fallbackQuestion.exact_year - guess),
      isCorrect: guess === fallbackQuestion.exact_year,
    });
  }
});

export default router;
