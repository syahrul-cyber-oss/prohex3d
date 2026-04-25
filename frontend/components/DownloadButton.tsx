"use client";

type DownloadButtonProps = {
  url?: string;
  filename?: string;
  text?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
  className?: string;
};

export default function DownloadButton({
  url = "",
  filename = "",
  text = "Download",
  disabled = false,
  fullWidth = false,
  variant = "primary",
  className = "",
}: DownloadButtonProps) {
  const isDisabled = disabled || !url;

  const baseClass =
    "inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold transition";

  const widthClass = fullWidth ? "w-full" : "";

  const variantClass =
    variant === "outline"
      ? "border border-white/10 text-slate-200 hover:bg-white/10"
      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300";

  const disabledClass =
    "pointer-events-none cursor-not-allowed bg-slate-700 text-slate-400 hover:bg-slate-700";

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        className={[
          baseClass,
          widthClass,
          disabledClass,
          className,
        ].join(" ")}
      >
        <DownloadIcon />
        <span>{text}</span>
      </button>
    );
  }

  return (
    <a
      href={url}
      download={filename || undefined}
      className={[
        baseClass,
        widthClass,
        variantClass,
        className,
      ].join(" ")}
    >
      <DownloadIcon />
      <span>{text}</span>
    </a>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}