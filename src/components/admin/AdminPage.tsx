import { AdminNav } from "@/components/admin/AdminNav";
import { PlaceholderSection } from "@/components/ui";

export function AdminPage() {
  return (
    <>
      <AdminNav />
      <main className="flex-1 [&>section:first-child]:border-t-0">
        <PlaceholderSection
          id="overview"
          heading="h1"
          title="Wedding planner"
          description="Private workspace for the bride and groom. Upcoming tasks, RSVP counts, and budget snapshot will live here."
        />
        <PlaceholderSection
          id="guests"
          title="Guests"
          description="Guest list, plus-ones, and meal choices. CRUD will be added after the data model is in place."
        />
        <PlaceholderSection
          id="budget"
          title="Budget"
          description="Categories, estimates, and actual spend. Placeholder only for this scaffold."
        />
        <PlaceholderSection
          id="vendors"
          title="Vendors"
          description="Venue, catering, photo, and other vendor contacts. Not wired up yet."
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
    </>
  );
}
