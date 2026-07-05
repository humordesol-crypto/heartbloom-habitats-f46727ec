/*
 * src/ai/mood/MoodEngine.ts
 * Slow-changing mood computed from recent emotions, memories and personality.
 */

import { Mood, Serializable } from "../types/Types";
import { EmotionEngine } from "../emotion/EmotionEngine";

export class MoodEngine implements Serializable {
  private emotionEngine: EmotionEngine;
  private lastMood: Mood = "neutral";
  private lastTick = Date.now();

  constructor(emotionEngine: EmotionEngine) {
    this.emotionEngine = emotionEngine;
  }

  update(now = Date.now()) {
    const elapsedMin = Math.max(0.001, (now - this.lastTick) / 60000);
    this.lastTick = now;
    // compute a simple aggregation of emotions to mood
    const s = this.emotionEngine.summary();
    const joy = s["joy"] ?? 0;
    const excitement = s["excitement"] ?? 0;
    const sadness = s["sadness"] ?? 0;
    const anxiety = s["anxiety"] ?? 0;

    const score = joy * 2 + excitement * 1.5 - sadness * 1.8 - anxiety * 1.2;
    const prev = this.lastMood;
    if (score > 1.0) this.lastMood = "very-happy";
    else if (score > 0.4) this.lastMood = "happy";
    else if (score > -0.3) this.lastMood = "neutral";
    else if (score > -0.8) this.lastMood = "bored";
    else this.lastMood = "sad";

    // small random drift towards excitement if excitement present
    if ((s["excitement"] ?? 0) > 0.6 && Math.random() < 0.08 * elapsedMin) this.lastMood = "excited";

    // clamp: if previously sleepy keep sleepy unless changed slowly
    if (prev === "sleepy" && Math.random() < 0.6) this.lastMood = prev;
  }

  getMood(): Mood {
    return this.lastMood;
  }

  serialize() {
    return { lastMood: this.lastMood, lastTick: this.lastTick };
  }

  deserialize(obj: any) {
    if (!obj) return;
    this.lastMood = obj.lastMood ?? this.lastMood;
    this.lastTick = obj.lastTick ?? this.lastTick;
  }
}
