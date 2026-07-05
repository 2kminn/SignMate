import { ArrowRight, Camera, CheckCircle2, Clock3, History, Sparkles } from "lucide-react";
import { useState } from "react";
import { signs } from "../data/signs";
import type { SignInfo } from "../types/sign";
import { getRandomSign } from "../utils/quiz";
import { getLearningStats } from "../utils/storage";

interface QuizPageProps {
  onStartQuiz: (sign: SignInfo) => void;
}

export function QuizPage({ onStartQuiz }: QuizPageProps) {
  const [target] = useState<SignInfo>(() => getRandomSign(signs) ?? signs[0]);
  const [stats] = useState(getLearningStats);

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <p className="text-xs font-extrabold tracking-[0.15em] text-sign-main">연습 모드</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-sign-deep">
          배운 수어를
          <br />
          퀴즈로 확인해요
        </h1>
        <p className="mt-4 text-sm leading-6 text-sign-sub">
          카메라 앞에서 제시된 수어를 표현하고
          <br />
          실시간 피드백을 받아보세요.
        </p>
      </div>

      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,.05)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sign-soft text-sign-main">
          <Sparkles size={24} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-sign-deep">기초 수어 5문제</h2>
        <ul className="mt-4 space-y-3 text-sm text-sign-sub">
          <li className="flex items-center gap-3">
            <Clock3 className="text-sign-main" size={18} aria-hidden="true" />
            예상 소요 시간 2분
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="text-sign-main" size={18} aria-hidden="true" />
            일치도 기반 실시간 피드백
          </li>
          <li className="flex items-center gap-3">
            <Camera className="text-sign-main" size={18} aria-hidden="true" />
            카메라로 직접 표현
          </li>
        </ul>
        <button
          type="button"
          onClick={() => onStartQuiz(target)}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sign-main px-4 font-extrabold text-white transition hover:bg-sign-dark"
        >
          퀴즈 시작
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <History className="text-sign-main" size={20} aria-hidden="true" />
          <h2 className="font-extrabold text-sign-deep">최근 결과</h2>
        </div>
        {stats.quizAttempts > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sign-soft p-4">
              <p className="text-xs font-bold text-sign-sub">최고 점수</p>
              <p className="mt-1 text-2xl font-black text-sign-main">{stats.bestQuizScore}점</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-sign-sub">마지막 기록</p>
              <p className="mt-1 text-2xl font-black text-sign-deep">{stats.quizScore}점</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm font-bold text-sign-deep">아직 퀴즈 기록이 없어요.</p>
            <p className="mt-1 text-xs text-sign-sub">첫 퀴즈를 시작해보세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
