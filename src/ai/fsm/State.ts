/*
 * src/ai/fsm/State.ts
 * Minimal FSM state interface.
 */

export abstract class State {
  abstract name: string;
  enter(prev?: State): void { /* optional */ }
  update(dtSec: number): void { /* optional */ }
  exit(next?: State): void { /* optional */ }
  shouldTransition(): string | null { return null; }
}
