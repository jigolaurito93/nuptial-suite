type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  compact?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  compact = false,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p
          className={
            compact
              ? "text-[0.65rem] tracking-[0.28em] text-accent uppercase sm:text-xs"
              : "text-xs tracking-[0.28em] text-accent uppercase"
          }
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={
          compact
            ? "font-display mt-1 text-xl font-medium tracking-tight text-foreground sm:mt-3 sm:text-4xl lg:text-5xl"
            : "font-display mt-3 text-4xl font-medium tracking-tight text-foreground sm:text-5xl"
        }
      >
        {title}
      </h2>
      {description ? (
        <p
          className={
            compact
              ? "mt-1 text-xs leading-relaxed text-muted sm:mt-4 sm:text-base"
              : "mt-4 text-base leading-relaxed text-muted"
          }
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
