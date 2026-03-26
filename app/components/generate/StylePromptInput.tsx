"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function StylePromptInput({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        Style instructions{" "}
        <span className="text-zinc-500 font-normal">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={500}
        rows={3}
        placeholder="e.g. dark moody background, dramatic side lighting, on a slate surface"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500 disabled:opacity-50"
      />
      <p className="text-right text-xs text-zinc-600 mt-1">{value.length}/500</p>
    </div>
  );
}
