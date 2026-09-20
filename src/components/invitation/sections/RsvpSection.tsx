import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import { RsvpForm } from "@/components/invitation/RsvpForm";
import type { PublicInvite } from "@/types";

type RsvpSectionProps = {
  invite?: PublicInvite | null;
  inviteCode?: string | null;
  loading?: boolean;
  onSuccess?: () => void;
};

export function RsvpSection({
  invite,
  inviteCode,
  loading = false,
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
        {loading ? (
          <p className="mx-auto max-w-lg text-center text-sm text-muted">
            Loading your invitation…
          </p>
        ) : (
          <RsvpForm
            key={inviteCode ?? "anonymous"}
            invite={invite}
            inviteCode={inviteCode}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </section>
  );
}
