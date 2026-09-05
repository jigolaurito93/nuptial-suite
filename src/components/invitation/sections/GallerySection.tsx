import Image from "next/image";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function GallerySection() {
  return (
    <section
      id="gallery"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading eyebrow="Moments" title="Gallery" />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {invitation.gallery.map((image) => (
          <div
            key={image.src}
            className="relative aspect-square overflow-hidden bg-accent-soft"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
