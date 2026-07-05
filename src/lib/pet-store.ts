import { useEffect, useRef, useState, useCallback } from "react";

export type StatKey = "hunger" | "thirst" | "energy" | "hygiene" | "fun" | "love";

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
}

const STORAGE_KEY = "fluffy-pet-v1";

/** Points per minute decay for each stat while app is open/idle. */
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
  lastTick: Date.now(),
  personality: { playful: 0, affectionate: 0, lazy: 0, sad: 0 },
};

function loadInitial(): PetState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, lastTick: Date.now() };
    const parsed = JSON.parse(raw) as PetState;
    return { ...DEFAULT_STATE, ...parsed, stats: { ...DEFAULT_STATE.stats, ...parsed.stats } };
  } catch {
    return { ...DEFAULT_STATE, lastTick: Date.now() };
  }
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function applyDecay(state: PetState, now: number): PetState {
  const elapsedMin = Math.max(0, (now - state.lastTick) / 60000);
  if (elapsedMin <= 0) return state;
  const next = { ...state, stats: { ...state.stats }, lastTick: now };
  (Object.keys(DECAY_PER_MIN) as StatKey[]).forEach((k) => {
    next.stats[k] = clamp(next.stats[k] - DECAY_PER_MIN[k] * elapsedMin);
  });
  // sad grows if love/fun low for long
  if (next.stats.love < 30 || next.stats.fun < 30) {
    next.personality = { ...next.personality, sad: clamp(next.personality.sad + elapsedMin * 0.5, 0, 100) };
  }
  return next;
}

export type ActionKey = "feed" | "drink" | "sleep" | "bath" | "play" | "pet";

const ACTIONS: Record<
  ActionKey,
  { deltas: Partial<Record<StatKey, number>>; xp: number; personality?: Partial<PetState["personality"]>; cooldown?: number }
> = {
  feed:  { deltas: { hunger: +30, energy: +5, fun: +3 }, xp: 4 },
  drink: { deltas: { thirst: +35, energy: +3 }, xp: 3 },
  sleep: { deltas: { energy: +45, fun: -5 }, xp: 5, personality: { lazy: +2 } },
  bath:  { deltas: { hygiene: +45, fun: +5 }, xp: 4 },
  play:  { deltas: { fun: +30, energy: -10, love: +6, hunger: -3 }, xp: 6, personality: { playful: +2 } },
  pet:   { deltas: { love: +25, fun: +6, energy: +2 }, xp: 3, personality: { affectionate: +2, sad: -3 } },
};

export function usePet() {
  const [state, setState] = useState<PetState>(() => loadInitial());
  const [floaters, setFloaters] = useState<{ id: number; icon: string; x: number }[]>([]);
  const floaterId = useRef(0);

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Passive decay tick (every 6s)
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => applyDecay(s, Date.now()));
    }, 6000);
    // apply on mount for time-away
    setState((s) => applyDecay(s, Date.now()));
    return () => clearInterval(t);
  }, []);

  const doAction = useCallback((key: ActionKey, icon = "✨") => {
    setState((s) => {
      const withDecay = applyDecay(s, Date.now());
      const a = ACTIONS[key];
      const stats = { ...withDecay.stats };
      (Object.keys(a.deltas) as StatKey[]).forEach((k) => {
        stats[k] = clamp(stats[k] + (a.deltas[k] ?? 0));
      });
      let xp = withDecay.xp + a.xp;
      let level = withDecay.level;
      const needed = level * 25;
      if (xp >= needed) {
        xp -= needed;
        level += 1;
      }
      const personality = { ...withDecay.personality };
      if (a.personality) {
        (Object.keys(a.personality) as (keyof PetState["personality"])[]).forEach((k) => {
          personality[k] = clamp((personality[k] ?? 0) + (a.personality?.[k] ?? 0), 0, 100);
        });
      }
      return { ...withDecay, stats, xp, level, personality, coins: withDecay.coins };
    });

    // spawn floating emoji
    const id = ++floaterId.current;
    const x = 40 + Math.random() * 20;
    setFloaters((f) => [...f, { id, icon, x }]);
    setTimeout(() => setFloaters((f) => f.filter((fl) => fl.id !== id)), 1400);
  }, []);

  const addCoins = useCallback((n: number) => {
    setState((s) => ({ ...s, coins: s.coins + n }));
  }, []);

  const reset = useCallback(() => setState({ ...DEFAULT_STATE, lastTick: Date.now() }), []);

  const mood = deriveMood(state);

  return { state, mood, doAction, addCoins, reset, floaters };
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
