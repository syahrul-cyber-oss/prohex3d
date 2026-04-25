"use client";

type GenerateButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  loadingText?: string;
  fullWidth?: boolean;
  onClick?: () => void;
};

export default function GenerateButton({
  loading = false,
  disabled = false,
  text = "Generate 3D Model",
  loadingText = "Memproses...",
  fullWidth = false,
  onClick,
}: GenerateButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
        fullWidth ? "w-full" : "",
      ].join(" ")}
    >
      {loading && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950 disabled:border-slate-400/30" />
      )}

      <span>{loading ? loadingText : text}</span>
    </button>
  );
}