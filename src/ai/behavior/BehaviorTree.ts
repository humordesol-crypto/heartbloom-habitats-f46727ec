/*
 * src/ai/behavior/BehaviorTree.ts
 * Simple orchestrator that ticks a root node and exposes last result.
 */

import { BehaviorNode, NodeStatus } from "./BehaviorNode";

export class BehaviorTree {
  root: BehaviorNode;
  lastStatus: NodeStatus = "running";

  constructor(root: BehaviorNode) { this.root = root; }

  tick(context: any) {
    const r = this.root.tick(context);
    this.lastStatus = r as NodeStatus;
    return this.lastStatus;
  }
}
