import { CircleHelp, Hand } from "lucide-react";

interface AppHeaderProps {
  onShowOnboarding: () => void;
}

export function AppHeader({ onShowOnboarding }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 px-5 pb-3 pt-[max(.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sign-main text-white shadow-[0_6px_16px_rgba(16,185,129,.18)]">
            <Hand size={27} aria-hidden="true" />
          </span>
          <div>
            <p className="text-3xl font-extrabold tracking-[-0.04em] text-sign-deep">SignMate</p>
            <p className="text-sm font-medium text-gray-500">매일 가볍게 배우는 수어</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onShowOnboarding}
          aria-label="온보딩 다시 보기"
          title="처음 안내 다시 보기"
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-sign-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sign-main"
        >
          <CircleHelp size={21} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
