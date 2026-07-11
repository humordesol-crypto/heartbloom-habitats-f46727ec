/*
 * src/components/Pet.tsx
 * Fully rigged SVG pet ("Momo") — every body part is an independent motion node.
 * A behavior state machine drives blended transitions between rich animation states,
 * layered on top of always-on micro-animations (breathing, blinking, ear/tail idle, gaze).
 */
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mood, Reaction, Stage } from "@/lib/pet-store";
import type { PetPalette } from "@/lib/species";

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

const DEFAULT_PALETTE: PetPalette = {
  body: ["#ffd1e0", "#ffa8c5", "#ff88ae"],
  belly: ["#fff2f6", "#ffd3e0"],
  ear: ["#ffbcd2", "#ff8fb1"],
  stroke: "#e56a92",
  aura: "oklch(0.78 0.16 350)",
};

/* ─────────────────────────────────────────────────────────── */
/*  STATE MACHINE                                              */
/* ─────────────────────────────────────────────────────────── */

type PetState =
  | "idle" | "happy" | "veryHappy" | "sad" | "cry" | "hungry" | "sleep"
  | "walkLeft" | "walkRight" | "run" | "jump" | "dance" | "laugh"
  | "scared" | "angry" | "sick" | "stretch" | "blink" | "curious"
  | "thinking" | "love"
  | "yawn" | "scratchFace" | "scratchBelly" | "sit" | "standUp"
  | "trip" | "earWiggle" | "tailWag" | "lookLeft" | "lookRight" | "headTilt";

interface Props {
  mood: Mood;
  stage: Stage;
  reaction: Reaction | null;
  hat: string | null;
  floaters: { id: number; icon: string; x: number }[];
  onTap: () => void;
  isDead?: boolean;
  isCritical?: boolean;
  palette?: PetPalette;
  evolving?: boolean;
}

/** Behaviors this mood is allowed to randomly wander into. */
function poolForMood(mood: Mood, dead: boolean, critical: boolean): PetState[] {
  if (dead) return ["idle"];
  if (critical) return ["idle", "sad", "sit"];
  switch (mood) {
    case "sleep":    return ["sleep", "sleep", "sleep", "yawn"];
    case "tired":    return ["idle", "sit", "yawn", "stretch", "headTilt"];
    case "sad":      return ["sad", "sit", "lookLeft", "lookRight", "headTilt"];
    case "crying":   return ["cry", "cry", "sad", "sit"];
    case "sick":     return ["sick", "sit", "yawn"];
    case "scared":   return ["scared", "idle", "lookLeft", "lookRight"];
    case "cold":     return ["idle", "sit", "headTilt", "earWiggle"];
    case "hot":      return ["idle", "sit", "yawn"];
    case "play":     return ["walkLeft", "walkRight", "jump", "dance", "run", "laugh", "earWiggle", "trip"];
    case "excited":  return ["dance", "jump", "laugh", "run", "veryHappy", "earWiggle"];
    case "inlove":   return ["love", "dance", "headTilt", "veryHappy", "earWiggle"];
    case "happy":    return ["happy", "walkLeft", "walkRight", "jump", "stretch", "earWiggle", "scratchFace", "headTilt"];
    case "angry":    return ["angry", "idle", "earWiggle"];
    case "critical": return ["idle", "sad", "sit"];
    default:         return ["idle", "lookLeft", "lookRight", "walkLeft", "walkRight", "sit", "stretch", "headTilt", "earWiggle", "yawn", "scratchFace", "scratchBelly", "curious", "thinking"];
  }
}

