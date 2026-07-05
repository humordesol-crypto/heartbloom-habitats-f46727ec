/*
 * src/ai/types/Types.ts
 * Shared enums and types used by AI subsystems.
 * Purpose: centralize basic keys and small utilities so modules stay decoupled.
 */

export type NeedKey =
  | "hunger"
  | "thirst"
  | "energy"
  | "hygiene"
  | "health"
  | "fun"
  | "love"
  | "sleep"
  | "curiosity"
  | "stress";

export type EmotionKey =
  | "joy"
  | "fear"
  | "anger"
  | "sadness"
  | "excitement"
  | "anxiety"
  | "loneliness"
  | "affection"
  | "pride"
  | "shame";

export type ActionKey = "feed" | "drink" | "sleep" | "bath" | "play" | "pet" | "explore" | "idle";

export type BehaviorKey =
  | "still"
  | "look-left"
  | "look-right"
  | "walk-left"
  | "walk-right"
  | "sit"
  | "stretch"
  | "dance"
  | "jump"
  | "wobble"
  | "hide"
  | "scratch"
  | "trip"
  | "yawn"
  | "spin"
  | "head-tilt"
  | "ear-wiggle";

export type Mood =
  | "very-happy"
  | "happy"
  | "neutral"
  | "bored"
  | "irritated"
  | "sad"
  | "sick"
  | "sleepy"
  | "excited";

export interface Serializable {
  serialize(): any;
  deserialize(obj: any): void;
}
