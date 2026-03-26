"use client";

import { useEffect, useState } from "react";
import HistoryCard from "./HistoryCard";
import type { HistoryEntry } from "@/lib/types";

export default function HistoryTab() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/history");
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function clearAll() {
    if (!confirm("Delete all history? This cannot be undone.")) return;
    await Promise.all(entries.map((e) => fetch(`/api/history/${e.id}`, { method: "DELETE" })));
    setEntries([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="w-6 h-6 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-zinc-500 text-sm">No generations yet.</p>
        <p className="text-zinc-600 text-xs mt-1">Enhance a photo to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {entries.length} generation{entries.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {entries.map((entry) => (
          <HistoryCard key={entry.id} entry={entry} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
