"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  easeInOut,
  easeOut,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
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
const CARD_SETTLED_SCALE = 1.07;
const CARD_SETTLED_ROTATE = 3;
const CARD_SETTLED_X = 20;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function prefersDirectScroll() {
  if (typeof window === "undefined") return true;
  if (navigator.maxTouchPoints > 0) return true;
  if ("ontouchstart" in window) return true;
  if (window.matchMedia("(pointer: coarse)").matches) return true;
  if (window.matchMedia("(hover: none)").matches) return true;
  return false;
}

function documentOffsetTop(element: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }
  return top;
}

function readSceneProgress(scene: HTMLElement | null, viewportHeight: number) {
  if (!scene) return 0;
  const view = viewportHeight || window.innerHeight;
  const max = scene.offsetHeight - view;
  if (max <= 0) return 0;
  return clamp((window.scrollY - documentOffsetTop(scene)) / max, 0, 1);
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
  const deviceIsTouch = useSyncExternalStore(
    () => () => {},
    prefersDirectScroll,
    () => true,
  );
  const [fingerUsed, setFingerUsed] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchScroll = Boolean(deviceIsTouch || fingerUsed || reduceMotion);
  const applySpring = useRef(false);

  // One scroll listener. iOS changes window.innerHeight as the URL bar hides,
  // so the viewport height used for progress is locked after first layout.
  // useScroll is not used: it reads getBoundingClientRect every frame and
  // that measurement jitters on sticky + mobile chrome.
  const rawProgress = useMotionValue(0);
  const smoothed = useSpring(rawProgress, {
    stiffness: 140,
    damping: 38,
    mass: 0.25,
    restDelta: 0.0004,
  });
  const progress = useMotionValue(0);
  const viewportHeight = useRef(0);

  useEffect(() => {
    viewportHeight.current = window.innerHeight;

    applySpring.current = !touchScroll;

    function onScroll() {
      const next = readSceneProgress(sceneRef.current, viewportHeight.current);
      rawProgress.set(next);
      if (touchScroll) progress.set(next);
    }

    function onTouchStart() {
      setFingerUsed(true);
      const next = readSceneProgress(sceneRef.current, viewportHeight.current);
      rawProgress.set(next);
      progress.set(next);
    }

    function onOrientation() {
      viewportHeight.current = window.innerHeight;
      onScroll();
    }

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [progress, rawProgress, touchScroll]);

  useMotionValueEvent(smoothed, "change", (latest) => {
    if (applySpring.current) progress.set(latest);
  });

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
  const flapZ = useTransform(flapRotate, (deg) => {
    if (touchScroll) return 0;
    // Open flap sits behind the card (1) so the letter can slide over it,
    // and in front of the backing (0) so the lining triangle stays visible.
    return deg > 90 ? 0.5 : Z_FLAP;
  });
  // cos(0)=1 closed (point down), cos(180)=-1 open (point up). A tiny
  // floor keeps the SVG/CSS clip from collapsing to nothing at 90deg.
  const flapScaleY = useTransform(flapRotate, (deg) => {
    const y = Math.cos((deg * Math.PI) / 180);
    const min = 0.08;
    if (Math.abs(y) >= min) return y;
    return deg > 90 ? -min : min;
  });
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
  // Closed flap covers the card (5). Once it is open the lining triangle
  // drops behind the card (2) so the letter can lift over it, and stays
  // below the pocket (4) so it does not paint on the envelope face.
  const flapLayer = useTransform(flapRotate, (deg) => (deg > 90 ? 1 : 5));
  // 3. The card is drawn up and out, then floats forward, grows a little
  // past its layout size, and settles 3deg clockwise.
  const slotHeight = useMotionValue(140);
  const restScale = useMotionValue(0.48);
  const cardY = useTransform([progress, slotHeight], (latest: number[]) => {
    const [value, height] = latest;
    const lifted = -1.25 * height;
    const settled = -0.68 * height;
    const travel =
      value <= CARD_LIFT[1]
        ? mapRange(value, CARD_LIFT[0], CARD_LIFT[1], 0, lifted)
        : mapRange(value, CARD_LIFT[1], CARD_GROW[1], lifted, settled);
    return `calc(-50% + ${Math.round(travel)}px)`;
  });
  const cardX = useTransform(progress, (value) => {
    if (value <= CARD_LIFT[1]) return "-50%";
    const shift = mapRange(
      value,
      CARD_LIFT[1],
      CARD_GROW[1],
      0,
      CARD_SETTLED_X,
    );
    return `calc(-50% + ${Math.round(shift)}px)`;
  });
  const cardRotate = useTransform(progress, (value) => {
    if (value <= CARD_LIFT[1]) return 0;
    return mapRange(
      value,
      CARD_LIFT[1],
      CARD_GROW[1],
      0,
      CARD_SETTLED_ROTATE,
    );
  });
  // Depth only starts climbing at the top of the lift, where the card is clear
  // of the front panel, so it never visibly pops through the envelope.
  const cardZ = useTransform(progress, (value) => {
    if (touchScroll) return 0;
    if (value <= CARD_LIFT[1]) return Z_CARD_IN;
    return mapRange(value, CARD_LIFT[1], CARD_GROW[1], Z_CARD_IN, Z_CARD_OUT);
  });
  const cardLayer = useTransform(progress, (value) =>
    value > CARD_LIFT[1] ? 8 : 2,
  );
  const growth = useTransform(progress, CARD_GROW, [0, 1], { ease: easeInOut });
  const cardScale = useTransform([growth, restScale], (latest: number[]) => {
    const [amount, rest] = latest;
    return rest + amount * (CARD_SETTLED_SCALE - rest);
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
  const envelopeTilt = useTransform(progress, (value) => {
    if (touchScroll) return 0;
    if (value <= FLAP_OPEN[1]) {
      return mapRange(value, 0, FLAP_OPEN[1], 11, 5);
    }
    return mapRange(value, FLAP_OPEN[1], CARD_LIFT[1], 5, 0);
  });
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
      const node = stageRef.current;
      if (!node) return;

      const stageWidth = node.offsetWidth;
      if (!stageWidth) return;

      const slotWidth = stageWidth * CARD_WIDTH_RATIO;
      const room = Math.min(window.innerWidth * 0.9, CARD_MAX_WIDTH);
      restScale.set(clamp(slotWidth / room, 0.38, 1));
      slotHeight.set(node.offsetHeight * CARD_HEIGHT_RATIO);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => {
      observer.disconnect();
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
      className={
        touchScroll
          ? "envelope-scene envelope-scene--touch relative z-20"
          : "envelope-scene relative z-20"
      }
    >
      <div className="envelope-sticky">
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
            className="font-script mt-3 text-7xl leading-[1.15] text-foreground sm:text-8xl md:text-9xl"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            {invitation.couple.partnerOne}{" "}
            <span className="letter-names-amp">&amp;</span>{" "}
            {invitation.couple.partnerTwo}
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

          <motion.div
            className="envelope"
            style={touchScroll ? undefined : { rotateX: envelopeTilt }}
          >
            <div className="envelope-back" aria-hidden />

            <motion.div
              className="envelope-letter"
              style={
                touchScroll
                  ? {
                      x: cardX,
                      y: cardY,
                      rotate: cardRotate,
                      scale: cardScale,
                      zIndex: cardLayer,
                    }
                  : {
                      x: cardX,
                      y: cardY,
                      z: cardZ,
                      rotate: cardRotate,
                      scale: cardScale,
                    }
              }
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
                <p className="letter-names">
                  {invitation.couple.partnerOne}{" "}
                  <span className="letter-names-amp">&amp;</span>{" "}
                  {invitation.couple.partnerTwo}
                </p>
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

            <div className="envelope-pocket-layer" aria-hidden>
              <div className="envelope-pocket">
                <div className="pocket-side pocket-side-left" />
                <div className="pocket-side pocket-side-right" />
                <div className="pocket-bottom" />
              </div>
            </div>

            <motion.div
              className="envelope-flap"
              aria-hidden
              style={
                touchScroll
                  ? { scaleY: flapScaleY, zIndex: flapLayer }
                  : { rotateX: flapRotate, z: flapZ }
              }
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
                style={
                  touchScroll
                    ? { opacity: sealOpacity }
                    : {
                        opacity: sealOpacity,
                        scale: sealScale,
                        rotate: sealRotate,
                        y: sealY,
                      }
                }
              >
                <img src="/kb-seal.svg" alt="" className="envelope-seal-img" />
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
