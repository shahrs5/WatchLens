import TabShell from "./components/TabShell";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-black">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-base font-semibold tracking-tight">WatchLens</h1>
          <span className="text-xs text-zinc-600 ml-auto">AI Watch Photography</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <TabShell />
      </main>
    </div>
  );
}
