import { BadgeCheck, BookOpen, Camera } from "lucide-react";
import type { TabType } from "../types/sign";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "translate" as const, label: "해석", icon: Camera },
  { id: "learn" as const, label: "학습", icon: BookOpen },
  { id: "quiz" as const, label: "퀴즈", icon: BadgeCheck }
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="grid grid-cols-3 gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-label={`수어 ${label}`}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-bold transition ${
                selected
                  ? "bg-sign-light text-sign-main"
                  : "text-[#9CA3AF] hover:bg-gray-50 hover:text-sign-deep"
              }`}
            >
              <Icon className="mb-1.5" size={22} strokeWidth={selected ? 2.5 : 2} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
