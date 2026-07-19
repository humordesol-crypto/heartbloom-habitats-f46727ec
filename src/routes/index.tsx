import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Shirt,
  BookOpen,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";
import {
  usePet,
  stageLabel,
  evolutionName,
} from "@/lib/pet-store";
import { Pet3D as Pet } from "@/components/Pet3D";
import { ShopModal } from "@/components/ShopModal";
import { MemoryGame } from "@/components/MemoryGame";
import { WardrobeModal, wallpaperCSS } from "@/components/WardrobeModal";
import { MemorialScreen } from "@/components/MemorialScreen";
import { PokedexModal } from "@/components/PokedexModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Momo — Colecione e cuide de pets mágicos" },
      {
        name: "description",
        content:
          "Adote, evolua e colecione pets virtuais únicos. Cada criatura tem sua personalidade, evolução e precisa do seu cuidado diário.",
      },
      { property: "og:title", content: "Momo — Colecione e cuide de pets mágicos" },
      {
        property: "og:description",
        content: "Um universo de pets colecionáveis com evolução, emoções e cuidado real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f7c9d7" },
    ],
  }),
  component: HomeScreen,
});

type Panel = "shop" | "game" | "wardrobe" | "pokedex" | null;

function HomeScreen() {
  const {
    state,
    game,
    species,
    mood,
    stage,
    reaction,
    doAction,
    buyItem,
    useItem,
    equipHat,
    setWallpaper,
    rewardGame,
    floaters,
    isCritical,
    greeting,
    dismissGreeting,
    startNewPet,
    hatchSpecies,
    setActive,
    releaseDead,
    evolving,
  } = usePet();
  const [panel, setPanel] = useState<Panel>(null);
  const xpForLevel = state.level * 25;
  const xpPct = Math.min(100, (state.xp / xpForLevel) * 100);

  const wpBg = wallpaperCSS(state.wallpaper);
  const isDarkWp = state.wallpaper === "space";
  const displayName = evolutionName(state.speciesId, stage);

  const miniStats = [
    { icon: Cookie,     value: state.stats.hunger,  tone: "hunger"  as const, label: "Fome" },
    { icon: Droplets,   value: state.stats.thirst,  tone: "thirst"  as const, label: "Sede" },
    { icon: Zap,        value: state.stats.energy,  tone: "energy"  as const, label: "Energia" },
    { icon: Sparkles,   value: state.stats.hygiene, tone: "hygiene" as const, label: "Higiene" },
    { icon: Gamepad2,   value: state.stats.fun,     tone: "fun"     as const, label: "Diversão" },
    { icon: Heart,      value: state.stats.love,    tone: "love"    as const, label: "Carinho" },
    { icon: HeartPulse, value: state.stats.health,  tone: "love"    as const, label: "Saúde" },
  ];

  return (
    <>
      <AnimatedBackground auraColor={species.palette.aura} />

      {/* Full-screen pet stage (behind UI) */}
      <div
        className={`fixed inset-0 -z-0 overflow-hidden ${isCritical ? "" : ""}`}
        style={{ background: wpBg }}
      >
        <div className="pointer-events-none absolute inset-0">
          {state.wallpaper === "candy" && <CandyDecor />}
          {state.wallpaper === "sky" && <SkyDecor />}
          {state.wallpaper === "forest" && <ForestDecor />}
          {state.wallpaper === "space" && <SpaceDecor />}
        </div>

        {isCritical && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background:
                "radial-gradient(circle at center, transparent 40%, color-mix(in oklab, var(--destructive) 45%, transparent) 100%)",
            }}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[min(84vw,340px)] aspect-square">
            <Pet
              mood={mood}
              stage={stage}
              reaction={reaction}
              hat={state.equippedHat}
              floaters={floaters}
              onTap={() => doAction("pet", "💖")}
              isDead={state.isDead}
              isCritical={isCritical}
              palette={species.palette}
              evolving={evolving}
            />
          </div>
        </div>
      </div>

      {/* UI overlays */}
      <div className="relative z-10 min-h-[100dvh] mx-auto flex max-w-md flex-col px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pointer-events-none">
        {/* Header */}
        <header className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full glass-card px-2.5 py-1.5">
            <div
              className="grid place-items-center h-8 w-8 rounded-full text-sm"
              style={{
                background: `linear-gradient(135deg, ${species.palette.body[0]}, ${species.palette.body[2]})`,
              }}
            >
              {species.emoji}
            </div>
            <div className="pr-1.5">
              <h1 className="text-sm leading-tight font-bold">{displayName}</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                {stageLabel(stage)} · Nv {state.level}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full glass-card px-2.5 py-1.5 ${
              isDarkWp ? "text-white" : ""
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {moodLabel(mood)}
            </span>
            <span className="h-3 w-px bg-current/30" />
            <Coins className="h-3.5 w-3.5 text-[oklch(0.78_0.16_80)]" />
            <span className="text-xs font-bold">{state.coins}</span>
          </div>
        </header>

        {/* XP */}
        <div className="mt-2 h-1 rounded-full bg-white/60 overflow-hidden pointer-events-auto">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.82_0.16_50)]"
            initial={false}
            animate={{ width: `${xpPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        {/* Mini stats — compact horizontal row */}
        <section className="mt-2 pointer-events-auto">
          <div className="flex items-center gap-1 rounded-full glass-card px-2 py-1.5">
            {miniStats.map((s) => (
              <MiniStat key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* Critical/greeting banners */}
        <AnimatePresence>
          {isCritical && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="mt-2 flex items-center gap-2 rounded-2xl bg-destructive/95 text-destructive-foreground px-3 py-2 shadow-lift pointer-events-auto"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold leading-tight">
                {state.name} precisa de você agora!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {greeting && !isCritical && (
            <motion.button
              onClick={dismissGreeting}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="mt-2 self-start rounded-2xl glass-card px-3 py-1.5 text-xs font-bold shadow-soft pointer-events-auto"
            >
              {greeting === "missed"
                ? `😢 ${state.name} sentiu sua falta!`
                : `😊 Que bom te ver!`}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Spacer — lets the pet breathe */}
        <div className="flex-1" />

        {/* Actions */}
        <section className="rounded-full glass-card p-1.5 pointer-events-auto">
          <div className="grid grid-cols-6 gap-0.5">
            <MiniAction icon={Drumstick} label="Comer"   onClick={() => doAction("feed", "🍗")} />
            <MiniAction icon={Droplets}  label="Beber"   onClick={() => doAction("drink", "💧")} />
            <MiniAction icon={Moon}      label="Dormir"  onClick={() => doAction("sleep", "💤")} />
            <MiniAction icon={ShowerHead}label="Banho"   onClick={() => doAction("bath", "🫧")} />
            <MiniAction icon={Gamepad2}  label="Brincar" onClick={() => doAction("play", "🎈")} />
            <MiniAction icon={Heart}     label="Carinho" onClick={() => doAction("pet", "💖")} />
          </div>
        </section>

        {/* Bottom nav */}
        <nav className="mt-1.5 flex items-center justify-around rounded-full glass-card px-1.5 py-1 pointer-events-auto">
          {[
            { icon: Home, label: "Casa", onClick: () => setPanel(null), active: panel === null },
            { icon: BookOpen, label: "Pokédex", onClick: () => setPanel("pokedex"), active: panel === "pokedex" },
            { icon: ShoppingBag, label: "Loja", onClick: () => setPanel("shop"), active: panel === "shop" },
            { icon: Gamepad2, label: "Jogos", onClick: () => setPanel("game"), active: panel === "game" },
            { icon: Shirt, label: "Estilo", onClick: () => setPanel("wardrobe"), active: panel === "wardrobe" },
          ].map(({ icon: Icon, label, onClick, active }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-center justify-center rounded-full h-8 w-8 transition-colors ${
                active ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground/60"
              }`}
              aria-label={label}
            >
              <Icon className="h-4 w-4" strokeWidth={2.4} />
            </button>
          ))}
        </nav>

        <ShopModal
          open={panel === "shop"}
          onClose={() => setPanel(null)}
          state={state}
          buyItem={buyItem}
          useItem={useItem}
        />
        <MemoryGame
          open={panel === "game"}
          onClose={() => setPanel(null)}
          onWin={rewardGame}
          bestScore={state.bestMemoryScore}
        />
        <WardrobeModal
          open={panel === "wardrobe"}
          onClose={() => setPanel(null)}
          state={state}
          equipHat={equipHat}
          setWallpaper={setWallpaper}
        />
        <PokedexModal
          open={panel === "pokedex"}
          onClose={() => setPanel(null)}
          game={game}
          hatchSpecies={hatchSpecies}
          setActive={(id) => { setActive(id); setPanel(null); }}
          releaseDead={releaseDead}
        />
        <MemorialScreen
          open={state.isDead}
          memorial={state.memorial}
          onNewPet={startNewPet}
        />
      </div>
    </>
  );
}

