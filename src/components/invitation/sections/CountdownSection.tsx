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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(new Date(invitation.weddingDate)),
  );

  useEffect(() => {
    const target = new Date(invitation.weddingDate);
    const id = window.setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <section id="countdown" className="invitation-section px-6 py-24">
      <SectionHeading
        eyebrow="Counting down"
        title="Until we say I do"
        description={invitation.weddingDateLabel}
      />
      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
        {units.map((unit) => (
          <div key={unit.label} className="text-center">
            <p className="font-display text-5xl font-medium tabular-nums tracking-tight sm:text-6xl">
              {String(unit.value).padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs tracking-[0.2em] text-muted uppercase">
              {unit.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted">
        Ceremony begins at {invitation.weddingTimeLabel}
      </p>
    </section>
  );
}
