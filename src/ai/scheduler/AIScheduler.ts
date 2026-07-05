/*
 * src/ai/scheduler/AIScheduler.ts
 * Runs AI subsystems at different frequencies and exposes a single tick hook.
 */

import { NeedsEngine } from "../needs/NeedsEngine";
import { EmotionEngine } from "../emotion/EmotionEngine";
import { MoodEngine } from "../mood/MoodEngine";
import { MemorySystem } from "../memory/MemorySystem";
import { PersonalityEngine } from "../personality/PersonalityEngine";
import { DecisionEngine } from "../decision/DecisionEngine";

export class AIScheduler {
  needs: NeedsEngine;
  emotions: EmotionEngine;
  mood: MoodEngine;
  memory: MemorySystem;
  personality: PersonalityEngine;
  decision: DecisionEngine;

  private running = false;
  private last = Date.now();
  private rafId: any = null;

  constructor() {
    this.needs = new NeedsEngine();
    this.emotions = new EmotionEngine();
    this.mood = new MoodEngine(this.emotions);
    this.memory = new MemorySystem();
    this.personality = new PersonalityEngine();
    this.decision = new DecisionEngine();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = Date.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private loop = () => {
    if (!this.running) return;
    const now = Date.now();
    const dtMs = now - this.last;
    this.last = now;
    // 60Hz-like: FSM/animation-sensitive - use requestAnimationFrame
    this.needs.update(now);
    // 10Hz: behavior/decision - sampled by simple counters
    this.emotions.update(now);
    this.mood.update(now);
    this.personality.update(now);
    // memory and learning are slower - handled externally via explicit calls

    this.rafId = requestAnimationFrame(this.loop);
  };

  // convenience: ask decision engine for best action
  recommendAction() {
    const needsSnapshot = this.needs.getAll();
    const personalityBias = (this.personality.getTrait("playful" as any) ?? 50) / 50 - 1; // -1..+1
    return this.decision.pickBest(needsSnapshot, personalityBias);
  }

  // serialize all engines
  snapshot() {
    return {
      needs: this.needs.serialize(),
      emotions: this.emotions.serialize(),
      mood: this.mood.serialize(),
      memory: this.memory.serialize(),
      personality: this.personality.serialize(),
    };
  }

  loadSnapshot(obj: any) {
    if (!obj) return;
    this.needs.deserialize(obj.needs);
    this.emotions.deserialize(obj.emotions);
    this.mood.deserialize(obj.mood);
    this.memory.deserialize(obj.memory);
    this.personality.deserialize(obj.personality);
  }
}
