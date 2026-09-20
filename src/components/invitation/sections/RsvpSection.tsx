import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import { RsvpForm } from "@/components/invitation/RsvpForm";
import type { PublicInvite } from "@/types";

type RsvpSectionProps = {
  invite: PublicInvite;
  inviteCode: string;
  onSuccess?: () => void;
};

export function RsvpSection({
  invite,
  inviteCode,
  onSuccess,
}: RsvpSectionProps) {
  return (
    <section
      id="rsvp"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading
        eyebrow="Kindly reply"
        title="RSVP"
        description={`Let us know if you will join us. Please respond by ${invitation.rsvpByLabel}.`}
      />
      <div className="mt-14">
        <RsvpForm
          key={inviteCode}
          invite={invite}
          inviteCode={inviteCode}
          onSuccess={onSuccess}
        />
      </div>
    </section>
  );
}
