/*
 * src/ai/index.ts
 * Lightweight facade to create a ready AIScheduler and helpers. Kept small so
 * consumers (usePet hook) can import and integrate incrementally.
 */

import { AIScheduler } from "./scheduler/AIScheduler";
import { saveAISnapshot, loadAISnapshot } from "./persistence/Serializer";

export function createAI() {
  const scheduler = new AIScheduler();
  loadAISnapshot(scheduler);
  return {
    scheduler,
    start: () => scheduler.start(),
    stop: () => scheduler.stop(),
    recommend: () => scheduler.recommendAction(),
    save: () => saveAISnapshot(scheduler),
  };
}
