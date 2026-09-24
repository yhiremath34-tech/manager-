import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Emergency Matchmaker — Realtime Crisis Volunteer Dispatch',
  description: 'Zero-touch volunteer coordination app for hyper-local crises powered by Antigravity, Supabase Realtime, and Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Emergency Matchmaker • Powered by Antigravity IDE, Supabase Realtime & Vercel
        </footer>
      </body>
    </html>
  );
}
