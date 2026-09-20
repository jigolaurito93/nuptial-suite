import { GuestsSection } from "@/components/admin/GuestsSection";
import { HouseholdsSection } from "@/components/admin/HouseholdsSection";
import { MessagesSection } from "@/components/admin/MessagesSection";
import { PlaceholderSection } from "@/components/ui";

export function AdminPage() {
  return (
    <main className="flex-1 [&>section:first-child]:border-t-0">
      <PlaceholderSection
        id="overview"
        heading="h1"
        title="Wedding planner"
        description="Private workspace for the bride and groom. Upcoming tasks, RSVP counts, and budget snapshot will live here."
      />
      <HouseholdsSection />
      <GuestsSection />
      <MessagesSection />
      <PlaceholderSection
        id="budget"
        title="Budget"
        description="Categories, estimates, and actual spend. Placeholder only for this scaffold."
      />
      <PlaceholderSection
        id="tasks"
        title="Tasks"
        description="Wedding planning checklist for the couple. Tasks will be stored in Supabase later."
      />
      <PlaceholderSection
        id="invitation"
        title="Invitation editor"
        description="Edit public invitation copy, schedule, and venue details from here in a later phase."
      />
    </main>
  );
}
