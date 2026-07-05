import { motion, AnimatePresence } from "motion/react";
import petIdle from "@/assets/pet-idle.png";
import petHappy from "@/assets/pet-happy.png";
import petSleep from "@/assets/pet-sleep.png";
import petSad from "@/assets/pet-sad.png";
import petPlay from "@/assets/pet-play.png";
import petBaby from "@/assets/pet-baby.png";
import petAdult from "@/assets/pet-adult.png";
import type { Mood, Reaction, Stage } from "@/lib/pet-store";

const moodSprites: Record<Mood, string> = {
  idle: petIdle,
  happy: petHappy,
  sleep: petSleep,
  sad: petSad,
  play: petPlay,
};

const HAT_EMOJI: Record<string, string> = {
  "hat-crown": "👑",
  "hat-cap": "🧢",
  "hat-party": "🎉",
};

const REACTION_EMOJI: Record<Reaction, string> = {
  love: "💖",
  yum: "😋",
  sleepy: "💤",
  clean: "🫧",
  excited: "🤩",
  wow: "✨",
  sad: "😢",
};

interface Props {
  mood: Mood;
  stage: Stage;
  reaction: Reaction | null;
  hat: string | null;
  floaters: { id: number; icon: string; x: number }[];
  onTap: () => void;
}

export function Pet({ mood, stage, reaction, hat, floaters, onTap }: Props) {
  // Stage determines base sprite; mood overrides only for adult/child
  const src =
    stage === "baby"
      ? petBaby
      : stage === "adult"
        ? petAdult
        : moodSprites[mood];

  const sizeClass =
    stage === "baby" ? "h-52 w-52" : stage === "adult" ? "h-72 w-72" : "h-64 w-64";

  const bobDuration = mood === "sleep" ? 4 : mood === "play" ? 0.9 : 2.2;
  const bobRange = mood === "sleep" ? 4 : mood === "play" ? 22 : 10;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Halo */}
      <div
        aria-hidden
        className="absolute -top-6 h-64 w-64 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Floaters */}
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

      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.94 }}
        className="relative outline-none"
        aria-label="Fazer carinho no pet"
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
              className="absolute -top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lift border border-white text-2xl"
            >
              {REACTION_EMOJI[reaction]}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${stage}-${mood}`}
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              y: [0, -bobRange, 0],
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              opacity: { duration: 0.25 },
              scale: { type: "spring", stiffness: 180, damping: 14 },
              y: { duration: bobDuration, repeat: Infinity, ease: "easeInOut" },
            }}
            className={`relative ${sizeClass}`}
          >
            <img
              src={src}
              alt={`Pet ${mood}`}
              className="h-full w-full object-contain drop-shadow-[0_18px_25px_rgba(180,80,140,0.25)]"
              draggable={false}
            />
            {/* Hat overlay */}
            {hat && HAT_EMOJI[hat] && (
              <motion.span
                aria-hidden
                animate={{ rotate: [-6, 6, -6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1/2 -top-2 -translate-x-1/2 text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
              >
                {HAT_EMOJI[hat]}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <motion.div
        className="floor-shadow h-6 w-40 -mt-2"
        animate={{ scaleX: [1, 0.85, 1] }}
        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
