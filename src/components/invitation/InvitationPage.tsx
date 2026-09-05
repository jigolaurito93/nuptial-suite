import Link from "next/link";
import { InvitationNav } from "@/components/invitation/InvitationNav";
import { PlaceholderSection } from "@/components/ui";

export function InvitationPage() {
  return (
    <>
      <InvitationNav />
      <main className="flex-1 [&>section:first-child]:border-t-0">
        <PlaceholderSection
          id="home"
          heading="h1"
          title="Wedding invitation"
          description="Public home for the couple's wedding website. Hero, countdown, and welcome copy will live here."
        />
        <PlaceholderSection
          id="story"
          title="Our story"
          description="How the couple met and the path to the wedding. Content will be editable from the admin page later."
        />
        <PlaceholderSection
          id="schedule"
          title="Schedule"
          description="Ceremony, reception, and other event times for guests. Details will be filled in later."
        />
        <PlaceholderSection
          id="venue"
          title="Venue"
          description="Location details and a Google Map will appear here once the Maps integration is wired up."
        />
        <PlaceholderSection
          id="rsvp"
          title="RSVP"
          description="Guests will confirm attendance here. The form and /api/rsvp handler are stubs for now."
        />
        <PlaceholderSection
          id="registry"
          title="Registry"
          description="Gift registry links and notes for guests. Nothing is connected yet."
        />
      </main>
      <footer className="border-t border-zinc-200 px-6 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        <Link href="/login" className="underline underline-offset-4">
          Couple login
        </Link>
      </footer>
    </>
  );
}
