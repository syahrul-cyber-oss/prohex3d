"use client";

type GenerateStep = {
  key: string;
  label: string;
  description?: string;
};

type GenerateStatusProps = {
  status?: string;
  error?: string;
  loading?: boolean;
  currentStep?: string;
  steps?: GenerateStep[];
  className?: string;
};

const defaultSteps: GenerateStep[] = [
  {
    key: "idle",
    label: "Menunggu Foto",
    description: "Pilih foto sebelum proses dimulai.",
  },
  {
    key: "uploading",
    label: "Upload Foto",
    description: "Foto dikirim ke backend.",
  },
  {
    key: "generating",
    label: "Generate 3D",
    description: "Backend membuat file model 3D.",
  },
  {
    key: "completed",
    label: "Selesai",
    description: "Model 3D berhasil dibuat.",
  },
];

function getStatusText(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "idle") return "Idle";
  if (normalized === "uploading") return "Uploading";
  if (normalized === "generating") return "Generating";
  if (normalized === "processing") return "Processing";
  if (normalized === "completed") return "Completed";
  if (normalized === "failed") return "Failed";
  if (normalized === "error") return "Error";

  return status;
}

function getStepIndex(steps: GenerateStep[], currentStep: string) {
  const index = steps.findIndex((step) => step.key === currentStep);

  if (index < 0) {
    return 0;
  }

  return index;
}

export default function GenerateStatus({
  status = "idle",
  error = "",
  loading = false,
  currentStep = "idle",
  steps = defaultSteps,
  className = "",
}: GenerateStatusProps) {
  const activeIndex = getStepIndex(steps, currentStep);
  const isError = Boolean(error) || status === "failed" || status === "error";
  const statusText = getStatusText(status);

  return (
    <section className={`prohex-card p-5 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Generate Status
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">{statusText}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            Pantau proses upload foto sampai model 3D selesai dibuat.
          </p>
        </div>

        <div
          className={[
            "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-bold",
            isError
              ? "border border-red-400/30 bg-red-500/10 text-red-200"
              : status === "completed"
              ? "border border-green-400/30 bg-green-500/10 text-green-200"
              : "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
          ].join(" ")}
        >
          {loading && !isError && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200" />
          )}

          {statusText}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {steps.map((step, index) => {
          const isDone = index < activeIndex || status === "completed";
          const isActive = index === activeIndex && !isError;
          const isPending = index > activeIndex && status !== "completed";

          return (
            <div
              key={step.key}
              className={[
                "flex gap-4 rounded-2xl border p-4 transition",
                isDone
                  ? "border-green-400/30 bg-green-500/10"
                  : isActive
                  ? "border-cyan-400/40 bg-cyan-400/10"
                  : isError && index === activeIndex
                  ? "border-red-400/30 bg-red-500/10"
                  : "border-white/10 bg-black/25",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                  isDone
                    ? "border-green-400/40 bg-green-400/20 text-green-200"
                    : isActive
                    ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-200"
                    : isError && index === activeIndex
                    ? "border-red-400/40 bg-red-400/20 text-red-200"
                    : "border-white/10 bg-white/5 text-slate-500",
                ].join(" ")}
              >
                {isDone ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : isError && index === activeIndex ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 8v5" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
                  </svg>
                ) : isActive && loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={[
                    "font-bold",
                    isDone
                      ? "text-green-200"
                      : isActive
                      ? "text-cyan-200"
                      : isError && index === activeIndex
                      ? "text-red-200"
                      : "text-slate-300",
                  ].join(" ")}
                >
                  {step.label}
                </p>

                {step.description && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                )}

                {isPending && (
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-600">
                    Pending
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}