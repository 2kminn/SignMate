import { Camera, Check, Hand, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { SignInfo } from "../types/sign";

interface SignDetailModalProps {
  sign: SignInfo;
  onClose: () => void;
  onPractice: (sign: SignInfo) => void;
}

export function SignDetailModal({ sign, onClose, onPractice }: SignDetailModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-detail-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-[430px] overflow-y-auto rounded-[28px] bg-white px-5 pb-6 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between">
          <h2 id="sign-detail-title" className="text-2xl font-extrabold text-sign-deep">
            {sign.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="상세 화면 닫기"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sign-text hover:bg-sign-soft"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div
          role="img"
          aria-label={`${sign.name} 수어 일러스트 자리`}
          className="my-5 flex aspect-[2/1] items-center justify-center rounded-[20px] bg-gradient-to-br from-sign-soft to-sign-light text-sign-main"
        >
          <Hand size={58} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="leading-7 text-sign-text">{sign.description}</p>
        <div className="mt-5">
          <h3 className="font-extrabold text-sign-deep">사용 예시</h3>
          <ul className="mt-2 space-y-2">
            {sign.usageExamples.map((example) => (
              <li key={example} className="rounded-xl bg-sign-soft px-4 py-3 text-sm text-sign-deep">
                “{example}”
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5">
          <h3 className="font-extrabold text-sign-deep">동작 가이드</h3>
          <ul className="mt-2 space-y-3">
            {sign.guide.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-sign-text">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sign-main text-white">
                  <Check size={13} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => onPractice(sign)}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sign-main px-4 font-extrabold text-white transition hover:bg-sign-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sign-main"
        >
          <Camera size={20} aria-hidden="true" />
          카메라로 따라 하기
        </button>
      </section>
    </div>,
    document.body
  );
}
