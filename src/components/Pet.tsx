import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import petIdle from "@/assets/pet-idle.png";
import petHappy from "@/assets/pet-happy.png";
import petSleep from "@/assets/pet-sleep.png";
import petSad from "@/assets/pet-sad.png";
import petPlay from "@/assets/pet-play.png";
import petBaby from "@/assets/pet-baby.png";
import petAdult from "@/assets/pet-adult.png";
import type { Mood, Reaction, Stage } from "@/lib/pet-store";

const moodSprites: Record<string, string> = {
  idle: petIdle,
  happy: petHappy,
  sleep: petSleep,
  sad: petSad,
  play: petPlay,
  sick: petSad,
  angry: petSad,
  scared: petSad,
  cold: petSad,
  hot: petSad,
  inlove: petHappy,
  tired: petSleep,
  crying: petSad,
  excited: petPlay,
  critical: petSad,
};

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

/** Face/expression overlay per mood. */
const FACE_EMOJI: Record<string, string | null> = {
  idle: null,
  happy: "😊",
  play: "😁",
  sleep: "😴",
  tired: "🥱",
  sad: "😢",
  crying: "😭",
  sick: "🤒",
  angry: "😡",
  scared: "😨",
  cold: "🥶",
  hot: "🥵",
  inlove: "😍",
  excited: "🤩",
  critical: "😵",
};

