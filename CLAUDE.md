# SignMate 개발 가이드

이 문서는 SignMate 저장소에서 작업하는 AI 코딩 에이전트와 개발자를 위한 구현 기준이다. 추측보다 현재 코드를 우선하며, 제품 요구사항은 `docs/PRD.md`, 데이터 설계는 `docs/ERD.md`, 시각 규칙은 `DESIGN.md`를 함께 참고한다.

## 프로젝트 개요

SignMate는 브라우저 카메라와 MediaPipe를 이용해 기초 수어 10개를 인식하고, 학습과 퀴즈를 제공하는 모바일 우선 PWA다. 영상과 추론은 브라우저 안에서 처리되며 서버 API나 계정 시스템은 없다.

현재 지원 표현:

- 안녕하세요 (`hello`)
- 감사합니다 (`thanks`)
- 죄송합니다 (`sorry`)
- 괜찮아요 (`okay`)
- 도와주세요 (`help`)
- 아니요 (`no`)
- 물 (`water`)
- 화장실 (`restroom`)
- 집 (`home`)
- 이름 (`name`)

## 기술 스택

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- Lucide React
- vite-plugin-pwa
- MediaPipe Tasks Vision 0.10.14
- 브라우저 `localStorage`

라우터, 전역 상태 라이브러리, 테스트 프레임워크, 백엔드는 사용하지 않는다.

## 주요 명령

```bash
npm install
npm run dev
npm run build
npm run preview
```

별도 lint/test 스크립트가 없으므로 변경 후 최소 검증은 다음과 같다.

```bash
npm run build
git diff --check
```

카메라는 보안 컨텍스트가 필요하다. 개발 시 `localhost`, 배포 시 HTTPS에서 확인한다.

## 디렉터리 구조

```text
src/
  App.tsx                    최상위 화면 상태와 탭/세션 전환
  pages/
    OnboardingPage.tsx       5단계 최초 안내
    TranslatePage.tsx        실시간 해석 진입
    LearnPage.tsx            검색/카테고리/상세 학습
    QuizPage.tsx             10문제 퀴즈 진입과 최근 기록
    CameraSessionPage.tsx    해석/연습/퀴즈 공용 카메라 세션
  components/
    CameraPanel.tsx          카메라 수명주기와 MediaPipe 브리지
    SignDetailModal.tsx      수어 상세 및 따라 하기 진입
    AppHeader.tsx            앱 헤더
    BottomNav.tsx            해석/학습/퀴즈 탭
    SignCard.tsx             학습 목록 카드
  data/signs.ts              UI의 수어 메타데이터 단일 소스
  types/sign.ts              도메인 타입
  utils/storage.ts           localStorage 읽기/쓰기
public/
  sign-images/               학습 및 힌트 이미지
  signmate/
    src/signmate-engine.js   실제 앱에서 로드하는 추론 엔진
    assets/signmate_model.json 실제 앱에서 로드하는 MLP 모델
mediapipe0.1/                모델 전달용 원본 번들 및 독립 데모
docs/                        PRD와 ERD
```

`dist/`, `*.tsbuildinfo`, 생성된 `vite.config.js`/`.d.ts`는 소스 설계의 기준으로 사용하지 않는다.

## 애플리케이션 흐름

`App.tsx`는 별도 라우터 없이 세 가지 `AppView`를 전환한다.

1. `onboarding`: 최초 실행 안내
2. `tabs`: 해석, 학습, 퀴즈 메인 탭
3. `cameraSession`: 해석/따라 하기/퀴즈 공용 전체 화면

온보딩 완료 여부는 `signmate-onboarding-done`에 저장한다. 카메라 세션은 `SessionMode`에 따라 다음처럼 동작한다.

- `translate`: 승인된 인식 결과를 실시간 표시
- `practice`: 선택한 수어와 인식 결과를 비교하며 동작 가이드 제공
- `quiz`: 3초 카운트다운과 준비 시간을 거친 뒤 정답만 자동 피드백. 오답은 자동 팝업을 띄우지 않고 `잘 모르겠어요`를 눌렀을 때 오답/힌트 팝업을 표시

퀴즈는 선택된 첫 문제 뒤에 나머지 표현을 이어 최대 10문제로 구성한다. 완료 점수는 백분율로 저장한다.

## MediaPipe 연동 규칙

### 로딩 구조

`CameraPanel.tsx`가 `/signmate/src/signmate-engine.js`를 동적 모듈 스크립트로 불러온다. 엔진은 다음 전역 API를 반드시 제공해야 한다.

```ts
globalThis.SignMateMediaPipe = {
  createSignMate,
  preloadSignMateRuntime
};
```

React 쪽 계약은 `SignMateEngine`, `CreateSignMate`, `SignPrediction` 인터페이스에 정의돼 있다. 엔진 수정 시 양쪽 계약을 함께 확인한다.

### 성능 불변 조건

