"use client";

import { useState } from "react";
import SourceDropzone from "./SourceDropzone";
import StylePromptInput from "./StylePromptInput";
import ResultViewer from "./ResultViewer";

export default function GenerateTab() {
  const [sourceFile, setSourceFile] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ outputUrl: string; id: string } | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const isLoading = status === "loading";
  const canSubmit = sourceFile.length === 1 && referenceFiles.length >= 1 && !isLoading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setResult(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const fd = new FormData();
      fd.append("source", sourceFile[0]);
      referenceFiles.forEach((f) => fd.append("references[]", f));
      fd.append("prompt", prompt);

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: inputs */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Scene photo <span className="text-red-400">*</span>
            <span className="text-zinc-500 font-normal ml-1">— background & composition to keep</span>
          </label>
          <SourceDropzone
            files={sourceFile}
            onChange={setSourceFile}
            label="Drop the scene/background photo here"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Watch reference photos <span className="text-red-400">*</span>
            <span className="text-zinc-500 font-normal ml-1">— the watch to place in the scene ({referenceFiles.length}/14)</span>
          </label>
          <SourceDropzone
            files={referenceFiles}
            multiple
            maxFiles={14}
            onChange={setReferenceFiles}
            label="Drop photos of the watch to composite in"
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
              Enhancing… {elapsed}s
            </>
          ) : (
            "Enhance Photo"
          )}
        </button>

        {status === "error" && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Right: result */}
      <div>
        {status === "done" && result ? (
          <ResultViewer outputUrl={result.outputUrl} />
        ) : (
          <div className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
            <p className="text-zinc-600 text-sm text-center px-4">
              {isLoading
                ? "Generating your enhanced image…"
                : "Your enhanced photo will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
