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
import { WellWishesSection } from "@/components/invitation/sections/WellWishesSection";
import { usePublicInvite } from "@/components/invitation/usePublicInvite";

type InvitationPageProps = {
  inviteCode?: string | null;
};

export function InvitationPage({ inviteCode = null }: InvitationPageProps) {
  const { invite, loading, refresh } = usePublicInvite(inviteCode);
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

  const replyHref = loading ? null : invite ? "#rsvp" : "#wishes";

  return (
    <div className="relative flex min-h-dvh flex-col text-foreground">
      <div className="liquid-atmosphere" aria-hidden>
        <span className="silk-wash silk-aurora" />
        <span className="silk-wash silk-aurora-b" />
        <span className="silk-wash silk-a" />
        <span className="silk-wash silk-b" />
        <span className="silk-wash silk-c" />
        <div className="liquid-glass" />
      </div>
      <audio ref={audioRef} src={invitation.audioSrc} loop preload="none" />

      <EnvelopeHero onOpenedChange={onOpenedChange} />

      <div className="relative z-10 flex flex-1 flex-col">
        <InvitationNav visible={opened} replyHref={replyHref} />
        <main className="flex-1">
          <SaveTheDateSection />
          <CountdownSection />
          <VenueSection />
          <ProgramSection />
          <EntourageSection />
          <DressCodeSection />
          <GallerySection />
          <GiftGuideSection />
          {loading ? (
            <section className="invitation-section border-t border-border px-6 py-24">
              <p className="mx-auto max-w-lg text-center text-sm text-muted">
                Loading your invitation…
              </p>
            </section>
          ) : invite && inviteCode ? (
            <RsvpSection
              invite={invite}
              inviteCode={inviteCode}
              onSuccess={refresh}
            />
          ) : (
            <WellWishesSection />
          )}
          <FaqsSection invite={invite} />
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
