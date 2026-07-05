import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { signs } from "./data/signs";
import { CameraSessionPage } from "./pages/CameraSessionPage";
import { LearnPage } from "./pages/LearnPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { QuizPage } from "./pages/QuizPage";
import { TranslatePage } from "./pages/TranslatePage";
import type { AppView, SessionMode, SignInfo, TabType } from "./types/sign";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("translate");
  const [appView, setAppView] = useState<AppView>(() =>
    window.localStorage.getItem("signmate-onboarding-done") === "true" ? "tabs" : "onboarding"
  );
  const [sessionMode, setSessionMode] = useState<SessionMode>("translate");
  const [selectedSign, setSelectedSign] = useState<SignInfo | null>(null);

  const startCameraSession = (mode: SessionMode, sign: SignInfo | null = null) => {
    setSessionMode(mode);
    setSelectedSign(sign);
    setAppView("cameraSession");
  };

  const endCameraSession = () => {
    setAppView("tabs");
  };

  const goToLearn = () => {
    setActiveTab("learn");
    setAppView("tabs");
  };

  const completeOnboarding = () => {
    window.localStorage.setItem("signmate-onboarding-done", "true");
    setActiveTab("translate");
    setAppView("tabs");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] border-x border-gray-100 bg-[#F7F9F8] shadow-[0_24px_80px_rgba(6,78,59,.12)]">
      {appView === "onboarding" ? (
        <OnboardingPage onComplete={completeOnboarding} />
      ) : appView === "cameraSession" ? (
        <CameraSessionPage
          mode={sessionMode}
          selectedSign={selectedSign}
          signs={signs}
          onEnd={endCameraSession}
          onGoLearn={goToLearn}
        />
      ) : (
        <>
          <AppHeader onShowOnboarding={() => setAppView("onboarding")} />
          <main className="pb-24">
            {activeTab === "translate" && (
              <TranslatePage onStart={() => startCameraSession("translate")} />
            )}
            {activeTab === "learn" && (
              <LearnPage onPractice={(sign) => startCameraSession("practice", sign)} />
            )}
            {activeTab === "quiz" && (
              <QuizPage onStartQuiz={(sign) => startCameraSession("quiz", sign)} />
            )}
          </main>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}
