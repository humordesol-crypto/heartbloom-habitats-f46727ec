import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Drumstick,
  Droplets,
  Moon,
  ShowerHead,
  Gamepad2,
  Heart,
  Zap,
  Sparkles,
  Cookie,
  Coins,
  Home,
  ShoppingBag,
  Trophy,
  User,
} from "lucide-react";
import { usePet, personalityLabel } from "@/lib/pet-store";
import { Pet } from "@/components/Pet";
import { StatBar } from "@/components/StatBar";
import { ActionButton } from "@/components/ActionButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Momo — Seu pet virtual mágico" },
      {
        name: "description",
        content:
          "Cuide do seu pet virtual moderno. Alimente, brinque, dê carinho e veja sua personalidade evoluir.",
      },
      { property: "og:title", content: "Momo — Seu pet virtual mágico" },
      {
        property: "og:description",
        content: "Um Tamagotchi reinventado para 2026. Fofo, imersivo e cheio de vida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f7c9d7" },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const { state, mood, doAction, floaters } = usePet();
  const xpForLevel = state.level * 25;

  return (
    <div className="min-h-[100dvh] mx-auto flex max-w-md flex-col overflow-hidden px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.85_0.14_330)] shadow-soft">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg leading-tight font-bold">{state.name}</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">
              {personalityLabel(state.personality)} · Nível {state.level}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 border border-white shadow-soft">
          <Coins className="h-4 w-4 text-[oklch(0.78_0.16_80)]" />
          <span className="text-sm font-bold">{state.coins}</span>
        </div>
      </header>

      {/* Level XP bar */}
      <div className="mt-3 h-1.5 rounded-full bg-white/70 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.82_0.16_50)]"
          initial={false}
          animate={{ width: `${(state.xp / xpForLevel) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Stats grid */}
      <section className="mt-4 grid grid-cols-2 gap-2">
        <StatBar icon={Cookie} label="Fome" value={state.stats.hunger} tone="hunger" />
        <StatBar icon={Droplets} label="Sede" value={state.stats.thirst} tone="thirst" />
        <StatBar icon={Zap} label="Energia" value={state.stats.energy} tone="energy" />
        <StatBar icon={Sparkles} label="Higiene" value={state.stats.hygiene} tone="hygiene" />
        <StatBar icon={Gamepad2} label="Diversão" value={state.stats.fun} tone="fun" />
        <StatBar icon={Heart} label="Carinho" value={state.stats.love} tone="love" />
      </section>

      {/* Pet stage */}
      <section className="relative mt-4 flex-1 min-h-[280px] rounded-[2rem] overflow-hidden border border-white/70 shadow-lift"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.97 0.03 320) 0%, oklch(0.94 0.06 300) 45%, oklch(0.92 0.08 340) 100%)",
        }}
      >
        {/* Room decor */}
        <div className="pointer-events-none absolute inset-0">
          {/* window */}
          <div className="absolute left-4 top-4 h-20 w-24 rounded-2xl border-4 border-white/70 bg-gradient-to-b from-[oklch(0.9_0.09_220)] to-[oklch(0.95_0.05_260)] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-[oklch(0.95_0.13_90)] shadow-[0_0_30px_10px_oklch(0.95_0.13_90/0.5)]" />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/70" />
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/70" />
          </div>
          {/* plant */}
          <div className="absolute right-4 top-6">
            <div className="h-10 w-10 rounded-full bg-[oklch(0.75_0.15_150)]" />
            <div className="mx-auto -mt-1 h-6 w-8 rounded-b-lg bg-[oklch(0.7_0.14_30)]" />
          </div>
          {/* floor rug */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[oklch(0.85_0.08_340)] to-transparent" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-3 w-64 rounded-full bg-[oklch(0.88_0.08_20)] opacity-70" />
        </div>

        <div className="relative h-full flex items-center justify-center pt-4">
          <Pet mood={mood} floaters={floaters} onTap={() => doAction("pet", "💖")} />
        </div>

        {/* mood chip */}
        <div className="absolute top-3 right-3 rounded-full glass-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          {moodLabel(mood)}
        </div>
      </section>

      {/* Actions */}
      <section className="mt-4 rounded-[1.75rem] glass-card p-3">
        <div className="grid grid-cols-6 gap-1">
          <ActionButton icon={Drumstick} label="Comer" tone="peach" onClick={() => doAction("feed", "🍗")} />
          <ActionButton icon={Droplets} label="Beber" tone="sky" onClick={() => doAction("drink", "💧")} />
          <ActionButton icon={Moon} label="Dormir" tone="lavender" onClick={() => doAction("sleep", "💤")} />
          <ActionButton icon={ShowerHead} label="Banho" tone="mint" onClick={() => doAction("bath", "🫧")} />
          <ActionButton icon={Gamepad2} label="Brincar" tone="pink" onClick={() => doAction("play", "🎈")} />
          <ActionButton icon={Heart} label="Carinho" tone="pink" onClick={() => doAction("pet", "💖")} />
        </div>
      </section>

      {/* Bottom nav */}
      <nav className="mt-3 flex items-center justify-around rounded-full glass-card px-2 py-2">
        {[
          { icon: Home, label: "Casa", active: true },
          { icon: ShoppingBag, label: "Loja" },
          { icon: Gamepad2, label: "Jogos" },
          { icon: Trophy, label: "Missões" },
          { icon: User, label: "Perfil" },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors ${
              active ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground/60"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.4} />
            <span className="text-[9px] font-bold uppercase">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function moodLabel(mood: string): string {
  return (
    {
      idle: "Tranquilo",
      happy: "Feliz",
      play: "Animado",
      sleep: "Dormindo",
      sad: "Triste",
    } as Record<string, string>
  )[mood] ?? mood;
}
