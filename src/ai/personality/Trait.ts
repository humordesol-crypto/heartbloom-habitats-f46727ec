/*
 * src/ai/personality/Trait.ts
 * Defines trait vector and helpers.
 */

export interface PersonalityTraits {
  curious: number;
  lazy: number;
  brave: number;
  fearful: number;
  affectionate: number;
  independent: number;
  playful: number;
  calm: number;
  energetic: number;
  smart: number;
  stubborn: number;
}

export function randomPersonality(seed = Math.random()): PersonalityTraits {
  // simple deterministic-ish initializer
  const r = () => Math.max(0, Math.min(100, Math.floor(seed * 100 * (0.6 + Math.random() * 0.8))));
  return {
    curious: r(), lazy: braveOr(60), brave: braveOr(60), fearful: r(), affectionate: r(), independent: r(), playful: r(), calm: r(), energetic: r(), smart: r(), stubborn: r(),
  };
  function braveOr(def: number) { return Math.max(0, Math.min(100, Math.floor(def * (0.6 + Math.random() * 0.8)))); }
}
