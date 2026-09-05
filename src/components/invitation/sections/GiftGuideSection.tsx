import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import { BankQr } from "@/components/invitation/BankQr";

export function GiftGuideSection() {
  return (
    <section id="gift-guide" className="invitation-section px-6 py-24">
      <SectionHeading
        eyebrow="With gratitude"
        title="Gift guide"
        description={invitation.giftGuide.intro}
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-16 md:grid-cols-2">
        <div className="text-center md:text-left">
          <h3 className="text-xs tracking-[0.22em] text-accent uppercase">
            Registries
          </h3>
          <ul className="mt-6 space-y-6">
            {invitation.giftGuide.registries.map((registry) => (
              <li key={registry.name}>
                <a
                  href={registry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-2xl underline underline-offset-4"
                >
                  {registry.name}
                </a>
                <p className="mt-1 text-sm text-muted">{registry.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center md:text-left">
          <h3 className="text-xs tracking-[0.22em] text-accent uppercase">
            Monetary gift
          </h3>
          <p className="mt-4 text-sm text-muted">
            {invitation.giftGuide.bank.bankName}
          </p>
          <p className="mt-1 text-foreground">
            {invitation.giftGuide.bank.accountName}
          </p>
          <p className="mt-1 font-mono text-sm tracking-wide">
            {invitation.giftGuide.bank.accountNumber}
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <BankQr />
          </div>
          <p className="mx-auto mt-3 max-w-xs text-xs text-muted md:mx-0">
            {invitation.giftGuide.bank.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
