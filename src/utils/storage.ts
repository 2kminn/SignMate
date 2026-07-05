import type { SignLabel } from "../types/sign";

const QUIZ_RESULTS_KEY = "signmate-quiz-history";
const LEARNED_SIGNS_KEY = "signmate.learnedSigns";

interface QuizRecord {
  score: number;
  correct: boolean;
  savedAt: string;
}

export interface LearningStats {
  quizScore: number;
  bestQuizScore: number;
  quizAttempts: number;
  learnedSigns: SignLabel[];
}

const isBrowser = () => typeof window !== "undefined";

const readJson = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getLearningStats = (): LearningStats => {
  const results = readJson<QuizRecord[]>(QUIZ_RESULTS_KEY, []);
  const learnedSigns = readJson<SignLabel[]>(LEARNED_SIGNS_KEY, []);
  return {
    quizScore: results[results.length - 1]?.score ?? 0,
    bestQuizScore: results.reduce((best, result) => Math.max(best, result.score), 0),
    quizAttempts: results.length,
    learnedSigns
  };
};

export const saveQuizResult = (score: number, correct = true): void => {
  if (!isBrowser()) return;
  const results = readJson<QuizRecord[]>(QUIZ_RESULTS_KEY, []);
  results.push({ score, correct, savedAt: new Date().toISOString() });
  window.localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results.slice(-20)));
};

export const markSignAsLearned = (label: SignLabel): void => {
  if (!isBrowser()) return;
  const labels = readJson<SignLabel[]>(LEARNED_SIGNS_KEY, []);
  if (!labels.includes(label)) {
    window.localStorage.setItem(LEARNED_SIGNS_KEY, JSON.stringify([...labels, label]));
  }
};
