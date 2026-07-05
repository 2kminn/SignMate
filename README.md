# SignMate

SignMate는 웹캠으로 양손을 인식하고, 사용자가 직접 수집한 한국 수어 샘플로 제한된 단어 라벨을 학습한 뒤 실시간 예측을 수행하는 MVP입니다.

이 프로젝트는 자음/모음 조합 입력기가 아니라, 하나의 수어 동작이 하나의 의미 또는 단어 라벨을 나타내는 방식입니다. 현재 목표 라벨은 `안녕하세요`, `감사합니다`, `죄송합니다`, `괜찮아요`, `도와주세요`와 대기 상태입니다.

중요한 한계: SignMate는 완전한 수어 번역기가 아닙니다. 사용자가 수집한 제한된 라벨 데이터 안에서만 동작을 분류하는 학습/예측 실험용 MVP입니다.

## 파일 구조

```text
SignMate/
  README.md
  requirements.txt
  labels.json
  main.py
  hand_features.py
  record.py
  train.py
  predict.py
  data/
    .gitkeep
  models/
    .gitkeep
  web/
    index.html
    styles.css
    app.js
  tools/
    export_web_assets.py
```

## 동작 방식

- MediaPipe Hands를 `max_num_hands=2`로 실행합니다.
- Python 코드도 최신 MediaPipe Tasks Vision 또는 구버전 `mp.solutions.hands`를 자동으로 선택합니다.
- 왼손 21개 landmark와 오른손 21개 landmark를 항상 같은 순서로 배치합니다.
- 각 landmark는 `x, y, z` 3개 값이며, 전체 feature는 `21 * 3 * 2 = 126`차원입니다.
- 손목 기준 상대좌표와 손 크기 기준 정규화를 적용합니다.
- 한 손만 보이면 반대쪽 손 feature는 0으로 채웁니다.
- 손이 전혀 보이지 않는 경우도 126차원 0 feature로 처리할 수 있습니다.
- Python 수집/예측 코드는 기본적으로 카메라 화면을 좌우 반전해서 MediaPipe handedness의 selfie-camera 가정과 맞춥니다.

## 설치

Mac, Python 3.11 기준입니다.

