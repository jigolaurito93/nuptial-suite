"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type AdminModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function AdminModal({ open, title, onClose, children }: AdminModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-navy/35"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-border bg-surface px-6 py-6 shadow-[0_24px_60px_-28px_rgba(12,26,50,0.35)] outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h3
            id={titleId}
            className="font-display text-2xl font-medium tracking-tight text-foreground"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-accent"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
