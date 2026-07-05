import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "hunger" | "thirst" | "energy" | "hygiene" | "fun" | "love";
}

const toneClass: Record<Props["tone"], string> = {
  hunger: "bg-hunger",
  thirst: "bg-thirst",
  energy: "bg-energy",
  hygiene: "bg-hygiene",
  fun: "bg-fun",
  love: "bg-love",
};

const toneRing: Record<Props["tone"], string> = {
  hunger: "text-hunger",
  thirst: "text-thirst",
  energy: "text-energy",
  hygiene: "text-hygiene",
  fun: "text-fun",
  love: "text-love",
};

export function StatBar({ icon: Icon, label, value, tone }: Props) {
  const low = value < 30;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-card/70 backdrop-blur-md px-3 py-2 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.15)] border border-white/60">
      <div className={`grid place-items-center h-8 w-8 rounded-full bg-white ${toneRing[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className={`text-[11px] font-bold ${low ? "text-destructive" : "text-foreground/70"}`}>
            {Math.round(value)}
          </span>
        </div>
        <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${toneClass[tone]}`}
            initial={false}
            animate={{ width: `${Math.max(2, value)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
