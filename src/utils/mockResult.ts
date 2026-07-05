import type { SignResult } from "../types/sign";

export const mockResult: SignResult = {
  detected: true,
  label: "thanks",
  name: "감사합니다",
  confidence: 0.87
};

export const mockQuizResult: SignResult = {
  detected: true,
  label: "water",
  name: "물",
  confidence: 0.92
};