interface MiniStatProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: number;
  tone: "hunger" | "thirst" | "energy" | "hygiene" | "fun" | "love";
  label: string;
}

const TONE_BG: Record<MiniStatProps["tone"], string> = {
  hunger: "bg-hunger",
  thirst: "bg-thirst",
  energy: "bg-energy",
  hygiene: "bg-hygiene",
  fun: "bg-fun",
  love: "bg-love",
};
const TONE_TEXT: Record<MiniStatProps["tone"], string> = {
  hunger: "text-hunger",
  thirst: "text-thirst",
  energy: "text-energy",
  hygiene: "text-hygiene",
  fun: "text-fun",
  love: "text-love",
};

function MiniStat({ icon: Icon, value, tone, label }: MiniStatProps) {
  const low = value < 30;
  return (
    <div
      className="group relative flex-1 flex flex-col items-center gap-0.5"
      title={`${label}: ${Math.round(value)}%`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${low ? "text-destructive" : TONE_TEXT[tone]}`}
        strokeWidth={2.6}
      />
      <div className="h-1 w-full rounded-full bg-black/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${low ? "bg-destructive" : TONE_BG[tone]}`}
          initial={false}
          animate={{ width: `${Math.max(3, value)}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
}

function MiniAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid place-items-center h-10 rounded-full bg-white/80 hover:bg-white active:scale-95 transition-all shadow-[0_2px_6px_-2px_rgba(0,0,0,0.15)]"
    >
      <Icon className="h-4 w-4 text-foreground/80" strokeWidth={2.4} />
    </button>
  );
}

function moodLabel(mood: string): string {
  return (
    {
      idle: "Tranquilo",
      happy: "Feliz",
      play: "Animado",
      excited: "Empolgado",
      inlove: "Apaixonado",
      sleep: "Dormindo",
      tired: "Cansado",
      sad: "Triste",
      crying: "Chorando",
      sick: "Doente",
      angry: "Bravo",
      scared: "Assustado",
      cold: "Com frio",
      hot: "Com calor",
      critical: "Crítico",
    } as Record<string, string>
  )[mood] ?? mood;
}

function CandyDecor() {
  return (
    <>
      <div className="absolute left-4 top-4 h-20 w-24 rounded-2xl border-4 border-white/70 bg-gradient-to-b from-[oklch(0.9_0.09_220)] to-[oklch(0.95_0.05_260)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-[oklch(0.95_0.13_90)] shadow-[0_0_30px_10px_oklch(0.95_0.13_90/0.5)]" />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/70" />
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/70" />
      </div>
      <div className="absolute right-4 top-6">
        <div className="h-10 w-10 rounded-full bg-[oklch(0.75_0.15_150)]" />
        <div className="mx-auto -mt-1 h-6 w-8 rounded-b-lg bg-[oklch(0.7_0.14_30)]" />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[oklch(0.85_0.08_340)] to-transparent" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-3 w-64 rounded-full bg-[oklch(0.88_0.08_20)] opacity-70" />
    </>
  );
}

function SkyDecor() {
  return (
    <>
      <div className="absolute left-6 top-6 text-5xl opacity-90">☁️</div>
      <div className="absolute right-10 top-14 text-4xl opacity-80">☁️</div>
      <div className="absolute right-6 top-4 text-3xl">🌤️</div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[oklch(0.85_0.1_220)] to-transparent" />
    </>
  );
}

function ForestDecor() {
  return (
    <>
      <div className="absolute left-4 top-4 text-4xl">🌳</div>
      <div className="absolute right-4 top-8 text-4xl">🌲</div>
      <div className="absolute left-1/2 top-3 text-2xl">🦋</div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[oklch(0.7_0.14_140)] to-transparent" />
      <div className="absolute bottom-6 left-6 text-2xl">🌷</div>
      <div className="absolute bottom-4 right-8 text-2xl">🍄</div>
    </>
  );
}

function SpaceDecor() {
  return (
    <>
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 90}%`,
              opacity: 0.5 + ((i * 7) % 5) / 10,
              boxShadow: "0 0 6px white",
            }}
          />
        ))}
      </div>
      <div className="absolute right-4 top-4 text-4xl">🌙</div>
      <div className="absolute left-6 top-10 text-3xl">🪐</div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[oklch(0.2_0.08_290)] to-transparent" />
    </>
  );
}
