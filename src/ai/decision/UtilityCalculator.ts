/*
 * src/ai/decision/UtilityCalculator.ts
 * Computes a utility score for candidate actions given context.
 * Responsibility: provide explainable breakdown so behavior isn't magic.
 */

import { ActionKey, NeedKey } from "../types/Types";

export type NeedMap = Partial<Record<NeedKey, number>>;

export interface UtilityBreakdown {
  base: number; // base utility
  needInfluence: number; // how much needs push it
  personalityBias: number;
  randomness: number;
  total: number;
}

export class UtilityCalculator {
  // personality and mood should be small numbers [-1..1] biases
  compute(action: ActionKey, needs: NeedMap, personalityBias = 0, timeOfDay = 12): UtilityBreakdown {
    let base = 0;
    switch (action) {
      case "feed": base = 0.2; break;
      case "drink": base = 0.15; break;
      case "sleep": base = 0.12; break;
      case "bath": base = 0.05; break;
      case "play": base = 0.18; break;
      case "pet": base = 0.08; break;
      case "explore": base = 0.07; break;
      default: base = 0.02; break;
    }

    // needs influence - simple mapping
    const hunger = needs.hunger ?? 80;
    const thirst = needs.thirst ?? 80;
    const energy = needs.energy ?? 80;
    const fun = needs.fun ?? 80;

    let needInfluence = 0;
    if (action === "feed") needInfluence = (100 - hunger) / 100 * 1.5;
    if (action === "drink") needInfluence = (100 - thirst) / 100 * 1.6;
    if (action === "sleep") needInfluence = (100 - energy) / 100 * 1.4;
    if (action === "play") needInfluence = (100 - fun) / 100 * 1.2;
    if (action === "pet") needInfluence = ((100 - (needs.love ?? 80)) / 100) * 1.0;

    // time-of-day: prefer sleep at night
    const hour = timeOfDay;
    const todBias = (hour >= 22 || hour < 6) && action === "sleep" ? 0.22 : 0;

    const randomness = (Math.random() - 0.5) * 0.04;

    const personality = personalityBias * 0.12;

    const total = Math.max(0, base + needInfluence + personality + todBias + randomness);

    return { base, needInfluence, personalityBias: personality, randomness, total };
  }
}
