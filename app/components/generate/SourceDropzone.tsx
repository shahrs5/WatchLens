"use client";

import { useRef } from "react";

interface Props {
  files: File[];
  multiple?: boolean;
  onChange: (files: File[]) => void;
  label?: string;
  maxFiles?: number;
}

export default function SourceDropzone({
  files,
  multiple = false,
  onChange,
  label = "Drop your watch photo here",
  maxFiles = 1,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    const next = multiple
      ? [...files, ...dropped].slice(0, maxFiles)
      : dropped.slice(0, 1);
    onChange(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const next = multiple
      ? [...files, ...selected].slice(0, maxFiles)
      : selected.slice(0, 1);
    onChange(next);
    e.target.value = "";
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-zinc-600 rounded-xl p-6 text-center cursor-pointer hover:border-zinc-400 transition-colors bg-zinc-900/50"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
        <div className="text-zinc-400 text-sm">
          {files.length === 0 ? (
            <>
              <p className="text-base font-medium text-zinc-300 mb-1">{label}</p>
              <p>JPEG, PNG, or WEBP — click or drag & drop</p>
              {multiple && maxFiles > 1 && (
                <p className="mt-1 text-xs text-zinc-500">Up to {maxFiles} images</p>
              )}
            </>
          ) : (
            <p className="text-zinc-300 font-medium">
              {files.length} image{files.length > 1 ? "s" : ""} selected
              {multiple && ` / ${maxFiles} max`}
              <span className="ml-2 text-zinc-500 font-normal">({sizeMB} MB total)</span>
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {files.length === 1 && (
                <p className="text-xs text-zinc-500 mt-1 max-w-[64px] truncate">{file.name}</p>
              )}
            </div>
          ))}
          {multiple && files.length < maxFiles && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition-colors text-2xl"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}