현재 Homebrew의 기본 `python3`가 Python 3.13 또는 3.14라면 TensorFlow/MediaPipe 설치가 실패할 수 있습니다. 이 프로젝트는 `python3.11`로 가상환경을 만들어 실행하세요.

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python --version
python -m pip install --upgrade pip
pip install -r requirements.txt
```

만약 이미 Python 3.13 또는 3.14로 `.venv`를 만들었다면 다음처럼 다시 만듭니다.

```bash
deactivate 2>/dev/null || true
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate
python --version
python -m pip install --upgrade pip
pip install -r requirements.txt
```

`python3.11` 명령이 없다면 Homebrew로 설치합니다.

```bash
brew install python@3.11
```

Apple Silicon Mac에서 TensorFlow 성능을 높이고 싶다면 선택적으로 다음을 추가 설치할 수 있습니다.

```bash
pip install tensorflow-metal
```

## 데이터 수집

라벨은 [labels.json](labels.json)에서 관리합니다. 기본 라벨은 다음과 같습니다.

- `wait`: 대기
- `hello`: 안녕하세요
- `thanks`: 감사합니다
- `sorry`: 죄송합니다
- `okay`: 괜찮아요
- `help`: 도와주세요

수집 창에서 `r`을 누르면 녹화 시작/일시정지, `q`를 누르면 종료합니다. 기본값은 양손이 모두 보이는 프레임만 저장합니다.

```bash
python record.py --label hello --samples 300
python record.py --label thanks --samples 300
python record.py --label sorry --samples 300
python record.py --label okay --samples 300
python record.py --label help --samples 300
```

대기 상태를 수집하려면 다음처럼 사용할 수 있습니다. `wait`은 한 손 또는 무손 프레임까지 수집할 수 있도록 옵션을 제공합니다.

```bash
python record.py --label wait --samples 300 --allow-partial --allow-no-hands
```

수집 데이터는 `data/sign_samples.csv`에 누적 저장됩니다. 컬럼은 `label`, `label_name`, `recorded_at`, `f0`부터 `f125`까지입니다.

## 모델 학습

```bash
python train.py
```

학습 결과는 다음 위치에 저장됩니다.

- `models/sign_model.keras`
- `models/label_encoder.json`
- `models/training_summary.json`

현재 모델은 프레임 단위 MLP입니다. 수어는 본질적으로 시간 흐름이 중요한 동작이므로, 다음 단계에서는 연속 프레임 window를 수집해 LSTM, GRU, Temporal CNN, Transformer 계열 모델로 확장하는 것이 좋습니다.

## 실시간 예측

```bash
python predict.py
```

또는 얇은 진입점인 `main.py`를 사용할 수 있습니다.

```bash
python main.py
```

예측 창에는 현재 예측 단어, confidence, 감지된 손 개수, raw label이 표시됩니다. confidence threshold와 최근 N프레임 smoothing으로 예측이 과하게 튀는 것을 줄입니다.

```bash
python predict.py --threshold 0.70 --smoothing-window 12
```

모델 파일이 없으면 먼저 `record.py`로 데이터를 수집하고 `train.py`를 실행하라는 안내가 표시됩니다.

## 웹 MVP

`web/` 폴더에는 정적 웹 MVP가 있습니다.

- `index.html`
- `styles.css`
- `app.js`

웹 버전은 MediaPipe Tasks Vision `HandLandmarker`로 양손 landmark를 감지하고 화면에 표시합니다. Python Keras 모델을 브라우저에서 바로 실행하지는 않으므로, 현재는 추후 TensorFlow.js 변환을 위한 구조와 hand feature 추출 흐름을 준비해 둔 상태입니다.

정적 서버로 실행할 수 있습니다.

```bash
python -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000/web/`를 엽니다.

학습 후 웹 자산을 내보내려면 다음을 실행합니다.

```bash
python tools/export_web_assets.py
```

이 스크립트는 `models/sign_model.keras`와 `models/label_encoder.json`을 읽어 `web/assets/signmate_model.json`을 생성합니다. 웹 MVP는 이 JSON을 로드해 브라우저에서 MLP를 직접 계산합니다. `tensorflowjs_converter`가 설치되어 있으면 추가로 `web/assets/tfjs_model/` 변환도 시도합니다.

## 자주 겪는 문제

카메라가 열리지 않는 경우:

- macOS 시스템 설정에서 터미널 또는 사용 중인 IDE의 카메라 권한을 허용하세요.
- 다른 앱이 카메라를 사용 중인지 확인하세요.
- 필요하면 `--camera 1`처럼 다른 카메라 인덱스를 지정하세요.

`module 'mediapipe' has no attribute 'solutions'` 오류가 나는 경우:

- 최신 MediaPipe는 `mp.solutions` 대신 Tasks API만 노출할 수 있습니다.
- 현재 코드는 두 API를 자동 감지합니다. 코드를 받은 뒤에도 같은 오류가 나면 `source .venv/bin/activate` 후 다시 실행하세요.
- 첫 실행에서 `models/hand_landmarker.task`를 자동 다운로드합니다. 네트워크가 막혀 있으면 README의 오류 메시지에 표시되는 URL 파일을 직접 받아 같은 위치에 저장하세요.

라벨 예측이 불안정한 경우:

- 각 라벨을 같은 환경과 거리에서 더 많이 수집하세요.
- `wait` 데이터를 반드시 수집하세요.
- `--threshold`를 높이거나 `--smoothing-window`를 늘려 보세요.

## 확장 방향

- 프레임 단위 MLP에서 sequence 기반 LSTM/GRU/Transformer 모델로 확장
- 양손뿐 아니라 얼굴 표정, 상체 pose, 팔 움직임까지 함께 사용
- 라벨별 데이터 수와 사용자 다양성 확대
- TensorFlow.js 변환 후 브라우저 단독 추론 지원
- 수어 단어 뒤에 문장 후처리 또는 대화 맥락 모델 연결

## 빠른 실행 순서

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

python record.py --label hello --samples 300
python record.py --label thanks --samples 300
python record.py --label sorry --samples 300
python record.py --label okay --samples 300
python record.py --label help --samples 300
python train.py
python predict.py
```
