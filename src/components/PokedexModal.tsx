import { motion } from "motion/react";
import { useState } from "react";
import { Coins, Check, HeartPulse, Skull } from "lucide-react";
import { Modal } from "./Modal";
import { SPECIES, RARITY_LABEL, RARITY_COLOR, type Species } from "@/lib/species";
import type { GameState, PetState } from "@/lib/pet-store";
import { deriveStage, evolutionName, stageLabel } from "@/lib/pet-store";

interface Props {
  open: boolean;
  onClose: () => void;
  game: GameState;
  hatchSpecies: (s: Species) => { ok: boolean; msg?: string };
  setActive: (id: string) => void;
  releaseDead: (id: string) => void;
}

export function PokedexModal({ open, onClose, game, hatchSpecies, setActive, releaseDead }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const petsBySpecies = new Map<string, PetState>();
  Object.values(game.pets).forEach((p) => {
    const existing = petsBySpecies.get(p.speciesId);
    if (!existing || (existing.isDead && !p.isDead)) petsBySpecies.set(p.speciesId, p);
  });

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1600);
  };

  const handleHatch = (s: Species) => {
    const r = hatchSpecies(s);
    flash(r.ok ? `${s.evolution.baby} chegou! ✨` : r.msg ?? "Erro");
  };

  return (
    <Modal open={open} onClose={onClose} title="Pokédex — Coleção">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.08_80)] px-3 py-1.5">
          <Coins className="h-4 w-4 text-[oklch(0.65_0.19_70)]" />
          <span className="text-sm font-bold">{game.coins}</span>
        </div>
        <div className="text-xs text-muted-foreground font-semibold">
          {game.unlockedSpecies.length}/{SPECIES.length} descobertos
        </div>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center text-xs font-bold text-primary"
        >
          {toast}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {SPECIES.map((s) => {
          const pet = petsBySpecies.get(s.id);
          const owned = !!pet && !pet.isDead;
          const dead = !!pet && pet.isDead;
          const unlocked = game.unlockedSpecies.includes(s.id);
          const active = pet && pet.id === game.activeId;
          const stage = pet ? deriveStage(pet.level) : "baby";
          const canAfford = game.coins >= s.price;

          return (
            <div
              key={s.id}
              className={`rounded-2xl border-2 p-3 flex items-center gap-3 transition-colors ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-white bg-white/80"
              }`}
            >
              <div
                className="relative grid place-items-center h-16 w-16 rounded-2xl text-3xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${s.palette.body[0]}, ${s.palette.body[2]})`,
                  boxShadow: `0 6px 20px -8px ${s.palette.aura}`,
                  filter: unlocked ? "none" : "grayscale(1) brightness(0.6)",
                }}
              >
                <span className="drop-shadow-md">{s.emoji}</span>
                {dead && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 grid place-items-center">
                    <Skull className="h-6 w-6 text-white/90" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="text-sm font-bold truncate">
                    {unlocked ? (pet ? evolutionName(s.id, stage) : s.evolution.baby) : "???"}
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: RARITY_COLOR[s.rarity] }}
                  >
                    {RARITY_LABEL[s.rarity].toUpperCase()}
                  </span>
                  {active && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                      ATIVO
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {unlocked ? s.bio : "Descubra este pet"}
                </div>
                {pet && !dead && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    <span>Nv {pet.level}</span>
                    <span>· {stageLabel(stage)}</span>
                    <span className="flex items-center gap-0.5">
                      <HeartPulse className="h-3 w-3 text-love" />
                      {Math.round(pet.stats.health)}%
                    </span>
                  </div>
                )}
                {pet && !dead && pet.stats.health < 40 && (
                  <div className="text-[10px] font-bold text-destructive mt-0.5">
                    ⚠️ Precisa de cuidado!
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 items-end">
                {owned ? (
                  active ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Check className="h-3 w-3" /> Cuidando
                    </div>
                  ) : (
                    <button
                      onClick={() => setActive(pet!.id)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-soft active:scale-95"
                    >
                      Escolher
                    </button>
                  )
                ) : dead ? (
                  <>
                    <div className="text-[10px] font-bold text-muted-foreground">💔 Faleceu</div>
                    <button
                      onClick={() => releaseDead(pet!.id)}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-foreground/70"
                    >
                      Liberar
                    </button>
                    <button
                      onClick={() => handleHatch(s)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${
                        canAfford ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-foreground/40"
                      }`}
                    >
                      <Coins className="inline h-3 w-3 mr-0.5" />
                      {s.price}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleHatch(s)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${
                      canAfford ? "bg-primary text-primary-foreground shadow-soft active:scale-95" : "bg-muted text-foreground/40"
                    }`}
                  >
                    <Coins className="inline h-3 w-3 mr-0.5" />
                    {s.price === 0 ? "Grátis" : s.price}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Evolução:</strong> cada pet evolui em 3 estágios (Bebê → Jovem → Evoluído)
        conforme sobe de nível. <strong className="text-foreground">Atenção:</strong> pets fora do foco também
        precisam de cuidado — visite-os antes que seja tarde!
      </div>
    </Modal>
  );
}
