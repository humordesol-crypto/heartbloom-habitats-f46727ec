/*
 * src/ai/needs/Need.ts
 * Small class representing a single need with continuous value and urgency.
 * Responsibility: hold value, history and provide urgency and tick logic.
 */

import { NeedKey, Serializable } from "../types/Types";

export class Need implements Serializable {
  key: NeedKey;
  value: number; // 0..100
  lastUpdated: number;
  // simple sliding window for rate-of-change
  private lastValues: { t: number; v: number }[] = [];

  constructor(key: NeedKey, value = 50, now = Date.now()) {
    this.key = key;
    this.value = Math.max(0, Math.min(100, value));
    this.lastUpdated = now;
    this.lastValues.push({ t: now, v: this.value });
  }

  // tick applies an external delta (can be negative)
  tick(delta: number, now = Date.now()) {
    this.value = Math.max(0, Math.min(100, this.value + delta));
    this.lastUpdated = now;
    this.lastValues.push({ t: now, v: this.value });
    // keep window small
    if (this.lastValues.length > 8) this.lastValues.shift();
  }

  // approximate recent rate (value change per minute)
  getRatePerMinute(): number {
    if (this.lastValues.length < 2) return 0;
    const a = this.lastValues[0];
    const b = this.lastValues[this.lastValues.length - 1];
    const minutes = Math.max(0.001, (b.t - a.t) / 60000);
    return (b.v - a.v) / minutes;
  }

  // urgency combines low value and fast decline; returns 0..1
  getUrgency(): number {
    const valueFactor = (100 - this.value) / 100; // 0 when full, 1 when empty
    const rate = -Math.min(0, this.getRatePerMinute()); // positive when decreasing
    const rateFactor = Math.tanh(rate / 10); // squash
    // weight recentness lightly
    return Math.max(0, Math.min(1, 0.7 * valueFactor + 0.3 * rateFactor));
  }

  serialize() {
    return { key: this.key, value: this.value, lastUpdated: this.lastUpdated, lastValues: this.lastValues };
  }

  deserialize(obj: any) {
    this.value = typeof obj.value === "number" ? obj.value : this.value;
    this.lastUpdated = typeof obj.lastUpdated === "number" ? obj.lastUpdated : this.lastUpdated;
    this.lastValues = Array.isArray(obj.lastValues) ? obj.lastValues : this.lastValues;
  }
}
