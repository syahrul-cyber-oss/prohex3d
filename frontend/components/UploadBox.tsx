"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type UploadBoxProps = {
  disabled?: boolean;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onError?: (message: string) => void;
};

export default function UploadBox({
  disabled = false,
  maxSizeMB = 10,
  onFileSelect,
  onError,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  function showError(message: string) {
    if (onError) {
      onError(message);
    }
  }

  function formatSize(size: number) {
    const mb = size / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  function validateFile(file: File) {
    if (!allowedTypes.includes(file.type)) {
      return "Format gambar harus JPG, JPEG, PNG, atau WEBP.";
    }

    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      return `Ukuran gambar maksimal ${maxSizeMB} MB.`;
    }

    return "";
  }

  function handleSelectedFile(file: File) {
    const errorMessage = validateFile(file);

    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setFileSize(formatSize(file.size));

    onFileSelect(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) {
      return;
    }

    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    handleSelectedFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      setDragActive(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  }

  function openFilePicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function removeFile() {
    if (disabled) {
      return;
    }

    setPreviewUrl("");
    setFileName("");
    setFileSize("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="w-full">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed px-5 py-8 text-center transition",
          dragActive
            ? "border-cyan-300 bg-cyan-400/15"
            : "border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img
                src={previewUrl}
                alt="Preview upload"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                File dipilih
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-white">
                {fileName}
              </p>

              <p className="mt-1 text-sm text-slate-400">{fileSize}</p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                Ganti Foto
              </button>

              <button
                type="button"
                onClick={removeFile}
                disabled={disabled}
                className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                Hapus Foto
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-cyan-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M20 16.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5" />
              </svg>
            </div>

            <p className="text-xl font-bold text-white">
              Klik atau drag foto ke sini
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Gunakan foto objek yang jelas. Format JPG, JPEG, PNG, atau WEBP.
              Ukuran maksimal {maxSizeMB} MB.
            </p>

            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Pilih Foto
            </button>
          </div>
        )}
      </label>
    </div>
  );
}