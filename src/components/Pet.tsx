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

  const eyesClosed =
    isDead ||
    mood === "sleep" ||
    mood === "crying" ||
    behavior === "yawn" ||
    (mood === "inlove" && Math.random() < 0) || // handled with heart-eyes below
    blink;

  const heartEyes = mood === "inlove";
  const angryBrows = mood === "angry";
  const worriedBrows = mood === "scared" || mood === "sick";

  const mouthPath = mouthForMood(mood, behavior);
  const cheekBlush = mood === "inlove" || mood === "happy" || mood === "excited" || mood === "hot";
  const skin = mood === "sick" ? "#c8d9c0" : mood === "cold" ? "#c8d6e6" : mood === "hot" ? "#f6b6b8" : "#f7c9d7";
  const skinDark = mood === "sick" ? "#a3b699" : mood === "cold" ? "#9db4c6" : mood === "hot" ? "#e08f95" : "#e79fb6";

  // Tail wag speed by mood
  const tailWagSpeed =
    mood === "play" || mood === "excited" ? 0.35 :
    mood === "happy" || mood === "inlove" ? 0.6 :
    mood === "sad" || mood === "sick" || mood === "crying" ? 2.5 :
    isDead ? 0 : 1.4;

  // Ear angles for emotion
  const earBase =
    mood === "sad" || mood === "crying" || mood === "sick" ? 20 :
    mood === "scared" ? 35 :
    mood === "angry" ? -25 :
    mood === "inlove" || mood === "happy" ? -5 : 0;

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
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-[0_18px_25px_rgba(180,80,140,0.28)]"
        >
          <defs>
            <radialGradient id="bodyGrad" cx="45%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={skin} />
              <stop offset="100%" stopColor={skinDark} />
            </radialGradient>
            <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff8fb0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff8fb0" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="earInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd3e0" />
              <stop offset="100%" stopColor="#f2a9c2" />
            </linearGradient>
          </defs>

          {/* Tail (behind body) */}
          <motion.g
            style={{ transformOrigin: "155px 175px" }}
            animate={
              isDead
                ? { rotate: 0 }
                : mood === "sad" || mood === "sick" || mood === "crying"
                ? { rotate: [0, -3, 0] }
                : { rotate: [-15, 25, -15] }
            }
            transition={{
              duration: tailWagSpeed || 0.001,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <path
              d="M155 175 Q185 165 190 195 Q195 220 175 215"
              fill="none"
              stroke={skinDark}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <circle cx="178" cy="212" r="10" fill={skin} />
          </motion.g>

          {/* Feet */}
          <motion.g
            animate={
              behavior === "walk-left" || behavior === "walk-right"
                ? { y: [0, -4, 0, -4, 0] }
                : behavior === "dance"
                ? { y: [0, -6, 0, -6, 0] }
                : { y: 0 }
            }
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <ellipse cx="78" cy="222" rx="16" ry="8" fill={skinDark} />
            <ellipse cx="122" cy="222" rx="16" ry="8" fill={skinDark} />
          </motion.g>

          {/* Left ear */}
          <Ear side="left" mood={mood} behavior={behavior} baseAngle={earBase} skin={skin} />
          {/* Right ear */}
          <Ear side="right" mood={mood} behavior={behavior} baseAngle={-earBase} skin={skin} />

          {/* Body */}
          <ellipse cx="100" cy="150" rx="72" ry="70" fill="url(#bodyGrad)" />
          {/* Belly highlight */}
          <ellipse cx="100" cy="175" rx="45" ry="30" fill="#ffffff" opacity="0.35" />

          {/* Arms */}
          <Arm side="left" behavior={behavior} mood={mood} skin={skin} skinDark={skinDark} />
          <Arm side="right" behavior={behavior} mood={mood} skin={skin} skinDark={skinDark} />

          {/* Cheeks */}
          {cheekBlush && (
            <>
              <ellipse cx="60" cy="150" rx="14" ry="9" fill="url(#cheekGrad)" />
              <ellipse cx="140" cy="150" rx="14" ry="9" fill="url(#cheekGrad)" />
            </>
          )}

          {/* Brows */}
          {angryBrows && (
            <>
              <line x1="66" y1="110" x2="86" y2="118" stroke="#3a2530" strokeWidth="4" strokeLinecap="round" />
              <line x1="134" y1="118" x2="114" y2="110" stroke="#3a2530" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {worriedBrows && (
            <>
              <path d="M66 118 Q76 112 88 118" stroke="#3a2530" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M112 118 Q124 112 134 118" stroke="#3a2530" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Eyes */}
          <Eye
            cx={78} cy={135} closed={eyesClosed} heart={heartEyes}
            gazeX={gazeX} gazeY={gazeY}
          />
          <Eye
            cx={122} cy={135} closed={eyesClosed} heart={heartEyes}
            gazeX={gazeX} gazeY={gazeY}
          />

          {/* Mouth */}
          <motion.g
            animate={{ scale: behavior === "yawn" ? [1, 1.6, 1] : 1 }}
            transition={{ duration: 1.2 }}
            style={{ transformOrigin: "100px 168px" }}
          >
            <path
              d={mouthPath}
              fill={mood === "angry" ? "#4a2030" : mood === "sick" ? "#7a5a5a" : "#5c2a3d"}
              stroke="#5c2a3d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Tongue for happy/yum */}
            {(behavior === "yawn" || mood === "excited") && (
              <ellipse cx="100" cy="175" rx="8" ry="4" fill="#ff7a99" />
            )}
          </motion.g>

          {/* Special: teardrops when crying */}
          {mood === "crying" && !isDead && (
            <>
              <motion.circle
                cx="78" cy="150" r="3.5" fill="#7ecff5"
                animate={{ y: [0, 30], opacity: [1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.circle
                cx="122" cy="150" r="3.5" fill="#7ecff5"
                animate={{ y: [0, 30], opacity: [1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}

          {/* Sick sweat */}
          {mood === "sick" && !isDead && (
            <motion.circle
              cx="145" cy="115" r="3" fill="#a8d8ff"
              animate={{ y: [0, 18], opacity: [1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}
        </svg>

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

function Ear({
  side, mood, behavior, baseAngle, skin,
}: {
  side: "left" | "right"; mood: Mood; behavior: Behavior; baseAngle: number; skin: string;
}) {
  const isLeft = side === "left";
  const cx = isLeft ? 62 : 138;
  const cy = 85;
  const origin = `${cx}px ${cy + 15}px`;
  const rotate =
    behavior === "ear-wiggle"
      ? [baseAngle, baseAngle + (isLeft ? 20 : -20), baseAngle - 5, baseAngle]
      : behavior === "walk-left" || behavior === "walk-right"
      ? [baseAngle - 4, baseAngle + 4, baseAngle - 4]
      : mood === "scared"
      ? [baseAngle, baseAngle + 2, baseAngle]
      : [baseAngle, baseAngle + (isLeft ? -3 : 3), baseAngle];
  const duration = behavior === "ear-wiggle" ? 0.9 : 3.6;

  return (
    <motion.g
      style={{ transformOrigin: origin }}
      animate={{ rotate }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" as const }}
    >
      <ellipse cx={cx} cy={cy} rx="18" ry="30" fill={skin} />
      <ellipse cx={cx} cy={cy + 4} rx="9" ry="20" fill="url(#earInner)" />
    </motion.g>
  );
}

function Arm({
  side, behavior, mood, skin, skinDark,
}: {
  side: "left" | "right"; behavior: Behavior; mood: Mood; skin: string; skinDark: string;
}) {
  const isLeft = side === "left";
  const cx = isLeft ? 32 : 168;
  const cy = 168;
  const origin = `${isLeft ? 42 : 158}px 155px`;

  let rotate: number | number[] = 0;
  const dur = 0.9;
  let repeat: number | undefined = Infinity;

  if (behavior === "dance") {
    rotate = isLeft ? [-30, 30, -30] : [30, -30, 30];
  } else if (behavior === "jump" || mood === "excited") {
    rotate = isLeft ? [-20, -60, -20] : [20, 60, 20];
  } else if (behavior === "scratch") {
    rotate = isLeft ? [-70, -55, -70] : 15;
    if (!isLeft) repeat = undefined;
  } else if (behavior === "stretch") {
    rotate = isLeft ? -80 : 80;
    repeat = undefined;
  } else if (behavior === "walk-left" || behavior === "walk-right") {
    rotate = isLeft ? [-8, 8, -8] : [8, -8, 8];
  } else if (mood === "sad" || mood === "crying") {
    rotate = isLeft ? 8 : -8;
    repeat = undefined;
  } else if (mood === "inlove") {
    rotate = isLeft ? [-4, 6, -4] : [4, -6, 4];
  }

  return (
    <motion.g
      style={{ transformOrigin: origin }}
      animate={{ rotate }}
      transition={{ duration: dur, repeat, ease: "easeInOut" as const }}
    >
      <ellipse cx={cx} cy={cy} rx="12" ry="18" fill={skinDark} />
      <circle cx={cx} cy={cy + 10} r="9" fill={skin} />
    </motion.g>
  );
}

function Eye({
  cx, cy, closed, heart, gazeX, gazeY,
}: {
  cx: number; cy: number; closed: boolean; heart: boolean;
  gazeX: any; gazeY: any;
}) {
  if (heart) {
    return (
      <g transform={`translate(${cx - 10} ${cy - 10})`}>
        <motion.path
          d="M10 4 C7 -1 0 0 0 6 C0 12 10 18 10 18 C10 18 20 12 20 6 C20 0 13 -1 10 4Z"
          fill="#ff4d7d"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ transformOrigin: "10px 10px" }}
        />
      </g>
    );
  }
  if (closed) {
    return (
      <path
        d={`M${cx - 10} ${cy} Q${cx} ${cy + 6} ${cx + 10} ${cy}`}
        stroke="#3a2530"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="11" ry="13" fill="#ffffff" />
      <motion.g style={{ x: gazeX, y: gazeY }}>
        <circle cx={cx} cy={cy + 1} r="7" fill="#2a1a2a" />
        <circle cx={cx + 2} cy={cy - 2} r="2.4" fill="#ffffff" />
        <circle cx={cx - 3} cy={cy + 4} r="1.2" fill="#ffffff" opacity="0.7" />
      </motion.g>
    </g>
  );
}

/* ============================================================ */
/*                     MOUTH SHAPES + BEHAVIOR                  */
/* ============================================================ */

const FACE_EMOJI: Record<string, string | null> = {
  idle: null,
  happy: "😊", play: "😁", excited: "🤩", inlove: "😍",
  sleep: "😴", tired: "🥱",
  sad: "😢", crying: "😭",
  sick: "🤒", angry: "😡", scared: "😨",
  cold: "🥶", hot: "🥵",
  critical: "😵",
};

function mouthForMood(mood: Mood, behavior: Behavior): string {
  if (behavior === "yawn") return "M85 165 Q100 195 115 165 Q100 178 85 165Z";
  switch (mood) {
    case "happy":
    case "play":
    case "excited":
    case "inlove":
      return "M84 165 Q100 188 116 165 Q100 178 84 165Z";
    case "sad":
    case "crying":
      return "M84 178 Q100 162 116 178";
    case "sick":
      return "M86 172 Q100 178 114 168";
    case "angry":
      return "M84 175 L116 172";
    case "scared":
      return "M92 170 Q100 178 108 170 Q100 174 92 170Z";
    case "tired":
    case "sleep":
      return "M92 170 Q100 176 108 170";
    case "cold":
      return "M90 172 Q95 176 100 172 Q105 176 110 172";
    case "hot":
      return "M86 168 Q100 182 114 168 Q100 176 86 168Z";
    case "critical":
      return "M86 175 Q100 170 114 175";
    default:
      return "M90 168 Q100 175 110 168";
  }
}

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
