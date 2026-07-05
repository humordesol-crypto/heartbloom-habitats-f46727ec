import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "pink" | "sky" | "mint" | "lemon" | "lavender" | "peach";
}

const tones: Record<NonNullable<Props["tone"]>, string> = {
  pink:     "from-[oklch(0.88_0.12_5)] to-[oklch(0.78_0.18_5)]",
  sky:      "from-[oklch(0.9_0.09_230)] to-[oklch(0.78_0.14_230)]",
  mint:     "from-[oklch(0.92_0.09_165)] to-[oklch(0.8_0.13_165)]",
  lemon:    "from-[oklch(0.93_0.11_100)] to-[oklch(0.82_0.16_100)]",
  lavender: "from-[oklch(0.9_0.09_300)] to-[oklch(0.78_0.14_300)]",
  peach:    "from-[oklch(0.92_0.09_55)] to-[oklch(0.8_0.15_55)]",
};

export function ActionButton({ icon: Icon, label, onClick, tone = "pink" }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92, y: 2 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col items-center gap-1"
    >
      <div
        className={`relative grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-b ${tones[tone]} shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25),inset_0_-4px_0_0_rgba(0,0,0,0.08),inset_0_2px_0_0_rgba(255,255,255,0.6)]`}
      >
        <Icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.6} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-foreground/70">{label}</span>
    </motion.button>
  );
}
