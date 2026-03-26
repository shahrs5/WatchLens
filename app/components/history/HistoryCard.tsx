"use client";

import type { HistoryEntry } from "@/lib/types";

interface Props {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}

export default function HistoryCard({ entry, onDelete }: Props) {
  function download() {
    const a = document.createElement("a");
    a.href = entry.outputUrl;
    a.download = `watchlens-${entry.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDelete() {
    const res = await fetch(`/api/history/${entry.id}`, { method: "DELETE" });
    if (res.ok) onDelete(entry.id);
  }

  const date = new Date(entry.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden group">
      <div className="aspect-square bg-zinc-900 overflow-hidden">
        <img
          src={entry.outputUrl}
          alt={entry.sourceFilename}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 space-y-2">
        <p className="text-xs text-zinc-400">{date}</p>
        <p className="text-xs text-zinc-500 truncate">{entry.sourceFilename}</p>
        {entry.prompt && (
          <p className="text-xs text-zinc-600 line-clamp-2 italic">"{entry.prompt}"</p>
        )}
        <p className="text-xs text-zinc-600">
          {entry.referenceCount} reference{entry.referenceCount !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={download}
            className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg transition-colors"
          >
            Download
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
