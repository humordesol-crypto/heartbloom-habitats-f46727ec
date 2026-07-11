import { useEffect, useRef, useState, useCallback } from "react";
import { SPECIES, getSpecies, type Species } from "./species";

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
  speciesId: string;
  daysAlive: number;
  maxLevel: number;
  personality: string;
  diedAt: number;
}

export interface PetState {
  id: string;
  speciesId: string;
  name: string;
  bornAt: number;
  stats: Record<StatKey, number>;
  xp: number;
  level: number;
  maxLevel: number;
  lastTick: number;
  personality: {
    playful: number;
    affectionate: number;
    disciplined: number;
    healthy: number;
    lazy: number;
    sad: number;
  };
  equippedHat: string | null;
  isSick: boolean;
  isDead: boolean;
  memorial: Memorial | null;
  criticalSince: number | null;
  temperature: "cold" | "normal" | "hot";
  temperatureUntil: number;
}

export interface FlatPetState extends PetState {
  coins: number;
  inventory: Record<string, number>;
  wallpaper: string;
  bestMemoryScore: number;
  memorial: Memorial | null;
}

export interface GameState {
  activeId: string;
  pets: Record<string, PetState>;
  coins: number;
  inventory: Record<string, number>;
  wallpaper: string;
  bestMemoryScore: number;
  unlockedSpecies: string[];
  lastVisit: number;
  memorials: Memorial[];
}

const STORAGE_KEY = "fluffy-game-v1";
const LEGACY_KEY = "fluffy-pet-v3";

const DECAY_PER_MIN: Record<StatKey, number> = {
  hunger: 0.9,
  thirst: 1.2,
  energy: 0.6,
  hygiene: 0.5,
  fun: 0.8,
  love: 0.4,
  health: 0,
};

function newPet(speciesId: string, name?: string, now = Date.now()): PetState {
  const sp = getSpecies(speciesId);
  return {
    id: `${speciesId}-${now}`,
    speciesId,
    name: name || sp.evolution.baby,
    bornAt: now,
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
    lastTick: now,
    personality: { playful: 0, affectionate: 0, disciplined: 0, healthy: 0, lazy: 0, sad: 0 },
    equippedHat: null,
    isSick: false,
    isDead: false,
    memorial: null,
    criticalSince: null,
    temperature: "normal",
    temperatureUntil: 0,
  };
}

function defaultGame(now = Date.now()): GameState {
  const starter = newPet("momo", "Momo", now);
  return {
    activeId: starter.id,
    pets: { [starter.id]: starter },
    coins: 60,
    inventory: {},
    wallpaper: "candy",
    bestMemoryScore: 0,
    unlockedSpecies: ["momo"],
    lastVisit: now,
    memorials: [],
  };
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "apple",    name: "Maçã",       emoji: "🍎", price: 8,  kind: "food",     effect: { hunger: +20, energy: +3 }, xp: 3 },
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

