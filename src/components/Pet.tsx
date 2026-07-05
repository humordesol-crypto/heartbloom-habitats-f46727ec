import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mood, Reaction, Stage } from "@/lib/pet-store";
import momoAsset from "@/assets/momo-pet.png.asset.json";

const HAT_EMOJI: Record<string, string> = {
  "hat-crown": "👑",
  "hat-cap": "🧢",
  "hat-party": "🎉",
};

const REACTION_EMOJI: Record<Reaction, string> = {
  love: "💖", yum: "😋", sleepy: "💤", clean: "🫧", excited: "🤩",
  wow: "✨", sad: "😢", sick: "🤒", angry: "😡", scared: "😨",
  cold: "🥶", hot: "🥵", inlove: "😍", crying: "😭",
};

type Behavior =
  | "still" | "look-left" | "look-right" | "walk-left" | "walk-right"
  | "sit" | "stretch" | "dance" | "jump" | "wobble" | "hide"
  | "scratch" | "trip" | "yawn" | "spin" | "head-tilt" | "ear-wiggle";

interface Props {
  mood: Mood;
  stage: Stage;
  reaction: Reaction | null;
  hat: string | null;
  floaters: { id: number; icon: string; x: number }[];
  onTap: () => void;
  isDead?: boolean;
  isCritical?: boolean;
}

