/*
 * src/ai/behavior/BehaviorNode.ts
 * Minimal behavior tree node types (selector, sequence, action, condition)
 * Responsibility: provide a tiny BT runtime used by the AIScheduler.
 */

export type NodeStatus = "success" | "running" | "failure";

export abstract class BehaviorNode {
  abstract tick(context: any): Promise<NodeStatus> | NodeStatus;
}

export class ConditionNode extends BehaviorNode {
  constructor(private fn: (c: any) => boolean) { super(); }
  tick(context: any) { return this.fn(context) ? "success" : "failure"; }
}

export class ActionNode extends BehaviorNode {
  constructor(private fn: (c: any) => Promise<NodeStatus> | NodeStatus) { super(); }
  tick(context: any) { return this.fn(context); }
}

export class SequenceNode extends BehaviorNode {
  children: BehaviorNode[];
  constructor(children: BehaviorNode[]) { super(); this.children = children; }
  tick(context: any) {
    for (const c of this.children) {
      const r = c.tick(context);
      if (r === "running") return "running";
      if (r === "failure") return "failure";
    }
    return "success";
  }
}

export class SelectorNode extends BehaviorNode {
  children: BehaviorNode[];
  constructor(children: BehaviorNode[]) { super(); this.children = children; }
  tick(context: any) {
    for (const c of this.children) {
      const r = c.tick(context);
      if (r === "running") return "running";
      if (r === "success") return "success";
    }
    return "failure";
  }
}