- 모델 JSON은 `cache: "force-cache"`와 모듈 전역 Promise Map으로 재사용한다.
- MediaPipe WASM 런타임과 `HandLandmarker`는 전역 Promise로 한 번만 초기화한다.
- 초기화 실패 시에만 해당 Promise 캐시를 비우고 재시도한다.
- 카메라 스트림은 엔진의 `start()`에서 한 번만 연다. React에서 별도로 `getUserMedia()`를 호출하지 않는다.
- 세션 종료 시 영상 트랙과 애니메이션 프레임은 반드시 중지한다.

### 추론 규칙

- 입력 특징 크기: 126 (`왼손 21 × xyz + 오른손 21 × xyz`)
- 손 순서: Left, Right
- 판정 임계값: 0.7
- 평활화 윈도우: 12
- 최대 감지 손: 2
- 전면 카메라는 화면과 랜드마크 좌표를 미러링한다.

### 모델 업데이트

`mediapipe0.1`은 전달/검증용 원본이고 `public/signmate`가 실제 배포 경로다. 새 번들을 적용할 때 최소 다음 두 파일을 동기화한다.

```text
mediapipe0.1/assets/signmate_model.json
  -> public/signmate/assets/signmate_model.json

mediapipe0.1/src/signmate-engine.js
  -> public/signmate/src/signmate-engine.js
```

주의: `public/signmate/src/signmate-engine.js`에는 앱 통합을 위한 전역 API와 전역 캐싱 로직이 필요하다. 원본 엔진을 단순 복사해 이 로직을 덮어쓰지 않는다. 모델의 `classes`와 `src/data/signs.ts`, `SignLabel`, `public/sign-images`도 서로 일치해야 한다.

## 데이터와 저장소 규칙

정적 수어 정보의 기준은 `src/data/signs.ts`다. 새 수어를 추가할 때 함께 수정할 항목:

1. `src/types/sign.ts`의 `SignLabel`
2. `src/data/signs.ts`
3. `public/sign-images/<label>.png`
4. `SignDetailModal.tsx`의 이미지 라벨 목록
5. 모델 JSON의 class 라벨
6. 필요 시 퀴즈 문항 수와 UI 문구

사용하는 localStorage 키:

| 키 | 값 |
| --- | --- |
| `signmate-onboarding-done` | `"true"` |
| `signmate.learnedSigns` | `SignLabel[]` JSON |
| `signmate-quiz-history` | 최근 20개 퀴즈 기록 JSON |

저장 데이터는 손상될 수 있으므로 `storage.ts`처럼 파싱 실패 시 안전한 기본값으로 복구한다.

## 구현 원칙

- 모바일 320–430px를 우선한다. 데스크톱에서는 430px 앱 셸을 중앙에 둔다.
- 색상은 `tailwind.config.ts`의 `sign.*` 토큰을 우선 사용한다.
- 아이콘은 기존 Lucide 아이콘 체계를 유지한다.
- 기본 터치 영역은 최소 44px, 주요 CTA는 52–56px로 유지한다.
- 모달은 `createPortal(..., document.body)`을 사용하고 `role="dialog"`, `aria-modal`, 제목 연결을 유지한다.
- 카메라/비동기 상태는 `idle`, `requesting`, `initializing`, `active`, `denied`, `unavailable`, `error`를 구분한다.
- `prefers-reduced-motion` 대응을 제거하지 않는다.
- 이미지 경로와 public 자산 경로에는 `import.meta.env.BASE_URL`을 사용한다.
- 기존 사용자 변경을 덮어쓰거나 관련 없는 파일을 정리하지 않는다.

## 알려진 주의사항

- `README.md`, 일부 PRD/ERD 설명에는 mock 인식 또는 MediaPipe 예정 상태가 남아 있어 실제 코드보다 오래됐다. 구현 판단은 현재 소스를 우선한다.
- `src/utils/mockResult.ts`와 일부 퀴즈 유틸은 현재 주요 흐름에서 사용되지 않는다. 참조 확인 없이 기능 기준으로 삼지 않는다.
- PWA precache 목록에 대용량 모델이 포함되지 않을 수 있다. 현재는 브라우저 HTTP 캐시와 런타임 전역 캐시를 사용한다.
- MediaPipe 모듈, WASM, HandLandmarker는 외부 CDN/Google Storage에 의존하므로 완전한 첫 실행 오프라인은 보장하지 않는다.
- 카메라 실제 동작은 빌드 성공만으로 검증되지 않는다. 가능하면 모바일 브라우저와 HTTPS 환경에서 권한 허용, 전후면 전환, 세션 재진입을 수동 확인한다.

## 변경 완료 체크리스트

- 요청한 화면과 인접 흐름이 함께 동작하는가?
- 320px 폭과 430px 폭에서 잘리지 않는가?
- 카메라가 세션 재진입 시 중복 실행되지 않는가?
- 모델/라벨/이미지 데이터가 일치하는가?
- localStorage 기존 데이터와 호환되는가?
- 키보드 포커스, `aria-label`, 모달 의미 구조가 유지되는가?
- `npm run build`와 `git diff --check`가 통과하는가?

