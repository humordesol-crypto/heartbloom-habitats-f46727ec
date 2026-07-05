import { useEffect, useRef, useState, useCallback } from "react";

export type StatKey = "hunger" | "thirst" | "energy" | "hygiene" | "fun" | "love";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  kind: "food" | "drink" | "toy" | "hat" | "wallpaper";
  effect?: Partial<Record<StatKey, number>>;
  xp?: number;
}

export interface PetState {
  name: string;
  stats: Record<StatKey, number>;
  xp: number;
  level: number;
  coins: number;
  lastTick: number;
  personality: {
    playful: number;
    affectionate: number;
    lazy: number;
    sad: number;
  };
  inventory: Record<string, number>;
  equippedHat: string | null;
  wallpaper: string;
  bestMemoryScore: number;
}

const STORAGE_KEY = "fluffy-pet-v2";

const DECAY_PER_MIN: Record<StatKey, number> = {
  hunger: 0.9,
  thirst: 1.2,
  energy: 0.6,
  hygiene: 0.5,
  fun: 0.8,
  love: 0.4,
};

const DEFAULT_STATE: PetState = {
  name: "Momo",
  stats: { hunger: 82, thirst: 78, energy: 90, hygiene: 85, fun: 70, love: 65 },
  xp: 0,
  level: 1,
  coins: 40,
  lastTick: 0, // set on client
  personality: { playful: 0, affectionate: 0, lazy: 0, sad: 0 },
  inventory: {},
  equippedHat: null,
  wallpaper: "candy",
  bestMemoryScore: 0,
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "apple",    name: "Maçã",         emoji: "🍎", price: 8,  kind: "food",  effect: { hunger: +20, energy: +3 },  xp: 3 },
  { id: "cake",     name: "Bolo",         emoji: "🍰", price: 20, kind: "food",  effect: { hunger: +45, fun: +10 },    xp: 6 },
  { id: "sushi",    name: "Sushi",        emoji: "🍣", price: 30, kind: "food",  effect: { hunger: +60, love: +5 },    xp: 8 },
  { id: "juice",    name: "Suco",         emoji: "🧃", price: 10, kind: "drink", effect: { thirst: +40, energy: +5 },  xp: 3 },
  { id: "milkshake",name: "Milkshake",    emoji: "🥤", price: 22, kind: "drink", effect: { thirst: +55, fun: +8 },     xp: 5 },
  { id: "ball",     name: "Bolinha",      emoji: "⚽", price: 25, kind: "toy",   effect: { fun: +35, love: +8 },       xp: 6 },
  { id: "teddy",    name: "Ursinho",      emoji: "🧸", price: 40, kind: "toy",   effect: { love: +30, fun: +15 },      xp: 8 },
  { id: "hat-crown",name: "Coroa",        emoji: "👑", price: 80, kind: "hat" },
  { id: "hat-cap",  name: "Boné",         emoji: "🧢", price: 45, kind: "hat" },
  { id: "hat-party",name: "Chapéu Festa", emoji: "🎉", price: 35, kind: "hat" },
  { id: "wp-candy", name: "Doceria",      emoji: "🍭", price: 0,  kind: "wallpaper" },
  { id: "wp-sky",   name: "Céu",          emoji: "☁️", price: 60, kind: "wallpaper" },
  { id: "wp-forest",name: "Floresta",     emoji: "🌳", price: 60, kind: "wallpaper" },
  { id: "wp-space", name: "Espaço",       emoji: "🌌", price: 120,kind: "wallpaper" },
];

function loadFromStorage(): PetState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PetState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats ?? {}) },
      personality: { ...DEFAULT_STATE.personality, ...(parsed.personality ?? {}) },
      inventory: { ...(parsed.inventory ?? {}) },
    };
  } catch {
    return null;
  }
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function applyDecay(state: PetState, now: number): PetState {
  if (!state.lastTick) return { ...state, lastTick: now };
  const elapsedMin = Math.max(0, (now - state.lastTick) / 60000);
  if (elapsedMin <= 0) return state;
  const next = { ...state, stats: { ...state.stats }, lastTick: now };
  (Object.keys(DECAY_PER_MIN) as StatKey[]).forEach((k) => {
    next.stats[k] = clamp(next.stats[k] - DECAY_PER_MIN[k] * elapsedMin);
  });
  if (next.stats.love < 30 || next.stats.fun < 30) {
    next.personality = { ...next.personality, sad: clamp(next.personality.sad + elapsedMin * 0.5, 0, 100) };
  }
  return next;
}

