# SignMate 디자인 시스템

## 1. 디자인 방향

SignMate는 수어 입문자가 부담 없이 학습과 카메라 인식을 시작하도록 돕는 모바일 우선 앱이다. 시각 언어는 다음 원칙을 따른다.

- 친근함: 밝은 에메랄드 계열과 둥근 형태를 사용한다.
- 명확함: 한 화면에 하나의 핵심 행동을 강조한다.
- 안정감: 카메라 권한, 로딩, 오류 상태를 숨기지 않고 설명한다.
- 접근성: 텍스트 라벨, 충분한 터치 영역, 명확한 대비를 제공한다.
- 집중: 앱 콘텐츠 폭을 430px로 제한해 모바일 경험을 유지한다.

## 2. 화면 구조

### 앱 셸

- 최소 지원 폭: 320px
- 최대 콘텐츠 폭: 430px
- 모바일: 화면 전체 폭 사용
- 431px 이상: 중앙 정렬, 외부 여백 24px, 앱 셸 모서리 32px
- 기본 배경: `sign.outside`
- 앱 내부 배경: `#F7F9F8` 또는 `sign.app`
- 하단 내비게이션이 있는 페이지는 콘텐츠 하단에 최소 96px 여백 확보

### 주요 화면 계층

```text
App
├─ Onboarding
├─ Tabs
│  ├─ AppHeader
│  ├─ Translate
│  ├─ Learn
│  └─ Quiz
│  └─ BottomNav
└─ CameraSession
   ├─ Translate mode
   ├─ Practice mode
   └─ Quiz mode
```

카메라 세션은 탭 셸 밖의 독립 전체 화면으로 표시한다. 상세와 퀴즈 피드백은 포털 모달을 사용한다.

## 3. 색상 토큰

색상 기준은 `tailwind.config.ts`의 `sign` 팔레트다.

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `sign.main` | `#10B981` | 기본 CTA, 선택 상태, 브랜드 |
| `sign.dark` | `#047857` | CTA hover, 진한 강조 |
| `sign.deep` | `#064E3B` | 제목, 브랜드 텍스트 |
| `sign.light` | `#D1FAE5` | 선택 배경, 진행 배경 |
| `sign.soft` | `#ECFDF5` | 카드 보조 배경, 태그 |
| `sign.outside` | `#F0FDF4` | 앱 외부와 완료 화면 배경 |
| `sign.app` | `#F9FAFB` | 카메라 세션 배경 |
| `sign.border` | `#A7F3D0` | 브랜드 계열 테두리 |
| `sign.text` | `#111827` | 본문 기본색 |
| `sign.sub` | `#6B7280` | 설명과 보조 정보 |
| `sign.success` | `#22C55E` | 성공 상태 |
| `sign.error` | `#EF4444` | 오류와 오답 |
| `sign.tip` | `#FEF3C7` | 힌트 배경 |
| `sign.tipText` | `#92400E` | 힌트 텍스트 |

사용 규칙:

- 주요 행동은 `sign.main` 배경과 흰색 텍스트를 사용한다.
- 제목은 `sign.deep`, 일반 본문은 `sign.text`, 보조 문구는 `sign.sub`를 사용한다.
- 빨강은 오류, 종료, 오답처럼 의미가 명확한 경우에만 사용한다.
- 에메랄드 배경 위 텍스트는 `sign.dark` 또는 `sign.deep`으로 대비를 확보한다.

## 4. 타이포그래피

기본 폰트 스택:

```css
Inter, Pretendard, -apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, "Noto Sans KR", sans-serif
```

| 역할 | 권장 스타일 |
| --- | --- |
| 랜딩/핵심 제목 | 30px, 900, line-height 1.25, letter-spacing -0.04em |
| 페이지 제목 | 28px, 900, letter-spacing -0.045em |
| 섹션 제목 | 18–20px, 800 |
| 카드 제목 | 18px, 800 |
| 본문 | 14–16px, line-height 1.5–1.75 |
| 보조 정보 | 12–14px, 600–700 |
| eyebrow | 12px, 800, letter-spacing 0.15–0.16em |

한글 제목은 강한 굵기와 좁은 자간을 사용하되, 본문에는 음수 자간을 적용하지 않는다. 줄바꿈이 제품 문구의 리듬을 결정하는 화면에서는 명시적 `<br>` 또는 `whitespace-pre-line`을 사용한다.

## 5. 간격과 크기

기본 간격은 Tailwind의 4px 단위를 따른다.

