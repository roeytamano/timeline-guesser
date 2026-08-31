import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Timeline Guesser',
  description: 'A historical date guessing game inspired by GeoGuessr.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
