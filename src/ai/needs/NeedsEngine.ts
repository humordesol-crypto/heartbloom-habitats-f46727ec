/*
 * src/ai/needs/NeedsEngine.ts
 * Manages all Needs. Provides continuous updates decoupled from UI.
 */

import { Need } from "./Need";
import { NeedKey, Serializable } from "../types/Types";

export class NeedsEngine implements Serializable {
  private needs: Record<NeedKey, Need> = {} as any;
  private lastTick = Date.now();

  constructor(now = Date.now()) {
    const keys: NeedKey[] = [
      "hunger",
      "thirst",
      "energy",
      "hygiene",
      "health",
      "fun",
      "love",
      "sleep",
      "curiosity",
      "stress",
    ];
    keys.forEach((k) => (this.needs[k] = new Need(k, 80, now)));
  }

  // update called by AIScheduler with elapsed time in seconds
  update(now = Date.now()) {
    const elapsed = Math.max(0, (now - this.lastTick) / 1000);
    this.lastTick = now;
    // apply decay curves (per-second small deltas) - tuned conservatively
    const DECAY_PER_SEC: Partial<Record<NeedKey, number>> = {
      hunger: -0.015, // ~0.9/min
      thirst: -0.02,
      energy: -0.01,
      hygiene: -0.008,
      fun: -0.013,
      love: -0.006,
      health: 0, // health changes via disease or starvation
      sleep: -0.01,
      curiosity: -0.004,
      stress: 0.001,
    };

    (Object.keys(this.needs) as NeedKey[]).forEach((k) => {
      const perSec = DECAY_PER_SEC[k] ?? 0;
      if (perSec !== 0) this.needs[k].tick(perSec * elapsed, now);
    });
  }

  getNeed(k: NeedKey) {
    return this.needs[k];
  }

  getAll(): Record<NeedKey, number> {
    const out: any = {};
    (Object.keys(this.needs) as NeedKey[]).forEach((k) => (out[k] = this.needs[k].value));
    return out;
  }

  serialize() {
    const out: any = {};
    (Object.keys(this.needs) as NeedKey[]).forEach((k) => (out[k] = this.needs[k].serialize()));
    return out;
  }

  deserialize(obj: any) {
    if (!obj) return;
    (Object.keys(this.needs) as NeedKey[]).forEach((k) => {
      if (obj[k]) this.needs[k].deserialize(obj[k]);
    });
  }
}
