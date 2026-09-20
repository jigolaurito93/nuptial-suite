import { GuestsSection } from "@/components/admin/GuestsSection";
import { HouseholdsSection } from "@/components/admin/HouseholdsSection";
import { MessagesSection } from "@/components/admin/MessagesSection";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import { PlaceholderSection } from "@/components/ui";
import { invitation } from "@/content/invitation";

export function AdminPage() {
  return (
    <main className="flex-1">
      <section id="overview" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <AdminSectionHeading
            heading="h1"
            eyebrow="Planner"
            title={invitation.couple.displayNames}
          />
          <p className="mt-3 text-[0.7rem] tracking-[0.2em] text-muted uppercase">
            {invitation.weddingDateLabel}
            {" · "}
            {invitation.venues.ceremony.address}
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Private workspace for households, guests, vendors, and notes from
            the invitation.
          </p>
        </div>
      </section>
      <HouseholdsSection />
      <GuestsSection />
      <MessagesSection />
      <PlaceholderSection
        id="budget"
        title="Budget"
        description="Categories, estimates, and actual spend will live here in a later phase."
      />
      <PlaceholderSection
        id="tasks"
        title="Tasks"
        description="A wedding planning checklist for the couple will be stored in Supabase later."
      />
      <PlaceholderSection
        id="invitation"
        title="Invitation editor"
        description="Edit public invitation copy, schedule, and venue details from here in a later phase."
      />
    </main>
  );
}
