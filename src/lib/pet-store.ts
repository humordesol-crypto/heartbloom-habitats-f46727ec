import { useEffect, useRef, useState, useCallback } from "react";

export type StatKey =
  | "hunger"
  | "thirst"
  | "energy"
  | "hygiene"
  | "fun"
  | "love"
  | "health";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  kind: "food" | "drink" | "toy" | "hat" | "wallpaper" | "medicine";
  effect?: Partial<Record<StatKey, number>>;
  xp?: number;
}

export interface Memorial {
  name: string;
  daysAlive: number;
  maxLevel: number;
  personality: string;
  diedAt: number;
}

export interface PetState {
  name: string;
  bornAt: number;
  stats: Record<StatKey, number>;
  xp: number;
  level: number;
  maxLevel: number;
  coins: number;
  lastTick: number;
  lastVisit: number;
  personality: {
    playful: number;
    affectionate: number;
    disciplined: number;
    healthy: number;
    lazy: number;
    sad: number;
  };
  inventory: Record<string, number>;
  equippedHat: string | null;
  wallpaper: string;
  bestMemoryScore: number;
  isSick: boolean;
  isDead: boolean;
  memorial: Memorial | null;
  criticalSince: number | null;
  temperature: "cold" | "normal" | "hot";
  temperatureUntil: number;
}

const STORAGE_KEY = "fluffy-pet-v3";

const DECAY_PER_MIN: Record<StatKey, number> = {
  hunger: 0.9,
  thirst: 1.2,
  energy: 0.6,
  hygiene: 0.5,
  fun: 0.8,
  love: 0.4,
  health: 0,
};

const DEFAULT_STATE: PetState = {
  name: "Momo",
  bornAt: 0,
  stats: {
    hunger: 82,
    thirst: 78,
    energy: 90,
    hygiene: 85,
    fun: 70,
    love: 65,
    health: 100,
  },
  xp: 0,
  level: 1,
  maxLevel: 1,
  coins: 40,
  lastTick: 0,
  lastVisit: 0,
  personality: {
    playful: 0,
    affectionate: 0,
    disciplined: 0,
    healthy: 0,
    lazy: 0,
    sad: 0,
  },
  inventory: {},
  equippedHat: null,
  wallpaper: "candy",
  bestMemoryScore: 0,
  isSick: false,
  isDead: false,
  memorial: null,
  criticalSince: null,
  temperature: "normal",
  temperatureUntil: 0,
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "apple",    name: "Maçã",       emoji: "🍎", price: 8,  kind: "food",     effect: { hunger: +20, energy: +3, healthy: 0 as never }, xp: 3 },
  { id: "cake",     name: "Bolo",       emoji: "🍰", price: 20, kind: "food",     effect: { hunger: +45, fun: +10 },   xp: 6 },
  { id: "sushi",    name: "Sushi",      emoji: "🍣", price: 30, kind: "food",     effect: { hunger: +60, love: +5 },   xp: 8 },
  { id: "juice",    name: "Suco",       emoji: "🧃", price: 10, kind: "drink",    effect: { thirst: +40, energy: +5 }, xp: 3 },
  { id: "milkshake",name: "Milkshake",  emoji: "🥤", price: 22, kind: "drink",    effect: { thirst: +55, fun: +8 },    xp: 5 },
  { id: "ball",     name: "Bolinha",    emoji: "⚽", price: 25, kind: "toy",      effect: { fun: +35, love: +8 },      xp: 6 },
  { id: "teddy",    name: "Ursinho",    emoji: "🧸", price: 40, kind: "toy",      effect: { love: +30, fun: +15 },     xp: 8 },
  { id: "medicine", name: "Remédio",    emoji: "💊", price: 35, kind: "medicine", effect: { health: +80 },             xp: 4 },
  { id: "vitamin",  name: "Vitamina",   emoji: "🌡️", price: 55, kind: "medicine", effect: { health: +100, energy: +30 }, xp: 6 },
  { id: "hat-crown",name: "Coroa",      emoji: "👑", price: 80, kind: "hat" },
  { id: "hat-cap",  name: "Boné",       emoji: "🧢", price: 45, kind: "hat" },
  { id: "hat-party",name: "Chapéu Festa",emoji:"🎉", price: 35, kind: "hat" },
  { id: "wp-candy", name: "Doceria",    emoji: "🍭", price: 0,  kind: "wallpaper" },
  { id: "wp-sky",   name: "Céu",        emoji: "☁️", price: 60, kind: "wallpaper" },
  { id: "wp-forest",name: "Floresta",   emoji: "🌳", price: 60, kind: "wallpaper" },
  { id: "wp-space", name: "Espaço",     emoji: "🌌", price: 120,kind: "wallpaper" },
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
  if (state.isDead) return state;
  if (!state.lastTick) return { ...state, lastTick: now, bornAt: state.bornAt || now };
  const elapsedMin = Math.max(0, (now - state.lastTick) / 60000);
  if (elapsedMin <= 0) return state;

  const next: PetState = { ...state, stats: { ...state.stats }, lastTick: now };

  (Object.keys(DECAY_PER_MIN) as StatKey[]).forEach((k) => {
    if (DECAY_PER_MIN[k] > 0) {
      next.stats[k] = clamp(next.stats[k] - DECAY_PER_MIN[k] * elapsedMin);
    }
  });

  // Interdependent needs
  // Low hunger/thirst drains energy faster
  if (next.stats.hunger < 25) next.stats.energy = clamp(next.stats.energy - 0.4 * elapsedMin);
  if (next.stats.thirst < 25) next.stats.energy = clamp(next.stats.energy - 0.5 * elapsedMin);

  // Low fun + love reduce love more (loneliness)
  if (next.stats.fun < 30 && next.stats.love < 40) {
    next.stats.love = clamp(next.stats.love - 0.3 * elapsedMin);
  }

  // Sickness: low hygiene raises risk; sick state drains health continuously
  if (!next.isSick && next.stats.hygiene < 25 && Math.random() < 0.15 * elapsedMin) {
    next.isSick = true;
  }
  if (next.isSick) {
    next.stats.health = clamp(next.stats.health - 1.2 * elapsedMin);
    next.stats.energy = clamp(next.stats.energy - 0.4 * elapsedMin);
  } else if (next.stats.hygiene > 60 && next.stats.health < 100) {
    next.stats.health = clamp(next.stats.health + 0.4 * elapsedMin);
  }

  // Starving directly damages health
  if (next.stats.hunger <= 0 || next.stats.thirst <= 0) {
    next.stats.health = clamp(next.stats.health - 1.5 * elapsedMin);
  }

  // Random temperature events
  if (now > next.temperatureUntil) {
    if (Math.random() < 0.03 * elapsedMin) {
      next.temperature = Math.random() < 0.5 ? "cold" : "hot";
      next.temperatureUntil = now + 6 * 60000;
    } else {
      next.temperature = "normal";
    }
  }

  // Personality drift
  if (next.stats.love < 30 || next.stats.fun < 30) {
    next.personality = {
      ...next.personality,
      sad: clamp(next.personality.sad + elapsedMin * 0.4, 0, 100),
    };
  }

  // Critical state
  const criticalNow =
    next.stats.health <= 5 ||
    (next.stats.hunger <= 0 && next.stats.thirst <= 0) ||
    (next.stats.energy <= 0 && next.stats.love <= 5);

  if (criticalNow) {
    if (!next.criticalSince) next.criticalSince = now;
    // Die after 20 real minutes in critical state without care
    if (now - next.criticalSince > 20 * 60000) {
      next.isDead = true;
      next.memorial = {
        name: next.name,
        daysAlive: Math.max(1, Math.floor((now - (next.bornAt || now)) / 86400000)),
        maxLevel: next.maxLevel,
        personality: personalityLabel(next.personality),
        diedAt: now,
      };
    }
  } else {
    next.criticalSince = null;
  }

  return next;
}

