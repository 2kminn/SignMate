from __future__ import annotations

import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np


HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
DEFAULT_TASK_MODEL_PATH = Path("models/hand_landmarker.task")

HAND_CONNECTIONS = (
    (0, 1),
    (1, 5),
    (5, 9),
    (9, 13),
    (13, 17),
    (0, 17),
    (1, 2),
    (2, 3),
    (3, 4),
    (5, 6),
    (6, 7),
    (7, 8),
    (9, 10),
    (10, 11),
    (11, 12),
    (13, 14),
    (14, 15),
    (15, 16),
    (17, 18),
    (18, 19),
    (19, 20),
)


class HandDetector:
    """Small compatibility layer for MediaPipe legacy Hands and Tasks Vision."""

    def __init__(
        self,
        *,
        max_num_hands: int = 2,
        min_detection_confidence: float = 0.6,
        min_tracking_confidence: float = 0.6,
        task_model_path: Path = DEFAULT_TASK_MODEL_PATH,
    ) -> None:
        self.max_num_hands = max_num_hands
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self.task_model_path = task_model_path
        self.backend = "legacy" if hasattr(mp, "solutions") else "tasks"
        self._hands: Any = None
        self._mp_hands: Any = None
        self._mp_drawing: Any = None
        self._mp_styles: Any = None

    def __enter__(self) -> "HandDetector":
        if self.backend == "legacy":
            self._open_legacy()
        else:
            self._open_tasks()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._hands is not None:
            self._hands.close()

    def process(self, rgb_frame: np.ndarray):
        if self.backend == "legacy":
            return self._hands.process(rgb_frame)

        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        timestamp_ms = time.monotonic_ns() // 1_000_000
        return self._hands.detect_for_video(image, timestamp_ms)

    def draw_landmarks(self, frame: np.ndarray, results: Any) -> None:
        if self.backend == "legacy":
            self._draw_legacy(frame, results)
        else:
            self._draw_tasks(frame, results)

    def _open_legacy(self) -> None:
        self._mp_hands = mp.solutions.hands
        self._mp_drawing = mp.solutions.drawing_utils
        self._mp_styles = mp.solutions.drawing_styles
        self._hands = self._mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=self.max_num_hands,
            model_complexity=1,
            min_detection_confidence=self.min_detection_confidence,
            min_tracking_confidence=self.min_tracking_confidence,
        )

    def _open_tasks(self) -> None:
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        model_path = ensure_hand_landmarker_model(self.task_model_path)
        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=self.max_num_hands,
            min_hand_detection_confidence=self.min_detection_confidence,
            min_tracking_confidence=self.min_tracking_confidence,
        )
        self._hands = vision.HandLandmarker.create_from_options(options)

    def _draw_legacy(self, frame: np.ndarray, results: Any) -> None:
        if not getattr(results, "multi_hand_landmarks", None):
            return
        for hand_landmarks in results.multi_hand_landmarks:
            self._mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                self._mp_hands.HAND_CONNECTIONS,
                self._mp_styles.get_default_hand_landmarks_style(),
                self._mp_styles.get_default_hand_connections_style(),
            )

    def _draw_tasks(self, frame: np.ndarray, results: Any) -> None:
        hand_landmarks = getattr(results, "hand_landmarks", None)
        if not hand_landmarks:
            return

        height, width = frame.shape[:2]
        for landmarks in hand_landmarks:
            points = [
                (int(point.x * width), int(point.y * height))
                for point in landmarks
            ]
            for start, end in HAND_CONNECTIONS:
                cv2.line(frame, points[start], points[end], (22, 166, 115), 2)
            for x, y in points:
                cv2.circle(frame, (x, y), 4, (71, 181, 255), -1)


def ensure_hand_landmarker_model(path: Path = DEFAULT_TASK_MODEL_PATH) -> Path:
    if path.exists() and path.stat().st_size > 0:
        return path

    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"MediaPipe hand landmarker 모델을 다운로드합니다: {path}")
    try:
        urllib.request.urlretrieve(HAND_LANDMARKER_URL, path)
    except (urllib.error.URLError, OSError) as exc:
        raise SystemExit(
            "MediaPipe Tasks hand model을 다운로드하지 못했습니다.\n"
            f"수동으로 {HAND_LANDMARKER_URL} 파일을 받아 {path}에 저장한 뒤 다시 실행하세요.\n"
            f"원인: {exc}"
        ) from exc
    return path
