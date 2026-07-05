import { Volume2 } from "lucide-react";
import type { SignResult } from "../types/sign";
import { ProgressBar } from "./ProgressBar";

interface ResultPanelProps {
  result: SignResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const speakResult = () => {
    if (!result.detected || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.name));
  };

  return (
    <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.045)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sign-sub">현재 해석</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-sign-deep">
            {result.detected ? result.name : "인식 불가"}
          </p>
        </div>
        <button
          type="button"
          onClick={speakResult}
          disabled={!result.detected}
          aria-label="인식 결과 음성으로 듣기"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-sign-main transition hover:bg-sign-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Volume2 size={21} aria-hidden="true" />
        </button>
      </div>
      {result.detected && <ProgressBar value={result.confidence} />}
    </section>
  );
}
