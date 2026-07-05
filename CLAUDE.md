# CLAUDE.md

## Project

SignMate is a Python/OpenCV/MediaPipe MVP for recognizing a small set of Korean sign-language word labels from webcam hand landmarks.

## Commands

```bash
source .venv/bin/activate
python record.py --label hello --samples 500
python train.py
python tools/export_web_assets.py
python predict.py
python -m http.server 8000
```

## Notes

- Use Python 3.11.
- Labels are managed in `labels.json`.
- Features are fixed at 126 dims: Left hand 63 + Right hand 63.
- Missing hands are padded with zeros.
- After retraining, run `tools/export_web_assets.py` before testing the web UI.
