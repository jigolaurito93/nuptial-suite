import Link from "next/link";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function SeeYouThereSection() {
  return (
    <section
      id="see-you-there"
      className="invitation-section border-t border-border px-6 py-28"
    >
      <SectionHeading
        title={invitation.seeYouThere.title}
        description={invitation.seeYouThere.message}
      />
      <p className="font-display mt-10 text-center text-3xl text-foreground">
        {invitation.couple.displayNames}
      </p>
      <p className="mt-3 text-center text-sm tracking-[0.18em] text-muted uppercase">
        {invitation.weddingDateLabel}
      </p>
    </section>
  );
}

export function InvitationFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
      <p>
        {invitation.couple.displayNames} ·{" "}
        {new Date(invitation.weddingDate).getFullYear()}
      </p>
      <Link
        href="/login"
        className="mt-3 inline-block text-xs tracking-wide underline underline-offset-4 opacity-60 hover:opacity-100"
      >
        Couple login
      </Link>
    </footer>
  );
}
