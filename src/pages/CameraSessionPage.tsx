import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CameraPanel,
  type CameraStatus,
  type SignPrediction
} from "../components/CameraPanel";
import { ProgressBar } from "../components/ProgressBar";
import type { SessionMode, SignInfo } from "../types/sign";
import { saveQuizResult } from "../utils/storage";

interface CameraSessionPageProps {
  mode: SessionMode;
  selectedSign: SignInfo | null;
  signs: SignInfo[];
  onEnd: () => void;
  onGoLearn: () => void;
}

export function CameraSessionPage({
  mode,
  selectedSign,
  signs,
  onEnd,
  onGoLearn
}: CameraSessionPageProps) {
  const quizSigns = useMemo(() => {
    if (mode !== "quiz") return signs;
    const first = selectedSign ?? signs[0];
    return first ? [first, ...signs.filter((sign) => sign.label !== first.label)] : [];
  }, [mode, selectedSign, signs]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [prediction, setPrediction] = useState<SignPrediction>({
    label: "wait",
    name: "인식 대기 중",
    confidence: 0,
    rawLabel: "wait",
    handCount: 0,
    accepted: false
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const currentQuizSign = quizSigns[quizIndex] ?? selectedSign ?? signs[0] ?? null;
  const targetSign = mode === "quiz" ? currentQuizSign : selectedSign;
  const matchesTarget =
    targetSign !== null && prediction.accepted && prediction.label === targetSign.label;

  const title =
    mode === "translate"
      ? "수어 해석 중"
      : mode === "practice"
        ? `${selectedSign?.name ?? "수어"} 따라 하기`
        : "수어 퀴즈";
  const description =
    mode === "translate"
      ? "카메라 앞의 기초 수어를 비춰보세요."
      : mode === "practice"
        ? "목표 수어를 천천히 따라 해보세요."
        : currentQuizSign
          ? `“${currentQuizSign.name}”을 수어로 표현해보세요.`
          : "제시된 단어를 수어로 표현해보세요.";
  const feedback =
    mode === "translate"
      ? prediction.accepted
        ? "해석 결과를 확인했어요."
        : "손이 잘 보이도록 카메라에 맞춰주세요."
      : mode === "practice"
        ? matchesTarget
          ? "목표 수어와 일치해요."
          : "손 모양을 천천히 다시 맞춰보세요."
        : matchesTarget
          ? "정답입니다!"
          : "다시 시도해보세요.";

  const retry = () => {
    setCameraActive(true);
    setCameraAttempt((current) => current + 1);
    setPrediction((current) => ({ ...current, confidence: 0, accepted: false }));
  };

  const nextQuestion = () => {
    const nextScore = score + (matchesTarget ? 1 : 0);
    setScore(nextScore);
    if (quizIndex >= quizSigns.length - 1) {
      saveQuizResult(Math.round((nextScore / quizSigns.length) * 100), true);
      setQuizComplete(true);
      setCameraActive(false);
      return;
    }
    setQuizIndex((current) => current + 1);
    retry();
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setScore(0);
    setQuizComplete(false);
    retry();
  };

  if (quizComplete) {
    return (
      <div className="flex min-h-screen flex-col bg-sign-outside px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onEnd}
          aria-label="퀴즈 종료"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sign-deep shadow-sm"
        >
          <X size={22} aria-hidden="true" />
        </button>
        <section className="my-auto rounded-[32px] bg-white p-8 text-center shadow-[0_16px_48px_rgba(15,23,42,.08)]">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sign-light text-sign-success">
            <CheckCircle2 size={42} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-black text-sign-deep">퀴즈 완료</h1>
          <p className="mt-3 text-sign-sub">기초 수어 퀴즈를 모두 풀었어요.</p>
          <p className="mt-8 text-5xl font-black text-sign-main">
            {score}
            <span className="text-2xl text-sign-sub"> / {quizSigns.length}</span>
          </p>
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={restartQuiz}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sign-main font-extrabold text-white hover:bg-sign-dark"
            >
              <RotateCcw size={19} aria-hidden="true" />
              다시 풀기
            </button>
            <button
              type="button"
              onClick={onGoLearn}
              className="min-h-[52px] w-full rounded-2xl bg-sign-light font-extrabold text-sign-deep hover:bg-sign-border"
            >
              학습 탭으로 돌아가기
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sign-app px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onEnd}
          aria-label="카메라 세션 종료"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sign-deep shadow-sm transition hover:bg-sign-soft"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-sign-deep">{title}</h1>
          <p className="mt-0.5 text-xs text-sign-sub">{description}</p>
        </div>
      </header>

      <section className="mb-4 rounded-3xl border border-sign-border bg-white px-4 py-3.5">
        {mode === "quiz" && currentQuizSign ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-sign-sub">
                문제 {quizIndex + 1} / {quizSigns.length}
              </p>
              <p className="mt-1 text-lg font-extrabold text-sign-deep">{currentQuizSign.name}</p>
            </div>
            <span className="rounded-full bg-sign-soft px-3 py-1.5 text-xs font-bold text-sign-main">
              {score}개 정답
            </span>
          </div>
        ) : mode === "practice" && selectedSign ? (
          <p className="text-sm font-bold text-sign-deep">
            목표 <span className="ml-2 text-sign-main">{selectedSign.name}</span>
          </p>
        ) : (
          <p className="text-sm font-bold text-sign-deep">손 전체가 화면 안에 보이게 맞춰주세요.</p>
        )}
      </section>

      <div className="relative">
        <CameraPanel
          compact
          active={cameraActive}
          attempt={cameraAttempt}
          onStatusChange={setCameraStatus}
          onPrediction={setPrediction}
        />
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-sign-light/80 bg-white/90 p-3.5 shadow-lg backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sign-sub">현재 해석</p>
              <p className="text-lg font-extrabold text-sign-deep">
                {prediction.accepted ? prediction.name : "인식 대기 중"}
              </p>
            </div>
            <span className="text-sm font-extrabold text-sign-main">
              {Math.round(prediction.confidence * 100)}%
            </span>
          </div>
          <ProgressBar value={prediction.confidence} label="일치도" />
        </div>
      </div>

      {cameraStatus !== "active" && (
        <button
          type="button"
          onClick={retry}
          disabled={cameraStatus === "requesting"}
          className="mt-4 min-h-[52px] w-full rounded-2xl bg-sign-main font-extrabold text-white disabled:opacity-60"
        >
          {cameraStatus === "requesting" ? "카메라 준비 중..." : "카메라 시작"}
        </button>
      )}

      <section
        aria-live="polite"
        className={`mt-4 flex items-center gap-3 rounded-3xl border p-4 ${
          mode === "translate" || matchesTarget
            ? "border-sign-border bg-sign-soft text-sign-deep"
            : "border-amber-200 bg-sign-tip text-sign-tipText"
        }`}
      >
        {mode === "translate" || matchesTarget ? (
          <CheckCircle2 className="shrink-0 text-sign-success" size={23} aria-hidden="true" />
        ) : (
          <RotateCcw className="shrink-0" size={21} aria-hidden="true" />
        )}
        <p className="text-sm font-extrabold">{feedback}</p>
      </section>

      <div className={`mt-4 grid gap-3 ${mode === "translate" ? "grid-cols-1" : "grid-cols-2"}`}>
        {mode === "translate" ? (
          <button
            type="button"
            onClick={onEnd}
            className="min-h-[52px] rounded-2xl bg-sign-deep font-extrabold text-white"
          >
            종료하기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={retry}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-sign-light px-3 font-extrabold text-sign-deep"
            >
              <RotateCcw size={18} aria-hidden="true" />
              {mode === "quiz" ? "다시 시도" : "다시 하기"}
            </button>
            <button
              type="button"
              onClick={mode === "quiz" ? nextQuestion : onGoLearn}
              className="flex min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-sign-main px-3 font-extrabold text-white"
            >
              {mode === "quiz" ? "다음 문제" : "다른 수어 배우기"}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
