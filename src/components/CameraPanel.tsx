import { AlertCircle, Camera, CameraOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "error";

interface CameraPanelProps {
  compact?: boolean;
  active: boolean;
  attempt?: number;
  onStatusChange?: (status: CameraStatus) => void;
}

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

export function CameraPanel({ compact = false, active, attempt = 0, onStatusChange }: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    if (!active) {
      stopCamera();
      setStatus("idle");
      return stopCamera;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return stopCamera;
    }

    setStatus("requesting");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("active");
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(getErrorState(error));
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, attempt]);

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
      {/* MediaPipe 담당자는 이 canvas에 랜드마크를 그릴 수 있습니다. */}
      <canvas
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