export type ActionKey = "feed" | "drink" | "sleep" | "bath" | "play" | "pet";

const ACTIONS: Record<
  ActionKey,
  { deltas: Partial<Record<StatKey, number>>; xp: number; personality?: Partial<PetState["personality"]> }
> = {
  feed:  { deltas: { hunger: +30, energy: +5, fun: +3 }, xp: 4, personality: { healthy: +1 } },
  drink: { deltas: { thirst: +35, energy: +3 }, xp: 3, personality: { healthy: +1 } },
  sleep: { deltas: { energy: +45, fun: -5 }, xp: 5, personality: { lazy: +1, disciplined: +2 } },
  bath:  { deltas: { hygiene: +45, fun: +5 }, xp: 4, personality: { disciplined: +2, healthy: +1 } },
  play:  { deltas: { fun: +30, energy: -10, love: +6, hunger: -3 }, xp: 6, personality: { playful: +2 } },
  pet:   { deltas: { love: +25, fun: +6, energy: +2 }, xp: 3, personality: { affectionate: +2, sad: -3 } },
};

/** Rich emotion vocabulary. */
export type Reaction =
  | "love" | "yum" | "sleepy" | "clean" | "excited" | "wow" | "sad"
  | "sick" | "angry" | "scared" | "cold" | "hot" | "inlove" | "crying";

function actionToReaction(k: ActionKey): Reaction {
  return { feed: "yum", drink: "yum", sleep: "sleepy", bath: "clean", play: "excited", pet: "love" }[k] as Reaction;
}

