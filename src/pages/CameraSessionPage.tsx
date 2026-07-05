import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleX,
  Lightbulb,
  RotateCcw,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CameraPanel,
  type CameraStatus,
  type SignPrediction
} from "../components/CameraPanel";
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
    return first
      ? [first, ...signs.filter((sign) => sign.label !== first.label)].slice(0, 10)
      : [];
  }, [mode, selectedSign, signs]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [quizHintVisible, setQuizHintVisible] = useState(false);
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);
  const [quizRecognitionPending, setQuizRecognitionPending] = useState(false);
  const [quizRecognitionReady, setQuizRecognitionReady] = useState(false);
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

  useEffect(() => {
    if (
      mode !== "quiz" ||
      !quizRecognitionReady ||
      cameraStatus !== "active" ||
      !prediction.accepted ||
      quizFeedback
    ) return;
    if (matchesTarget) {
      setQuizFeedback("correct");
      setCameraActive(false);
    }
  }, [
    cameraStatus,
    matchesTarget,
    mode,
    prediction.accepted,
    quizFeedback,
    quizRecognitionReady
  ]);

  useEffect(() => {
    if (mode !== "quiz" || cameraStatus !== "active") {
      setQuizCountdown(null);
      setQuizRecognitionPending(false);
      setQuizRecognitionReady(false);
      return;
    }

    let remaining = 3;
    let recognitionTimer: number | null = null;
    setQuizCountdown(remaining);
    setQuizRecognitionPending(false);
    setQuizRecognitionReady(false);
    setPrediction((current) => ({ ...current, confidence: 0, accepted: false }));

    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining === 0) {
        window.clearInterval(timer);
        setQuizCountdown(null);
        setQuizRecognitionPending(true);
        recognitionTimer = window.setTimeout(() => {
          setQuizRecognitionPending(false);
          setQuizRecognitionReady(true);
        }, 1500);
        return;
      }
      setQuizCountdown(remaining);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      if (recognitionTimer !== null) window.clearTimeout(recognitionTimer);
    };
  }, [cameraAttempt, cameraStatus, mode, quizIndex]);

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
  const retry = () => {
    setQuizFeedback(null);
    setQuizHintVisible(false);
    setCameraActive(true);
    setCameraAttempt((current) => current + 1);
    setPrediction((current) => ({ ...current, confidence: 0, accepted: false }));
  };

  const giveUpQuestion = () => {
    setQuizFeedback("incorrect");
    setQuizHintVisible(false);
    setCameraActive(false);
  };

  const nextQuestion = () => {
    const nextScore = score + (quizFeedback === "correct" ? 1 : 0);
    setScore(nextScore);
    setQuizFeedback(null);
    setQuizHintVisible(false);
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
    setQuizFeedback(null);
    setQuizHintVisible(false);
    retry();
  };

  if (quizComplete) {
    return (
      <div className="flex min-h-screen flex-col bg-sign-outside px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onEnd}
          aria-label="퀴즈 종료"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sign-deep shadow-sm transition hover:bg-sign-soft active:scale-95"
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
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sign-main font-extrabold text-white transition hover:bg-sign-dark active:scale-[0.98]"
            >
              <RotateCcw size={19} aria-hidden="true" />
              다시 풀기
            </button>
            <button
              type="button"
              onClick={onGoLearn}
              className="min-h-[52px] w-full rounded-2xl bg-sign-light font-extrabold text-sign-deep transition hover:bg-sign-border active:scale-[0.98]"
            >
              학습 탭으로 돌아가기
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
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
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-sign-deep">
                목표 <span className="ml-2 text-sign-main">{selectedSign.name}</span>
              </p>
              <button
                type="button"
                onClick={() => setGuideExpanded((current) => !current)}
                aria-expanded={guideExpanded}
                aria-controls="practice-sign-guide"
                className="flex min-h-10 items-center gap-1 rounded-full bg-sign-soft px-3 text-xs font-extrabold text-sign-dark transition active:scale-95"
              >
                {guideExpanded ? "동작 접기" : "동작 보기"}
                <ChevronDown
                  className={`transition-transform ${guideExpanded ? "rotate-180" : ""}`}
                  size={16}
                  aria-hidden="true"
                />
              </button>
            </div>
            {guideExpanded && (
              <div id="practice-sign-guide" className="mt-3 border-t border-sign-light pt-3">
                <div className="flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <img
                    src={`${import.meta.env.BASE_URL}sign-images/${selectedSign.label}.png`}
                    alt={`${selectedSign.name} 수어 동작 설명`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-sign-sub">{selectedSign.description}</p>
              </div>
            )}
          </div>
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
          onPrediction={(nextPrediction) => {
            if (mode !== "quiz" || quizRecognitionReady) {
              setPrediction(nextPrediction);
            }
          }}
        />
        {mode === "quiz" && quizCountdown !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]">
            <div className="text-center text-white">
              <p className="text-7xl font-black drop-shadow-lg">{quizCountdown}</p>
              <p className="mt-3 text-sm font-extrabold">손을 준비해주세요</p>
            </div>
          </div>
        )}
        {mode === "quiz" && quizRecognitionPending && (
          <div className="absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-slate-950/70 px-4 py-4 text-center text-sm font-extrabold text-white shadow-lg backdrop-blur">
            손동작 인식 중...
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-sign-light/80 bg-white/90 p-3.5 shadow-lg backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sign-sub">현재 해석</p>
          <p className="text-lg font-extrabold text-sign-deep">
            {prediction.accepted ? prediction.name : "인식 대기 중"}
          </p>
        </div>
      </div>

      {cameraStatus !== "active" && (
        <button
          type="button"
          onClick={retry}
          disabled={cameraStatus === "requesting" || cameraStatus === "initializing"}
          className="mt-4 min-h-[52px] w-full rounded-2xl bg-sign-main font-extrabold text-white transition hover:bg-sign-dark active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {cameraStatus === "requesting" || cameraStatus === "initializing"
            ? "카메라 준비 중..."
            : "카메라 시작"}
        </button>
      )}

      <div className={`mt-4 grid gap-3 ${mode === "practice" ? "grid-cols-2" : "grid-cols-1"}`}>
        {mode === "translate" ? (
          <button
            type="button"
            onClick={onEnd}
            className="min-h-[52px] rounded-2xl border border-red-200 bg-white font-extrabold text-red-600 transition hover:border-red-300 hover:bg-red-50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            종료하기
          </button>
        ) : mode === "practice" ? (
          <>
            <button
              type="button"
              onClick={retry}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-sign-light px-3 font-extrabold text-sign-deep transition hover:bg-sign-border active:scale-[0.98]"
            >
              <RotateCcw size={18} aria-hidden="true" />
              다시 하기
            </button>
            <button
              type="button"
              onClick={onGoLearn}
              className="flex min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-sign-main px-3 font-extrabold text-white transition hover:bg-sign-dark active:scale-[0.98]"
            >
              다른 수어 배우기
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        ) : mode === "quiz" ? (
          <button
            type="button"
            onClick={giveUpQuestion}
            className="min-h-[52px] rounded-2xl border border-gray-200 bg-white font-extrabold text-sign-sub transition hover:bg-gray-50 active:scale-[0.98]"
          >
            잘 모르겠어요
          </button>
        ) : null}
      </div>
    </div>
    {quizFeedback && currentQuizSign &&
      createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-feedback-title"
            className="relative max-h-[calc(100dvh-2.5rem)] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setQuizFeedback(null);
                setQuizHintVisible(false);
              }}
              aria-label="퀴즈 피드백 닫기"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sign-sub transition hover:bg-gray-200 active:scale-95"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                quizFeedback === "correct"
                  ? "bg-sign-light text-sign-success"
                  : "bg-red-50 text-sign-error"
              }`}
            >
              {quizFeedback === "correct" ? (
                <CheckCircle2 size={36} aria-hidden="true" />
              ) : (
                <CircleX size={36} aria-hidden="true" />
              )}
            </span>
            <h2 id="quiz-feedback-title" className="mt-4 text-2xl font-black text-sign-deep">
              {quizFeedback === "correct" ? "정답이에요!" : "아쉬워요, 다시 해볼까요?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-sign-sub">
              {quizFeedback === "correct"
                ? `“${currentQuizSign.name}” 동작을 정확히 표현했어요.`
                : `목표 수어는 “${currentQuizSign.name}”입니다.`}
            </p>

            {quizFeedback === "incorrect" && quizHintVisible && (
              <div className="mt-5 rounded-2xl border border-sign-light bg-sign-soft p-3 text-left">
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img
                    src={`${import.meta.env.BASE_URL}sign-images/${currentQuizSign.label}.png`}
                    alt={`${currentQuizSign.name} 수어 동작 힌트`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-sign-sub">
                  {currentQuizSign.description}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={retry}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-sign-light px-3 font-extrabold text-sign-deep transition hover:bg-sign-border active:scale-[0.98]"
              >
                <RotateCcw size={18} aria-hidden="true" />
                다시 하기
              </button>
              {quizFeedback === "correct" ? (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="flex min-h-[52px] items-center justify-center gap-1 rounded-2xl bg-sign-main px-3 font-extrabold text-white transition hover:bg-sign-dark active:scale-[0.98]"
                >
                  다음 퀴즈
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuizHintVisible((current) => !current)}
                  aria-expanded={quizHintVisible}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-amber-100 px-3 font-extrabold text-amber-800 transition hover:bg-amber-200 active:scale-[0.98]"
                >
                  <Lightbulb size={18} aria-hidden="true" />
                  {quizHintVisible ? "힌트 닫기" : "힌트 보기"}
                </button>
              )}
            </div>
            {quizFeedback === "incorrect" && (
              <button
                type="button"
                onClick={nextQuestion}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 font-extrabold text-sign-sub transition hover:bg-gray-50 active:scale-[0.98]"
              >
                {quizIndex >= quizSigns.length - 1 ? "결과 보기" : "다른 문제로 넘어가기"}
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
