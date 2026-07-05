/*
 * src/ai/decision/DecisionEngine.ts
 * High-level decision engine: given needs/personality/mood it ranks actions.
 */

import { ActionKey } from "../types/Types";
import { UtilityCalculator, NeedMap } from "./UtilityCalculator";

export class DecisionEngine {
  private util = new UtilityCalculator();

  scoreAll(needs: NeedMap, personalityBias = 0, hour = new Date().getHours()) {
    const actions: ActionKey[] = ["feed", "drink", "sleep", "bath", "play", "pet", "explore", "idle"];
    return actions.map((a) => ({ action: a, breakdown: this.util.compute(a, needs, personalityBias, hour) }));
  }

  pickBest(needs: NeedMap, personalityBias = 0, hour = new Date().getHours()) {
    const scored = this.scoreAll(needs, personalityBias, hour);
    scored.sort((a, b) => b.breakdown.total - a.breakdown.total);
    // add small softmax-ish exploration
    const top = scored[0];
    return { chosen: top.action, scored };
  }
}