export type ActionKey = "feed" | "drink" | "sleep" | "bath" | "play" | "pet";

const ACTIONS: Record<
  ActionKey,
  { deltas: Partial<Record<StatKey, number>>; xp: number; personality?: Partial<PetState["personality"]> }
> = {
  feed:  { deltas: { hunger: +30, energy: +5, fun: +3 }, xp: 4 },
  drink: { deltas: { thirst: +35, energy: +3 }, xp: 3 },
  sleep: { deltas: { energy: +45, fun: -5 }, xp: 5, personality: { lazy: +2 } },
  bath:  { deltas: { hygiene: +45, fun: +5 }, xp: 4 },
  play:  { deltas: { fun: +30, energy: -10, love: +6, hunger: -3 }, xp: 6, personality: { playful: +2 } },
  pet:   { deltas: { love: +25, fun: +6, energy: +2 }, xp: 3, personality: { affectionate: +2, sad: -3 } },
};

/** Emotion shown temporarily when the pet reacts. */
export type Reaction = "love" | "yum" | "sleepy" | "clean" | "excited" | "wow" | "sad";

function actionToReaction(k: ActionKey): Reaction {
  return { feed: "yum", drink: "yum", sleep: "sleepy", bath: "clean", play: "excited", pet: "love" }[k] as Reaction;
}