function loadFromStorage(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      // sanity — make sure activeId exists
      if (parsed.pets && parsed.activeId && parsed.pets[parsed.activeId]) return parsed;
    }
    // migrate legacy single-pet save
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const l = JSON.parse(legacy);
      const now = Date.now();
      const p = newPet("momo", l.name ?? "Momo", now);
      p.stats = { ...p.stats, ...(l.stats ?? {}) };
      p.level = l.level ?? 1;
      p.maxLevel = l.maxLevel ?? p.level;
      p.xp = l.xp ?? 0;
      p.equippedHat = l.equippedHat ?? null;
      p.isSick = !!l.isSick;
      p.isDead = !!l.isDead;
      p.memorial = l.memorial ?? null;
      return {
        activeId: p.id,
        pets: { [p.id]: p },
        coins: l.coins ?? 60,
        inventory: l.inventory ?? {},
        wallpaper: l.wallpaper ?? "candy",
        bestMemoryScore: l.bestMemoryScore ?? 0,
        unlockedSpecies: ["momo"],
        lastVisit: now,
        memorials: l.memorial ? [l.memorial] : [],
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function tickPet(p: PetState, now: number, background: boolean): PetState {
  if (p.isDead) return p;
  if (!p.lastTick) return { ...p, lastTick: now, bornAt: p.bornAt || now };
  const elapsedMin = Math.max(0, (now - p.lastTick) / 60000);
  if (elapsedMin <= 0) return p;
  const rate = background ? 0.55 : 1; // idle pets decay slower but still need care
  const next: PetState = { ...p, stats: { ...p.stats }, lastTick: now };

  (Object.keys(DECAY_PER_MIN) as StatKey[]).forEach((k) => {
    if (DECAY_PER_MIN[k] > 0) {
      next.stats[k] = clamp(next.stats[k] - DECAY_PER_MIN[k] * elapsedMin * rate);
    }
  });

  if (next.stats.hunger < 25) next.stats.energy = clamp(next.stats.energy - 0.4 * elapsedMin * rate);
  if (next.stats.thirst < 25) next.stats.energy = clamp(next.stats.energy - 0.5 * elapsedMin * rate);
  if (next.stats.fun < 30 && next.stats.love < 40) {
    next.stats.love = clamp(next.stats.love - 0.3 * elapsedMin * rate);
  }
  if (!next.isSick && next.stats.hygiene < 25 && Math.random() < 0.15 * elapsedMin) next.isSick = true;
  if (next.isSick) {
    next.stats.health = clamp(next.stats.health - 1.2 * elapsedMin * rate);
    next.stats.energy = clamp(next.stats.energy - 0.4 * elapsedMin * rate);
  } else if (next.stats.hygiene > 60 && next.stats.health < 100) {
    next.stats.health = clamp(next.stats.health + 0.4 * elapsedMin);
  }
  if (next.stats.hunger <= 0 || next.stats.thirst <= 0) {
    next.stats.health = clamp(next.stats.health - 1.5 * elapsedMin * rate);
  }
  if (now > next.temperatureUntil) {
    if (Math.random() < 0.03 * elapsedMin) {
      next.temperature = Math.random() < 0.5 ? "cold" : "hot";
      next.temperatureUntil = now + 6 * 60000;
    } else {
      next.temperature = "normal";
    }
  }
  if (next.stats.love < 30 || next.stats.fun < 30) {
    next.personality = { ...next.personality, sad: clamp(next.personality.sad + elapsedMin * 0.4, 0, 100) };
  }
  const criticalNow =
    next.stats.health <= 5 ||
    (next.stats.hunger <= 0 && next.stats.thirst <= 0) ||
    (next.stats.energy <= 0 && next.stats.love <= 5);
  if (criticalNow) {
    if (!next.criticalSince) next.criticalSince = now;
    if (now - next.criticalSince > 20 * 60000) {
      next.isDead = true;
      next.memorial = {
        name: next.name,
        speciesId: next.speciesId,
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

function tickGame(g: GameState, now: number): GameState {
  const pets: Record<string, PetState> = {};
  const newMemorials: Memorial[] = [];
  Object.entries(g.pets).forEach(([id, p]) => {
    const wasAlive = !p.isDead;
    const next = tickPet(p, now, id !== g.activeId);
    if (wasAlive && next.isDead && next.memorial) newMemorials.push(next.memorial);
    pets[id] = next;
  });
  return {
    ...g,
    pets,
    memorials: newMemorials.length ? [...g.memorials, ...newMemorials] : g.memorials,
  };
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

export type Reaction =
  | "love" | "yum" | "sleepy" | "clean" | "excited" | "wow" | "sad"
  | "sick" | "angry" | "scared" | "cold" | "hot" | "inlove" | "crying";

function actionToReaction(k: ActionKey): Reaction {
  return { feed: "yum", drink: "yum", sleep: "sleepy", bath: "clean", play: "excited", pet: "love" }[k] as Reaction;
}

function addXP(p: PetState, gained: number): PetState {
  let xp = p.xp + gained;
  let level = p.level;
  let needed = level * 25;
  while (xp >= needed) {
    xp -= needed;
    level += 1;
    needed = level * 25;
  }
  return { ...p, xp, level, maxLevel: Math.max(p.maxLevel, level) };
}

export function usePet() {
  const [game, setGame] = useState<GameState>(defaultGame);
  const [hydrated, setHydrated] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; icon: string; x: number }[]>([]);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [greeting, setGreeting] = useState<"missed" | "welcome" | null>(null);
  const [evolving, setEvolving] = useState(false);
  const floaterId = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStageRef = useRef<Stage | null>(null);

  useEffect(() => {
    const now = Date.now();
    const stored = loadFromStorage() ?? defaultGame(now);
    const away = now - (stored.lastVisit || now);
    let g = tickGame(stored, now);
    g = { ...g, lastVisit: now };
    const active = g.pets[g.activeId];
    if (active && !active.isDead) {
      if (away > 20 * 3600000) setGreeting("missed");
      else if (away > 4 * 3600000) setGreeting("welcome");
    }
    setGame(g);
    prevStageRef.current = active ? deriveStage(active.level) : null;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); } catch { /* ignore */ }
  }, [game, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setInterval(() => setGame((g) => tickGame(g, Date.now())), 4000);
    return () => clearInterval(t);
  }, [hydrated]);

  // Evolution detection
  useEffect(() => {
    const active = game.pets[game.activeId];
    if (!active) return;
    const s = deriveStage(active.level);
    if (prevStageRef.current && prevStageRef.current !== s && !active.isDead) {
      setEvolving(true);
      setTimeout(() => setEvolving(false), 2400);
    }
    prevStageRef.current = s;
  }, [game.pets, game.activeId]);

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

  const updateActive = useCallback((fn: (p: PetState) => PetState) => {
    setGame((g) => {
      const g2 = tickGame(g, Date.now());
      const p = g2.pets[g2.activeId];
      if (!p || p.isDead) return g2;
      return { ...g2, pets: { ...g2.pets, [g2.activeId]: fn(p) } };
    });
  }, []);

  const doAction = useCallback(
    (key: ActionKey, icon = "✨") => {
      updateActive((p) => {
        const a = ACTIONS[key];
        const stats = { ...p.stats };
        (Object.keys(a.deltas) as StatKey[]).forEach((k) => {
          stats[k] = clamp(stats[k] + (a.deltas[k] ?? 0));
        });
        const personality = { ...p.personality };
        if (a.personality) {
          (Object.keys(a.personality) as (keyof PetState["personality"])[]).forEach((k) => {
            personality[k] = clamp((personality[k] ?? 0) + (a.personality?.[k] ?? 0), 0, 100);
          });
        }
        return addXP({ ...p, stats, personality }, a.xp);
      });
      spawnFloater(icon);
      triggerReaction(actionToReaction(key));
      if (greeting) setGreeting(null);
    },
    [updateActive, spawnFloater, triggerReaction, greeting]
  );

  const buyItem = useCallback((item: ShopItem): { ok: boolean; msg?: string } => {
    let ok = false;
    let msg: string | undefined;
    setGame((g) => {
      if (g.coins < item.price) { msg = "Moedas insuficientes"; return g; }
      const inv = { ...g.inventory };
      if (item.kind === "wallpaper" || item.kind === "hat") {
        if (inv[item.id]) { msg = "Já desbloqueado"; return g; }
        inv[item.id] = 1;
      } else {
        inv[item.id] = (inv[item.id] ?? 0) + 1;
      }
      ok = true;
      return { ...g, coins: g.coins - item.price, inventory: inv };
    });
    return { ok, msg };
  }, []);

  const useItem = useCallback(
    (item: ShopItem) => {
      if (!item.effect) return;
      setGame((g) => {
        const p = g.pets[g.activeId];
        if (!p || p.isDead) return g;
        if ((g.inventory[item.id] ?? 0) <= 0) return g;
        const inv = { ...g.inventory, [item.id]: g.inventory[item.id] - 1 };
        const stats = { ...p.stats };
        (Object.keys(item.effect!) as StatKey[]).forEach((k) => {
          stats[k] = clamp(stats[k] + (item.effect![k] ?? 0));
        });
        const isSick = item.kind === "medicine" ? false : p.isSick;
        const updated = addXP({ ...p, stats, isSick }, item.xp ?? 0);
        return { ...g, inventory: inv, pets: { ...g.pets, [g.activeId]: updated } };
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
    updateActive((p) => ({ ...p, equippedHat: hatId }));
  }, [updateActive]);

  const setWallpaper = useCallback((wp: string) => {
    setGame((g) => ({ ...g, wallpaper: wp }));
  }, []);

  const rewardGame = useCallback((coins: number, xp: number, score: number) => {
    setGame((g) => {
      const p = g.pets[g.activeId];
      if (!p) return g;
      const updated = addXP({ ...p, stats: { ...p.stats, fun: clamp(p.stats.fun + 15) } }, xp);
      return {
        ...g,
        coins: g.coins + coins,
        pets: { ...g.pets, [g.activeId]: updated },
        bestMemoryScore: Math.max(g.bestMemoryScore, score),
      };
    });
    spawnFloater("🪙");
    triggerReaction("excited");
  }, [spawnFloater, triggerReaction]);

  const startNewPet = useCallback((name: string) => {
    setGame((g) => {
      const p = newPet("momo", name || "Momo");
      return {
        ...g,
        activeId: p.id,
        pets: { ...g.pets, [p.id]: p },
        unlockedSpecies: g.unlockedSpecies.includes("momo") ? g.unlockedSpecies : [...g.unlockedSpecies, "momo"],
      };
    });
    setGreeting(null);
  }, []);

  const hatchSpecies = useCallback((species: Species): { ok: boolean; msg?: string } => {
    let ok = false;
    let msg: string | undefined;
    setGame((g) => {
      if (g.coins < species.price) { msg = "Moedas insuficientes"; return g; }
      // Only one alive pet per species at a time
      const existing = Object.values(g.pets).find((p) => p.speciesId === species.id && !p.isDead);
      if (existing) { msg = "Você já tem esse pet"; return g; }
      const p = newPet(species.id);
      ok = true;
      return {
        ...g,
        coins: g.coins - species.price,
        activeId: p.id,
        pets: { ...g.pets, [p.id]: p },
        unlockedSpecies: g.unlockedSpecies.includes(species.id) ? g.unlockedSpecies : [...g.unlockedSpecies, species.id],
      };
    });
    return { ok, msg };
  }, []);

  const setActive = useCallback((petId: string) => {
    setGame((g) => (g.pets[petId] ? { ...g, activeId: petId } : g));
  }, []);

  const releaseDead = useCallback((petId: string) => {
    setGame((g) => {
      if (!g.pets[petId] || !g.pets[petId].isDead) return g;
      const { [petId]: _, ...rest } = g.pets;
      if (Object.keys(rest).length === 0) {
        const starter = newPet("momo", "Momo");
        return { ...g, activeId: starter.id, pets: { [starter.id]: starter } };
      }
      const nextActive = g.activeId === petId ? Object.keys(rest)[0] : g.activeId;
      return { ...g, pets: rest, activeId: nextActive };
    });
  }, []);

  const state = game.pets[game.activeId];
  const species = getSpecies(state.speciesId);
  const mood = deriveMood(state);
  const stage = deriveStage(state.level);
  const isCritical = !state.isDead && !!state.criticalSince;

  // Build "flat" view for existing UI compat
  const flatState = {
    ...state,
    coins: game.coins,
    inventory: game.inventory,
    wallpaper: game.wallpaper,
    bestMemoryScore: game.bestMemoryScore,
    memorial: state.memorial ?? game.memorials[game.memorials.length - 1] ?? null,
  };

  return {
    state: flatState,
    game,
    species,
    mood,
    stage,
    reaction,
    hydrated,
    greeting,
    dismissGreeting: () => setGreeting(null),
    isCritical,
    evolving,
    doAction,
    buyItem,
    useItem,
    equipHat,
    setWallpaper,
    rewardGame,
    startNewPet,
    hatchSpecies,
    setActive,
    releaseDead,
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
  if (level <= 3) return "baby";
  if (level <= 8) return "child";
  return "adult";
}

export function stageLabel(s: Stage) {
  return { baby: "Bebê", child: "Jovem", adult: "Evoluído" }[s];
}

export function evolutionName(speciesId: string, stage: Stage): string {
  return getSpecies(speciesId).evolution[stage];
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
