import Image from "next/image";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function DressCodeSection() {
  return (
    <section id="dress-code" className="invitation-section px-6 py-24">
      <SectionHeading
        eyebrow="Attire"
        title={invitation.dressCode.title}
        description={invitation.dressCode.description}
      />

      <ul className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-5">
        {invitation.dressCode.palette.map((swatch) => (
          <li
            key={swatch.name}
            className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase"
          >
            <span
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: swatch.hex }}
              aria-hidden
            />
            {swatch.name}
          </li>
        ))}
      </ul>

      <OutfitGroup heading="Gentlemen" looks={invitation.dressCode.gentlemen} />
      <OutfitGroup heading="Ladies" looks={invitation.dressCode.ladies} />

      <ul className="mx-auto mt-16 max-w-md space-y-3 text-center text-sm text-muted">
        {invitation.dressCode.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}

type OutfitLook =
  | (typeof invitation.dressCode.gentlemen)[number]
  | (typeof invitation.dressCode.ladies)[number];

function OutfitGroup({
  heading,
  looks,
}: {
  heading: string;
  looks: readonly OutfitLook[];
}) {
  return (
    <div className="mx-auto mt-16 max-w-5xl">
      <h3 className="text-center text-xs tracking-[0.22em] text-accent uppercase">
        {heading}
      </h3>
      <ul className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {looks.map((look) => (
          <li key={look.title} className="text-center">
            <div className="relative mb-4 aspect-3/4 overflow-hidden bg-accent-soft">
              <Image
                src={look.image.src}
                alt={look.image.alt}
                fill
                sizes="(max-width: 640px) 100vw, 20rem"
                className="object-cover"
              />
            </div>
            <p className="font-display text-2xl font-medium">{look.title}</p>
            <p className="mt-2 text-sm text-muted">{look.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
