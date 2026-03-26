import { kv } from "@vercel/kv";
import type { HistoryEntry } from "./types";

export async function readHistory(): Promise<HistoryEntry[]> {
  const data = await kv.hgetall<Record<string, HistoryEntry>>("history");
  if (!data) return [];
  return Object.values(data).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  await kv.hset("history", { [entry.id]: entry });
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const data = await kv.hgetall<Record<string, HistoryEntry>>("history");
  if (!data || !data[id]) return null;
  const entry = data[id];
  await kv.hdel("history", id);
  return entry;
}
