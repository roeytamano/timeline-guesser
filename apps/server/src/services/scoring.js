export function calculateScore(exactYear, guess) {
  const distance = Math.abs(Number(exactYear) - Number(guess));

  if (!Number.isFinite(distance)) {
    return 0;
  }

  const maxScore = 1000;
  const decayFactor = 30;
  const score = maxScore * Math.exp(-(distance / decayFactor));

  return Math.max(0, Math.round(score));
}
