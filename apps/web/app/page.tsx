import { QuestionCard } from '@/components/QuestionCard';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-sky-300">Timeline Guesser</p>
          <h1 className="text-4xl font-black md:text-5xl">Guess the year</h1>
        </header>

        <QuestionCard />
      </div>
    </main>
  );
}
