type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-sm tracking-wide text-zinc-500 uppercase">Placeholder</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">{description}</p>
    </section>
  );
}