export function usePet() {
  // IMPORTANT: identical initial state on SSR and first client render
  // to avoid hydration mismatch. Storage is hydrated in an effect.
  const [state, setState] = useState<PetState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; icon: string; x: number }[]>([]);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const floaterId = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = loadFromStorage();
    setState(applyDecay(stored ?? { ...DEFAULT_STATE, lastTick: Date.now() }, Date.now()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setInterval(() => {
      setState((s) => applyDecay(s, Date.now()));
    }, 6000);
    return () => clearInterval(t);
  }, [hydrated]);

  const triggerReaction = useCallback((r: Reaction) => {
    setReaction(r);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(null), 2200);
  }, []);

  const spawnFloater = useCallback((icon: string) => {
    const id = ++floaterId.current;
    const x = 35 + Math.random() * 30;
    setFloaters((f) => [...f, { id, icon, x }]);
    setTimeout(() => setFloaters((f) => f.filter((fl) => fl.id !== id)), 1400);
  }, []);

  const applyAction = useCallback(
    (key: ActionKey, extraCoins = 0) => {
      setState((s) => {
        const withDecay = applyDecay(s, Date.now());
        const a = ACTIONS[key];
        const stats = { ...withDecay.stats };
        (Object.keys(a.deltas) as StatKey[]).forEach((k) => {
          stats[k] = clamp(stats[k] + (a.deltas[k] ?? 0));
        });
        let xp = withDecay.xp + a.xp;
        let level = withDecay.level;
        let needed = level * 25;
        while (xp >= needed) {
          xp -= needed;
          level += 1;
          needed = level * 25;
        }
        const personality = { ...withDecay.personality };
        if (a.personality) {
          (Object.keys(a.personality) as (keyof PetState["personality"])[]).forEach((k) => {
            personality[k] = clamp((personality[k] ?? 0) + (a.personality?.[k] ?? 0), 0, 100);
          });
        }
        return { ...withDecay, stats, xp, level, personality, coins: withDecay.coins + extraCoins };
      });
    },
    []
  );

  const doAction = useCallback(
    (key: ActionKey, icon = "✨") => {
      applyAction(key);
      spawnFloater(icon);
      triggerReaction(actionToReaction(key));
    },
    [applyAction, spawnFloater, triggerReaction]
  );

  const addCoins = useCallback((n: number) => {
    setState((s) => ({ ...s, coins: Math.max(0, s.coins + n) }));
  }, []);

  const buyItem = useCallback((item: ShopItem): { ok: boolean; msg?: string } => {
    let ok = false;
    let msg: string | undefined;
    setState((s) => {
      if (s.coins < item.price) {
        msg = "Moedas insuficientes";
        return s;
      }
      const inv = { ...s.inventory };
      // Wallpapers & hats: one-time unlock (owned marker = 1)
      if (item.kind === "wallpaper" || item.kind === "hat") {
        if (inv[item.id]) {
          msg = "Já desbloqueado";
          return s;
        }
        inv[item.id] = 1;
      } else {
        inv[item.id] = (inv[item.id] ?? 0) + 1;
      }
      ok = true;
      return { ...s, coins: s.coins - item.price, inventory: inv };
    });
    return { ok, msg };
  }, []);

  const useItem = useCallback(
    (item: ShopItem) => {
      if (!item.effect) return;
      setState((s) => {
        if ((s.inventory[item.id] ?? 0) <= 0) return s;
        const inv = { ...s.inventory, [item.id]: s.inventory[item.id] - 1 };
        const stats = { ...s.stats };
        (Object.keys(item.effect!) as StatKey[]).forEach((k) => {
          stats[k] = clamp(stats[k] + (item.effect![k] ?? 0));
        });
        let xp = s.xp + (item.xp ?? 0);
        let level = s.level;
        let needed = level * 25;
        while (xp >= needed) {
          xp -= needed;
          level += 1;
          needed = level * 25;
        }
        return { ...s, inventory: inv, stats, xp, level };
      });
      spawnFloater(item.emoji);
      triggerReaction(item.kind === "drink" ? "yum" : item.kind === "toy" ? "excited" : "yum");
    },
    [spawnFloater, triggerReaction]
  );

  const equipHat = useCallback((hatId: string | null) => {
    setState((s) => ({ ...s, equippedHat: hatId }));
  }, []);

  const setWallpaper = useCallback((wp: string) => {
    setState((s) => ({ ...s, wallpaper: wp }));
  }, []);

  const rewardGame = useCallback((coins: number, xp: number, score: number) => {
    setState((s) => {
      let newXp = s.xp + xp;
      let level = s.level;
      let needed = level * 25;
      while (newXp >= needed) {
        newXp -= needed;
        level += 1;
        needed = level * 25;
      }
      return {
        ...s,
        coins: s.coins + coins,
        xp: newXp,
        level,
        stats: { ...s.stats, fun: clamp(s.stats.fun + 15) },
        bestMemoryScore: Math.max(s.bestMemoryScore, score),
      };
    });
    spawnFloater("🪙");
    triggerReaction("excited");
  }, [spawnFloater, triggerReaction]);

  const reset = useCallback(
    () => setState({ ...DEFAULT_STATE, lastTick: Date.now() }),
    []
  );

  const mood = deriveMood(state);
  const stage = deriveStage(state.level);

  return {
    state,
    mood,
    stage,
    reaction,
    hydrated,
    doAction,
    addCoins,
    buyItem,
    useItem,
    equipHat,
    setWallpaper,
    rewardGame,
    reset,
    floaters,
  };
}

export type Mood = "sleep" | "sad" | "play" | "happy" | "idle";

export function deriveMood(s: PetState): Mood {
  if (s.stats.energy < 20) return "sleep";
  const lows = [s.stats.hunger, s.stats.thirst, s.stats.hygiene].filter((v) => v < 25).length;
  if (lows >= 1 || s.stats.love < 20) return "sad";
  if (s.stats.fun > 80 && s.stats.love > 70) return "play";
  if (s.stats.love > 60 && s.stats.fun > 50) return "happy";
  return "idle";
}

export type Stage = "baby" | "child" | "adult";
export function deriveStage(level: number): Stage {
  if (level <= 2) return "baby";
  if (level <= 6) return "child";
  return "adult";
}

export function stageLabel(s: Stage) {
  return { baby: "Bebê", child: "Criança", adult: "Lendário" }[s];
}

export function personalityLabel(p: PetState["personality"]): string {
  const entries = Object.entries(p) as [keyof PetState["personality"], number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 8) return "Curioso";
  return {
    playful: "Brincalhão",
    affectionate: "Carinhoso",
    lazy: "Preguiçoso",
    sad: "Melancólico",
  }[top[0]];
}
