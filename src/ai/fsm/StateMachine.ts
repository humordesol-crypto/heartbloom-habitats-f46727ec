/*
 * src/ai/fsm/StateMachine.ts
 * Small FSM driver that holds states and performs transitions.
 */

import { State } from "./State";

export class StateMachine {
  private states: Record<string, State> = {};
  private current?: State;

  add(name: string, s: State) { this.states[name] = s; return this; }
  set(name: string) {
    const next = this.states[name];
    if (!next) throw new Error(`Unknown state ${name}`);
    const prev = this.current;
    if (prev) prev.exit(next);
    this.current = next;
    this.current.enter(prev);
  }

  update(dtSec: number) {
    if (!this.current) return;
    this.current.update(dtSec);
    const t = this.current.shouldTransition();
    if (t) this.set(t);
  }

  getCurrentName(): string | null { return this.current?.name ?? null; }
}
