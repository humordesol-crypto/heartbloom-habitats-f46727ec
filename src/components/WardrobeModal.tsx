import { Modal } from "./Modal";
import { SHOP_ITEMS, type PetState } from "@/lib/pet-store";
import { Check, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  state: PetState;
  equipHat: (id: string | null) => void;
  setWallpaper: (id: string) => void;
}

export function WardrobeModal({ open, onClose, state, equipHat, setWallpaper }: Props) {
  const hats = SHOP_ITEMS.filter((i) => i.kind === "hat");
  const wallpapers = SHOP_ITEMS.filter((i) => i.kind === "wallpaper");

  return (
    <Modal open={open} onClose={onClose} title="Guarda-roupa & Quarto">
      <section className="mb-5">
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Chapéus</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => equipHat(null)}
            className={`aspect-square rounded-2xl border-2 grid place-items-center bg-white text-3xl ${
              state.equippedHat === null ? "border-primary" : "border-white"
            }`}
          >
            🚫
          </button>
          {hats.map((h) => {
            const owned = (state.inventory[h.id] ?? 0) > 0;
            const active = state.equippedHat === h.id;
            return (
              <button
                key={h.id}
                onClick={() => owned && equipHat(h.id)}
                disabled={!owned}
                className={`aspect-square rounded-2xl border-2 grid place-items-center bg-white text-3xl relative ${
                  active ? "border-primary shadow-soft" : "border-white"
                } ${!owned ? "opacity-50" : ""}`}
              >
                {h.emoji}
                {!owned && (
                  <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                )}
                {active && (
                  <Check className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white rounded-full p-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Cenários</h3>
        <div className="grid grid-cols-2 gap-2">
          {wallpapers.map((w) => {
            const owned = w.price === 0 || (state.inventory[w.id] ?? 0) > 0;
            const active = state.wallpaper === w.id.replace("wp-", "");
            return (
              <button
                key={w.id}
                onClick={() => owned && setWallpaper(w.id.replace("wp-", ""))}
                disabled={!owned}
                className={`aspect-video rounded-2xl border-2 relative overflow-hidden text-3xl grid place-items-center ${
                  active ? "border-primary shadow-soft" : "border-white"
                } ${!owned ? "opacity-50" : ""}`}
                style={{ background: wallpaperCSS(w.id.replace("wp-", "")) }}
              >
                <span className="drop-shadow-md">{w.emoji}</span>
                <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white/90 drop-shadow">
                  {w.name}
                </span>
                {!owned && (
                  <Lock className="absolute top-1 right-1 h-3 w-3 text-white" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

export function wallpaperCSS(id: string): string {
  switch (id) {
    case "sky":
      return "linear-gradient(180deg, oklch(0.9 0.08 230) 0%, oklch(0.95 0.06 260) 60%, oklch(0.92 0.08 320) 100%)";
    case "forest":
      return "linear-gradient(180deg, oklch(0.85 0.12 150) 0%, oklch(0.9 0.09 130) 50%, oklch(0.88 0.1 100) 100%)";
    case "space":
      return "linear-gradient(180deg, oklch(0.28 0.1 290) 0%, oklch(0.32 0.14 310) 50%, oklch(0.4 0.16 340) 100%)";
    case "candy":
    default:
      return "linear-gradient(180deg, oklch(0.97 0.03 320) 0%, oklch(0.94 0.06 300) 45%, oklch(0.92 0.08 340) 100%)";
  }
}
