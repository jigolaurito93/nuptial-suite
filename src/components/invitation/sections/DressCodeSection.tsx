import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function DressCodeSection() {
  return (
    <section id="dress-code" className="invitation-section px-6 py-24">
      <SectionHeading
        eyebrow="Attire"
        title={invitation.dressCode.title}
        description={invitation.dressCode.description}
      />
      <ul className="mx-auto mt-10 max-w-md space-y-3 text-center text-sm text-muted">
        {invitation.dressCode.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
