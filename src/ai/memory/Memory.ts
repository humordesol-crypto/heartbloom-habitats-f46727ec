/*
 * src/ai/memory/Memory.ts
 * Single memory item structure.
 */

export interface MemoryRecord {
  id: string;
  type: string;
  importance: number; // 0..1
  timestamp: number;
  location?: string;
  actor?: string; // who caused it
  emotion?: string;
  expiresAt?: number | null;
}

export function makeMemory(type: string, opts?: Partial<MemoryRecord>): MemoryRecord {
  const now = Date.now();
  return {
    id: `${type}:${now}:${Math.floor(Math.random() * 10000)}`,
    type,
    importance: opts?.importance ?? 0.5,
    timestamp: opts?.timestamp ?? now,
    location: opts?.location,
    actor: opts?.actor,
    emotion: opts?.emotion,
    expiresAt: opts?.expiresAt ?? null,
  };
}
