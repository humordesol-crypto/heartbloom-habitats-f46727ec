import { useState } from "react";
import { motion } from "motion/react";
import { Coins, Check } from "lucide-react";
import { Modal } from "./Modal";
import { SHOP_ITEMS, type ShopItem, type PetState } from "@/lib/pet-store";

interface Props {
  open: boolean;
  onClose: () => void;
  state: PetState;
  buyItem: (item: ShopItem) => { ok: boolean; msg?: string };
  useItem: (item: ShopItem) => void;
}

const TABS: { key: ShopItem["kind"] | "all"; label: string }[] = [
  { key: "food", label: "Comidas" },
  { key: "drink", label: "Bebidas" },
  { key: "toy", label: "Brinquedos" },
  { key: "hat", label: "Chapéus" },
  { key: "wallpaper", label: "Cenários" },
];

export function ShopModal({ open, onClose, state, buyItem, useItem }: Props) {
  const [tab, setTab] = useState<ShopItem["kind"]>("food");
  const [toast, setToast] = useState<string | null>(null);
  const items = SHOP_ITEMS.filter((i) => i.kind === tab);

  const handleBuy = (item: ShopItem) => {
    const r = buyItem(item);
    setToast(r.ok ? `+ ${item.name}` : r.msg ?? "Erro");
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Loja">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.08_80)] px-3 py-1.5">
          <Coins className="h-4 w-4 text-[oklch(0.65_0.19_70)]" />
          <span className="text-sm font-bold">{state.coins}</span>
        </div>
        {toast && (
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-primary"
          >
            {toast}
          </motion.span>
        )}
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto -mx-1 px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as ShopItem["kind"])}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted text-foreground/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const owned = state.inventory[item.id] ?? 0;
          const unlockable = item.kind === "hat" || item.kind === "wallpaper";
          const isOwned = unlockable && owned > 0;
          const canAfford = state.coins >= item.price;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white/80 border border-white p-3 shadow-soft flex flex-col items-center"
            >
              <div className="text-4xl">{item.emoji}</div>
              <div className="mt-1 text-sm font-bold text-center">{item.name}</div>
              {item.effect && (
                <div className="text-[10px] text-muted-foreground text-center mt-0.5">
                  {Object.entries(item.effect)
                    .map(([k, v]) => `${v! > 0 ? "+" : ""}${v} ${labelFor(k)}`)
                    .join(" · ")}
                </div>
              )}
              {!unlockable && owned > 0 && (
                <div className="text-[10px] text-primary font-bold mt-1">
                  Estoque: {owned}
                </div>
              )}
              <div className="mt-2 flex flex-col gap-1 w-full">
                {isOwned ? (
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-[oklch(0.55_0.15_150)] py-1.5">
                    <Check className="h-3.5 w-3.5" /> Desbloqueado
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      canAfford
                        ? "bg-primary text-primary-foreground shadow-soft active:scale-95"
                        : "bg-muted text-foreground/40"
                    }`}
                  >
                    <Coins className="h-3 w-3" /> {item.price}
                  </button>
                )}
                {!unlockable && owned > 0 && (
                  <button
                    onClick={() => useItem(item)}
                    className="py-1.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground active:scale-95"
                  >
                    Usar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function labelFor(k: string) {
  return (
    {
      hunger: "fome",
      thirst: "sede",
      energy: "energia",
      hygiene: "higiene",
      fun: "diversão",
      love: "amor",
    } as Record<string, string>
  )[k] ?? k;
}
