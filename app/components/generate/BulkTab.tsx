"use client";

import { useState } from "react";
import SourceDropzone from "./SourceDropzone";
import StylePromptInput from "./StylePromptInput";

interface BulkResult {
  id: string;
  outputUrl: string;
  sourceFilename: string;
}

export default function BulkTab() {
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const isLoading = status === "loading";
  const canSubmit = sourceFiles.length >= 2 && referenceFiles.length >= 1 && !isLoading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setResults([]);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const fd = new FormData();
      sourceFiles.forEach((f) => fd.append("sources[]", f));
      referenceFiles.forEach((f) => fd.append("references[]", f));
      fd.append("prompt", prompt);

      const res = await fetch("/api/generate-bulk", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Bulk generation failed");

      setResults(data.results);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      clearInterval(timer);
    }
  }

  function downloadAll() {
    results.forEach(({ outputUrl, sourceFilename }, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = `watchlens-${sourceFilename.replace(/\.[^.]+$/, "")}-enhanced.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 300);
    });
  }

  function downloadOne(url: string, sourceFilename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlens-${sourceFilename.replace(/\.[^.]+$/, "")}-enhanced.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Watch photos{" "}
              <span className="text-red-400">*</span>
              <span className="text-zinc-500 font-normal ml-1">
                (2–20, {sourceFiles.length} selected)
              </span>
            </label>
            <SourceDropzone
              files={sourceFiles}
              multiple
              maxFiles={20}
              onChange={setSourceFiles}
              label="Drop multiple watch photos here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Reference images{" "}
              <span className="text-red-400">*</span>
              <span className="text-zinc-500 font-normal ml-1">
                ({referenceFiles.length}/14)
              </span>
            </label>
            <SourceDropzone
              files={referenceFiles}
              multiple
              maxFiles={14}
              onChange={setReferenceFiles}
              label="Drop professional reference photos here"
            />
          </div>

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
                Processing {sourceFiles.length} photos… {elapsed}s
              </>
            ) : (
              `Enhance All ${sourceFiles.length > 0 ? `(${sourceFiles.length})` : ""} Photos`
            )}
          </button>

          {status === "error" && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-1">How bulk works</h3>
          <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
            <li>Each photo is processed sequentially</li>
            <li>All photos share the same references & prompt</li>
            <li>Results are saved to history as they complete</li>
            <li>Large batches may take several minutes</li>
          </ul>
        </div>
      </div>

      {status === "done" && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">
              {results.length} enhanced photos
            </h2>
            <button
              onClick={downloadAll}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors"
            >
              Download all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map((r) => (
              <div key={r.id} className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-zinc-700 aspect-square bg-zinc-900">
                  <img src={r.outputUrl} alt={r.sourceFilename} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-zinc-500 truncate">{r.sourceFilename}</p>
                <button
                  onClick={() => downloadOne(r.outputUrl, r.sourceFilename)}
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
