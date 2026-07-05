/*
 * src/ai/emotion/Emotion.ts
 * Small emotion record with intensity, duration, cause and decay.
 */

import { EmotionKey, Serializable } from "../types/Types";

export class Emotion implements Serializable {
  key: EmotionKey;
  intensity: number; // 0..1
  duration: number; // seconds
  cause?: string;
  createdAt: number;
  decayRate: number; // intensity per second

  constructor(key: EmotionKey, intensity = 0.5, duration = 6, cause?: string, now = Date.now()) {
    this.key = key;
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.duration = duration;
    this.cause = cause;
    this.createdAt = now;
    this.decayRate = (this.intensity / Math.max(1, this.duration));
  }

  tick(elapsedSec: number) {
    this.intensity = Math.max(0, this.intensity - this.decayRate * elapsedSec);
  }

  isActive() {
    return this.intensity > 0.02;
  }

  serialize() {
    return { key: this.key, intensity: this.intensity, duration: this.duration, cause: this.cause, createdAt: this.createdAt };
  }

  deserialize(obj: any) {
    if (!obj) return;
    this.intensity = typeof obj.intensity === "number" ? obj.intensity : this.intensity;
    this.duration = typeof obj.duration === "number" ? obj.duration : this.duration;
    this.cause = typeof obj.cause === "string" ? obj.cause : this.cause;
    this.createdAt = typeof obj.createdAt === "number" ? obj.createdAt : this.createdAt;
    this.decayRate = (this.intensity / Math.max(1, this.duration));
  }
}