- 화면 좌우 패딩: 20px, 온보딩은 24px
- 섹션 간격: 24–28px
- 카드 내부 패딩: 16–24px
- 요소 간 기본 간격: 8–12px
- 주요 CTA 높이: 최소 52px
- 온보딩 CTA 높이: 최소 56px
- 아이콘 전용 버튼: 40–44px
- 카테고리 필터: 최소 44px

Safe Area:

- 상단: `env(safe-area-inset-top)`
- 하단: `env(safe-area-inset-bottom)`
- 고정 내비게이션과 전체 화면 카메라에서 반드시 반영한다.

## 6. 형태와 그림자

### Radius

| 요소 | Radius |
| --- | --- |
| 앱 셸 | 32px |
| 주요 카드/모달 | 24–32px |
| 카메라 뷰 | 28px |
| 일반 버튼/입력 | 16px |
| 아이콘 컨테이너 | 16px |
| 태그/필터 | full |

둥근 모서리는 핵심 브랜드 특성이므로 새 컴포넌트도 기존 반경 계층을 따른다.

### 그림자

- 일반 카드: 낮은 불투명도의 slate 그림자
- 카메라/모달: 깊은 그림자로 레이어 분리
- CTA: 에메랄드 색조 그림자를 제한적으로 사용
- 테두리와 그림자를 동시에 과하게 사용하지 않는다.

## 7. 아이콘과 이미지

- 아이콘 라이브러리: Lucide React
- 기본 크기: 18–24px
- 핵심 일러스트 역할: 42–58px
- 장식 아이콘에는 `aria-hidden="true"` 적용
- 아이콘 단독 버튼에는 반드시 `aria-label`과 필요 시 `title` 제공
- 수어 동작 이미지는 `object-contain`으로 잘리지 않게 표시
- 이미지 경로는 `${import.meta.env.BASE_URL}sign-images/<label>.png` 사용

수어 이미지가 없으면 손 아이콘과 브랜드 그라데이션의 대체 영역을 제공한다.

## 8. 컴포넌트 규칙

### App Header

- 흰색 반투명 sticky 헤더와 backdrop blur 사용
- 좌측에 56px 브랜드 아이콘, 제품명, 한 줄 설명
- 우측 도움말 버튼으로 온보딩 재진입

### Bottom Navigation

- 화면 하단 고정, 최대 폭 430px
- 3개 동일 폭 탭: 해석, 학습, 퀴즈
- 선택 탭: `sign.light` 배경 + `sign.main` 아이콘/텍스트
- 비선택 탭: 회색, hover 시 약한 배경

### Cards

- 흰색 배경과 회색 또는 브랜드 테두리
- 정보 계층은 제목 → 설명 → 태그 순서
- 카드 전체 행동은 하나의 `<button>`으로 구성
- hover는 테두리나 배경을 미세하게 변경하며 레이아웃은 움직이지 않는다.

### Buttons

Primary:

- `sign.main` 배경, 흰색, 800 이상 굵기
- hover `sign.dark`, active scale 약 0.98

Secondary:

- `sign.light` 배경, `sign.deep` 텍스트

Tertiary:

- 흰색 배경, 회색 테두리, `sign.sub` 텍스트

Destructive:

- 흰색 또는 연한 빨강 배경, 빨강 텍스트

비활성 상태는 opacity를 낮추고 pointer event를 막는다. 텍스트만으로 행동이 분명하지 않으면 아이콘을 함께 사용한다.

### Inputs and Filters

- 입력 높이 최소 48px
- 기본 회색 테두리, focus 시 `sign.main` 테두리와 `sign.light` ring
- 필터는 가로 스크롤 가능한 pill 형태
- 선택 여부는 색상뿐 아니라 `aria-pressed`로 전달

### Modal

- 배경: `slate-950/45`와 backdrop blur
- 최대 폭: 384–430px
- 최대 높이: viewport에서 32–40px 제외
- 내부 스크롤 허용
- 닫기 버튼, `role="dialog"`, `aria-modal`, `aria-labelledby` 제공
- 상세 모달은 배경 클릭으로 닫을 수 있으며 피드백 모달은 명시적 행동을 우선한다.

## 9. 화면별 설계

### Onboarding

- 5단계, 전체 viewport 고정
- 상단 브랜드는 중앙 정렬, 이전 버튼은 좌측 absolute, 단계 수는 우측 absolute
- 중앙 정사각형 비주얼과 큰 아이콘
- 하단 진행 점과 full-width CTA
- 높이 740px 이하에서는 비주얼과 여백을 축소
- 슬라이드 전환은 560ms의 부드러운 이동/페이드. reduced motion에서는 사실상 제거

