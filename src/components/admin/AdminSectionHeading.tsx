type AdminSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  heading?: "h1" | "h2";
};

export function AdminSectionHeading({
  eyebrow,
  title,
  description,
  heading: Heading = "h2",
}: AdminSectionHeadingProps) {
  return (
    <header>
      <p className="text-[0.7rem] tracking-[0.28em] text-accent uppercase">
        {eyebrow}
      </p>
      <Heading className="font-display mt-2 text-4xl font-medium tracking-tight text-foreground">
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}
