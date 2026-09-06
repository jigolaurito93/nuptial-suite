"use client";

import { useEffect, useState } from "react";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(invitation.weddingDate);
    const tick = () => setTimeLeft(getTimeLeft(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const units = [
    { label: "Days", value: timeLeft?.days },
    { label: "Hours", value: timeLeft?.hours },
    { label: "Minutes", value: timeLeft?.minutes },
    { label: "Seconds", value: timeLeft?.seconds },
  ];

  return (
    <section
      id="countdown"
      className="invitation-section countdown-wood relative flex min-h-[16rem] flex-col overflow-hidden px-4 sm:min-h-[26rem] sm:px-6 lg:min-h-[34rem]"
    >
      <div className="shrink-0 pt-5 sm:pt-10">
        <SectionHeading
          compact
          eyebrow="Counting down"
          title="Until we say I do"
          description={invitation.weddingDateLabel}
        />
      </div>
      <div className="flex flex-1 items-center py-3">
        <div className="mx-auto grid w-full grid-cols-4 gap-2 sm:max-w-4xl sm:gap-8 lg:max-w-6xl">
          {units.map((unit) => (
            <div key={unit.label} className="min-w-0 text-center">
              <p className="font-display -translate-y-6 text-5xl font-medium tabular-nums tracking-tight text-foreground [text-shadow:0_2px_14px_rgba(20,10,4,0.45)] sm:-translate-y-8 sm:text-6xl lg:-translate-y-10 lg:text-8xl xl:text-9xl">
                {unit.value == null ? "—" : String(unit.value).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[0.6rem] tracking-[0.12em] text-muted uppercase sm:mt-2 sm:text-xs sm:tracking-[0.2em]">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="shrink-0 pb-5 text-center text-[0.7rem] text-muted sm:pb-10 sm:text-sm">
        Ceremony begins at {invitation.weddingTimeLabel}
      </p>
    </section>
  );
}
