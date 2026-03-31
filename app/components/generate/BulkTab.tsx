"use client";

import { useState } from "react";
import SourceDropzone from "./SourceDropzone";
import StylePromptInput from "./StylePromptInput";

type Mode = "one-scene" | "one-watch";

interface WatchSlot {
  id: string;
  refs: File[];
}

interface BulkResult {
  id: string;
  outputUrl: string;
  label: string;
}

let slotCounter = 0;
function newSlot(): WatchSlot {
  return { id: `slot-${++slotCounter}`, refs: [] };
}

export default function BulkTab() {
  const [mode, setMode] = useState<Mode>("one-scene");

  // Mode 1 state
  const [sceneFile, setSceneFile] = useState<File[]>([]);
  const [watchSlots, setWatchSlots] = useState<WatchSlot[]>([newSlot()]);

  // Mode 2 state
  const [watchRefs, setWatchRefs] = useState<File[]>([]);
  const [sceneFiles, setSceneFiles] = useState<File[]>([]);

  // Shared state
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const isLoading = status === "loading";

  const canSubmitMode1 =
    sceneFile.length === 1 &&
    watchSlots.length >= 1 &&
    watchSlots.every((s) => s.refs.length >= 1);

  const canSubmitMode2 =
    watchRefs.length >= 1 &&
    sceneFiles.length >= 2;

  const canSubmit = (mode === "one-scene" ? canSubmitMode1 : canSubmitMode2) && !isLoading;

  function addWatchSlot() {
    if (watchSlots.length >= 10) return;
    setWatchSlots((prev) => [...prev, newSlot()]);
  }

  function removeWatchSlot(id: string) {
    setWatchSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlotRefs(id: string, refs: File[]) {
    setWatchSlots((prev) => prev.map((s) => (s.id === id ? { ...s, refs } : s)));
  }

  function switchMode(next: Mode) {
    if (isLoading) return;
    setMode(next);
    setStatus("idle");
    setResults([]);
    setError("");
  }

  async function handleGenerate() {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setResults([]);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      if (mode === "one-scene") {
        const total = watchSlots.length;
        setProgress({ done: 0, total });
        let done = 0;
        const accumulated: (BulkResult | null)[] = new Array(total).fill(null);

        const promises = watchSlots.map(async (slot, i) => {
          const fd = new FormData();
          fd.append("source", sceneFile[0]);
          slot.refs.forEach((f) => fd.append("references[]", f));
          fd.append("prompt", prompt);

          const res = await fetch("/api/generate", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Watch ${i + 1} failed`);

          accumulated[i] = { id: data.id, outputUrl: data.outputUrl, label: `Watch ${i + 1}` };
          done++;
          setResults(accumulated.filter((r): r is BulkResult => r !== null));
          setProgress({ done, total });
        });

        await Promise.all(promises);
      } else {
        setProgress({ done: 0, total: sceneFiles.length });
        const fd = new FormData();
        sceneFiles.forEach((f) => fd.append("sources[]", f));
        watchRefs.forEach((f) => fd.append("references[]", f));
        fd.append("prompt", prompt);

        const res = await fetch("/api/generate-bulk", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk generation failed");

        setResults(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.results.map((r: any) => ({
            id: r.id,
            outputUrl: r.outputUrl,
            label: r.sourceFilename.replace(/\.[^.]+$/, ""),
          }))
        );
        setProgress({ done: sceneFiles.length, total: sceneFiles.length });
      }

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      clearInterval(timer);
    }
  }

  function downloadOne(url: string, label: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlens-${label}-enhanced.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadAll() {
    results.forEach(({ outputUrl, label }, i) => {
      setTimeout(() => downloadOne(outputUrl, label), i * 300);
    });
  }

  const totalToProcess = mode === "one-scene" ? watchSlots.length : sceneFiles.length;

  return (
    <div className="space-y-8">

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => switchMode("one-scene")}
          disabled={isLoading}
          className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
            mode === "one-scene"
              ? "border-zinc-400 bg-white/5"
              : "border-zinc-800 hover:border-zinc-600"
          }`}
        >
          <p className="text-sm font-semibold text-zinc-200">One scene, many watches</p>
          <p className="text-xs text-zinc-500 mt-1">
            Pick one background photo and place several different watches into it — one result per watch.
          </p>
        </button>
        <button
          onClick={() => switchMode("one-watch")}
          disabled={isLoading}
          className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
            mode === "one-watch"
              ? "border-zinc-400 bg-white/5"
              : "border-zinc-800 hover:border-zinc-600"
          }`}
        >
          <p className="text-sm font-semibold text-zinc-200">One watch, many scenes</p>
          <p className="text-xs text-zinc-500 mt-1">
            Pick one watch and drop it into multiple background photos — one result per scene.
          </p>
        </button>
      </div>

      {/* Mode 1: One scene, many watches */}
      {mode === "one-scene" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Background / scene photo <span className="text-red-400">*</span>
              <span className="text-zinc-500 font-normal ml-1">— every watch will be placed into this photo</span>
            </label>
            <SourceDropzone
              files={sceneFile}
              onChange={setSceneFile}
              label="Drop your scene or background photo here"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-300">
                Watches <span className="text-red-400">*</span>
                <span className="text-zinc-500 font-normal ml-1">
                  — add reference photos for each watch ({watchSlots.length}/10)
                </span>
              </p>
              {watchSlots.length < 10 && (
                <button
                  onClick={addWatchSlot}
                  disabled={isLoading}
                  className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add watch
                </button>
              )}
            </div>

            {watchSlots.map((slot, i) => (
              <div key={slot.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Watch {i + 1}</span>
                  {watchSlots.length > 2 && (
                    <button
                      onClick={() => removeWatchSlot(slot.id)}
                      disabled={isLoading}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <SourceDropzone
                  files={slot.refs}
                  multiple
                  maxFiles={14}
                  onChange={(files) => updateSlotRefs(slot.id, files)}
                  label={`Drop reference photos of Watch ${i + 1} here`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: One watch, many scenes */}
      {mode === "one-watch" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Watch reference photos <span className="text-red-400">*</span>
              <span className="text-zinc-500 font-normal ml-1">
                — photos of the watch you want to place into each scene ({watchRefs.length}/14)
              </span>
            </label>
            <SourceDropzone
              files={watchRefs}
              multiple
              maxFiles={14}
              onChange={setWatchRefs}
              label="Drop reference photos of your watch here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Background / scene photos <span className="text-red-400">*</span>
              <span className="text-zinc-500 font-normal ml-1">
                — the watch will be placed into each one ({sceneFiles.length}/20)
              </span>
            </label>
            <SourceDropzone
              files={sceneFiles}
              multiple
              maxFiles={20}
              onChange={setSceneFiles}
              label="Drop your scene or background photos here"
            />
          </div>
        </div>
      )}

      {/* Prompt + submit */}
      <div className="space-y-4">
        <StylePromptInput value={prompt} onChange={setPrompt} disabled={isLoading} />

        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {progress.done}/{progress.total} done… {elapsed}s
            </>
          ) : (
            `Generate ${totalToProcess > 0 ? `${totalToProcess} ` : ""}Enhanced Photo${totalToProcess !== 1 ? "s" : ""}`
          )}
        </button>

        {status === "error" && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Results — appear as they come in */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">
              {results.length} of {progress.total} enhanced
              {isLoading && <span className="ml-2 text-zinc-500 font-normal animate-pulse">— processing…</span>}
            </p>
            {status === "done" && results.length > 1 && (
              <button
                onClick={downloadAll}
                className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors"
              >
                Download all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map((r) => (
              <div key={r.id} className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-zinc-700 aspect-square bg-zinc-900">
                  <img src={r.outputUrl} alt={r.label} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-zinc-500 truncate">{r.label}</p>
                <button
                  onClick={() => downloadOne(r.outputUrl, r.label)}
                  className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1.5 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
