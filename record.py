from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

import cv2

from hand_features import feature_column_names, extract_hand_features
from mediapipe_hands import HandDetector


DEFAULT_LABELS_PATH = Path("labels.json")
DEFAULT_OUTPUT_PATH = Path("data/sign_samples.csv")
NO_HAND_LABELS = {"idle", "wait"}


def load_labels(path: Path) -> dict[str, dict]:
    if not path.exists():
        raise SystemExit(f"라벨 파일을 찾을 수 없습니다: {path}")

    with path.open("r", encoding="utf-8") as file:
        labels = json.load(file)

    by_label = {item["label"]: item for item in labels}
    if len(by_label) != len(labels):
        raise SystemExit("labels.json에 중복 label이 있습니다.")
    return by_label


def append_sample(csv_path: Path, label_info: dict, features) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    is_new_file = not csv_path.exists()

    with csv_path.open("a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        if is_new_file:
            writer.writerow(["label", "label_name", "recorded_at", *feature_column_names()])

        writer.writerow(
            [
                label_info["label"],
                label_info["name"],
                datetime.now().isoformat(timespec="seconds"),
                *[f"{float(value):.8f}" for value in features],
            ]
        )


def count_samples(csv_path: Path) -> Counter:
    counts: Counter = Counter()
    if not csv_path.exists():
        return counts

    with csv_path.open("r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get("label"):
                counts[row["label"]] += 1
    return counts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SignMate 수어 샘플 수집")
    parser.add_argument("--label", required=True, help="수집할 label 값. 예: hello, thanks")
    parser.add_argument("--samples", type=int, default=300, help="이번 실행에서 저장할 샘플 수")
    parser.add_argument("--camera", type=int, default=0, help="OpenCV 카메라 인덱스")
    parser.add_argument("--labels", type=Path, default=DEFAULT_LABELS_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="한 손만 보여도 저장합니다. 기본값은 양손이 모두 보일 때만 저장입니다.",
    )
    parser.add_argument(
        "--allow-no-hands",
        action="store_true",
        help="wait/idle 라벨에서 손이 보이지 않는 프레임도 저장합니다.",
    )
    parser.add_argument(
        "--no-mirror",
        action="store_true",
        help="카메라 프레임을 좌우 반전하지 않습니다.",
    )
    args = parser.parse_args()

    if args.samples <= 0:
        parser.error("--samples는 1 이상이어야 합니다.")
    if args.allow_no_hands and args.label not in NO_HAND_LABELS:
        parser.error("--allow-no-hands는 wait/idle 라벨에서만 사용하세요.")
    return args


def can_save_sample(seen: dict[str, bool], *, allow_partial: bool, allow_no_hands: bool) -> bool:
    seen_count = int(seen["Left"]) + int(seen["Right"])
    if seen_count == 2:
        return True
    if seen_count == 1:
        return allow_partial
    return allow_no_hands


def draw_status(frame, args, seen, recording: bool, saved: int, can_save: bool) -> None:
    status = "REC" if recording else "PAUSED"
    color = (0, 0, 255) if recording else (60, 180, 75)
    message = "saving" if can_save else "waiting for required hands"

    cv2.putText(frame, f"{status} | label={args.label} | {saved}/{args.samples}", (16, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)
    cv2.putText(frame, f"Left={int(seen['Left'])} Right={int(seen['Right'])} | {message}", (16, 64), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    cv2.putText(frame, "r: record/pause | q: quit", (16, 96), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)


def print_counts(csv_path: Path) -> None:
    counts = count_samples(csv_path)
    print("\n현재 저장된 샘플 수")
    if not counts:
        print("- 아직 저장된 샘플이 없습니다.")
        return
    for label, count in sorted(counts.items()):
        print(f"- {label}: {count}")


def main() -> int:
    args = parse_args()
    labels = load_labels(args.labels)
    if args.label not in labels:
        available = ", ".join(sorted(labels))
        raise SystemExit(f"알 수 없는 label입니다: {args.label}. 사용 가능: {available}")

    label_info = labels[args.label]
    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise SystemExit(
            "카메라를 열 수 없습니다. macOS 카메라 권한을 확인하거나 --camera 값을 바꿔 보세요."
        )

    recording = False
    saved = 0

    print(f"라벨 '{args.label}'({label_info['name']}) 수집을 시작합니다.")
    print("창에서 r을 누르면 녹화 시작/일시정지, q를 누르면 종료합니다.")
    print_counts(args.output)

    with HandDetector(
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
    ) as hands:
        while saved < args.samples:
            ok, frame = cap.read()
            if not ok:
                print("카메라 프레임을 읽지 못했습니다.")
                break

            # 기본값은 selfie-camera처럼 보이도록 좌우 반전합니다. MediaPipe handedness도
            # 이 입력 가정과 맞기 때문에 hand_features에서 Left/Right 순서가 안정됩니다.
            display = frame if args.no_mirror else cv2.flip(frame, 1)
            rgb = cv2.cvtColor(display, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)
            hands.draw_landmarks(display, results)

            features, seen = extract_hand_features(results, flip_handedness=args.no_mirror)
            allowed = can_save_sample(
                seen,
                allow_partial=args.allow_partial,
                allow_no_hands=args.allow_no_hands,
            )

            if recording and allowed:
                append_sample(args.output, label_info, features)
                saved += 1

            draw_status(display, args, seen, recording, saved, allowed)
            cv2.imshow("SignMate Recorder", display)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("r"):
                recording = not recording
                print("녹화 시작" if recording else "녹화 일시정지")
            elif key == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()

    print(f"\n이번 실행에서 저장한 샘플: {saved}/{args.samples}")
    print_counts(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
