"use client";

import { useEffect, useRef, useState } from "react";
import { invitation } from "@/content/invitation";
import { AudioControl } from "@/components/invitation/AudioControl";
import { EnvelopeHero } from "@/components/invitation/EnvelopeHero";
import { InvitationNav } from "@/components/invitation/InvitationNav";
import { CountdownSection } from "@/components/invitation/sections/CountdownSection";
import { DressCodeSection } from "@/components/invitation/sections/DressCodeSection";
import { EntourageSection } from "@/components/invitation/sections/EntourageSection";
import { FaqsSection } from "@/components/invitation/sections/FaqsSection";
import { GallerySection } from "@/components/invitation/sections/GallerySection";
import { GiftGuideSection } from "@/components/invitation/sections/GiftGuideSection";
import { ProgramSection } from "@/components/invitation/sections/ProgramSection";
import { RsvpSection } from "@/components/invitation/sections/RsvpSection";
import { SaveTheDateSection } from "@/components/invitation/sections/SaveTheDateSection";
import {
  InvitationFooter,
  SeeYouThereSection,
} from "@/components/invitation/sections/SeeYouThereSection";
import { VenueSection } from "@/components/invitation/sections/VenueSection";

export function InvitationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!isOpen) {
      root.classList.add("scroll-locked");
      body.classList.add("scroll-locked");
    } else {
      root.classList.remove("scroll-locked");
      body.classList.remove("scroll-locked");
    }

    return () => {
      root.classList.remove("scroll-locked");
      body.classList.remove("scroll-locked");
    };
  }, [isOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isOpen) return;
    audio.muted = muted;
    if (!muted) {
      void audio.play().catch(() => {
        // Missing file or autoplay restrictions — fail silently.
      });
    } else {
      audio.pause();
    }
  }, [isOpen, muted]);

  function handleOpen() {
    if (isOpen || isOpening) return;
    setIsOpening(true);

    window.setTimeout(() => {
      setIsOpen(true);
      setIsOpening(false);
      requestAnimationFrame(() => {
        document
          .getElementById("save-the-date")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 900);
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      <audio ref={audioRef} src={invitation.audioSrc} loop preload="none" />

      <EnvelopeHero
        isOpen={isOpen}
        isOpening={isOpening}
        onOpen={handleOpen}
        eyebrow={invitation.saveTheDateEyebrow}
        names={invitation.couple.displayNames}
        hint={invitation.envelopeHint}
      />

      <div
        className={
          isOpen
            ? "relative z-10 flex flex-1 flex-col"
            : "pointer-events-none invisible absolute inset-0 -z-10 overflow-hidden"
        }
        aria-hidden={!isOpen}
      >
        <InvitationNav visible={isOpen} />
        <main className="flex-1">
          <SaveTheDateSection />
          <CountdownSection />
          <VenueSection />
          <ProgramSection />
          <EntourageSection />
          <DressCodeSection />
          <GallerySection />
          <GiftGuideSection />
          <RsvpSection />
          <FaqsSection />
          <SeeYouThereSection />
        </main>
        <InvitationFooter />
      </div>

      <AudioControl
        visible={isOpen}
        muted={muted}
        onToggle={() => setMuted((value) => !value)}
      />
    </div>
  );
}