export function usePet() {
  const [state, setState] = useState<PetState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; icon: string; x: number }[]>([]);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [greeting, setGreeting] = useState<"missed" | "welcome" | null>(null);
  const floaterId = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const stored = loadFromStorage();
    let initial = stored ?? { ...DEFAULT_STATE, lastTick: now, bornAt: now, lastVisit: now };
    if (!initial.bornAt) initial.bornAt = now;
    // Bond: greeting based on time away
    const away = now - (initial.lastVisit || now);
    if (!initial.isDead) {
      if (away > 20 * 3600000) setGreeting("missed");
      else if (away > 4 * 3600000) setGreeting("welcome");
    }
    initial = applyDecay(initial, now);
    initial.lastVisit = now;
    setState(initial);
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
    const t = setInterval(() => setState((s) => applyDecay(s, Date.now())), 4000);
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

  const applyAction = useCallback((key: ActionKey, extraCoins = 0) => {
    setState((s) => {
      if (s.isDead) return s;
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
      return {
        ...withDecay,
        stats,
        xp,
        level,
        maxLevel: Math.max(withDecay.maxLevel, level),
        personality,
        coins: withDecay.coins + extraCoins,
      };
    });
  }, []);

  const doAction = useCallback(
    (key: ActionKey, icon = "✨") => {
      applyAction(key);
      spawnFloater(icon);
      triggerReaction(actionToReaction(key));
      if (greeting) setGreeting(null);
    },
    [applyAction, spawnFloater, triggerReaction, greeting]
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
        if (s.isDead) return s;
        if ((s.inventory[item.id] ?? 0) <= 0) return s;
        const inv = { ...s.inventory, [item.id]: s.inventory[item.id] - 1 };
        const stats = { ...s.stats };
        (Object.keys(item.effect!) as StatKey[]).forEach((k) => {
          stats[k] = clamp(stats[k] + (item.effect![k] ?? 0));
        });
        const isSick = item.kind === "medicine" ? false : s.isSick;
        let xp = s.xp + (item.xp ?? 0);
        let level = s.level;
        let needed = level * 25;
        while (xp >= needed) {
          xp -= needed;
          level += 1;
          needed = level * 25;
        }
        return { ...s, inventory: inv, stats, xp, level, maxLevel: Math.max(s.maxLevel, level), isSick };
      });
      spawnFloater(item.emoji);
      triggerReaction(
        item.kind === "medicine" ? "clean" :
        item.kind === "drink" ? "yum" :
        item.kind === "toy" ? "excited" : "yum"
      );
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
        maxLevel: Math.max(s.maxLevel, level),
        stats: { ...s.stats, fun: clamp(s.stats.fun + 15) },
        bestMemoryScore: Math.max(s.bestMemoryScore, score),
      };
    });
    spawnFloater("🪙");
    triggerReaction("excited");
  }, [spawnFloater, triggerReaction]);

  const startNewPet = useCallback((name: string) => {
    setState((s) => ({
      ...DEFAULT_STATE,
      name: name || "Momo",
      lastTick: Date.now(),
      bornAt: Date.now(),
      lastVisit: Date.now(),
      // Keep collection + coins
      coins: s.coins,
      inventory: s.inventory,
      wallpaper: s.wallpaper,
      bestMemoryScore: s.bestMemoryScore,
      memorial: s.memorial,
    }));
    setGreeting(null);
  }, []);

  const reset = useCallback(
    () => setState({ ...DEFAULT_STATE, lastTick: Date.now(), bornAt: Date.now(), lastVisit: Date.now() }),
    []
  );

  const mood = deriveMood(state);
  const stage = deriveStage(state.level);
  const isCritical = !state.isDead && !!state.criticalSince;

  return {
    state,
    mood,
    stage,
    reaction,
    hydrated,
    greeting,
    dismissGreeting: () => setGreeting(null),
    isCritical,
    doAction,
    addCoins,
    buyItem,
    useItem,
    equipHat,
    setWallpaper,
    rewardGame,
    startNewPet,
    reset,
    floaters,
  };
}

export type Mood =
  | "sleep" | "sad" | "play" | "happy" | "idle"
  | "sick" | "angry" | "scared" | "cold" | "hot"
  | "inlove" | "tired" | "crying" | "excited" | "critical";

export function deriveMood(s: PetState): Mood {
  if (s.isDead) return "sad";
  if (s.criticalSince) return "critical";
  if (s.isSick || s.stats.health < 35) return "sick";
  if (s.temperature === "cold") return "cold";
  if (s.temperature === "hot") return "hot";
  if (s.stats.energy < 15) return "sleep";
  if (s.stats.energy < 30) return "tired";
  const criticals = [s.stats.hunger, s.stats.thirst, s.stats.hygiene].filter((v) => v < 20).length;
  if (criticals >= 2) return "crying";
  if (criticals >= 1 || s.stats.love < 15) return "sad";
  if (s.stats.love > 88 && s.stats.fun > 70) return "inlove";
  if (s.stats.fun > 85 && s.stats.love > 70) return "excited";
  if (s.stats.fun > 75 && s.stats.love > 60) return "play";
  if (s.stats.love > 55 && s.stats.fun > 45) return "happy";
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
    disciplined: "Disciplinado",
    healthy: "Saudável",
    lazy: "Preguiçoso",
    sad: "Melancólico",
  }[top[0]];
}
