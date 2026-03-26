"use client";

interface Props {
  outputUrl: string;
}

export default function ResultViewer({ outputUrl }: Props) {
  function download() {
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `watchlens-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-300">Result</h2>
      <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
        <img
          src={outputUrl}
          alt="Enhanced watch photo"
          className="w-full object-contain max-h-[600px]"
        />
      </div>
      <button
        onClick={download}
        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
      >
        Download PNG
      </button>
    </div>
  );
}
