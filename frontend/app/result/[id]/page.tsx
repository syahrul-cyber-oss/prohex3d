"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";

type ModelOutput = {
  filename: string;
  path: string;
  url: string;
  downloadUrl: string;
  size?: number;
  sizeMB?: number;
  ext?: string;
  createdAt?: string;
  updatedAt?: string;
};

type GeneratedModel = {
  id: string;
  status: string;
  provider: string;
  inputImage: {
    filename: string;
    path: string;
    url: string;
  } | null;
  outputModel: ModelOutput | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

function LoadingBox() {
  return (
    <Html center>
      <div className="rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-slate-200">
        Loading model...
      </div>
    </Html>
  );
}

function ModelScene({ url }: { url: string }) {
  const gltf = useGLTF(url);

  return (
    <Bounds fit clip observe margin={1.2}>
      <primitive object={gltf.scene} />
    </Bounds>
  );
}

export default function ResultDetailPage() {
  const params = useParams();

  const id = useMemo(() => {
    const rawId = params?.id;

    if (Array.isArray(rawId)) {
      return rawId[0] || "";
    }

    return rawId || "";
  }, [params]);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }, []);

  const [model, setModel] = useState<GeneratedModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  async function fetchModel() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${apiBaseUrl}/api/generate/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<GeneratedModel> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Data model tidak ditemukan.");
      }

      setModel(result.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengambil data model.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchModel();
    }
  }, [id]);

  const modelUrl = model?.outputModel?.url || "";
  const downloadUrl = model?.outputModel?.downloadUrl || "";

  return (
    <main className="prohex-bg prohex-grid min-h-screen text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Home
              </Link>

              <Link
                href="/upload"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Upload Lagi
              </Link>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Result
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              Detail model 3D
            </h1>

            <p className="mt-3 max-w-2xl break-all text-sm leading-6 text-slate-300 md:text-base">
              ID: {id}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Status
            </p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">
              {loading ? "Loading" : model?.status || "Unknown"}
            </p>
          </div>
        </header>

        {loading && (
          <div className="prohex-card flex min-h-80 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="prohex-loader" />
              <p className="text-sm text-slate-400">Mengambil data model...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="prohex-card p-6">
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
              <h2 className="text-xl font-bold text-red-200">
                Data tidak bisa dibuka
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-100">{error}</p>

              <button
                type="button"
                onClick={fetchModel}
                className="mt-5 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {!loading && !error && model && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="prohex-card overflow-hidden p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview 3D</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Rotate, zoom, dan pan model di area preview.
                  </p>
                </div>

                {modelUrl && (
                  <a
                    href={modelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 px-4 py-2 text-center text-sm font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    Buka File
                  </a>
                )}
              </div>

              <div className="h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                {modelUrl ? (
                  <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[5, 5, 5]} intensity={1.5} />

                    <Suspense fallback={<LoadingBox />}>
                      <ModelScene url={modelUrl} />
                      <Environment preset="city" />
                    </Suspense>

                    <OrbitControls
                      enableDamping
                      dampingFactor={0.08}
                      makeDefault
                    />
                  </Canvas>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
                    Model belum tersedia.
                  </div>
                )}
              </div>

              {model.provider === "demo" && (
                <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                  Mode saat ini masih demo. File GLB bisa kosong, jadi preview
                  3D mungkin tidak menampilkan bentuk objek asli.
                </div>
              )}
            </section>

            <section className="flex flex-col gap-6">
              <div className="prohex-card p-5">
                <h2 className="text-xl font-bold">Informasi Model</h2>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Model ID
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-cyan-300">
                      {model.id}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Provider
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      {model.provider}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      {model.status}
                    </p>
                  </div>

                  {model.outputModel && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        File Model
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-slate-200">
                        {model.outputModel.filename}
                      </p>
                    </div>
                  )}
                </div>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    className="mt-5 block rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Download GLB
                  </a>
                )}
              </div>

              <div className="prohex-card p-5">
                <h2 className="text-xl font-bold">Foto Input</h2>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {model.inputImage?.url ? (
                    <img
                      src={model.inputImage.url}
                      alt="Foto input"
                      className="aspect-square h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center px-6 text-center text-sm text-slate-500">
                      Foto input tidak tersedia.
                    </div>
                  )}
                </div>

                {model.inputImage?.filename && (
                  <p className="mt-3 break-all text-sm text-slate-400">
                    {model.inputImage.filename}
                  </p>
                )}
              </div>

              <div className="prohex-card p-5">
                <h2 className="text-xl font-bold">Response JSON</h2>

                <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-5 text-slate-300">
                  {JSON.stringify(model, null, 2)}
                </pre>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}