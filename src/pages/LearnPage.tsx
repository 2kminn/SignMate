import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SignCard } from "../components/SignCard";
import { SignDetailModal } from "../components/SignDetailModal";
import { signs } from "../data/signs";
import type { SignCategory, SignInfo } from "../types/sign";
import { markSignAsLearned } from "../utils/storage";

interface LearnPageProps {
  onPractice: (sign: SignInfo) => void;
}

type CategoryFilter = "all" | SignCategory;

const categoryFilters: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "greeting", label: "인사" },
  { value: "response", label: "응답" },
  { value: "request", label: "요청" },
  { value: "daily", label: "생활" }
];

export function LearnPage({ onPractice }: LearnPageProps) {
  const [selectedSign, setSelectedSign] = useState<SignInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase("ko");
  const filteredSigns = useMemo(
    () =>
      signs.filter((sign) => {
        const matchesCategory =
          selectedCategory === "all" || sign.category === selectedCategory;
        const searchableText = sign.name.toLocaleLowerCase("ko");
        const matchesSearch =
          normalizedSearchTerm.length === 0 || searchableText.includes(normalizedSearchTerm);
        return matchesCategory && matchesSearch;
      }),
    [normalizedSearchTerm, selectedCategory]
  );

  const selectedCategoryLabel =
    categoryFilters.find((category) => category.value === selectedCategory)?.label ?? "전체";
  const resultTitle = normalizedSearchTerm
    ? "검색 결과"
    : selectedCategory === "all"
      ? "전체 표현"
      : `${selectedCategoryLabel} 표현`;

  const handlePractice = (sign: SignInfo) => {
    markSignAsLearned(sign.label);
    setSelectedSign(null);
    onPractice(sign);
  };

  return (
    <div className="space-y-7 px-5 py-6">
      <div>
        <h1 className="page-title">수어 학습</h1>
        <p className="mt-1.5 text-sm text-sign-sub">기초 수어 표현을 상황별로 배워보세요.</p>
      </div>
      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">수어 표현 검색</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="수어 표현을 검색해보세요"
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-base text-sign-text outline-none transition placeholder:text-gray-400 focus:border-sign-main focus:ring-4 focus:ring-sign-light/70"
          />
        </label>
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="상황별 카테고리"
        >
          {categoryFilters.map((category) => {
            const selected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                aria-pressed={selected}
                className={`min-h-11 shrink-0 rounded-full border px-5 text-sm transition ${
                  selected
                    ? "border-sign-main bg-sign-main font-bold text-white shadow-sm"
                    : "border-sign-light bg-white font-semibold text-sign-dark hover:bg-sign-soft"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-extrabold text-sign-text">
            {normalizedSearchTerm ? resultTitle : selectedCategory === "all" ? "기초 표현" : resultTitle}
          </h2>
          <span className="text-sm font-bold text-sign-main">{filteredSigns.length}개</span>
        </div>
        {filteredSigns.length > 0 ? (
          <div className="space-y-3" aria-label="기초 수어 목록">
            {filteredSigns.map((sign) => (
              <SignCard
                key={sign.label}
                sign={sign}
                onClick={() => setSelectedSign(sign)}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            role="status"
          >
            <span className="text-4xl" aria-hidden="true">🔍</span>
            <h3 className="mt-4 text-lg font-extrabold text-sign-deep">검색 결과가 없어요</h3>
            <p className="mt-2 text-sm leading-relaxed text-sign-sub">
              다른 표현이나 카테고리로 다시 검색해보세요.
            </p>
          </div>
        )}
      </div>
      {selectedSign && (
        <SignDetailModal
          sign={selectedSign}
          onClose={() => setSelectedSign(null)}
          onPractice={handlePractice}
        />
      )}
    </div>
  );
}
