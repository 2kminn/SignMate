from __future__ import annotations

from typing import Any

import numpy as np


HAND_ORDER = ("Left", "Right")
LANDMARKS_PER_HAND = 21
VALUES_PER_LANDMARK = 3
FEATURES_PER_HAND = LANDMARKS_PER_HAND * VALUES_PER_LANDMARK
FEATURE_SIZE = FEATURES_PER_HAND * len(HAND_ORDER)


def feature_column_names() -> list[str]:
    return [f"f{i}" for i in range(FEATURE_SIZE)]


def extract_hand_features(
    results: Any,
    *,
    flip_handedness: bool = False,
) -> tuple[np.ndarray, dict[str, bool]]:
    """Extract a fixed 126-dim Left-then-Right feature vector from MediaPipe Hands.

    MediaPipe handedness assumes a mirrored/selfie camera input. The Python
    capture scripts mirror frames before processing, so labels can be used as-is.
    If you process an unmirrored camera frame, set flip_handedness=True.
    """
    slots = {
        "Left": np.zeros(FEATURES_PER_HAND, dtype=np.float32),
        "Right": np.zeros(FEATURES_PER_HAND, dtype=np.float32),
    }
    seen = {"Left": False, "Right": False}

    hand_landmarks = _get_hand_landmarks(results)
    if not hand_landmarks:
        return _combine_slots(slots), seen

    handedness = _get_handedness(results)
    best_by_hand: dict[str, tuple[float, np.ndarray]] = {}

    for index, landmarks in enumerate(hand_landmarks):
        hand_label, score = _hand_label_from_results(handedness, index)
        if flip_handedness and hand_label in HAND_ORDER:
            hand_label = _opposite_hand(hand_label)

        if hand_label not in HAND_ORDER:
            continue

        vector = normalize_landmarks(landmarks)
        current = best_by_hand.get(hand_label)
        if current is None or score >= current[0]:
            best_by_hand[hand_label] = (score, vector)

    for hand_label, (_, vector) in best_by_hand.items():
        slots[hand_label] = vector
        seen[hand_label] = True

    return _combine_slots(slots), seen


def normalize_landmarks(hand_landmarks: Any) -> np.ndarray:
    landmark_points = getattr(hand_landmarks, "landmark", hand_landmarks)
    coords = np.array(
        [[point.x, point.y, point.z] for point in landmark_points],
        dtype=np.float32,
    )
    if coords.shape != (LANDMARKS_PER_HAND, VALUES_PER_LANDMARK):
        raise ValueError(
            f"Expected {LANDMARKS_PER_HAND} hand landmarks, got shape {coords.shape}."
        )

    wrist = coords[0].copy()
    relative = coords - wrist

    xy_span = float(np.ptp(coords[:, :2], axis=0).max())
    wrist_distance = float(np.linalg.norm(relative[:, :2], axis=1).max())
    scale = max(xy_span, wrist_distance, 1e-6)

    return (relative / scale).reshape(FEATURES_PER_HAND).astype(np.float32)


def _hand_label_from_results(handedness: list[Any], index: int) -> tuple[str | None, float]:
    if index >= len(handedness):
        return None, 0.0

    classifications = getattr(handedness[index], "classification", handedness[index])
    if not classifications:
        return None, 0.0

    top = classifications[0]
    label = getattr(top, "label", None) or getattr(top, "category_name", None)
    return label, float(getattr(top, "score", 0.0))


def _get_hand_landmarks(results: Any) -> list[Any] | None:
    return (
        getattr(results, "multi_hand_landmarks", None)
        or getattr(results, "hand_landmarks", None)
    )


def _get_handedness(results: Any) -> list[Any]:
    return (
        getattr(results, "multi_handedness", None)
        or getattr(results, "handedness", None)
        or []
    )


def _opposite_hand(label: str) -> str:
    return "Right" if label == "Left" else "Left"


def _combine_slots(slots: dict[str, np.ndarray]) -> np.ndarray:
    return np.concatenate([slots[hand] for hand in HAND_ORDER]).astype(np.float32)
