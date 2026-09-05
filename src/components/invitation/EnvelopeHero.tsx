"use client";

type EnvelopeHeroProps = {
  isOpening: boolean;
  onOpen: () => void;
  eyebrow: string;
  names: string;
  hint: string;
};

export function EnvelopeHero({
  isOpening,
  onOpen,
  eyebrow,
  names,
  hint,
}: EnvelopeHeroProps) {
  return (
    <section
      aria-label="Open invitation"
      className="relative z-20 flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <div className="motion-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <p className="text-xs tracking-[0.28em] text-muted uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-4 text-5xl font-medium tracking-tight text-foreground sm:text-6xl md:text-7xl">
          {names}
        </h1>

        <button
          type="button"
          className={`envelope mt-12 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
            isOpening ? "is-open" : ""
          }`}
          onClick={onOpen}
          aria-label="Open the invitation envelope"
          disabled={isOpening}
        >
          <div className="envelope-body" />
          <div className="envelope-flap" />
          <div className="envelope-pocket" />
          <div className="envelope-seal" aria-hidden />
        </button>

        <p className="mt-8 text-sm text-muted">{hint}</p>
      </div>
    </section>
  );
}
