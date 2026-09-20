import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import {
  adminSectionClassName,
  adminSectionInnerClassName,
} from "@/components/admin/formStyles";

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
  heading = "h2",
}: PlaceholderSectionProps) {
  return (
    <section id={id} className={adminSectionClassName}>
      <div className={adminSectionInnerClassName}>
        <AdminSectionHeading
          heading={heading}
          eyebrow="Coming later"
          title={title}
          description={description}
        />
      </div>
    </section>
  );
}
