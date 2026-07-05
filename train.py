from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow import keras
from tensorflow.keras import layers

from hand_features import FEATURE_SIZE, feature_column_names


DEFAULT_DATA_PATH = Path("data/sign_samples.csv")
DEFAULT_LABELS_PATH = Path("labels.json")
DEFAULT_MODEL_PATH = Path("models/sign_model.keras")
DEFAULT_ENCODER_PATH = Path("models/label_encoder.json")
DEFAULT_SUMMARY_PATH = Path("models/training_summary.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SignMate MLP 모델 학습")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--labels", type=Path, default=DEFAULT_LABELS_PATH)
    parser.add_argument("--model-out", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--encoder-out", type=Path, default=DEFAULT_ENCODER_PATH)
    parser.add_argument("--summary-out", type=Path, default=DEFAULT_SUMMARY_PATH)
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--validation-size", type=float, default=0.2)
    return parser.parse_args()


def load_label_items(path: Path) -> list[dict]:
    if not path.exists():
        raise SystemExit(f"라벨 파일을 찾을 수 없습니다: {path}")
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_training_data(data_path: Path, label_items: list[dict]) -> tuple[np.ndarray, np.ndarray, list[dict], Counter]:
    if not data_path.exists():
        raise SystemExit(
            f"학습 데이터가 없습니다: {data_path}\n먼저 record.py로 수집한 뒤 train.py를 실행하세요."
        )

    df = pd.read_csv(data_path)
    feature_columns = feature_column_names()
    missing_columns = [column for column in ["label", *feature_columns] if column not in df.columns]
    if missing_columns:
        raise SystemExit(f"CSV에 필요한 컬럼이 없습니다: {', '.join(missing_columns[:8])}")

    label_by_name = {item["label"]: item for item in label_items}
    unknown_labels = sorted(set(df["label"]) - set(label_by_name))
    if unknown_labels:
        raise SystemExit(f"labels.json에 없는 label이 CSV에 있습니다: {', '.join(unknown_labels)}")

    df = df.dropna(subset=["label", *feature_columns])
    counts = Counter(df["label"])
    classes = [item for item in label_items if counts[item["label"]] > 0]
    if len(classes) < 2:
        raise SystemExit("최소 2개 이상의 라벨 샘플이 필요합니다.")

    index_by_label = {item["label"]: index for index, item in enumerate(classes)}
    y = df["label"].map(index_by_label).astype("int64").to_numpy()
    x = df[feature_columns].astype("float32").to_numpy()

    if x.shape[1] != FEATURE_SIZE:
        raise SystemExit(f"feature 크기가 {FEATURE_SIZE}가 아닙니다: {x.shape[1]}")

    return x, y, classes, counts


def build_model(input_size: int, num_classes: int) -> keras.Model:
    model = keras.Sequential(
        [
            layers.Input(shape=(input_size,)),
            layers.BatchNormalization(),
            layers.Dense(256, activation="relu"),
            layers.Dropout(0.30),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.25),
            layers.Dense(64, activation="relu"),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def split_dataset(x: np.ndarray, y: np.ndarray, validation_size: float):
    class_counts = Counter(y)
    stratify = y if min(class_counts.values()) >= 2 else None
    try:
        return train_test_split(
            x,
            y,
            test_size=validation_size,
            random_state=42,
            stratify=stratify,
        )
    except ValueError:
        if stratify is None:
            raise
        print("라벨별 샘플 수가 적어 stratified split 대신 일반 split을 사용합니다.")
        return train_test_split(
            x,
            y,
            test_size=validation_size,
            random_state=42,
            stratify=None,
        )


def save_encoder(path: Path, classes: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 1,
        "feature_size": FEATURE_SIZE,
        "classes": [
            {
                "index": index,
                "id": item["id"],
                "label": item["label"],
                "name": item["name"],
            }
            for index, item in enumerate(classes)
        ],
    }
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)


def main() -> int:
    args = parse_args()
    if not 0 < args.validation_size < 0.5:
        raise SystemExit("--validation-size는 0보다 크고 0.5보다 작아야 합니다.")

    label_items = load_label_items(args.labels)
    x, y, classes, counts = load_training_data(args.data, label_items)

    print("라벨별 샘플 수")
    for item in label_items:
        print(f"- {item['label']} ({item['name']}): {counts[item['label']]}")

    x_train, x_val, y_train, y_val = split_dataset(x, y, args.validation_size)
    model = build_model(FEATURE_SIZE, len(classes))

    args.model_out.parent.mkdir(parents=True, exist_ok=True)
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=10,
            mode="max",
            restore_best_weights=True,
        ),
        keras.callbacks.ModelCheckpoint(
            filepath=args.model_out,
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
        ),
    ]

    # TODO: Sequence 모델은 (samples, timesteps, 126) window를 저장한 뒤 LSTM/GRU로 확장합니다.
    history = model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=1,
    )

    val_loss, val_accuracy = model.evaluate(x_val, y_val, verbose=0)
    model.save(args.model_out)
    save_encoder(args.encoder_out, classes)

    summary = {
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "data_path": str(args.data),
        "model_path": str(args.model_out),
        "encoder_path": str(args.encoder_out),
        "feature_size": FEATURE_SIZE,
        "total_samples": int(len(x)),
        "train_samples": int(len(x_train)),
        "validation_samples": int(len(x_val)),
        "validation_loss": float(val_loss),
        "validation_accuracy": float(val_accuracy),
        "best_validation_accuracy": float(max(history.history.get("val_accuracy", [val_accuracy]))),
        "class_counts": {item["label"]: int(counts[item["label"]]) for item in label_items},
        "trained_classes": [
            {"index": index, "label": item["label"], "name": item["name"]}
            for index, item in enumerate(classes)
        ],
    }
    args.summary_out.parent.mkdir(parents=True, exist_ok=True)
    with args.summary_out.open("w", encoding="utf-8") as file:
        json.dump(summary, file, ensure_ascii=False, indent=2)

    print(f"\nValidation accuracy: {val_accuracy:.4f}")
    print(f"모델 저장: {args.model_out}")
    print(f"라벨 인코더 저장: {args.encoder_out}")
    print(f"학습 요약 저장: {args.summary_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
