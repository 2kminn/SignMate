import {
  BadgeCheck,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Hand,
  ScanLine,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";

interface OnboardingPageProps {
  onComplete: () => void;
}

interface OnboardingStep {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: OnboardingStep[] = [
  {
    eyebrow: "SIGNMATE",
    title: "손짓을 이해하는\n기초 수어 도우미",
    description: "일상에 필요한 수어를 쉽고 가볍게 시작하세요.",
    icon: Hand
  },
  {
    title: "안녕하세요!\nSignMate입니다",
    description: "카메라로 수어를 해석하고\n배우고 연습해보세요.",
    icon: Sparkles
  },
  {
    eyebrow: "핵심 기능 01",
    title: "실시간 수어 해석",
    description: "카메라로 손동작을 비추면\n기초 수어의 의미를 확인할 수 있어요.",
    icon: ScanLine
  },
  {
    eyebrow: "핵심 기능 02",
    title: "수어 학습",
    description: "기초 수어를 상황별로 배우고\n카메라로 따라 해볼 수 있어요.",
    icon: BookOpen
  },
  {
    eyebrow: "핵심 기능 03",
    title: "퀴즈로 연습",
    description: "배운 수어를 퀴즈로 확인하고\n실력을 키워보세요.",
    icon: BadgeCheck
  }
];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === steps.length - 1;

  const continueOnboarding = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  const goToPreviousStep = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  return (
    <main className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden bg-[linear-gradient(180deg,#F0FDF4_0%,#F9FAFB_72%)] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="relative flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goToPreviousStep}
              aria-label="이전 설명으로 돌아가기"
              className="onboarding-back-button absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border border-sign-border bg-white text-sign-deep shadow-sm transition active:scale-95 active:bg-sign-soft"
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>
          )}
          <span className="flex items-center gap-2 text-sm font-black tracking-tight text-sign-deep">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sign-main text-white">
              <Hand size={19} aria-hidden="true" />
            </span>
            SignMate
          </span>
        </div>
        <span className="absolute right-0 text-xs font-bold text-sign-sub">{stepIndex + 1} / {steps.length}</span>
      </div>

      <section
        key={stepIndex}
        className="onboarding-slide my-auto min-h-0 py-5 text-center"
      >
        <div className="onboarding-visual relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[40px] border border-sign-border bg-white shadow-[0_20px_60px_rgba(6,78,59,.1)]">
          <span className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sign-light opacity-70" />
          <span className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-sign-soft" />
          <span className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-sign-main text-white shadow-[0_16px_32px_rgba(16,185,129,.25)]">
            <Icon size={54} aria-hidden={true} />
          </span>
          {stepIndex === 2 && (
            <Camera className="absolute bottom-7 right-8 text-sign-dark" size={25} aria-hidden="true" />
          )}
        </div>

        {step.eyebrow && (
          <p className="onboarding-eyebrow mt-6 text-xs font-extrabold tracking-[0.16em] text-sign-main">{step.eyebrow}</p>
        )}
        <h1 className={`${step.eyebrow ? "mt-2" : "onboarding-title-without-eyebrow mt-6"} whitespace-pre-line text-3xl font-black leading-tight tracking-[-0.04em] text-sign-deep`}>
          {step.title}
        </h1>
        <p className="mt-3 whitespace-pre-line text-base leading-6 text-sign-sub">{step.description}</p>
      </section>

      <div className="shrink-0">
        <div className="mb-3 flex justify-center gap-2" aria-label={`온보딩 ${stepIndex + 1}단계`}>
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === stepIndex ? "w-7 bg-sign-main" : "w-2 bg-sign-light"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={continueOnboarding}
          className="onboarding-primary-button flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-sign-main px-5 font-extrabold text-white shadow-[0_12px_28px_rgba(16,185,129,.24)] transition active:scale-[0.98] active:bg-sign-dark"
        >
          {isLast ? "시작하기" : "다음"}
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
