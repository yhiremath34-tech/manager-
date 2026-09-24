import Link from 'next/link';

export function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-red-600 text-white font-bold text-sm px-2.5 py-1 rounded tracking-wider uppercase">
              Emergency
            </span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Matchmaker
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Realtime Active</span>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2 py-1"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
