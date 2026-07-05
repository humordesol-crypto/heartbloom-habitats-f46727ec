/*
 * src/ai/memory/MemorySystem.ts
 * Stores memories, supports queries and expirations.
 */

import { MemoryRecord } from "./Memory";
import { Serializable } from "../types/Types";

export class MemorySystem implements Serializable {
  private memories: MemoryRecord[] = [];

  add(m: MemoryRecord) {
    this.memories.push(m);
    // keep size bounded for performance
    if (this.memories.length > 300) this.memories.shift();
  }

  query(filter: (m: MemoryRecord) => boolean): MemoryRecord[] {
    return this.memories.filter(filter);
  }

  cleanup(now = Date.now()) {
    this.memories = this.memories.filter((m) => !(m.expiresAt && m.expiresAt < now));
  }

  serialize() {
    return this.memories.slice(-300);
  }

  deserialize(obj: any) {
    if (!Array.isArray(obj)) return;
    this.memories = obj as MemoryRecord[];
  }
}
