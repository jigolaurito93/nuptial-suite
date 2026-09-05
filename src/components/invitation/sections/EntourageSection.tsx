import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function EntourageSection() {
  return (
    <section
      id="entourage"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading
        eyebrow="With us"
        title="Entourage"
        description="The people standing beside us on our wedding day."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-14 sm:grid-cols-2">
        {invitation.entourage.map((group) => (
          <div key={group.group} className="text-center">
            <h3 className="text-xs tracking-[0.22em] text-accent uppercase">
              {group.group}
            </h3>
            <ul className="mt-4 space-y-2">
              {group.people.map((person) => (
                <li
                  key={person}
                  className="font-display text-xl text-foreground"
                >
                  {person}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