function stateDuration(s: PetState): number {
  switch (s) {
    case "walkLeft": case "walkRight":  return 2600;
    case "run":                          return 2200;
    case "dance":                        return 2400;
    case "jump":                         return 900;
    case "sit":                          return 2200;
    case "stretch":                      return 1600;
    case "yawn":                         return 1600;
    case "trip":                         return 900;
    case "scratchFace": case "scratchBelly": return 1800;
    case "earWiggle":                    return 1200;
    case "tailWag":                      return 1600;
    case "lookLeft": case "lookRight":   return 1400;
    case "headTilt":                     return 1800;
    case "cry":                          return 2400;
    case "sad":                          return 2200;
    case "sick":                         return 2400;
    case "scared":                       return 1400;
    case "curious":                      return 1800;
    case "thinking":                     return 2200;
    case "love":                         return 2600;
    case "laugh":                        return 1600;
    case "veryHappy":                    return 1400;
    case "happy":                        return 1800;
    case "angry":                        return 1600;
    case "sleep":                        return 4200;
    default:                             return 1600;
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  COMPONENT                                                  */
/* ─────────────────────────────────────────────────────────── */

export function Pet({ mood, stage, reaction, hat, floaters, onTap, isDead, isCritical, palette, evolving }: Props) {
  const pal = palette ?? DEFAULT_PALETTE;
  const size = stage === "baby" ? 240 : stage === "adult" ? 320 : 280;

  const [state, setState] = useState<PetState>("idle");
  const [thought, setThought] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = useMemo(() => poolForMood(mood, !!isDead, !!isCritical), [mood, isDead, isCritical]);

  // Scheduler: pick next random state after each finishes, blending back to "idle" briefly
  useEffect(() => {
    if (isDead) { setState("idle"); return; }
    let cancelled = false;
    const schedule = () => {
      const delay = 900 + Math.random() * 2400;
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        const next = pool[Math.floor(Math.random() * pool.length)];
        setState(next);
        setTimeout(() => {
          if (cancelled) return;
          setState("idle");
          schedule();
        }, stateDuration(next));
      }, delay);
    };
    schedule();
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pool, isDead]);

  // Thought bubble
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

  // ─── Gaze tracking (pupils follow pointer / touch) ───
  const gazeX = useMotionValue(0);
  const gazeY = useMotionValue(0);
  const sGazeX = useSpring(gazeX, { stiffness: 140, damping: 20, mass: 0.4 });
  const sGazeY = useSpring(gazeY, { stiffness: 140, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (isDead || mood === "sleep") return;
    const el = stageRef.current;
    if (!el) return;
    const handle = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const px = cx - (r.left + r.width / 2);
      const py = cy - (r.top + r.height / 2);
      const max = 6;
      gazeX.set(Math.max(-max, Math.min(max, px / 22)));
      gazeY.set(Math.max(-max, Math.min(max, py / 30)));
    };
    const onMove = (e: PointerEvent) => handle(e.clientX, e.clientY);
    const parent = el.closest("section") ?? window;
    parent.addEventListener("pointermove", onMove as EventListener);
    return () => parent.removeEventListener("pointermove", onMove as EventListener);
  }, [gazeX, gazeY, isDead, mood]);

  // Autonomous glance offsets
  const glance = state === "lookLeft" ? -5 : state === "lookRight" ? 5 : 0;
  const pupilX = useTransform(sGazeX, (v) => v + glance);
  const pupilY = sGazeY;

  return (
    <div ref={stageRef} className="relative flex flex-col items-center justify-center select-none w-full h-full">
      {/* Halo */}
      <div
        aria-hidden
        className="absolute top-8 h-64 w-64 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            isDead || mood === "critical"
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

      <RiggedBody
        size={size}
        mood={mood}
        state={state}
        reaction={reaction}
        thought={thought}
        hat={hat}
        pupilX={pupilX}
        pupilY={pupilY}
        onTap={onTap}
        isDead={isDead}
        pal={pal}
      />

      <motion.div
        className="floor-shadow h-5 w-40 -mt-2"
        animate={{ scaleX: state === "jump" || state === "run" ? [1, 0.55, 1] : [1, 0.92, 1] }}
        transition={{ duration: state === "run" ? 0.35 : 1.6, repeat: Infinity, ease: "easeInOut" as const }}
      />

      {/* Evolution flash overlay */}
      <AnimatePresence>
        {evolving && (
          <motion.div
            key="evo"
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute h-72 w-72 rounded-full"
              style={{ background: `radial-gradient(circle, white, ${pal.aura} 55%, transparent 75%)` }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: [0.2, 1.6, 1.2, 2], opacity: [1, 1, 0.9, 0] }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            />
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-white"
                style={{ boxShadow: `0 0 12px ${pal.aura}` }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 160,
                  y: Math.sin((i / 12) * Math.PI * 2) * 160,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />
            ))}
            <motion.div
              className="absolute text-4xl font-black tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2 }}
            >
              EVOLUINDO!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  RIGGED BODY — each part is its own <motion.g>              */
/* ─────────────────────────────────────────────────────────── */

interface BodyProps {
  size: number;
  mood: Mood;
  state: PetState;
  reaction: Reaction | null;
  thought: string | null;
  hat: string | null;
  pupilX: any;
  pupilY: any;
  onTap: () => void;
  isDead?: boolean;
  pal: PetPalette;
}

function RiggedBody({ size, mood, state, reaction, thought, hat, pupilX, pupilY, onTap, isDead, pal }: BodyProps) {
  // Real (short) blinking loop — independent of state machine
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (isDead) return;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
      if (Math.random() < 0.25) {
        setTimeout(() => setBlink(true), 240);
        setTimeout(() => setBlink(false), 360);
      }
      setTimeout(loop, 2200 + Math.random() * 3800);
    };
    const t = setTimeout(loop, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isDead]);

  // Derived rig targets — Framer Motion blends between successive targets automatically
  const rig = useMemo(() => buildRig(state, mood, !!isDead), [state, mood, isDead]);
  const eyesClosed = blink || rig.eyesClosed;

  // Blend transition (spring-ish) — feels organic, never robotic
  const blend = { type: "spring" as const, stiffness: 170, damping: 18, mass: 0.9 };
  const softBlend = { type: "spring" as const, stiffness: 120, damping: 16, mass: 1 };

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.95 }}
      animate={rig.container}
      transition={rig.containerTransition ?? blend}
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

      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        style={{ overflow: "visible", filter: isDead ? "grayscale(1)" : "drop-shadow(0 14px 22px rgba(180,80,140,0.28))" }}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={pal.body[0]} />
            <stop offset="60%" stopColor={pal.body[1]} />
            <stop offset="100%" stopColor={pal.body[2]} />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={pal.belly[0]} />
            <stop offset="100%" stopColor={pal.belly[1]} />
          </radialGradient>
          <radialGradient id="eyeGrad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f2f6ff" />
          </radialGradient>
          <linearGradient id="earGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.ear[0]} />
            <stop offset="100%" stopColor={pal.ear[1]} />
          </linearGradient>
        </defs>

        {/* Whole rig — breathes + performs state animation */}
        <motion.g
          animate={rig.body}
          transition={rig.bodyTransition ?? softBlend}
          style={{ originX: "200px", originY: "340px", transformBox: "fill-box" as any }}
        >
          {/* ── TAIL (behind body) ── */}
          <motion.g
            style={{ originX: "310px", originY: "260px", transformBox: "fill-box" as any }}
            animate={{ rotate: rig.tailWag }}
            transition={{ duration: rig.tailDur, repeat: Infinity, ease: "easeInOut" as const }}
          >
            <path
              d="M295 250 Q345 210 355 175 Q360 165 350 162 Q335 158 320 180 Q305 210 290 240 Z"
              fill="url(#bodyGrad)"
              stroke="#e56a92"
              strokeWidth="2"
            />
          </motion.g>

          {/* ── LEGS ── */}
          <motion.g
            animate={{ y: rig.legLeftY, rotate: rig.legLeftRot }}
            transition={{ duration: rig.legDur, repeat: rig.legRepeat, ease: "easeInOut" as const }}
            style={{ originX: "160px", originY: "320px", transformBox: "fill-box" as any }}
          >
            <ellipse cx="160" cy="335" rx="26" ry="20" fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2" />
            <ellipse cx="160" cy="342" rx="18" ry="8" fill="#ff6f9a" opacity="0.55" />
          </motion.g>
          <motion.g
            animate={{ y: rig.legRightY, rotate: rig.legRightRot }}
            transition={{ duration: rig.legDur, repeat: rig.legRepeat, ease: "easeInOut" as const }}
            style={{ originX: "240px", originY: "320px", transformBox: "fill-box" as any }}
          >
            <ellipse cx="240" cy="335" rx="26" ry="20" fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2" />
            <ellipse cx="240" cy="342" rx="18" ry="8" fill="#ff6f9a" opacity="0.55" />
          </motion.g>

          {/* ── BODY ── */}
          <ellipse cx="200" cy="260" rx="95" ry="90" fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2.5" />
          <ellipse cx="200" cy="275" rx="60" ry="55" fill="url(#bellyGrad)" opacity="0.9" />

          {/* ── ARMS ── */}
          <motion.g
            animate={{ rotate: rig.armLeftRot, y: rig.armLeftY }}
            transition={{ duration: rig.armDur, repeat: rig.armRepeat, ease: "easeInOut" as const }}
            style={{ originX: "115px", originY: "230px", transformBox: "fill-box" as any }}
          >
            <path d="M115 230 Q95 260 110 295 Q120 305 132 300 Q125 270 130 240 Z"
              fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2" />
          </motion.g>
          <motion.g
            animate={{ rotate: rig.armRightRot, y: rig.armRightY }}
            transition={{ duration: rig.armDur, repeat: rig.armRepeat, ease: "easeInOut" as const }}
            style={{ originX: "285px", originY: "230px", transformBox: "fill-box" as any }}
          >
            <path d="M285 230 Q305 260 290 295 Q280 305 268 300 Q275 270 270 240 Z"
              fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2" />
          </motion.g>

          {/* ── HEAD (with ears, eyes, mouth) ── */}
          <motion.g
            animate={{ rotate: rig.headRot, x: rig.headX, y: rig.headY }}
            transition={softBlend}
            style={{ originX: "200px", originY: "195px", transformBox: "fill-box" as any }}
          >
            {/* Left ear */}
            <motion.g
              animate={{ rotate: rig.earLeftRot }}
              transition={{ duration: rig.earDur, repeat: Infinity, ease: "easeInOut" as const }}
              style={{ originX: "135px", originY: "140px", transformBox: "fill-box" as any }}
            >
              <path d="M135 145 Q110 90 130 70 Q150 65 160 100 Q160 125 150 145 Z"
                fill="url(#earGrad)" stroke="#e56a92" strokeWidth="2" />
              <path d="M138 130 Q130 105 140 90 Q150 92 152 115 Q150 130 145 138 Z"
                fill="#ffd1de" opacity="0.8" />
            </motion.g>
            {/* Right ear */}
            <motion.g
              animate={{ rotate: rig.earRightRot }}
              transition={{ duration: rig.earDur, repeat: Infinity, ease: "easeInOut" as const, delay: 0.15 }}
              style={{ originX: "265px", originY: "140px", transformBox: "fill-box" as any }}
            >
              <path d="M265 145 Q290 90 270 70 Q250 65 240 100 Q240 125 250 145 Z"
                fill="url(#earGrad)" stroke="#e56a92" strokeWidth="2" />
              <path d="M262 130 Q270 105 260 90 Q250 92 248 115 Q250 130 255 138 Z"
                fill="#ffd1de" opacity="0.8" />
            </motion.g>

            {/* Head shape */}
            <ellipse cx="200" cy="170" rx="92" ry="80" fill="url(#bodyGrad)" stroke="#e56a92" strokeWidth="2.5" />

            {/* Brows */}
            <motion.g animate={{ y: rig.browY, rotate: rig.browRot }} transition={blend}>
              <path d={rig.browLeftPath} stroke="#4a2635" strokeWidth="4" strokeLinecap="round" fill="none" opacity={rig.browOpacity} />
              <path d={rig.browRightPath} stroke="#4a2635" strokeWidth="4" strokeLinecap="round" fill="none" opacity={rig.browOpacity} />
            </motion.g>

            {/* Cheeks */}
            <motion.g animate={{ opacity: rig.cheekOpacity }} transition={blend}>
              <ellipse cx="145" cy="195" rx="16" ry="9" fill="#ff88a8" opacity="0.7" />
              <ellipse cx="255" cy="195" rx="16" ry="9" fill="#ff88a8" opacity="0.7" />
            </motion.g>

            {/* Eyes — whites */}
            <g>
              <ellipse cx="165" cy="170" rx="20" ry={rig.eyeRy} fill="url(#eyeGrad)" stroke="#4a2635" strokeWidth="2" />
              <ellipse cx="235" cy="170" rx="20" ry={rig.eyeRy} fill="url(#eyeGrad)" stroke="#4a2635" strokeWidth="2" />
            </g>

            {/* Pupils (follow gaze) */}
            {!rig.heartEyes && (
              <motion.g style={{ x: pupilX, y: pupilY }}>
                <circle cx="165" cy="172" r={rig.pupilR} fill="#2a1620" />
                <circle cx="235" cy="172" r={rig.pupilR} fill="#2a1620" />
                <circle cx="171" cy="167" r="3" fill="#ffffff" />
                <circle cx="241" cy="167" r="3" fill="#ffffff" />
              </motion.g>
            )}

            {/* Heart eyes when in love */}
            {rig.heartEyes && (
              <g>
                <text x="165" y="182" textAnchor="middle" fontSize="30" fill="#ff3d70">♥</text>
                <text x="235" y="182" textAnchor="middle" fontSize="30" fill="#ff3d70">♥</text>
              </g>
            )}

            {/* Eyelids (real blink + forced-close states) */}
            <motion.rect
              x="145" y="152" width="40" height={rig.eyeRy * 2 + 4} rx="18"
              fill="#e78ea6" stroke="#c96684" strokeWidth="1.5"
              style={{ originX: "165px", originY: "170px", transformBox: "fill-box" as any }}
              animate={{ scaleY: eyesClosed ? 1 : 0.02, opacity: eyesClosed ? 1 : 0 }}
              transition={{ duration: 0.12 }}
            />
            <motion.rect
              x="215" y="152" width="40" height={rig.eyeRy * 2 + 4} rx="18"
              fill="#e78ea6" stroke="#c96684" strokeWidth="1.5"
              style={{ originX: "235px", originY: "170px", transformBox: "fill-box" as any }}
              animate={{ scaleY: eyesClosed ? 1 : 0.02, opacity: eyesClosed ? 1 : 0 }}
              transition={{ duration: 0.12 }}
            />

            {/* Mouth */}
            <motion.path
              d={rig.mouth}
              fill={rig.mouthFill}
              stroke="#4a2635"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              animate={{ d: rig.mouth }}
              transition={blend}
            />

            {/* Tongue for laugh/yawn */}
            {rig.tongue && (
              <path d={rig.tongue} fill="#ff6f8e" stroke="#4a2635" strokeWidth="1.5" />
            )}

            {/* Tears */}
            {rig.tears && (
              <>
                <motion.circle
                  cx="150" cy="185" r="4" fill="#7ecff5"
                  animate={{ cy: [185, 235, 235], opacity: [1, 1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeIn" as const }}
                />
                <motion.circle
                  cx="250" cy="185" r="4" fill="#7ecff5"
                  animate={{ cy: [185, 235, 235], opacity: [1, 1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeIn" as const, delay: 0.4 }}
                />
              </>
            )}

            {/* Sweat drop (sick / hot) */}
            {rig.sweat && (
              <motion.text
                x="280" y="140" fontSize="22"
                animate={{ y: [140, 158], opacity: [1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >💧</motion.text>
            )}

            {/* Snowflake (cold) */}
            {rig.cold && (
              <motion.text
                x="280" y="135" fontSize="22"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" as const }}
                style={{ originX: "285px", originY: "135px", transformBox: "fill-box" as any }}
              >❄️</motion.text>
            )}
          </motion.g>
        </motion.g>
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
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  RIG BUILDER — turns state+mood into per-part targets       */
/* ─────────────────────────────────────────────────────────── */

interface Rig {
  container: any;
  containerTransition?: any;
  body: any;
  bodyTransition?: any;

  headRot: number; headX: number; headY: number;

  earLeftRot: number[] | number;
  earRightRot: number[] | number;
  earDur: number;

  eyeRy: number;
  pupilR: number;
  eyesClosed: boolean;
  heartEyes: boolean;

  browY: number; browRot: number;
  browLeftPath: string; browRightPath: string; browOpacity: number;

  cheekOpacity: number;

  mouth: string;
  mouthFill: string;
  tongue?: string;

  tears: boolean; sweat: boolean; cold: boolean;

  armLeftRot: number | number[]; armRightRot: number | number[];
  armLeftY: number | number[]; armRightY: number | number[];
  armDur: number; armRepeat: number;

  legLeftRot: number | number[]; legRightRot: number | number[];
  legLeftY: number | number[]; legRightY: number | number[];
  legDur: number; legRepeat: number;

  tailWag: number[] | number;
  tailDur: number;
}

function buildRig(state: PetState, mood: Mood, dead: boolean): Rig {
  // Base breathing rig
  const base: Rig = {
    container: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    body: { scaleY: [1, 1.035, 1], scaleX: [1, 0.99, 1], y: [0, -2, 0], rotate: 0 },
    bodyTransition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const },
    headRot: 0, headX: 0, headY: 0,
    earLeftRot: [-4, 2, -4], earRightRot: [4, -2, 4], earDur: 3.4,
    eyeRy: 22, pupilR: 6, eyesClosed: false, heartEyes: false,
    browY: 0, browRot: 0,
    browLeftPath: "M148 148 Q160 142 178 148",
    browRightPath: "M222 148 Q234 142 252 148",
    browOpacity: 0,
    cheekOpacity: 0.4,
    mouth: mouthSmall(),
    mouthFill: "#4a2635",
    tears: false, sweat: false, cold: false,
    armLeftRot: [-2, 4, -2], armRightRot: [2, -4, 2],
    armLeftY: 0, armRightY: 0, armDur: 3, armRepeat: Infinity,
    legLeftRot: 0, legRightRot: 0, legLeftY: 0, legRightY: 0,
    legDur: 2, legRepeat: Infinity,
    tailWag: [-8, 8, -8], tailDur: 2.2,
  };

  if (dead) {
    return {
      ...base,
      container: { x: 0, y: 8, rotate: 0, scale: 0.95, opacity: 0.8 },
      body: { scaleY: 0.9, scaleX: 1.05, y: 4 },
      bodyTransition: { duration: 1.2 },
      eyesClosed: true, mouth: mouthFlat(), cheekOpacity: 0,
      earDur: 6, tailDur: 8, armDur: 6,
    };
  }

  // Mood-driven baseline modifiers
  if (mood === "inlove") {
    base.heartEyes = true; base.cheekOpacity = 0.85; base.mouth = mouthSmile(); base.tailWag = [-18, 18, -18]; base.tailDur = 0.8;
  }
  if (mood === "happy" || mood === "excited" || mood === "play") {
    base.mouth = mouthSmile(); base.cheekOpacity = 0.7; base.tailDur = 1.1;
  }
  if (mood === "sad") { base.mouth = mouthSad(); base.browOpacity = 0.8; base.browLeftPath = "M148 152 Q162 145 176 152"; base.browRightPath = "M224 152 Q238 145 252 152"; base.tailDur = 4; }
  if (mood === "crying") { base.mouth = mouthOpenSad(); base.tears = true; base.browOpacity = 0.85; base.tailDur = 4.5; }
  if (mood === "sick") { base.mouth = mouthWavy(); base.sweat = true; base.eyeRy = 14; base.tailDur = 5; }
  if (mood === "cold") { base.cold = true; base.mouth = mouthShiver(); base.tailDur = 4; }
  if (mood === "hot") { base.sweat = true; base.mouth = mouthOpen(); base.tailDur = 3; }
  if (mood === "angry") { base.browOpacity = 1; base.browLeftPath = "M144 158 Q162 148 180 156"; base.browRightPath = "M220 156 Q238 148 256 158"; base.mouth = mouthAngry(); base.cheekOpacity = 0.5; }
  if (mood === "scared") { base.eyeRy = 26; base.pupilR = 4; base.mouth = mouthOpen(); }
  if (mood === "sleep" || mood === "tired") { base.eyesClosed = mood === "sleep"; base.mouth = mouthTiny(); base.tailDur = 6; }

  // State-driven animations (blended on top)
  switch (state) {
    case "happy":
      base.mouth = mouthSmile(); base.headRot = 0;
      base.body = { scaleY: [1, 1.06, 1], y: [0, -6, 0] };
      base.bodyTransition = { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const };
      break;
    case "veryHappy":
    case "laugh":
      base.mouth = mouthLaugh(); base.tongue = tonguePath();
      base.body = { y: [0, -12, 0], scaleY: [1, 1.08, 1] };
      base.bodyTransition = { duration: 0.45, repeat: Infinity, ease: "easeOut" as const };
      base.armLeftRot = [-30, -10, -30]; base.armRightRot = [30, 10, 30]; base.armDur = 0.5;
      base.cheekOpacity = 0.9;
      break;
    case "jump":
      base.container = { y: [0, -60, 0], scale: [1, 1.02, 1], rotate: 0 };
      base.containerTransition = { duration: 0.75, ease: "easeOut" as const };
      base.body = { scaleY: [1, 0.9, 1.1, 0.95, 1], scaleX: [1, 1.1, 0.9, 1.02, 1] };
      base.bodyTransition = { duration: 0.75, ease: "easeOut" as const };
      base.armLeftRot = -40; base.armRightRot = 40;
      base.legLeftRot = 30; base.legRightRot = -30;
      base.mouth = mouthSmile();
      break;
    case "run":
      base.container = { x: [-80, 80], rotate: 0 };
      base.containerTransition = { duration: 1.8, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const };
      base.body = { y: [0, -6, 0], rotate: [-4, 4, -4] };
      base.bodyTransition = { duration: 0.35, repeat: Infinity, ease: "easeInOut" as const };
      base.legLeftY = [0, -12, 0]; base.legRightY = [-12, 0, -12]; base.legDur = 0.35;
      base.armLeftRot = [-30, 10, -30]; base.armRightRot = [30, -10, 30]; base.armDur = 0.35;
      base.earLeftRot = [-15, 5, -15]; base.earRightRot = [15, -5, 15]; base.earDur = 0.35;
      base.tailWag = [-25, 25, -25]; base.tailDur = 0.4;
      base.mouth = mouthOpenSmile();
      break;
    case "walkLeft":
      base.container = { x: [-4, -80, -80], rotate: 0 };
      base.containerTransition = { duration: 2.4, ease: "easeInOut" as const };
      base.body = { y: [0, -4, 0, -4, 0] };
      base.bodyTransition = { duration: 0.55, repeat: Infinity, ease: "easeInOut" as const };
      base.legLeftY = [0, -8, 0]; base.legRightY = [-8, 0, -8]; base.legDur = 0.55;
      base.armLeftRot = [-15, 10, -15]; base.armRightRot = [15, -10, 15]; base.armDur = 0.55;
      break;
    case "walkRight":
      base.container = { x: [4, 80, 80], rotate: 0 };
      base.containerTransition = { duration: 2.4, ease: "easeInOut" as const };
      base.body = { y: [0, -4, 0, -4, 0] };
      base.bodyTransition = { duration: 0.55, repeat: Infinity, ease: "easeInOut" as const };
      base.legLeftY = [-8, 0, -8]; base.legRightY = [0, -8, 0]; base.legDur = 0.55;
      base.armLeftRot = [10, -15, 10]; base.armRightRot = [-10, 15, -10]; base.armDur = 0.55;
      break;
    case "dance":
      base.body = { rotate: [-10, 10, -10, 10, 0], y: [0, -12, 0, -12, 0] };
      base.bodyTransition = { duration: 1.2, ease: "easeInOut" as const };
      base.armLeftRot = [-45, 20, -45]; base.armRightRot = [45, -20, 45]; base.armDur = 0.6;
      base.legLeftRot = [-10, 10, -10]; base.legRightRot = [10, -10, 10]; base.legDur = 0.6;
      base.earLeftRot = [-20, 10, -20]; base.earRightRot = [20, -10, 20]; base.earDur = 0.6;
      base.tailWag = [-30, 30, -30]; base.tailDur = 0.6;
      base.mouth = mouthOpenSmile();
      break;
    case "sad":
    case "cry":
      base.body = { y: [0, 2, 0], scaleY: [1, 0.98, 1] };
      base.bodyTransition = { duration: 3, repeat: Infinity, ease: "easeInOut" as const };
      base.headRot = 0; base.headY = 4;
      base.armLeftRot = 10; base.armRightRot = -10;
      base.tailWag = [-2, 2, -2]; base.tailDur = 5;
      base.mouth = state === "cry" ? mouthOpenSad() : mouthSad();
      base.tears = state === "cry";
      base.browOpacity = 0.9;
      base.browLeftPath = "M148 152 Q162 145 176 152";
      base.browRightPath = "M224 152 Q238 145 252 152";
      break;
    case "hungry":
      base.mouth = mouthOpen(); base.headRot = -4;
      base.armLeftRot = -20; base.armRightRot = 20;
      break;
    case "sleep":
      base.eyesClosed = true; base.mouth = mouthTiny();
      base.body = { scaleY: [1, 1.08, 1], scaleX: [1, 0.96, 1] };
      base.bodyTransition = { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const };
      base.headRot = -8; base.headY = 8;
      base.tailDur = 8;
      break;
    case "yawn":
      base.mouth = mouthYawn(); base.tongue = tonguePath();
      base.eyesClosed = true;
      base.body = { scaleY: [1, 1.1, 1], y: [0, -4, 0] };
      base.bodyTransition = { duration: 1.4 };
      base.armLeftRot = -60; base.armRightRot = 60;
      break;
    case "stretch":
      base.body = { scaleY: [1, 1.18, 1], scaleX: [1, 0.9, 1], y: [0, -8, 0] };
      base.bodyTransition = { duration: 1.4 };
      base.armLeftRot = [-2, -70, -2]; base.armRightRot = [2, 70, 2]; base.armDur = 1.4; base.armRepeat = 0;
      base.mouth = mouthOpen();
      break;
    case "scratchFace":
      base.armLeftRot = [-2, -80, -50, -80, -2]; base.armDur = 1.5; base.armRepeat = 0;
      base.headRot = -6;
      break;
    case "scratchBelly":
      base.armLeftRot = [-2, -40, -10, -40, -2]; base.armRightRot = [2, 40, 10, 40, 2];
      base.armDur = 1.5; base.armRepeat = 0;
      base.mouth = mouthSmile();
      break;
    case "sit":
      base.container = { y: 18, scale: 0.96, rotate: 0 };
      base.body = { scaleY: 0.9, scaleX: 1.08 };
      base.bodyTransition = { duration: 0.6 };
      base.legLeftRot = -15; base.legRightRot = 15;
      break;
    case "standUp":
      base.body = { scaleY: [0.9, 1.05, 1], y: [10, -4, 0] };
      base.bodyTransition = { duration: 0.7 };
      break;
    case "trip":
      base.body = { rotate: [0, -22, 8, 0], y: [0, 8, 0] };
      base.bodyTransition = { duration: 0.9 };
      base.armLeftRot = [-2, -60, 10, -2]; base.armRightRot = [2, 60, -10, 2]; base.armDur = 0.9; base.armRepeat = 0;
      base.mouth = mouthOpen();
      break;
    case "earWiggle":
      base.earLeftRot = [-4, -25, 8, -25, -4]; base.earRightRot = [4, 25, -8, 25, 4]; base.earDur = 0.8;
      break;
    case "tailWag":
      base.tailWag = [-30, 30, -30]; base.tailDur = 0.4;
      break;
    case "lookLeft":
      base.headRot = -6; base.headX = -4;
      break;
    case "lookRight":
      base.headRot = 6; base.headX = 4;
      break;
    case "headTilt":
      base.body = { rotate: [0, -10, -10, 0] };
      base.bodyTransition = { duration: 1.8, ease: "easeInOut" as const };
      base.headRot = -10;
      break;
    case "curious":
      base.headRot = -8; base.eyeRy = 24;
      base.earLeftRot = [-15, 0, -15]; base.earRightRot = [15, 0, 15]; base.earDur = 1.4;
      base.mouth = mouthTiny();
      break;
    case "thinking":
      base.headRot = 6; base.eyeRy = 20;
      base.armLeftRot = -80; base.armDur = 1.4; base.armRepeat = 0;
      base.mouth = mouthTiny();
      break;
    case "love":
      base.heartEyes = true; base.cheekOpacity = 1; base.mouth = mouthSmile();
      base.body = { y: [0, -6, 0], scaleY: [1, 1.05, 1] };
      base.bodyTransition = { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };
      base.tailWag = [-30, 30, -30]; base.tailDur = 0.6;
      break;
    case "scared":
      base.container = { x: [0, -6, 6, -4, 4, 0], y: 0 };
      base.containerTransition = { duration: 0.5, repeat: Infinity };
      base.eyeRy = 26; base.pupilR = 3;
      base.mouth = mouthOpen();
      break;
    case "angry":
      base.browOpacity = 1;
      base.browLeftPath = "M144 158 Q162 148 180 156";
      base.browRightPath = "M220 156 Q238 148 256 158";
      base.mouth = mouthAngry();
      base.body = { rotate: [-3, 3, -3, 3, 0], y: [0, -4, 0] };
      base.bodyTransition = { duration: 0.6, repeat: Infinity };
      break;
    case "sick":
      base.sweat = true; base.mouth = mouthWavy(); base.eyeRy = 14;
      base.body = { rotate: [-2, 2, -2] };
      base.bodyTransition = { duration: 2.5, repeat: Infinity };
      break;
    case "blink":
      base.eyesClosed = true;
      break;
  }

  return base;
}

/* ─────────────────────────────────────────────────────────── */
/*  MOUTH PATHS (all in head local coords, mouth around y≈205) */
/* ─────────────────────────────────────────────────────────── */

const mouthSmall   = () => "M188 210 Q200 218 212 210";
const mouthSmile   = () => "M180 208 Q200 228 220 208";
const mouthOpenSmile = () => "M182 208 Q200 235 218 208 Q200 220 182 208 Z";
const mouthLaugh   = () => "M175 205 Q200 245 225 205 Q200 225 175 205 Z";
const mouthYawn    = () => "M180 200 Q200 250 220 200 Q200 235 180 200 Z";
const mouthOpen    = () => "M188 208 Q200 230 212 208 Q200 220 188 208 Z";
const mouthSad     = () => "M182 220 Q200 205 218 220";
const mouthOpenSad = () => "M182 215 Q200 240 218 215 Q200 225 182 215 Z";
const mouthTiny    = () => "M195 212 Q200 216 205 212";
const mouthFlat    = () => "M188 214 L212 214";
const mouthAngry   = () => "M182 218 Q200 208 218 218 Q200 214 182 218 Z";
const mouthWavy    = () => "M182 214 Q188 208 194 214 Q200 220 206 214 Q212 208 218 214";
const mouthShiver  = () => "M184 214 Q190 210 196 214 Q202 218 208 214 Q214 210 218 214";
const tonguePath   = () => "M192 218 Q200 232 208 218 Q200 228 192 218 Z";

/* ─────────────────────────────────────────────────────────── */
/*  AMBIENT FX + faces                                         */
/* ─────────────────────────────────────────────────────────── */

const FACE_EMOJI: Record<string, string | null> = {
  idle: null,
  happy: "😊", play: "😁", excited: "🤩", inlove: "😍",
  sleep: "😴", tired: "🥱",
  sad: "😢", crying: "😭",
  sick: "🤒", angry: "😡", scared: "😨",
  cold: "🥶", hot: "🥵",
  critical: "😵",
};

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
