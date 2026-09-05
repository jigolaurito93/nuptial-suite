"use client";

type AudioControlProps = {
  muted: boolean;
  onToggle: () => void;
  visible: boolean;
};

export function AudioControl({ muted, onToggle, visible }: AudioControlProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed right-4 bottom-4 z-40 rounded-full border border-border bg-surface/90 px-4 py-2 text-xs tracking-wide text-foreground shadow-sm backdrop-blur transition hover:border-accent hover:text-accent"
      aria-pressed={!muted}
      aria-label={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? "Music off" : "Music on"}
    </button>
  );
}
