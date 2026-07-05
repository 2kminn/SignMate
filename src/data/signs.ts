import type { SignInfo } from "../types/sign";

export const signs: SignInfo[] = [
  {
    label: "hello",
    name: "안녕하세요",
    description: "양손을 주먹 쥔 상태로 몸 앞에서 아래쪽으로 내리며 인사 동작을 표현합니다.",
    difficulty: "easy",
    category: "greeting",
    usageExamples: ["안녕하세요, 반갑습니다.", "선생님, 안녕하세요."],
    guide: ["손이 화면에 잘 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "thanks",
    name: "감사합니다",
    description: "한 손을 다른 손 위에 세워 올리듯 맞대며 고마움을 표현합니다.",
    difficulty: "normal",
    category: "greeting",
    usageExamples: ["도와주셔서 감사합니다.", "선생님, 감사합니다."],
    guide: [
      "손을 가슴 앞쪽에 위치시킵니다.",
      "손의 이동 방향이 잘 보이도록 천천히 표현합니다."
    ]
  },
  {
    label: "sorry",
    name: "죄송합니다",
    description: "한 손을 이마 쪽에서 아래 손바닥 방향으로 내려 미안함을 표현합니다.",
    difficulty: "normal",
    category: "greeting",
    usageExamples: ["늦어서 죄송합니다.", "정말 죄송합니다."],
    guide: ["손이 화면에 잘 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "okay",
    name: "괜찮아요",
    description: "두 손바닥을 몸 앞에서 위아래로 마주 보게 움직이며 괜찮다는 뜻을 표현합니다.",
    difficulty: "easy",
    category: "response",
    usageExamples: ["네, 괜찮아요.", "저는 괜찮아요."],
    guide: ["손이 화면에 잘 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "no",
    name: "아니요",
    description: "한 손 손바닥 옆으로 다른 손의 손가락을 가져가며 부정의 의미를 표현합니다.",
    difficulty: "easy",
    category: "response",
    usageExamples: ["아니요, 괜찮습니다.", "아니요, 필요 없습니다."],
    guide: [
      "손 모양이 잘 보이도록 카메라 정면에서 표현합니다.",
      "손이 화면 밖으로 나가지 않도록 합니다."
    ]
  },
  {
    label: "help",
    name: "도와주세요",
    description: "한 손을 다른 손 가까이에 두고 손끝을 밀어 주듯 움직여 도움 요청을 표현합니다.",
    difficulty: "normal",
    category: "request",
    usageExamples: ["도와주세요.", "길을 찾는 것을 도와주세요."],
    guide: [
      "양손 또는 손의 위치가 화면 중앙에 오도록 합니다.",
      "동작을 너무 빠르게 하지 않습니다."
    ]
  },
  {
    label: "water",
    name: "물",
    description: "손을 입가 가까이에 가져가 물을 마시는 듯한 동작으로 물을 표현합니다.",
    difficulty: "easy",
    category: "daily",
    usageExamples: ["물 주세요.", "물이 필요합니다."],
    guide: [
      "손가락 모양이 잘 보이도록 카메라에 가깝게 표현합니다.",
      "손이 얼굴이나 몸에 가려지지 않도록 합니다."
    ]
  },
  {
    label: "restroom",
    name: "화장실",
    description: "손가락을 둥글게 말아 얼굴 옆에서 보이며 화장실을 나타냅니다.",
    difficulty: "easy",
    category: "daily",
    usageExamples: ["화장실이 어디예요?", "화장실에 다녀올게요."],
    guide: ["손 모양이 잘 보이도록 카메라 정면에서 표현합니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "home",
    name: "집",
    description: "한 손을 지붕처럼 올리고 다른 손을 아래에 두어 집의 형태를 표현합니다.",
    difficulty: "easy",
    category: "daily",
    usageExamples: ["집에 가요.", "우리 집이에요."],
    guide: ["양손이 화면 안에 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "name",
    name: "이름",
    description: "검지를 몸 앞쪽으로 내밀어 이름을 가리키는 동작을 표현합니다.",
    difficulty: "normal",
    category: "daily",
    usageExamples: ["이름이 뭐예요?", "제 이름은 민수예요."],
    guide: ["손가락 모양이 잘 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  }
];
