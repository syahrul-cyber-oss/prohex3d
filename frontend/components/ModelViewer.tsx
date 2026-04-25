"use client";

import {
  Component,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

type ModelViewerProps = {
  modelUrl?: string;
  downloadUrl?: string;
  filename?: string;
  title?: string;
  description?: string;
  emptyText?: string;
  height?: number | string;
  className?: string;
  autoRotate?: boolean;
  showActions?: boolean;
  showInfo?: boolean;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

function LoadingModel() {
  return (
    <Html center>
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-sm font-semibold text-slate-200">
        Loading model...
      </div>
    </Html>
  );
}

function EmptyModelBox({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-slate-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 4 7l8 4 8-4-8-4Z" />
          <path d="M4 7v10l8 4 8-4V7" />
          <path d="M12 11v10" />
        </svg>
      </div>

      <p className="max-w-md text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function ErrorModelBox() {
  return (
    <Html center>
      <div className="max-w-xs rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-center text-sm leading-6 text-red-100">
        Model gagal dimuat. Pastikan file GLB valid dan URL bisa diakses.
      </div>
    </Html>
  );
}

class ModelErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function LoadedModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  return (
    <Bounds fit clip observe margin={1.2}>
      <primitive object={gltf.scene} />
    </Bounds>
  );
}

export default function ModelViewer({
  modelUrl = "",
  downloadUrl = "",
  filename = "",
  title = "Preview Model 3D",
  description = "Rotate, zoom, dan pan model di area preview.",
  emptyText = "Model 3D belum tersedia.",
  height = 520,
  className = "",
  autoRotate = false,
  showActions = true,
  showInfo = true,
}: ModelViewerProps) {
  const [viewerKey, setViewerKey] = useState<number>(0);

  const hasModel = Boolean(modelUrl);

  const viewerHeight = useMemo(() => {
    if (typeof height === "number") {
      return `${height}px`;
    }

    return height;
  }, [height]);

  useEffect(() => {
    setViewerKey((prev) => prev + 1);
  }, [modelUrl]);

  return (
    <section className={`prohex-card overflow-hidden p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>

        {showActions && hasModel && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={modelUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-4 py-2 text-center text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Buka File
            </a>

            {downloadUrl && (
              <a
                href={downloadUrl}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Download
              </a>
            )}
          </div>
        )}
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-white/10 bg-black/40"
        style={{
          height: viewerHeight,
        }}
      >
        {hasModel ? (
          <Canvas
            camera={{
              position: [3, 2, 4],
              fov: 45,
            }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />

            <Suspense fallback={<LoadingModel />}>
              <ModelErrorBoundary fallback={<ErrorModelBox />}>
                <LoadedModel key={viewerKey} url={modelUrl} />
                <Environment preset="city" />
              </ModelErrorBoundary>
            </Suspense>

            <OrbitControls
              enableDamping
              dampingFactor={0.08}
              autoRotate={autoRotate}
              autoRotateSpeed={1.2}
              enableZoom
              enablePan
              makeDefault
            />
          </Canvas>
        ) : (
          <EmptyModelBox text={emptyText} />
        )}
      </div>

      {showInfo && hasModel && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Informasi Model
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Filename</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-200">
                {filename || "Tidak tersedia"}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Format</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {filename.toLowerCase().endsWith(".glb")
                  ? "GLB"
                  : "Model 3D"}
              </p>
            </div>
          </div>

          <p className="mt-3 break-all text-sm leading-6 text-cyan-300">
            {modelUrl}
          </p>
        </div>
      )}
    </section>
  );
}