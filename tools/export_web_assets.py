from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf


ROOT = Path(__file__).resolve().parents[1]
LABELS_PATH = ROOT / "labels.json"
MODEL_PATH = ROOT / "models" / "sign_model.keras"
ENCODER_PATH = ROOT / "models" / "label_encoder.json"
WEB_ASSETS = ROOT / "web" / "assets"
TFJS_OUT = WEB_ASSETS / "tfjs_model"
WEB_MODEL_PATH = WEB_ASSETS / "signmate_model.json"


def copy_if_exists(source: Path, target: Path) -> bool:
    if not source.exists():
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return True


def try_convert_tfjs() -> bool:
    converter = shutil.which("tensorflowjs_converter")
    if not converter or not MODEL_PATH.exists():
        return False

    TFJS_OUT.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            converter,
            "--input_format=keras",
            str(MODEL_PATH),
            str(TFJS_OUT),
        ],
        check=True,
    )
    return True


def export_lightweight_mlp() -> bool:
    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        return False

    model = tf.keras.models.load_model(MODEL_PATH)
    with ENCODER_PATH.open("r", encoding="utf-8") as file:
        encoder = json.load(file)

    layers = []
    for layer in model.layers:
        class_name = layer.__class__.__name__
        weights = layer.get_weights()
        if class_name == "BatchNormalization":
            gamma, beta, moving_mean, moving_variance = weights
            layers.append(
                {
                    "type": "batch_norm",
                    "name": layer.name,
                    "epsilon": float(layer.epsilon),
                    "gamma": _round(gamma),
                    "beta": _round(beta),
                    "moving_mean": _round(moving_mean),
                    "moving_variance": _round(moving_variance),
                }
            )
        elif class_name == "Dense":
            kernel, bias = weights
            activation = layer.activation.__name__
            layers.append(
                {
                    "type": "dense",
                    "name": layer.name,
                    "activation": activation,
                    "kernel": _round(kernel),
                    "bias": _round(bias),
                }
            )
        elif class_name == "Dropout":
            continue
        else:
            raise SystemExit(f"웹 export가 지원하지 않는 layer입니다: {layer.name} ({class_name})")

    payload = {
        "version": 1,
        "format": "signmate-lightweight-mlp",
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "source_model": str(MODEL_PATH.relative_to(ROOT)),
        "feature_size": int(encoder["feature_size"]),
        "classes": sorted(encoder["classes"], key=lambda item: item["index"]),
        "layers": layers,
    }
    WEB_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with WEB_MODEL_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, separators=(",", ":"))
    return True


def _round(array: np.ndarray) -> list:
    return np.asarray(array, dtype=np.float32).round(7).tolist()


def main() -> int:
    WEB_ASSETS.mkdir(parents=True, exist_ok=True)
    copied_labels = copy_if_exists(LABELS_PATH, WEB_ASSETS / "labels.json")
    copied_encoder = copy_if_exists(ENCODER_PATH, WEB_ASSETS / "label_encoder.json")
    exported_lightweight = export_lightweight_mlp()

    converted = False
    try:
        converted = try_convert_tfjs()
    except subprocess.CalledProcessError as exc:
        print(f"TensorFlow.js 변환 실패: {exc}")

    manifest = {
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "labels": copied_labels,
        "label_encoder": copied_encoder,
        "keras_model_found": MODEL_PATH.exists(),
        "lightweight_model_exported": exported_lightweight,
        "lightweight_model_path": "assets/signmate_model.json" if exported_lightweight else None,
        "tfjs_model_exported": converted,
        "tfjs_model_path": "assets/tfjs_model/model.json" if converted else None,
    }
    with (WEB_ASSETS / "model_manifest.json").open("w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)

    print(f"웹 자산 내보내기 완료: {WEB_ASSETS}")
    if exported_lightweight:
        print(f"브라우저용 MLP 모델 저장: {WEB_MODEL_PATH}")
    if not converted:
        print("tensorflowjs_converter가 없거나 Keras 모델이 없어 TF.js 모델 변환은 건너뛰었습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
