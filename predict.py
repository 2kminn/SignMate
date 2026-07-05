from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw, ImageFont

from hand_features import FEATURE_SIZE, extract_hand_features
from mediapipe_hands import HandDetector


DEFAULT_MODEL_PATH = Path("models/sign_model.keras")
DEFAULT_ENCODER_PATH = Path("models/label_encoder.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SignMate 실시간 수어 예측")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--encoder", type=Path, default=DEFAULT_ENCODER_PATH)
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--threshold", type=float, default=0.70)
    parser.add_argument("--smoothing-window", type=int, default=12)
    parser.add_argument("--no-mirror", action="store_true", help="카메라 프레임을 좌우 반전하지 않습니다.")
    return parser.parse_args()


def load_runtime(model_path: Path, encoder_path: Path):
    missing = [str(path) for path in (model_path, encoder_path) if not path.exists()]
    if missing:
        raise SystemExit(
            "모델 파일이 없습니다: "
            + ", ".join(missing)
            + "\n먼저 record.py로 데이터를 수집하고 train.py를 실행하세요."
        )

    model = tf.keras.models.load_model(model_path)
    with encoder_path.open("r", encoding="utf-8") as file:
        encoder = json.load(file)

    if encoder.get("feature_size") != FEATURE_SIZE:
        raise SystemExit(
            f"label_encoder feature_size가 {FEATURE_SIZE}와 다릅니다: {encoder.get('feature_size')}"
        )

    classes = sorted(encoder["classes"], key=lambda item: item["index"])
    return model, classes


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_overlay(frame, lines: list[tuple[str, tuple[int, int, int]]], font) -> np.ndarray:
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(image)
    draw.rectangle((14, 14, 470, 154), fill=(20, 24, 31))

    y = 24
    for text, color in lines:
        draw.text((24, y), text, font=font, fill=color)
        y += 30

    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def predict_smoothed(model, features: np.ndarray, probability_window: deque[np.ndarray]) -> np.ndarray:
    probs = model.predict(features.reshape(1, -1), verbose=0)[0].astype(np.float32)
    probability_window.append(probs)
    return np.mean(np.stack(probability_window, axis=0), axis=0)


def main() -> int:
    args = parse_args()
    if not 0.0 <= args.threshold <= 1.0:
        raise SystemExit("--threshold는 0.0에서 1.0 사이여야 합니다.")
    if args.smoothing_window <= 0:
        raise SystemExit("--smoothing-window는 1 이상이어야 합니다.")

    model, classes = load_runtime(args.model, args.encoder)
    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise SystemExit(
            "카메라를 열 수 없습니다. macOS 카메라 권한을 확인하거나 --camera 값을 바꿔 보세요."
        )

    font = load_font(22)
    probability_window: deque[np.ndarray] = deque(maxlen=args.smoothing_window)

    with HandDetector(
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
    ) as hands:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("카메라 프레임을 읽지 못했습니다.")
                break

            # record.py와 같은 handedness 정책입니다. 기본은 mirror/selfie 입력이고,
            # --no-mirror를 쓰면 MediaPipe handedness를 좌우 교환해 canonical 순서를 맞춥니다.
            display = frame if args.no_mirror else cv2.flip(frame, 1)
            rgb = cv2.cvtColor(display, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)
            hands.draw_landmarks(display, results)

            features, seen = extract_hand_features(results, flip_handedness=args.no_mirror)
            smoothed_probs = predict_smoothed(model, features, probability_window)
            top_index = int(np.argmax(smoothed_probs))
            confidence = float(smoothed_probs[top_index])
            predicted = classes[top_index]

            if confidence >= args.threshold:
                word = predicted["name"]
                raw_label = predicted["label"]
                color = (255, 255, 255)
            else:
                word = "인식 대기"
                raw_label = "uncertain"
                color = (220, 220, 220)

            hand_count = int(seen["Left"]) + int(seen["Right"])
            display = draw_overlay(
                display,
                [
                    (f"예측: {word}", color),
                    (f"confidence: {confidence:.2f}", (141, 220, 180)),
                    (f"감지된 손: {hand_count}개", (255, 205, 116)),
                    (f"raw label: {raw_label}", (210, 220, 235)),
                ],
                font,
            )
            cv2.putText(display, "q: quit", (18, display.shape[0] - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.imshow("SignMate Predictor", display)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