### Translate

- 강한 소개 제목 뒤에 하나의 주요 해석 카드
- 지원 표현을 pill 목록으로 노출
- “카메라 영상은 서버로 전송되지 않음”을 명시
- 핵심 행동은 `해석 시작` 하나로 유지

### Learn

- 검색 → 카테고리 필터 → 결과 목록 순서
- 결과 개수를 항상 표시
- 카드 선택 시 상세 모달
- 상세에서 이미지, 설명, 사용 예시, 동작 가이드를 제공
- `카메라로 따라 하기`를 누르면 학습 완료로 기록하고 연습 세션 진입

### Quiz

- 시작 화면에 10문제와 예상 시간, 피드백 방식 명시
- 최근 최고 점수와 마지막 점수를 2열 카드로 표시
- 세션 중 현재 문제, 전체 문제 수, 누적 정답 수 노출
- 정답 인식 시 자동 성공 팝업
- 다른 동작 인식은 실시간 표시만 하고 자동 오답 처리하지 않음
- 사용자가 `잘 모르겠어요`를 누르면 오답 팝업과 힌트 제공
- 완료 화면에서 점수, 다시 풀기, 학습 탭 이동 제공

### Camera Session

- 상단에 뒤로 가기, 모드 제목, 짧은 지시문
- 카메라 위에 상태 badge, 전후면 전환, 프레이밍 corner 표시
- 하단 overlay에 현재 해석 표시
- 카메라 시작 전에는 명시적 시작 버튼 제공
- 퀴즈는 카메라 활성화 후 3초 카운트다운과 1.5초 준비 상태를 거침

## 10. 상태와 피드백

카메라 상태:

| 상태 | UI |
| --- | --- |
| `idle` | 카메라 아이콘, 시작 안내 |
| `requesting` | spinner, 권한 확인 문구 |
| `initializing` | spinner, 모델 준비 문구 |
| `active` | 영상과 초록 상태점 |
| `denied` | 카메라 차단 아이콘, 권한 허용 안내 |
| `unavailable` | 지원/장치 없음 안내 |
| `error` | 카메라 충돌 또는 연결 오류 안내 |

인식 결과:

- 승인 기준 미만: `인식 대기 중`
- 승인 결과: 수어 이름 표시
- 손 없음: 대기 상태로 복귀
- 성공: 초록 계열, Check 아이콘
- 오답/포기: 빨강 계열, X 아이콘
- 힌트: amber 계열, Lightbulb 아이콘

색상만으로 상태를 전달하지 않고 아이콘과 문구를 함께 제공한다.

## 11. 모션

- 버튼: hover 색상 전환, active scale 0.95–0.98
- 진행률: width 500ms 전환
- 로딩: spinner 또는 pulse
- 온보딩: 이동 + fade + 약한 blur
- 모션은 기능 이해를 돕는 범위에서만 사용
- `prefers-reduced-motion: reduce`에서 애니메이션과 전환을 최소화

## 12. 접근성 체크리스트

- 모든 아이콘 전용 버튼에 한국어 `aria-label`이 있는가?
- 현재 탭은 `aria-current="page"`를 사용하는가?
- toggle/filter는 `aria-pressed` 또는 `aria-expanded`를 사용하는가?
- 진행률은 `role="progressbar"`와 현재 값을 제공하는가?
- 모달 제목이 `aria-labelledby`로 연결되는가?
- 이미지에 동작을 설명하는 alt가 있는가?
- 터치 대상이 최소 44×44px인가?
- 텍스트와 배경 대비가 충분한가?
- 키보드 focus 스타일이 보이는가?
- reduced motion 환경에서 사용 가능한가?

## 13. 새 UI 추가 기준

새 화면이나 컴포넌트를 만들 때 다음 순서로 결정한다.

1. 기존 페이지의 레이아웃과 컴포넌트를 재사용할 수 있는지 확인한다.
2. `sign.*` 토큰과 기존 spacing/radius 계층을 적용한다.
3. 화면의 primary action을 하나로 정한다.
4. loading, empty, error, disabled 상태를 함께 설계한다.
5. 320px, 390px, 430px 폭과 짧은 viewport를 확인한다.
6. 키보드와 스크린 리더 의미 구조를 확인한다.

임의의 새 색상, 새로운 아이콘 스타일, 작은 터치 대상, 데스크톱 중심 다단 레이아웃은 도입하지 않는다.
