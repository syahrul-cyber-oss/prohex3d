"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type UploadData = {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  sizeMB: number;
  url: string;
  path: string;
  uploadedAt: string;
};

type ModelData = {
  id: string;
  status: string;
  provider: string;
  inputImage: {
    filename: string;
    path: string;
    url: string;
  };
  outputModel: {
    filename: string;
    path: string;
    url: string;
    downloadUrl: string;
  } | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

export default function UploadPage() {
  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }, []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<UploadData | null>(null);
  const [generatedModel, setGeneratedModel] = useState<ModelData | null>(null);
  const [statusText, setStatusText] = useState<string>("Menunggu foto");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setUploadedImage(null);
    setGeneratedModel(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      setStatusText("Menunggu foto");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setPreviewUrl("");
      setStatusText("File ditolak");
      setError("Format file harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedFile(null);
      setPreviewUrl("");
      setStatusText("File terlalu besar");
      setError("Ukuran foto maksimal 10 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setStatusText("Foto siap diproses");
  }

  async function uploadImage(): Promise<UploadData> {
    if (!selectedFile) {
      throw new Error("Pilih foto dulu.");
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch(`${apiBaseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const result: ApiResponse<UploadData> = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Upload foto gagal.");
    }

    return result.data;
  }

  async function generateModel(filename: string): Promise<ModelData> {
    const response = await fetch(`${apiBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    const result: ApiResponse<ModelData> = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Generate model 3D gagal.");
    }

    return result.data;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Pilih foto dulu.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setUploadedImage(null);
      setGeneratedModel(null);

      setStatusText("Mengupload foto...");
      const uploadResult = await uploadImage();
      setUploadedImage(uploadResult);

      setStatusText("Membuat model 3D...");
      const modelResult = await generateModel(uploadResult.filename);
      setGeneratedModel(modelResult);

      setStatusText("Selesai");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
      setStatusText("Gagal");
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadedImage(null);
    setGeneratedModel(null);
    setError("");
    setStatusText("Menunggu foto");
  }

  return (
    <main className="prohex-bg prohex-grid min-h-screen text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-5 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Kembali
            </Link>

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Upload
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              Upload foto untuk dibuat model 3D
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Pilih satu foto objek. Backend akan menerima file, menyimpannya,
              lalu membuat hasil GLB demo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Status
            </p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">
              {statusText}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="prohex-card p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Foto objek
                </label>

                <label className="flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-5 py-10 text-center transition hover:bg-cyan-400/10">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />

                  <span className="text-xl font-bold text-white">
                    Klik untuk memilih foto
                  </span>

                  <span className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Gunakan foto objek yang jelas. Format JPG, PNG, atau WEBP.
                    Ukuran maksimal 10 MB.
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm text-slate-400">File dipilih</p>

                  <p className="mt-1 break-all text-base font-semibold text-white">
                    {selectedFile.name}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs text-slate-500">Ukuran</p>
                      <p className="mt-1 text-sm text-slate-200">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs text-slate-500">Tipe</p>
                      <p className="mt-1 text-sm text-slate-200">
                        {selectedFile.type}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {loading ? "Memproses..." : "Upload dan Generate"}
                </button>

                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={loading}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-medium text-slate-300">Backend</p>
              <p className="mt-2 break-all text-sm text-cyan-300">
                {apiBaseUrl}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="prohex-card p-5">
              <h2 className="text-xl font-bold">Preview Foto</h2>

              <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview foto"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="px-6 text-center text-sm text-slate-500">
                    Preview foto akan tampil di sini.
                  </p>
                )}
              </div>
            </div>

            <div className="prohex-card p-5">
              <h2 className="text-xl font-bold">Hasil Generate</h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                {generatedModel?.outputModel ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Model ID</p>
                      <p className="mt-1 break-all text-sm font-semibold text-cyan-300">
                        {generatedModel.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">File GLB</p>
                      <p className="mt-1 break-all text-sm font-semibold text-white">
                        {generatedModel.outputModel.filename}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        href={generatedModel.outputModel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:bg-white/10"
                      >
                        Buka GLB
                      </a>

                      <a
                        href={generatedModel.outputModel.downloadUrl}
                        className="rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Download
                      </a>
                    </div>

                    <Link
                      href={`/result/${generatedModel.id}`}
                      className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-center text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
                    >
                      Lihat Halaman Result
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    Hasil model akan muncul setelah upload dan generate selesai.
                  </p>
                )}
              </div>
            </div>

            {(uploadedImage || generatedModel) && (
              <div className="prohex-card p-5">
                <h2 className="text-xl font-bold">Response Backend</h2>

                <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-5 text-slate-300">
                  {JSON.stringify(
                    {
                      uploadedImage,
                      generatedModel,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}