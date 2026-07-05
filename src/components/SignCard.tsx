import { Camera, ChevronRight, Hand } from "lucide-react";
import type { SignCategory, SignInfo } from "../types/sign";

interface SignCardProps {
  sign: SignInfo;
  onClick: () => void;
  onPractice: () => void;
}

const difficultyLabel = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움"
} as const;

const categoryLabel: Record<SignCategory, string> = {
  greeting: "인사",
  response: "응답",
  request: "요청",
  daily: "생활"
};

export function SignCard({ sign, onClick, onPractice }: SignCardProps) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.04)] transition hover:border-sign-border">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${sign.name} 수어 자세히 보기`}
        className="flex w-full items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sign-main"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sign-soft text-sign-main">
          <Hand size={27} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold text-sign-deep">{sign.name}</span>
          <span className="mt-0.5 line-clamp-1 block text-sm text-sign-sub">{sign.description}</span>
          <span className="mt-2 flex gap-1.5">
            <span className="rounded-full border border-sign-light bg-sign-soft px-2 py-0.5 text-[10px] font-bold text-sign-dark">
              {categoryLabel[sign.category]}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
              {difficultyLabel[sign.difficulty]}
            </span>
          </span>
        </span>
        <ChevronRight className="shrink-0 text-gray-300" size={21} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onPractice}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-sign-soft text-sm font-extrabold text-sign-dark transition hover:bg-sign-light"
      >
        <Camera size={17} aria-hidden="true" />
        따라 하기
      </button>
    </article>
  );
}
