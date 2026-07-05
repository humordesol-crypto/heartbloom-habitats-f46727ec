import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Memorial } from "@/lib/pet-store";

interface Props {
  open: boolean;
  memorial: Memorial | null;
  onNewPet: (name: string) => void;
}

export function MemorialScreen({ open, memorial, onNewPet }: Props) {
  const [name, setName] = useState("");
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 backdrop-blur-md" />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="relative w-full max-w-sm rounded-[2rem] bg-card border border-white/60 shadow-lift p-6 text-center"
          >
            {/* Light particles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
              {[...Array(14)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]"
                  style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6], y: [-4, -20, -4] }}
                  transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>

            <div className="relative">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.85_0.14_330)] shadow-lift">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Uma jornada especial</h2>
              {memorial && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{memorial.name}</span> viveu{" "}
                  <span className="font-semibold text-foreground">{memorial.daysAlive} dia{memorial.daysAlive > 1 ? "s" : ""}</span>,
                  alcançou o nível {memorial.maxLevel} e era{" "}
                  <span className="font-semibold text-foreground">{memorial.personality}</span>.
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3 text-love" /> Suas moedas e itens permanecem com você.
              </p>

              <div className="mt-6 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Nome do novo amigo
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 14))}
                  placeholder="Ex: Luna"
                  className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => onNewPet(name.trim() || "Momo")}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-primary to-[oklch(0.82_0.16_50)] py-3 text-base font-bold text-primary-foreground shadow-lift active:scale-95 transition-transform"
              >
                Iniciar nova jornada
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
