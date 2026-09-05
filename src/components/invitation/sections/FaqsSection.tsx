"use client";

import { useState } from "react";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function FaqsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="invitation-section px-6 py-24">
      <SectionHeading eyebrow="Helpful notes" title="FAQs" />
      <div className="mx-auto mt-14 max-w-2xl divide-y divide-border border-y border-border">
        {invitation.faqs.map((faq, index) => {
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
