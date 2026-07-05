import type { SignInfo, SignLabel } from "../types/sign";

export const getRandomSign = (items: SignInfo[]): SignInfo | undefined =>
  items.length > 0 ? items[Math.floor(Math.random() * items.length)] : undefined;

export const isCorrectAnswer = (targetLabel: SignLabel, resultLabel: SignLabel): boolean =>
  targetLabel === resultLabel;

export const calculateScore = (confidence: number): number =>
  Math.round(Math.min(1, Math.max(0, confidence)) * 100);
