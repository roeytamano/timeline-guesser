const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Question = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  exact_year: number;
  category: string;
};

export async function fetchRandomQuestion(): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/api/questions/random`);

  if (!response.ok) {
    throw new Error('Failed to fetch a question');
  }

  return response.json();
}

export async function submitGuess(questionId: number, guess: number) {
  const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/grade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guess }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit guess');
  }

  return response.json();
}
