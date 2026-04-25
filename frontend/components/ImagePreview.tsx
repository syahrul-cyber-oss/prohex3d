"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

type ImagePreviewProps = {
  file?: File | null;
  imageUrl?: string;
  title?: string;
  description?: string;
  emptyText?: string;
  className?: string;
  showInfo?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
};

function formatFileSize(size: number) {
  const mb = size / 1024 / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  const kb = size / 1024;

  return `${kb.toFixed(2)} KB`;
}

export default function ImagePreview({
  file = null,
  imageUrl = "",
  title = "Preview Foto",
  description = "Foto yang dipilih akan tampil di sini.",
  emptyText = "Belum ada foto.",
  className = "",
  showInfo = true,
  onRemove,
  disabled = false,
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (imageUrl) {
      setPreviewUrl(imageUrl);
      return;
    }

    setPreviewUrl("");
  }, [file, imageUrl]);

  const hasImage = Boolean(previewUrl);

  return (
    <section className={`prohex-card p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>

        {hasImage && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            Hapus
          </button>
        )}
      </div>

      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        {hasImage ? (
          <img
            src={previewUrl}
            alt="Preview foto"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
                <path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="m21 16-5.5-5.5L5 21" />
              </svg>
            </div>

            <p className="text-sm leading-6 text-slate-500">{emptyText}</p>
          </div>
        )}
      </div>

      {showInfo && file && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Informasi File
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Nama</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-200">
                {file.name}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Ukuran</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {formatFileSize(file.size)}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Tipe</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-200">
                {file.type || "Tidak diketahui"}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Last Modified</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {new Date(file.lastModified).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      )}

      {showInfo && !file && imageUrl && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            URL Gambar
          </p>

          <p className="mt-2 break-all text-sm text-cyan-300">{imageUrl}</p>
        </div>
      )}
    </section>
  );
}