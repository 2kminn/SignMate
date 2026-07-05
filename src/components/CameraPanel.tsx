import { AlertCircle, Camera, CameraOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "error";

export interface SignPrediction {
  label: string;
  name: string;
  confidence: number;
  rawLabel: string;
  handCount: number;
  accepted: boolean;
}

interface CameraPanelProps {
  compact?: boolean;
  active: boolean;
  attempt?: number;
  onStatusChange?: (status: CameraStatus) => void;
  onPrediction?: (prediction: SignPrediction) => void;
}

interface SignMateEngine {
  start: () => Promise<void>;
  dispose: () => void;
}

type CreateSignMate = (options: {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  modelUrl: string;
  threshold: number;
  smoothingWindow: number;
  onPrediction: (prediction: SignPrediction) => void;
  onError: (error: unknown) => void;
}) => Promise<SignMateEngine>;

interface SignMateMediaPipeGlobal {
  createSignMate: CreateSignMate;
}

let engineLoaderPromise: Promise<SignMateMediaPipeGlobal> | null = null;

const loadSignMateEngine = () => {
  const browserWindow = window as typeof window & {
    SignMateMediaPipe?: SignMateMediaPipeGlobal;
  };
  if (browserWindow.SignMateMediaPipe) {
    return Promise.resolve(browserWindow.SignMateMediaPipe);
  }
  if (engineLoaderPromise) return engineLoaderPromise;

  engineLoaderPromise = new Promise<SignMateMediaPipeGlobal>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = `${import.meta.env.BASE_URL}signmate/src/signmate-engine.js`;
    script.onload = () => {
      if (browserWindow.SignMateMediaPipe) {
        resolve(browserWindow.SignMateMediaPipe);
      } else {
        reject(new Error("SignMate MediaPipe API를 찾을 수 없습니다."));
      }
    };
    script.onerror = () => reject(new Error("SignMate MediaPipe 엔진을 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return engineLoaderPromise;
};

const statusText: Record<CameraStatus, string> = {
  idle: "카메라 실행 대기",
  requesting: "카메라 권한 확인 중",
  active: "카메라 실행 중",
  denied: "카메라 권한 필요",
  unavailable: "카메라 사용 불가",
  error: "카메라 연결 오류"
};

const getErrorState = (error: unknown): CameraStatus => {
  if (!(error instanceof DOMException)) return "error";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") return "denied";
  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") return "unavailable";
  return "error";
};

export function CameraPanel({
  compact = false,
  active,
  attempt = 0,
  onStatusChange,
  onPrediction
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SignMateEngine | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    let cancelled = false;

    const stopEngine = () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };

    if (!active) {
      stopEngine();
      setStatus("idle");
      return stopEngine;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return stopEngine;
    }

    setStatus("requesting");

    const startEngine = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) return;
        const { createSignMate } = await loadSignMateEngine();
        const engine = await createSignMate({
          videoElement: videoRef.current,
          canvasElement: canvasRef.current,
          modelUrl: `${import.meta.env.BASE_URL}signmate/assets/signmate_model.json`,
          threshold: 0.7,
          smoothingWindow: 12,
          onPrediction: (prediction) => {
            if (!cancelled) onPrediction?.(prediction);
          },
          onError: (error) => {
            console.error("MediaPipe inference failed", error);
            if (!cancelled) setStatus("error");
          }
        });

        if (cancelled) {
          engine.dispose();
          return;
        }

        engineRef.current = engine;
        await engine.start();
        if (!cancelled) setStatus("active");
      } catch (error: unknown) {
        if (!cancelled) setStatus(getErrorState(error));
      }
    };

    void startEngine();

    return () => {
      cancelled = true;
      stopEngine();
    };
  }, [active, attempt, onPrediction]);

  const hasError = status === "denied" || status === "unavailable" || status === "error";

  return (
    <section
      aria-label="카메라 미리보기"
      className={`relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-800 to-gray-950 shadow-[0_16px_40px_rgba(15,23,42,.15)] ${
        compact ? "aspect-[8/9]" : "aspect-square"
      }`}
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover transition-opacity ${
          status === "active" ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        playsInline
        aria-label="실시간 카메라 영상"
      />
      {/* MediaPipe가 감지한 손 랜드마크를 카메라 영상 위에 표시합니다. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
        aria-hidden="true"
      />

      {status !== "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white/85">
          {status === "requesting" ? (
            <LoaderCircle className="animate-spin" size={compact ? 34 : 44} aria-hidden="true" />
          ) : hasError ? (
            <CameraOff size={compact ? 34 : 44} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <Camera size={compact ? 34 : 44} strokeWidth={1.6} aria-hidden="true" />
          )}
          <p className="mt-3 text-sm font-semibold">
            {status === "denied"
              ? "브라우저 설정에서 카메라 권한을 허용해주세요."
              : status === "unavailable"
                ? "사용 가능한 카메라가 없거나 브라우저가 지원하지 않습니다."
                : status === "error"
                  ? "다른 앱이 카메라를 사용 중인지 확인해주세요."
                  : status === "requesting"
                    ? "카메라 사용 권한을 확인하고 있어요."
                    : "버튼을 눌러 카메라를 시작하세요."}
          </p>
          {hasError && (
            <p className="mt-2 flex items-center gap-1 text-xs text-white/65">
              <AlertCircle size={14} aria-hidden="true" />
              HTTPS 또는 localhost 환경에서 사용할 수 있어요.
            </p>
          )}
        </div>
      )}

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-[11px] font-bold text-sign-deep shadow backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "active"
              ? "bg-sign-success"
              : hasError
                ? "bg-sign-error"
                : status === "requesting"
                  ? "animate-pulse bg-amber-400"
                  : "bg-gray-400"
          }`}
          aria-hidden="true"
        />
        {statusText[status]}
      </div>
      <span className="camera-corner left-5 top-[4.5rem] border-l-[3px] border-t-[3px]" />
      <span className="camera-corner right-5 top-[4.5rem] border-r-[3px] border-t-[3px]" />
      <span className="camera-corner bottom-5 left-5 border-b-[3px] border-l-[3px]" />
      <span className="camera-corner bottom-5 right-5 border-b-[3px] border-r-[3px]" />
    </section>
  );
}
