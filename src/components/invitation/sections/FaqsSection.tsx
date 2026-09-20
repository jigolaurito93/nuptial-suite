"use client";

import { useState } from "react";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import { plusOneAllowanceCopy } from "@/lib/invite";
import type { PublicInvite } from "@/types";

type FaqsSectionProps = {
  invite?: PublicInvite | null;
};

export function FaqsSection({ invite }: FaqsSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = invitation.faqs.map((faq) => {
    if (faq.question !== "Can I bring a guest/date?" || !invite) {
      return faq;
    }

    return {
      ...faq,
      answer: plusOneAllowanceCopy(invite.plusOnesAllowed, invite.label),
    };
  });

  return (
    <section id="faqs" className="invitation-section px-6 py-24">
      <SectionHeading eyebrow="Helpful notes" title="FAQs" />
      <div className="mx-auto mt-14 max-w-2xl divide-y divide-border border-y border-border">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-display text-xl sm:text-2xl">
                  {faq.question}
                </span>
                <span className="text-muted" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <p className="pb-5 text-sm leading-relaxed text-muted">
                  {faq.answer}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
