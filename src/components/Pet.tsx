import { motion, AnimatePresence } from "motion/react";
import petIdle from "@/assets/pet-idle.png";
import petHappy from "@/assets/pet-happy.png";
import petSleep from "@/assets/pet-sleep.png";
import petSad from "@/assets/pet-sad.png";
import petPlay from "@/assets/pet-play.png";
import type { Mood } from "@/lib/pet-store";

const sprites: Record<Mood, string> = {
  idle: petIdle,
  happy: petHappy,
  sleep: petSleep,
  sad: petSad,
  play: petPlay,
};

interface Props {
  mood: Mood;
  floaters: { id: number; icon: string; x: number }[];
  onTap: () => void;
}

export function Pet({ mood, floaters, onTap }: Props) {
  const bobDuration = mood === "sleep" ? 4 : mood === "play" ? 0.9 : 2.2;
  const bobRange = mood === "sleep" ? 4 : mood === "play" ? 22 : 10;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Halo / glow */}
      <div
        aria-hidden
        className="absolute -top-6 h-64 w-64 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Floating emojis */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -110, scale: [0.6, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              className="absolute text-3xl"
              style={{ left: `${f.x}%`, top: "20%" }}
            >
              {f.icon}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.95 }}
        className="relative outline-none"
        aria-label="Fazer carinho no pet"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={mood}
            src={sprites[mood]}
            alt={`Pet ${mood}`}
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
            className="h-64 w-64 object-contain drop-shadow-[0_18px_25px_rgba(180,80,140,0.25)]"
            draggable={false}
          />
        </AnimatePresence>
      </motion.button>

      {/* Floor shadow */}
      <motion.div
        className="floor-shadow h-6 w-40 -mt-2"
        animate={{ scaleX: [1, 0.85, 1] }}
        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
