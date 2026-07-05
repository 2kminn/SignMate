import { ArrowRight, Camera, ScanLine, ShieldCheck } from "lucide-react";
import { signs } from "../data/signs";

interface TranslatePageProps {
  onStart: () => void;
}

export function TranslatePage({ onStart }: TranslatePageProps) {
  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <p className="text-xs font-extrabold tracking-[0.15em] text-sign-main">AI 수어 해석</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-sign-deep">
          카메라로 기초 수어를
          <br />
          바로 확인해보세요
        </h1>
        <p className="mt-4 text-sm leading-6 text-sign-sub">
          네, 아니요, 감사합니다, 도와주세요, 물 표현을 실시간으로 해석합니다.
        </p>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-sign-border bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.05)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sign-soft text-sign-main">
          <ScanLine size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-xl font-extrabold text-sign-deep">실시간 수어 해석</h2>
        <p className="mt-2 text-sm leading-6 text-sign-sub">카메라를 실행해 손동작을 확인해보세요.</p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sign-main px-4 font-extrabold text-white transition hover:bg-sign-dark"
        >
          <Camera size={20} aria-hidden="true" />
          해석 시작
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-xs font-bold text-sign-sub">지원하는 기초 표현</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {signs.map((sign) => (
              <span key={sign.label} className="rounded-full bg-sign-soft px-3 py-1.5 text-xs font-bold text-sign-dark">
                {sign.name}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-sign-soft px-4 py-3 text-xs font-semibold text-sign-dark">
          <ShieldCheck size={18} aria-hidden="true" />
          카메라 영상은 서버로 전송되지 않아요.
        </div>
      </section>

    </div>
  );
}
