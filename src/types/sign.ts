export type SignLabel = "yes" | "no" | "thanks" | "help" | "water" | "unknown";
export type SignCategory = "greeting" | "response" | "request" | "daily";

export interface SignInfo {
  label: SignLabel;
  name: string;
  description: string;
  usageExamples: string[];
  difficulty: "easy" | "normal" | "hard";
  category: SignCategory;
  guide: string[];
}

export interface SignResult {
  detected: boolean;
  label: SignLabel;
  name: string;
  confidence: number;
}

export type TabType = "translate" | "learn" | "quiz";
export type AppView = "onboarding" | "tabs" | "cameraSession";
export type SessionMode = "translate" | "practice" | "quiz";
