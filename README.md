# SignMate

MediaPipe 기반 기초 수어 학습 및 실시간 손동작 인식 PWA

## 기술 스택

- React
- TypeScript
- Vite
- Tailwind CSS
- PWA
- MediaPipe 예정

## 실행 방법

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 브랜치 규칙

main에 직접 push하지 않고, 각자 `feat/기능명` 브랜치에서 작업 후 Pull Request로 병합합니다.

## MVP 기능

- 수어 학습
- 수어 인식 UI
- 수어 퀴즈
- mock result 기반 일치도 표시
- localStorage 기반 학습 기록 구조

현재 카메라 미리보기는 실제 브라우저 카메라를 사용하고, MediaPipe 인식 결과는 mock으로
구성되어 있습니다. 이후 `CameraPanel`의 canvas 레이어에 손 랜드마크를 그릴 수 있습니다.

카메라 미리보기는 브라우저의 `getUserMedia`를 사용하며 `localhost` 또는 HTTPS 환경에서
동작합니다. 수어 판정 결과는 MediaPipe 연결 전까지 mock 데이터를 사용합니다.
