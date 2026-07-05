/*
 * src/ai/emotion/EmotionEngine.ts
 * Holds a set of concurrent emotions and updates them over time.
 */

import { Emotion } from "./Emotion";
import { EmotionKey, Serializable } from "../types/Types";

export class EmotionEngine implements Serializable {
  private emotions: Emotion[] = [];
  private lastTick = Date.now();

  add(key: EmotionKey, intensity = 0.5, duration = 6, cause?: string, now = Date.now()) {
    const e = new Emotion(key, intensity, duration, cause, now);
    this.emotions.push(e);
  }

  update(now = Date.now()) {
    const elapsed = Math.max(0, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.emotions.forEach((e) => e.tick(elapsed));
    this.emotions = this.emotions.filter((e) => e.isActive());
  }

  // returns weighted summary: record key -> summed intensity
  summary() {
    const out: Record<string, number> = {};
    this.emotions.forEach((e) => (out[e.key] = (out[e.key] ?? 0) + e.intensity));
    return out;
  }

  dominant(): { key: EmotionKey; intensity: number } | null {
    if (this.emotions.length === 0) return null;
    const top = this.emotions.reduce((a, b) => (a.intensity > b.intensity ? a : b));
    return { key: top.key, intensity: top.intensity };
  }

  serialize() {
    return this.emotions.map((e) => e.serialize());
  }

  deserialize(obj: any) {
    if (!Array.isArray(obj)) return;
    this.emotions = obj.map((o) => {
      const e = new Emotion(o.key, o.intensity, o.duration, o.cause, o.createdAt);
      return e;
    });
  }
}
