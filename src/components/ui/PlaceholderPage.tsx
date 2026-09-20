import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <AdminSectionHeading
        heading="h1"
        eyebrow="Coming later"
        title={title}
        description={description}
      />
    </section>
  );
}
