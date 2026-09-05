type PlaceholderSectionProps = {
  id?: string;
  title: string;
  description: string;
  heading?: "h1" | "h2";
};

export function PlaceholderSection({
  id,
  title,
  description,
  heading: Heading = "h2",
}: PlaceholderSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">Placeholder</p>
        <Heading className="mt-2 text-3xl font-semibold tracking-tight">{title}</Heading>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </section>
  );
}
