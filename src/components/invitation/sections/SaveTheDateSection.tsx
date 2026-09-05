import Image from "next/image";
import { invitation } from "@/content/invitation";

export function SaveTheDateSection() {
  return (
    <section
      id="save-the-date"
      className="invitation-section relative overflow-hidden px-6 py-24 sm:py-32"
    >
      <div className="motion-orbs opacity-40" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs tracking-[0.28em] text-accent uppercase">
          {invitation.saveTheDateEyebrow}
        </p>
        <h1 className="font-display mt-4 text-5xl font-medium tracking-tight sm:text-7xl">
          {invitation.couple.displayNames}
        </h1>
        <p className="mt-6 text-sm tracking-[0.18em] text-muted uppercase">
          {invitation.weddingDateLabel}
        </p>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          {invitation.message}
        </p>
        <div className="relative mt-12 aspect-[4/5] w-full max-w-md overflow-hidden">
          <Image
            src={invitation.heroImage.src}
            alt={invitation.heroImage.alt}
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 28rem"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
