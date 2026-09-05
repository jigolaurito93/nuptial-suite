import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function ProgramSection() {
  return (
    <section id="program" className="invitation-section px-6 py-24">
      <SectionHeading eyebrow="Timeline" title="Program flow" />
      <ol className="mx-auto mt-14 max-w-2xl space-y-0">
        {invitation.program.map((item) => (
          <li
            key={`${item.time}-${item.title}`}
            className="grid grid-cols-[6.5rem_1fr] gap-6 border-t border-border py-6 first:border-t-0"
          >
            <p className="text-sm tracking-wide text-accent tabular-nums">
              {item.time}
            </p>
            <div>
              <p className="font-display text-2xl font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
