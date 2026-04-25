"use client";

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

export default function HomePage() {
  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }, []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<UploadData | null>(null);
  const [generatedModel, setGeneratedModel] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("Idle");
  const [error, setError] = useState<string>("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setUploadedImage(null);
    setGeneratedModel(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Format gambar harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Ukuran gambar maksimal 10 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatusText("Foto siap diupload");
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
      setStatusText("Mengupload foto...");

      const uploadResult = await uploadImage();
      setUploadedImage(uploadResult);

      setStatusText("Membuat model 3D...");
      const modelResult = await generateModel(uploadResult.filename);
      setGeneratedModel(modelResult);

      setStatusText("Selesai");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
      setStatusText("Gagal");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadedImage(null);
    setGeneratedModel(null);
    setError("");
    setStatusText("Idle");
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
        <header className="mb-8 flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">
            ProHex3D
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
                Ubah foto menjadi model 3D
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Upload gambar, kirim ke backend, lalu backend membuat file model
                3D demo dalam format GLB.
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
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Upload foto
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-5 py-10 text-center transition hover:bg-cyan-400/10">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />

                  <span className="text-lg font-semibold">
                    Pilih gambar objek
                  </span>

                  <span className="mt-2 text-sm text-slate-400">
                    Format JPG, PNG, WEBP. Maksimal 10 MB.
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-400">File dipilih</p>
                  <p className="mt-1 break-all font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {loading ? "Memproses..." : "Generate 3D Model"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-slate-300">
                  Backend URL
                </p>
                <p className="mt-2 break-all text-sm text-cyan-300">
                  {apiBaseUrl}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-slate-300">
                  Endpoint aktif
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  /api/upload dan /api/generate
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
              <h2 className="text-xl font-semibold">Preview Foto</h2>

              <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview upload"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="px-6 text-center text-sm text-slate-500">
                    Belum ada foto yang dipilih.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
              <h2 className="text-xl font-semibold">Hasil Model</h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                {generatedModel?.outputModel ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-slate-400">Model berhasil dibuat</p>

                    <p className="break-all text-sm font-medium text-cyan-300">
                      {generatedModel.outputModel.filename}
                    </p>

                    <a
                      href={generatedModel.outputModel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Buka File GLB
                    </a>

                    <a
                      href={generatedModel.outputModel.downloadUrl}
                      className="rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Download GLB
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Hasil model 3D akan muncul setelah proses generate selesai.
                  </p>
                )}
              </div>
            </div>

            {(uploadedImage || generatedModel) && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-semibold">Data Response</h2>

                <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-slate-300">
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