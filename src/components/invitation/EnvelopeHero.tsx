"use client";

import { useEffect, useRef } from "react";
import {
  easeInOut,
  easeOut,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { invitation } from "@/content/invitation";

type EnvelopeHeroProps = {
  onOpenedChange: (opened: boolean) => void;
};

// Beats of the sequence, as fractions of the scene's scroll range. They never
// overlap, so each one settles before the next begins.
const SEAL_BREAK: [number, number] = [0.04, 0.11];
const FLAP_OPEN: [number, number] = [0.13, 0.35];
const CARD_LIFT: [number, number] = [0.4, 0.58];
const CARD_GROW: [number, number] = [0.58, 0.75];

// translateZ in px, standing in for paper thickness. Against the stage's 1400px
// perspective these are imperceptible, but they make paint order inside the
// preserve-3d context explicit rather than leaving it to z-index, which browsers
// resolve inconsistently once 3D transforms are involved.
const Z_FLAP = 6;
const Z_CARD_IN = 1;
const Z_CARD_OUT = 84;

// Slot the card occupies inside the envelope, matching .envelope-letter's
// visual rest size (84% of stage width, 63% of stage height).
const CARD_WIDTH_RATIO = 0.84;
const CARD_HEIGHT_RATIO = 0.63;
const CARD_MAX_WIDTH = 620;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  const t = easeInOutCubic((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * t;
}

export function EnvelopeHero({ onOpenedChange }: EnvelopeHeroProps) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const openedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });

  // Wheels and trackpads deliver scroll in coarse steps. Running progress
  // through a spring turns those steps into continuous motion.
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 32,
    mass: 0.4,
    restDelta: 0.0002,
  });
  const progress = reduceMotion ? scrollYProgress : smoothed;

  // 1. The wax seal cracks and drops away.
  const sealOpacity = useTransform(progress, SEAL_BREAK, [1, 0], {
    ease: easeOut,
  });
  const sealScale = useTransform(progress, SEAL_BREAK, [1, 0.78]);
  const sealRotate = useTransform(progress, SEAL_BREAK, [0, -20]);
  const sealY = useTransform(progress, SEAL_BREAK, ["0%", "30%"]);

  // 2. The flap swings back on its top edge.
  const flapRotate = useTransform(progress, FLAP_OPEN, [0, 180], {
    ease: easeInOut,
  });
  // At 90deg the flap is edge-on and invisible, which hides the depth swap that
  // drops it behind the envelope for the rest of the sequence.
  const flapZ = useTransform(flapRotate, (deg) =>
    deg > 90 ? -Z_FLAP : Z_FLAP,
  );
  // Light grazes the paper as it turns edge-on, so it darkens towards 90deg and
  // recovers on the way back out. The two paper surfaces swap at that same
  // angle, where the flap has no visible area and the cut cannot be seen.
  const flapShade = useTransform(flapRotate, [0, 90, 180], [0, 0.55, 0]);
  const flapOuterOpacity = useTransform(flapRotate, (deg) =>
    deg > 90 ? 0 : 1,
  );
  const flapLiningOpacity = useTransform(flapRotate, (deg) =>
    deg > 90 ? 1 : 0,
  );

  // 3. The card is drawn up and out, then floats forward and grows.
  // It is laid out at its final size and only ever scaled down, so the type is
  // never an upscaled bitmap. y is in px of the resting (small) slot so the
  // travel stays the same when the native card is larger than the envelope.
  const slotHeight = useMotionValue(140);
  const restScale = useMotionValue(0.48);
  const cardY = useTransform([progress, slotHeight], (latest: number[]) => {
    const [value, height] = latest;
    const lifted = -1.25 * height;
    const settled = -0.8 * height;
    const travel =
      value <= CARD_LIFT[1]
        ? mapRange(value, CARD_LIFT[0], CARD_LIFT[1], 0, lifted)
        : mapRange(value, CARD_LIFT[1], CARD_GROW[1], lifted, settled);
    return `calc(-50% + ${travel}px)`;
  });
  const cardRotate = useTransform(
    progress,
    [CARD_LIFT[0], CARD_LIFT[1], CARD_GROW[1]],
    [0, -1.4, 0],
    { ease: [easeInOut, easeInOut] },
  );
  // Depth only starts climbing at the top of the lift, where the card is clear
  // of the front panel, so it never visibly pops through the envelope.
  const cardZ = useTransform(
    progress,
    [CARD_LIFT[1], CARD_GROW[1]],
    [Z_CARD_IN, Z_CARD_OUT],
    { ease: easeInOut },
  );
  const growth = useTransform(progress, CARD_GROW, [0, 1], { ease: easeInOut });
  const cardScale = useTransform([growth, restScale], (latest: number[]) => {
    const [amount, rest] = latest;
    return rest + amount * (1 - rest);
  });
  const cardShadow = useTransform(
    progress,
    [CARD_LIFT[0], CARD_GROW[1]],
    [0, 1],
    { ease: easeInOut },
  );
  // Shadow of the envelope mouth lingering on the card as it slides clear.
  const cardMouthShade = useTransform(
    progress,
    [CARD_LIFT[0], CARD_LIFT[0] + 0.12],
    [0.6, 0],
  );

  // 4. Supporting elements step aside as the card takes over the frame.
  const envelopeTilt = useTransform(
    progress,
    [0, FLAP_OPEN[1], CARD_LIFT[1]],
    [11, 5, 0],
    { ease: [easeInOut, easeInOut] },
  );
  const groundShadow = useTransform(
    progress,
    [CARD_LIFT[0], CARD_GROW[1]],
    [1, 0.3],
  );
  const copyOpacity = useTransform(
    progress,
    [CARD_LIFT[0] - 0.08, CARD_LIFT[0] + 0.06],
    [1, 0],
  );
  const hintOpacity = useTransform(progress, [0.02, 0.09], [1, 0]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function measure() {
      const stageWidth = stage.offsetWidth;
      if (!stageWidth) return;

      const slotWidth = stageWidth * CARD_WIDTH_RATIO;
      const room = Math.min(window.innerWidth * 0.9, CARD_MAX_WIDTH);
      restScale.set(clamp(slotWidth / room, 0.38, 0.88));
      slotHeight.set(stage.offsetHeight * CARD_HEIGHT_RATIO);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    // The stage stops growing once it hits its max width, so viewport changes
    // past that point only ever show up on the window.
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [restScale, slotHeight]);

  useMotionValueEvent(progress, "change", (value) => {
    const opened = value >= 0.72;
    if (opened === openedRef.current) return;
    openedRef.current = opened;
    onOpenedChange(opened);
  });

  return (
    <section
      ref={sceneRef}
      aria-label="Open invitation"
      className="envelope-scene relative z-20"
    >
      <svg className="envelope-clip-defs" aria-hidden>
        <defs>
          <clipPath id="envelope-flap-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 H 1 L 0.535 0.91 Q 0.5 1.02 0.465 0.91 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="envelope-sticky">
        <div className="motion-orbs" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <motion.div className="envelope-copy" style={{ opacity: copyOpacity }}>
          <motion.p
            className="text-xs tracking-[0.28em] text-muted uppercase"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {invitation.saveTheDateEyebrow}
          </motion.p>
          <motion.h1
            className="font-script mt-3 text-6xl leading-[1.15] text-foreground sm:text-7xl md:text-8xl"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            {invitation.couple.displayNames}
          </motion.h1>
        </motion.div>

        <motion.div
          ref={stageRef}
          className="envelope-stage"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            delay: 0.1,
          }}
        >
          <motion.div
            className="envelope-shadow-halo"
            aria-hidden
            style={{ opacity: groundShadow }}
          />
          <motion.div
            className="envelope-shadow"
            aria-hidden
            style={{ opacity: groundShadow }}
          />

          <motion.div className="envelope" style={{ rotateX: envelopeTilt }}>
            <div className="envelope-back" aria-hidden />

            <motion.div
              className="envelope-letter"
              style={{
                x: "-50%",
                y: cardY,
                z: cardZ,
                rotate: cardRotate,
                scale: cardScale,
              }}
            >
              <motion.div
                className="letter-shadow"
                aria-hidden
                style={{ opacity: cardShadow }}
              />
              <div className="letter-card">
                <div className="letter-frame" aria-hidden>
                  <span className="letter-corner letter-corner-tl" />
                  <span className="letter-corner letter-corner-tr" />
                  <span className="letter-corner letter-corner-bl" />
                  <span className="letter-corner letter-corner-br" />
                </div>

                <p className="letter-mono" aria-hidden>
                  K<span>&amp;</span>B
                </p>
                <p className="letter-kicker">You&apos;re invited</p>
                <p className="letter-names">{invitation.couple.displayNames}</p>
                <svg
                  className="letter-flourish"
                  viewBox="0 0 160 18"
                  aria-hidden
                >
                  <path d="M4 9 H62" />
                  <path d="M98 9 H156" />
                  <path d="M80 2.5 C86 6 86 12 80 15.5 C74 12 74 6 80 2.5 Z" />
                  <path d="M72 9 C76 5 78 5 80 9 C82 5 84 5 88 9 C84 13 82 13 80 9 C78 13 76 13 72 9 Z" />
                </svg>
                <p className="letter-date">{invitation.weddingDateLabel}</p>
                <p className="letter-place">
                  {invitation.weddingTimeLabel}
                  <span aria-hidden> · </span>
                  Nasugbu &amp; Tagaytay
                </p>
                <motion.div
                  className="letter-mouth-shade"
                  aria-hidden
                  style={{ opacity: cardMouthShade }}
                />
              </div>
            </motion.div>

            <div className="envelope-pocket" aria-hidden>
              <div className="pocket-side pocket-side-left" />
              <div className="pocket-side pocket-side-right" />
              <div className="pocket-bottom" />
            </div>

            <motion.div
              className="envelope-flap"
              aria-hidden
              style={{ rotateX: flapRotate, z: flapZ }}
            >
              <div className="envelope-flap-face">
                <motion.div
                  className="flap-outer"
                  style={{ opacity: flapOuterOpacity }}
                />
                <motion.div
                  className="flap-lining"
                  style={{ opacity: flapLiningOpacity }}
                />
                <motion.div
                  className="flap-shade"
                  style={{ opacity: flapShade }}
                />
              </div>
            </motion.div>

            <div className="envelope-seal-anchor" aria-hidden>
              <motion.div
                className="envelope-seal"
                style={{
                  opacity: sealOpacity,
                  scale: sealScale,
                  rotate: sealRotate,
                  y: sealY,
                }}
              >
                <span>K&amp;B</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          className="envelope-hint text-sm text-muted"
          style={{ opacity: hintOpacity }}
        >
          {invitation.envelopeHint}
        </motion.p>
      </div>
    </section>
  );
}
