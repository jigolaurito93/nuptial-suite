import { SectionHeading } from "@/components/invitation/SectionHeading";
import { RsvpForm } from "@/components/invitation/RsvpForm";

export function RsvpSection() {
  return (
    <section
      id="rsvp"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading
        eyebrow="Kindly reply"
        title="RSVP"
        description="Let us know if you will join us. Please respond by 20 May 2027."
      />
      <div className="mt-14">
        <RsvpForm />
      </div>
    </section>
  );
}
