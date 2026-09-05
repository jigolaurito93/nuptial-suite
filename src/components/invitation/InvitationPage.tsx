"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [opened, setOpened] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onOpenedChange = useCallback((next: boolean) => {
    setOpened(next);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (opened && !muted) {
      void audio.play().catch(() => {
        // Missing file or autoplay restrictions — fail silently.
      });
    } else {
      audio.pause();
    }
  }, [opened, muted]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      <audio ref={audioRef} src={invitation.audioSrc} loop preload="none" />

      <EnvelopeHero onOpenedChange={onOpenedChange} />

      <div className="relative z-10 flex flex-1 flex-col">
        <InvitationNav visible={opened} />
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
        visible={opened}
        muted={muted}
        onToggle={() => setMuted((value) => !value)}
      />
    </div>
  );
}