export function Pet({ mood, stage, reaction, hat, floaters, onTap, isDead, isCritical }: Props) {
  const size = stage === "baby" ? 220 : stage === "adult" ? 300 : 260;

  // ---- Behavior scheduler ----
  const [behavior, setBehavior] = useState<Behavior>("still");
  const [thought, setThought] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const behaviorPool = useMemo<Behavior[]>(() => {
    if (isDead) return ["still"];
    if (isCritical) return ["still", "wobble"];
    switch (mood) {
      case "sleep":
        return ["still", "still", "still"];
      case "tired":
        return ["still", "sit", "yawn", "stretch", "head-tilt"];
      case "sad":
      case "crying":
        return ["still", "sit", "hide", "look-left", "look-right"];
      case "sick":
        return ["still", "sit", "wobble", "yawn"];
      case "scared":
        return ["hide", "wobble", "still"];
      case "cold":
      case "hot":
        return ["wobble", "still", "sit"];
      case "play":
      case "excited":
        return ["dance", "jump", "walk-left", "walk-right", "spin", "wobble", "trip", "ear-wiggle"];
      case "inlove":
        return ["dance", "jump", "head-tilt", "ear-wiggle", "spin"];
      case "happy":
        return ["walk-left", "walk-right", "jump", "sit", "stretch", "head-tilt", "ear-wiggle", "scratch"];
      default:
        return ["still", "look-left", "look-right", "walk-left", "walk-right", "sit", "stretch", "head-tilt", "ear-wiggle", "yawn", "scratch"];
    }
  }, [mood, isCritical, isDead]);

  useEffect(() => {
    if (isDead) { setBehavior("still"); return; }
    let cancelled = false;
    const schedule = () => {
      const delay = 1400 + Math.random() * 3200;
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        const next = behaviorPool[Math.floor(Math.random() * behaviorPool.length)];
        setBehavior(next);
        setTimeout(() => {
          if (cancelled) return;
          setBehavior("still");
          schedule();
        }, behaviorDuration(next));
      }, delay);
    };
    schedule();
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [behaviorPool, isDead]);

  // Thought bubbles
  useEffect(() => {
    if (isDead) return;
    const face = FACE_EMOJI[mood];
    if (!face) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      setThought(face);
      t = setTimeout(() => {
        setThought(null);
        t = setTimeout(tick, 4500 + Math.random() * 5000);
      }, 1600);
    };
    t = setTimeout(tick, 2500 + Math.random() * 3000);
    return () => { cancelled = true; clearTimeout(t); setThought(null); };
  }, [mood, isDead]);

  // ---- Gaze tracking: eyes follow pointer ----
  const gazeX = useMotionValue(0);
  const gazeY = useMotionValue(0);
  const smoothGazeX = useSpring(gazeX, { stiffness: 120, damping: 18 });
  const smoothGazeY = useSpring(gazeY, { stiffness: 120, damping: 18 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDead || mood === "sleep") return;
    const stage = stageRef.current;
    if (!stage) return;
    const handle = (cx: number, cy: number) => {
      const r = stage.getBoundingClientRect();
      const px = cx - (r.left + r.width / 2);
      const py = cy - (r.top + r.height / 2);
      const max = 3.5;
      gazeX.set(Math.max(-max, Math.min(max, px / 40)));
      gazeY.set(Math.max(-max, Math.min(max, py / 60)));
    };
    const onMove = (e: PointerEvent) => handle(e.clientX, e.clientY);
    const parent = stage.closest("section") ?? window;
    parent.addEventListener("pointermove", onMove as EventListener);
    return () => parent.removeEventListener("pointermove", onMove as EventListener);
  }, [gazeX, gazeY, isDead, mood]);

  // Autonomous glance offsets when idle "look-left/right"
  const lookOffset = behavior === "look-left" ? -3 : behavior === "look-right" ? 3 : 0;
  const gazeXFinal = useTransform(smoothGazeX, (v) => v + lookOffset);

  return (
    <div ref={stageRef} className="relative flex flex-col items-center justify-center select-none w-full h-full">
      {/* Halo */}
      <div
        aria-hidden
        className="absolute top-8 h-64 w-64 rounded-full opacity-60 blur-3xl"
        style={{
          background: isDead || mood === "critical"
            ? "radial-gradient(circle, color-mix(in oklab, var(--destructive) 35%, transparent), transparent 70%)"
            : mood === "inlove"
            ? "radial-gradient(circle, color-mix(in oklab, var(--love) 55%, transparent), transparent 70%)"
            : "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
        }}
      />

      {/* Floaters */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.6, 1.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: "easeOut" as const }}
              className="absolute text-3xl"
              style={{ left: `${f.x}%`, top: "24%" }}
            >
              {f.icon}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <AmbientEffect mood={mood} isDead={isDead} />

      <PetBody
        size={size}
        mood={mood}
        behavior={behavior}
        reaction={reaction}
        thought={thought}
        hat={hat}
        gazeX={gazeXFinal}
        gazeY={smoothGazeY}
        onTap={onTap}
        isDead={isDead}
      />

      <motion.div
        className="floor-shadow h-5 w-40 -mt-1"
        animate={{ scaleX: behavior === "jump" ? [1, 0.6, 1] : [1, 0.9, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" as const }}
      />
    </div>
  );
}

/* ============================================================ */
/*                     PET BODY (articulated SVG)                */
/* ============================================================ */

interface BodyProps {
  size: number;
  mood: Mood;
  behavior: Behavior;
  reaction: Reaction | null;
  thought: string | null;
  hat: string | null;
  gazeX: any;
  gazeY: any;
  onTap: () => void;
  isDead?: boolean;
}

function PetBody({ size, mood, behavior, reaction, thought, hat, gazeX, gazeY, onTap, isDead }: BodyProps) {
  // Container-level movement (position, walking)
  const containerAnim = buildContainerAnim(behavior, isDead);
  // Body-level (breathing, hop, tilt)
  const bodyAnim = buildBodyAnim(behavior, mood, isDead);

  // Blinking loop
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (isDead) return;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      // Double blink sometimes
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
      if (Math.random() < 0.25) {
        setTimeout(() => setBlink(true), 260);
        setTimeout(() => setBlink(false), 380);
      }
      setTimeout(loop, 2200 + Math.random() * 3800);
    };
    const t = setTimeout(loop, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isDead]);

  // Kept for helpers below (unused vars intentionally omitted)

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.94 }}
      animate={containerAnim.animate}
      transition={containerAnim.transition}
      className="relative outline-none"
      aria-label="Interagir com o pet"
      style={{ width: size, height: size }}
    >
      {/* Reaction bubble */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={reaction}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="absolute -top-1 right-1 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lift border border-white text-2xl"
          >
            {REACTION_EMOJI[reaction]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thought bubble */}
      <AnimatePresence>
        {thought && !reaction && (
          <motion.div
            key={thought + mood}
            initial={{ opacity: 0, scale: 0.4, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="absolute -top-2 left-1 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-soft border border-white text-xl"
          >
            {thought}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={bodyAnim.animate}
        transition={bodyAnim.transition}
        style={{ transformOrigin: "50% 90%" }}
        className="relative w-full h-full"
      >
        <div className="relative w-full h-full">
          {/* Character bitmap */}
          <img
            src={momoAsset.url}
            alt="Momo"
            draggable={false}
            className={`select-none pointer-events-none w-full h-full object-contain transition-[filter] duration-500 ${
              isDead ? "grayscale opacity-70" :
              mood === "sick" ? "saturate-[0.6] brightness-95" :
              mood === "cold" ? "hue-rotate-[190deg] saturate-[0.8]" :
              mood === "hot" ? "hue-rotate-[-15deg] saturate-125 brightness-[1.05]" :
              mood === "critical" ? "grayscale-[0.4] brightness-90" : ""
            }`}
            style={{
              filter:
                mood === "inlove"
                  ? "drop-shadow(0 0 22px rgba(255,90,140,0.55))"
                  : mood === "excited" || mood === "play"
                  ? "drop-shadow(0 12px 20px rgba(180,80,140,0.35))"
                  : "drop-shadow(0 14px 22px rgba(180,80,140,0.3))",
            }}
          />

          {/* Eyelid overlays for real blinking, positioned over the eyes */}
          <Eyelid side="left" closed={blink || eyesForcedClosed(mood, behavior, isDead)} />
          <Eyelid side="right" closed={blink || eyesForcedClosed(mood, behavior, isDead)} />

          {/* Heart-eyes overlay when in love */}
          {mood === "inlove" && !isDead && (
            <>
              <HeartEye side="left" />
              <HeartEye side="right" />
            </>
          )}

          {/* Angry brows */}
          {mood === "angry" && !isDead && (
            <>
              <div
                className="absolute bg-[#3a2530] rounded"
                style={{ left: "36%", top: "37%", width: "10%", height: "3px", transform: "rotate(15deg)" }}
              />
              <div
                className="absolute bg-[#3a2530] rounded"
                style={{ left: "54%", top: "37%", width: "10%", height: "3px", transform: "rotate(-15deg)" }}
              />
            </>
          )}

          {/* Cheeks blush */}
          {(mood === "inlove" || mood === "happy" || mood === "excited" || mood === "hot") && !isDead && (
            <>
              <div
                className="absolute rounded-full bg-[#ff88a8] opacity-60 blur-[6px]"
                style={{ left: "27%", top: "50%", width: "10%", height: "6%" }}
              />
              <div
                className="absolute rounded-full bg-[#ff88a8] opacity-60 blur-[6px]"
                style={{ left: "63%", top: "50%", width: "10%", height: "6%" }}
              />
            </>
          )}

          {/* Tears */}
          {(mood === "crying" || mood === "sad") && !isDead && (
            <>
              <motion.div
                className="absolute rounded-full bg-[#7ecff5]"
                style={{ left: "40%", top: "47%", width: "3%", height: "4%" }}
                animate={{ y: [0, 60, 60], opacity: [1, 1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn" as const }}
              />
              <motion.div
                className="absolute rounded-full bg-[#7ecff5]"
                style={{ left: "57%", top: "47%", width: "3%", height: "4%" }}
                animate={{ y: [0, 60, 60], opacity: [1, 1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.5, ease: "easeIn" as const }}
              />
            </>
          )}

          {/* Sick sweat */}
          {mood === "sick" && !isDead && (
            <motion.span
              className="absolute text-2xl"
              style={{ left: "68%", top: "30%" }}
              animate={{ y: [0, 12], opacity: [1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              💧
            </motion.span>
          )}

          {/* Cold snowflake */}
          {mood === "cold" && !isDead && (
            <motion.span
              className="absolute text-2xl"
              style={{ left: "70%", top: "28%" }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" as const }}
            >
              ❄️
            </motion.span>
          )}

          {/* Hot sweat */}
          {mood === "hot" && !isDead && (
            <motion.span
              className="absolute text-2xl"
              style={{ left: "68%", top: "28%" }}
              animate={{ y: [0, 14], opacity: [1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              💦
            </motion.span>
          )}
        </div>

        {/* Hat overlay */}
        {hat && HAT_EMOJI[hat] && !isDead && (
          <motion.span
            aria-hidden
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
            className="absolute left-1/2 -translate-x-1/2 text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
            style={{ top: "-6%" }}
          >
            {HAT_EMOJI[hat]}
          </motion.span>
        )}
      </motion.div>
    </motion.button>
  );
}

/* ============================================================ */
/*                          BODY PARTS                          */
/* ============================================================ */

/* Eyelid overlay (matches the pink eye ring; scales down to blink) */
function Eyelid({ side, closed }: { side: "left" | "right"; closed: boolean }) {
  const left = side === "left" ? "34%" : "52%";
  return (
    <motion.div
      className="absolute rounded-[45%] pointer-events-none"
      style={{
        left,
        top: "39.5%",
        width: "14%",
        height: "10%",
        background: "linear-gradient(180deg, #f0a4b8, #e78ea6)",
        transformOrigin: "50% 0%",
        boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.15)",
      }}
      animate={{ scaleY: closed ? 1 : 0 }}
      transition={{ duration: 0.12, ease: "easeOut" as const }}
    />
  );
}

/* Big pink heart over each eye */
function HeartEye({ side }: { side: "left" | "right" }) {
  const left = side === "left" ? "35%" : "53%";
  return (
    <motion.div
      className="absolute flex items-center justify-center pointer-events-none text-[46px] leading-none"
      style={{ left, top: "38%", width: "12%", height: "10%", color: "#ff4d7d" }}
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" as const }}
    >
      ♥
    </motion.div>
  );
}

function eyesForcedClosed(mood: Mood, behavior: Behavior, isDead?: boolean): boolean {
  if (isDead) return true;
  if (mood === "sleep" || mood === "crying") return true;
  if (behavior === "yawn") return true;
  return false;
}

const FACE_EMOJI: Record<string, string | null> = {
  idle: null,
  happy: "😊", play: "😁", excited: "🤩", inlove: "😍",
  sleep: "😴", tired: "🥱",
  sad: "😢", crying: "😭",
  sick: "🤒", angry: "😡", scared: "😨",
  cold: "🥶", hot: "🥵",
  critical: "😵",
};

function behaviorDuration(b: Behavior): number {
  switch (b) {
    case "walk-left":
    case "walk-right": return 2600;
    case "dance": return 2400;
    case "jump": return 900;
    case "hide": return 2500;
    case "stretch": return 1600;
    case "sit": return 2000;
    case "scratch": return 1400;
    case "trip": return 900;
    case "wobble": return 1400;
    case "yawn": return 1600;
    case "spin": return 1200;
    case "head-tilt": return 1800;
    case "ear-wiggle": return 1200;
    case "look-left":
    case "look-right": return 1400;
    default: return 1500;
  }
}

function buildContainerAnim(behavior: Behavior, isDead?: boolean) {
  if (isDead) {
    return {
      animate: { x: 0, y: 6, rotate: 0, scale: 0.95, opacity: 0.85 },
      transition: { duration: 1 },
    };
  }
  switch (behavior) {
    case "walk-left":
      return {
        animate: { x: [-5, -70, -70, -70], y: [0, 0, 0, 0], rotate: 0 },
        transition: { duration: 2.4, ease: "easeInOut" as const },
      };
    case "walk-right":
      return {
        animate: { x: [5, 70, 70, 70], rotate: 0 },
        transition: { duration: 2.4, ease: "easeInOut" as const },
      };
    case "hide":
      return {
        animate: { x: 0, y: 28, scale: 0.82, opacity: 0.9, rotate: 0 },
        transition: { duration: 0.8 },
      };
    case "spin":
      return {
        animate: { rotate: 360, x: 0, y: 0 },
        transition: { duration: 1.2, ease: "easeInOut" as const },
      };
    default:
      return {
        animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
        transition: { duration: 0.6, ease: "easeOut" as const },
      };
  }
}

function buildBodyAnim(behavior: Behavior, mood: Mood, isDead?: boolean) {
  if (isDead) {
    return {
      animate: { scaleY: 0.9, scaleX: 1.05, y: 4, rotate: 0 },
      transition: { duration: 1.2 },
    };
  }

  // Baseline breathing
  const breathScaleY =
    mood === "sleep" ? [1, 1.06, 1] :
    mood === "sick" || mood === "sad" || mood === "crying" ? [1, 1.02, 1] :
    mood === "play" || mood === "excited" ? [1, 1.05, 1] :
    [1, 1.035, 1];
  const breathScaleX =
    mood === "sleep" ? [1, 0.97, 1] : [1, 0.985, 1];
  const breathDur =
    mood === "sleep" ? 4.5 :
    mood === "play" || mood === "excited" ? 1.2 :
    mood === "sad" || mood === "sick" || mood === "crying" ? 3 :
    2.4;

  const base = {
    animate: { scaleY: breathScaleY, scaleX: breathScaleX, y: 0, rotate: 0 } as any,
    transition: { duration: breathDur, repeat: Infinity, ease: "easeInOut" as const } as any,
  };

  switch (behavior) {
    case "jump":
      return {
        animate: { y: [0, -40, 0], scaleY: [1, 1.05, 0.9, 1.02, 1], scaleX: [1, 0.95, 1.05, 0.98, 1], rotate: [0, -4, 0] },
        transition: { duration: 0.9, ease: "easeOut" as const },
      };
    case "sit":
      return {
        animate: { y: 12, scaleY: 0.9, scaleX: 1.08, rotate: 0 },
        transition: { duration: 0.6 },
      };
    case "stretch":
      return {
        animate: { scaleY: [1, 1.15, 1], scaleX: [1, 0.92, 1], y: [0, -6, 0], rotate: [-2, 2, 0] },
        transition: { duration: 1.4 },
      };
    case "dance":
      return {
        animate: { rotate: [-8, 8, -8, 8, 0], y: [0, -10, 0, -10, 0], scaleY: [1, 1.05, 1, 1.05, 1] },
        transition: { duration: 1.2, ease: "easeInOut" as const },
      };
    case "wobble":
      return {
        animate: { rotate: [-5, 5, -4, 4, 0], y: 0, scaleY: [1, 1.03, 1] },
        transition: { duration: 1.4 },
      };
    case "trip":
      return {
        animate: { rotate: [0, -18, 8, 0], y: [0, 6, 0], scaleY: [1, 0.9, 1] },
        transition: { duration: 0.9 },
      };
    case "head-tilt":
      return {
        animate: { rotate: [0, -10, -10, 0], scaleY: breathScaleY, scaleX: breathScaleX },
        transition: { duration: 1.8, ease: "easeInOut" as const },
      };
    case "yawn":
      return {
        animate: { scaleY: [1, 1.1, 1], scaleX: [1, 0.95, 1], y: [0, -4, 0] },
        transition: { duration: 1.5 },
      };
    case "walk-left":
    case "walk-right":
      return {
        animate: { y: [0, -5, 0, -5, 0], scaleY: [1, 1.03, 1, 1.03, 1], rotate: 0 },
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const },
      };
    default:
      return base;
  }
}

/* ============================================================ */
/*                         AMBIENT FX                            */
/* ============================================================ */

function AmbientEffect({ mood, isDead }: { mood: Mood; isDead?: boolean }) {
  if (isDead) return null;
  if (mood === "inlove") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-xl"
            style={{ left: `${20 + i * 12}%`, bottom: "10%" }}
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], y: -160, scale: [0.6, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" as const }}
          >
            💗
          </motion.span>
        ))}
      </div>
    );
  }
  if (mood === "sleep") {
    return (
      <div className="pointer-events-none absolute inset-0">
        {["Z", "z", "z"].map((z, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl font-bold text-white/90"
            style={{ left: `${55 + i * 6}%`, top: `${20 - i * 4}%` }}
            animate={{ opacity: [0, 1, 0], y: [0, -20, -40] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
          >
            {z}
          </motion.span>
        ))}
      </div>
    );
  }
  return null;
}
