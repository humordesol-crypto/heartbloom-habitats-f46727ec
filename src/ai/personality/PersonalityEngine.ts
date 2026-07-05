/*
 * src/ai/personality/PersonalityEngine.ts
 * Holds personality and exposes modifiers used by decision and mood engines.
 */

import { PersonalityTraits, randomPersonality } from "./Trait";
import { Serializable } from "../types/Types";

export class PersonalityEngine implements Serializable {
  traits: PersonalityTraits;

  constructor(seed?: number) {
    this.traits = seed != null ? randomPersonality(seed) : randomPersonality();
  }

  getTrait(t: keyof PersonalityTraits) {
    return this.traits[t];
  }

  // small drift over time
  update(now = Date.now()) {
    // intentionally tiny, kept deterministic-free
    Object.keys(this.traits).forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = k as any;
      const delta = (Math.random() - 0.5) * 0.02;
      this.traits[key] = Math.max(0, Math.min(100, this.traits[key] + delta));
    });
  }

  serialize() {
    return { traits: this.traits };
  }

  deserialize(obj: any) {
    if (!obj) return;
    if (obj.traits) this.traits = obj.traits;
  }
}