/** Autonomous behaviors: transient physical actions the pet performs on its own. */
type Behavior =
  | "still" | "look-left" | "look-right" | "walk-left" | "walk-right"
  | "sit" | "stretch" | "dance" | "jump" | "wobble" | "hide"
  | "scratch" | "trip";

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
  const src =
    stage === "baby" ? petBaby :
    stage === "adult" ? petAdult :
    (moodSprites[mood] ?? petIdle);

  const sizeClass =
    stage === "baby" ? "h-52 w-52" : stage === "adult" ? "h-72 w-72" : "h-64 w-64";

  // -------- Autonomous behavior scheduler --------
  const [behavior, setBehavior] = useState<Behavior>("still");
  const [thought, setThought] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thoughtRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const behaviorPool = useMemo<Behavior[]>(() => {
    if (isDead) return ["still"];
    if (isCritical) return ["still", "wobble"];
    switch (mood) {
      case "sleep":
      case "tired":
        return ["still", "sit", "stretch", "look-left", "look-right"];
      case "sad":
      case "crying":
      case "sick":
        return ["still", "sit", "hide", "look-left", "look-right"];
      case "scared":
        return ["hide", "wobble", "still"];
      case "cold":
      case "hot":
        return ["wobble", "still", "sit"];
      case "play":
      case "excited":
        return ["dance", "jump", "walk-left", "walk-right", "trip", "wobble"];
      case "inlove":
        return ["dance", "jump", "sit", "look-left", "look-right"];
      case "happy":
        return ["walk-left", "walk-right", "jump", "sit", "stretch", "look-left", "look-right", "scratch"];
      default:
        return ["still", "look-left", "look-right", "walk-left", "walk-right", "sit", "stretch", "scratch"];
    }
  }, [mood, isCritical, isDead]);

  useEffect(() => {
    if (isDead) {
      setBehavior("still");
      return;
    }
    let cancelled = false;

    const schedule = () => {
      const delay = 1800 + Math.random() * 3500;
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        const pool = behaviorPool;
        const next = pool[Math.floor(Math.random() * pool.length)];
        setBehavior(next);
        // return to "still" after the behavior duration
        const dur = behaviorDuration(next);
        setTimeout(() => {
          if (cancelled) return;
          setBehavior("still");
          schedule();
        }, dur);
      }, delay);
    };
    schedule();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [behaviorPool, isDead]);

  // Occasional thought bubbles that hint at the current emotion
  useEffect(() => {
    if (isDead) return;
    const face = FACE_EMOJI[mood];
    const tick = () => {
      if (face) setThought(face);
      thoughtRef.current = setTimeout(() => {
        setThought(null);
        thoughtRef.current = setTimeout(tick, 4000 + Math.random() * 5000);
      }, 1600);
    };
    thoughtRef.current = setTimeout(tick, 2500 + Math.random() * 3500);
    return () => {
      if (thoughtRef.current) clearTimeout(thoughtRef.current);
      setThought(null);
    };
  }, [mood, isDead]);

  // Blink loop (natural blinking)
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (isDead) return;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      setTimeout(loop, 2800 + Math.random() * 3200);
    };
    const t = setTimeout(loop, 1500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isDead]);

  const anim = buildAnimation(behavior, mood, isDead);
  const trans = buildTransition(behavior, mood);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-full">
      {/* Halo */}
      <div
        aria-hidden
        className="absolute top-6 h-64 w-64 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            mood === "critical" || isDead
              ? "radial-gradient(circle, color-mix(in oklab, var(--destructive) 35%, transparent) 0%, transparent 70%)"
              : mood === "inlove"
              ? "radial-gradient(circle, color-mix(in oklab, var(--love) 50%, transparent) 0%, transparent 70%)"
              : "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Floaters (action feedback) */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -110, scale: [0.6, 1.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              className="absolute text-3xl"
              style={{ left: `${f.x}%`, top: "22%" }}
            >
              {f.icon}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Ambient effects per emotion */}
      <AmbientEffect mood={mood} />

      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.94 }}
        className="relative outline-none"
        aria-label="Fazer carinho no pet"
        animate={anim.container}
        transition={trans.container}
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
              className="absolute -top-2 right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lift border border-white text-2xl"
            >
              {REACTION_EMOJI[reaction]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thought bubble (autonomous emotion hint) */}
        <AnimatePresence>
          {thought && !reaction && (
            <motion.div
              key={thought + mood}
              initial={{ opacity: 0, scale: 0.4, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="absolute -top-4 left-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-soft border border-white text-xl"
            >
              {thought}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={anim.body}
          transition={trans.body}
          className={`relative ${sizeClass}`}
        >
          <img
            src={src}
            alt={`Pet ${mood}`}
            className={`h-full w-full object-contain drop-shadow-[0_18px_25px_rgba(180,80,140,0.25)] transition-[filter] duration-500 ${
              isDead ? "grayscale opacity-70" :
              mood === "sick" ? "saturate-50" :
              mood === "cold" ? "hue-rotate-[200deg] saturate-75" :
              mood === "hot" ? "hue-rotate-[-20deg] saturate-125" : ""
            }`}
            draggable={false}
          />

          {/* Blink mask */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: blink && !isDead
                ? "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.06) 45%, transparent 55%)"
                : "transparent",
            }}
          />

          {/* Hat overlay */}
          {hat && HAT_EMOJI[hat] && !isDead && (
            <motion.span
              aria-hidden
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 -top-2 -translate-x-1/2 text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
            >
              {HAT_EMOJI[hat]}
            </motion.span>
          )}

          {/* Cold shiver / hot sweat */}
          {mood === "cold" && !isDead && (
            <span className="absolute -top-2 right-4 text-2xl animate-pulse">❄️</span>
          )}
          {mood === "hot" && !isDead && (
            <span className="absolute -top-2 right-4 text-2xl animate-pulse">💦</span>
          )}
          {mood === "sick" && !isDead && (
            <span className="absolute -top-3 right-6 text-2xl">🤧</span>
          )}
        </motion.div>
      </motion.button>

      <motion.div
        className="floor-shadow h-6 w-40 -mt-2"
        animate={{ scaleX: [1, 0.85, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function behaviorDuration(b: Behavior): number {
  switch (b) {
    case "walk-left":
    case "walk-right": return 2600;
    case "dance": return 2200;
    case "jump": return 900;
    case "hide": return 2500;
    case "stretch": return 1400;
    case "sit": return 2000;
    case "scratch": return 1200;
    case "trip": return 900;
    case "wobble": return 1400;
    case "look-left":
    case "look-right": return 1200;
    default: return 1500;
  }
}

function buildAnimation(behavior: Behavior, mood: Mood, isDead?: boolean) {
  if (isDead) {
    return {
      container: { x: 0, y: 0, rotate: 0, scale: 0.95, opacity: 0.85 },
      body: { rotate: 0, scaleX: 1, y: 0 },
    };
  }

  // Container drives horizontal position + orientation
  // Body drives vertical bob + squash
  const bobY =
    mood === "sleep" ? [0, -3, 0] :
    mood === "tired" ? [0, -4, 0] :
    mood === "critical" ? [0, -2, 0] :
    mood === "play" || mood === "excited" ? [0, -18, 0] :
    mood === "inlove" ? [0, -12, 0] :
    [0, -9, 0];

  switch (behavior) {
    case "walk-left":
      return {
        container: { x: [-4, -80, -80], rotate: 0, scale: 1 },
        body: { scaleX: -1, y: [0, -6, 0, -6, 0], rotate: 0 },
      };
    case "walk-right":
      return {
        container: { x: [4, 80, 80], rotate: 0, scale: 1 },
        body: { scaleX: 1, y: [0, -6, 0, -6, 0], rotate: 0 },
      };
    case "look-left":
      return { container: { x: 0, rotate: -3, scale: 1 }, body: { scaleX: -1, y: bobY, rotate: 0 } };
    case "look-right":
      return { container: { x: 0, rotate: 3, scale: 1 }, body: { scaleX: 1, y: bobY, rotate: 0 } };
    case "sit":
      return { container: { x: 0, y: 12, rotate: 0, scale: 0.98 }, body: { scaleX: 1, y: [0, -2, 0], rotate: 0 } };
    case "stretch":
      return { container: { x: 0, scale: [1, 1.08, 1], rotate: 0 }, body: { scaleX: 1, y: [0, -12, 0], rotate: [-2, 2, 0] } };
    case "dance":
      return {
        container: { x: [0, -10, 10, -8, 8, 0], rotate: [-6, 6, -6, 6, 0], scale: 1 },
        body: { scaleX: 1, y: [0, -14, 0, -12, 0], rotate: 0 },
      };
    case "jump":
      return { container: { x: 0, rotate: 0, scale: 1 }, body: { scaleX: 1, y: [0, -40, 0], rotate: [0, -8, 0] } };
    case "wobble":
      return { container: { x: [0, -6, 6, -4, 4, 0], rotate: 0, scale: 1 }, body: { scaleX: 1, y: bobY, rotate: [-4, 4, -3, 3, 0] } };
    case "hide":
      return { container: { x: 0, y: 30, rotate: 0, scale: 0.85, opacity: 0.85 }, body: { scaleX: 1, y: 0, rotate: 0 } };
    case "scratch":
      return { container: { x: 0, rotate: [-2, 2, -2, 2, 0], scale: 1 }, body: { scaleX: 1, y: bobY, rotate: 0 } };
    case "trip":
      return { container: { x: [0, 6, -3, 0], rotate: [0, -18, 8, 0], scale: 1 }, body: { scaleX: 1, y: [0, 6, 0], rotate: 0 } };
    default:
      return { container: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }, body: { scaleX: 1, y: bobY, rotate: 0 } };
  }
}

function buildTransition(behavior: Behavior, mood: Mood) {
  const bobDur =
    mood === "sleep" ? 4 :
    mood === "play" || mood === "excited" ? 0.9 :
    mood === "inlove" ? 1.4 :
    2.2;

  const walking = behavior === "walk-left" || behavior === "walk-right";

  return {
    container: {
      duration: walking ? 2.4 : behavior === "dance" ? 1.2 : 0.9,
      ease: "easeInOut" as const,
    },
    body: {
      scaleX: { duration: 0.35 },
      rotate: { duration: 0.9 },
      y: {
        duration: behavior === "jump" ? 0.9 : walking ? 0.6 : bobDur,
        repeat: walking ? 0 : Infinity,
        ease: "easeInOut" as const,
      },
    },
  };
}

function AmbientEffect({ mood }: { mood: Mood }) {
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
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          >
            💗
          </motion.span>
        ))}
      </div>
    );
  }
  if (mood === "crying") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 text-lg"
            style={{ top: "45%", marginLeft: i === 0 ? -22 : i === 1 ? 12 : -8 }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: 40 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3, ease: "easeIn" }}
          >
            💧
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
