type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs tracking-[0.28em] text-accent uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display mt-3 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
