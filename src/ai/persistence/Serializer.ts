/*
 * src/ai/persistence/Serializer.ts
 * Simple helper to persist AI snapshot into localStorage alongside existing pet state.
 * Responsibility: do not overwrite existing pet data; store AI data under `aiSnapshot` property.
 */

import { AIScheduler } from "../scheduler/AIScheduler";

const STORAGE_KEY = "fluffy-pet-v3";

export function saveAISnapshot(scheduler: AIScheduler) {
  try {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.aiSnapshot = scheduler.snapshot();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn("Failed to save AI snapshot", e);
  }
}

export function loadAISnapshot(scheduler: AIScheduler) {
  try {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.aiSnapshot) scheduler.loadSnapshot(parsed.aiSnapshot);
  } catch (e) {
    console.warn("Failed to load AI snapshot", e);
  }
}
