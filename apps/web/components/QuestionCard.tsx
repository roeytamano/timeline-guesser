'use client';

import { useEffect, useState } from 'react';
import { fetchRandomQuestion, submitGuess, type Question } from '@/lib/api';

export function QuestionCard() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [guess, setGuess] = useState(1950);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<null | {
    exactYear: number;
    guess: number;
    pointsEarned: number;
    difference: number;
    isCorrect: boolean;
  }>(null);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const nextQuestion = await fetchRandomQuestion();
      setQuestion(nextQuestion);
      setGuess(1950);
      setResult(null);
    } catch (error) {
      console.error('Unable to load question', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleSubmit = async () => {
    if (!question) {
      return;
    }

    const nextResult = await submitGuess(question.id, Number(guess));
    setResult(nextResult);
  };

  if (loading || !question) {
    return (
      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-slate-200 shadow-2xl">
        Loading question...
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl md:grid-cols-[1.2fr_0.8fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
        <img
          src={question.image_url}
          alt={question.title}
          className="h-72 w-full object-cover md:h-[420px]"
        />
      </div>

      <div className="flex flex-col justify-between gap-5">
        <div>
          <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            {question.category}
          </span>

          <h2 className="mt-4 text-2xl font-bold text-white">{question.title}</h2>
          <p className="mt-3 text-base text-slate-300">{question.description}</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Select your guess
          </label>

          <input
            type="range"
            min={1000}
            max={2100}
            value={guess}
            onChange={(event) => setGuess(Number(event.target.value))}
            className="w-full"
          />

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-center text-xl font-bold text-sky-200">
            {guess}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Submit guess
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-200">
            <p className="text-lg font-bold text-white">Round result</p>
            <div className="mt-2 space-y-1">
              <p>Exact year: {result.exactYear}</p>
              <p>Your guess: {result.guess}</p>
              <p>Difference: {result.difference} years</p>
              <p>Points earned: {result.pointsEarned}</p>
            </div>

            <div className="mt-3 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-sky-200">
              {result.isCorrect ? 'Perfect match!' : 'Close, but not exact.'}
            </div>

            <button
              onClick={loadQuestion}
              className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 font-medium text-white transition hover:border-sky-400 hover:text-sky-200"
            >
              Next question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
