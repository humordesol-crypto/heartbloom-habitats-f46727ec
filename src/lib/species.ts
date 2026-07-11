/*
 * Species catalog — collectible pet types with unique palettes and evolutions.
 */

export type Rarity = "starter" | "common" | "rare" | "epic" | "legendary";

export interface PetPalette {
  body: [string, string, string]; // radial stops: light/mid/dark
  belly: [string, string];
  ear: [string, string];
  stroke: string;
  aura: string; // for background halo
}

export interface Species {
  id: string;
  emoji: string;
  rarity: Rarity;
  price: number;
  palette: PetPalette;
  evolution: { baby: string; child: string; adult: string };
  bio: string;
}

export const SPECIES: Species[] = [
  {
    id: "momo",
    emoji: "🐰",
    rarity: "starter",
    price: 0,
    palette: {
      body: ["#ffd1e0", "#ffa8c5", "#ff88ae"],
      belly: ["#fff2f6", "#ffd3e0"],
      ear: ["#ffbcd2", "#ff8fb1"],
      stroke: "#e56a92",
      aura: "oklch(0.78 0.16 350)",
    },
    evolution: { baby: "Momo", child: "Momio", adult: "Momora" },
    bio: "Doce e leal. O primeiro companheiro.",
  },
  {
    id: "flarry",
    emoji: "🔥",
    rarity: "rare",
    price: 180,
    palette: {
      body: ["#ffd1a8", "#ff9d5c", "#ff6f2e"],
      belly: ["#fff2df", "#ffdcb8"],
      ear: ["#ffb98a", "#ff8542"],
      stroke: "#c25217",
      aura: "oklch(0.72 0.19 45)",
    },
    evolution: { baby: "Flarry", child: "Blazon", adult: "Infernox" },
    bio: "Cheio de energia. Adora brincar sem parar.",
  },
  {
    id: "aquari",
    emoji: "💧",
    rarity: "rare",
    price: 180,
    palette: {
      body: ["#bde5ff", "#7fc7ff", "#4aa4ff"],
      belly: ["#eaf6ff", "#c9e5ff"],
      ear: ["#a4d5ff", "#5faaff"],
      stroke: "#2b6ec0",
      aura: "oklch(0.72 0.18 230)",
    },
    evolution: { baby: "Aquari", child: "Splasho", adult: "Tsunar" },
    bio: "Calmo e curioso. Ama água fresquinha.",
  },
  {
    id: "leafy",
    emoji: "🌿",
    rarity: "rare",
    price: 180,
    palette: {
      body: ["#d3f0b6", "#9fd97a", "#6cbf4a"],
      belly: ["#eef8dd", "#cceaa8"],
      ear: ["#b7e28c", "#7ec95d"],
      stroke: "#3d7c2a",
      aura: "oklch(0.72 0.18 140)",
    },
    evolution: { baby: "Leafy", child: "Bloomo", adult: "Verdant" },
    bio: "Gentil e carinhoso. Cresce com afeto.",
  },
  {
    id: "sparky",
    emoji: "⚡",
    rarity: "epic",
    price: 380,
    palette: {
      body: ["#fff2a8", "#ffe15c", "#ffcd1f"],
      belly: ["#fff9d6", "#ffedb0"],
      ear: ["#ffe37a", "#ffd23f"],
      stroke: "#b8830e",
      aura: "oklch(0.85 0.17 95)",
    },
    evolution: { baby: "Sparky", child: "Voltis", adult: "Thundrax" },
    bio: "Elétrico e travesso. Fome imensa.",
  },
  {
    id: "shadowy",
    emoji: "🌙",
    rarity: "legendary",
    price: 720,
    palette: {
      body: ["#d5c7ff", "#a08cff", "#6f56e6"],
      belly: ["#ece5ff", "#d0c3ff"],
      ear: ["#b8a6ff", "#8b73ff"],
      stroke: "#4a37a8",
      aura: "oklch(0.65 0.18 295)",
    },
    evolution: { baby: "Shadowy", child: "Umbros", adult: "Noctarix" },
    bio: "Lendário e misterioso. Só vive à noite.",
  },
];

export function getSpecies(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}

export const RARITY_LABEL: Record<Rarity, string> = {
  starter: "Inicial",
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  starter: "oklch(0.72 0.16 350)",
  common: "oklch(0.7 0.05 260)",
  rare: "oklch(0.7 0.18 230)",
  epic: "oklch(0.68 0.2 300)",
  legendary: "oklch(0.78 0.18 80)",
};
