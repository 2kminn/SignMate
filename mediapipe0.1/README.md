# SignMate Frontend Bundle mediapipe0.1

프론트 통합용 최소 묶음입니다. Python 학습/수집 코드는 제외했고, 브라우저에서 카메라 손 인식과 수어 라벨 예측을 실행하는 파일만 담았습니다.

## Contents

```text
mediapipe0.1/
  assets/
    signmate_model.json
    label_encoder.json
    labels.json
    model_manifest.json
  src/
    signmate-engine.js
  demo/
    index.html
    styles.css
    app.js
```

## Quick Test

프로젝트 루트에서 정적 서버를 켠 뒤 접속합니다.

```bash
python -m http.server 8000
```

```text
http://localhost:8000/mediapipe0.1/demo/
```

카메라는 `localhost` 또는 `https` 환경에서만 정상 동작합니다.

## Integration

프론트 프로젝트의 public/static 폴더에 `assets`와 `src/signmate-engine.js`를 복사합니다.

```js
import { createSignMate } from "/signmate/src/signmate-engine.js";

const signmate = await createSignMate({
  videoElement: document.querySelector("#video"),
  canvasElement: document.querySelector("#overlay"),
  modelUrl: "/signmate/assets/signmate_model.json",
  threshold: 0.7,
  smoothingWindow: 12,
  onPrediction(prediction) {
    console.log(prediction.label, prediction.name, prediction.confidence);
  },
});

await signmate.start();
```

`prediction` 형식:

```js
{
  label: "hello",
  name: "안녕하세요",
  confidence: 0.92,
  rawLabel: "hello",
  handCount: 2,
  seen: { Left: true, Right: true },
  accepted: true
}
```

## Model Update

모델을 다시 학습한 뒤에는 루트에서 아래 명령을 실행하고 `web/assets`의 최신 파일을 이 폴더의 `assets`로 다시 복사합니다.

```bash
python train.py
python tools/export_web_assets.py
```
