import type { SignInfo } from "../types/sign";

export const signs: SignInfo[] = [
  {
    label: "yes",
    name: "네",
    description: "긍정의 의미를 나타내는 기초 수어입니다.",
    difficulty: "easy",
    category: "response",
    usageExamples: ["네, 맞습니다.", "네, 괜찮습니다."],
    guide: ["손이 화면에 잘 보이도록 위치를 맞춥니다.", "동작을 천천히 표현합니다."]
  },
  {
    label: "no",
    name: "아니요",
    description: "부정의 의미를 나타내는 기초 수어입니다.",
    difficulty: "easy",
    category: "response",
    usageExamples: ["아니요, 괜찮습니다.", "아니요, 필요 없습니다."],
    guide: [
      "손 모양이 잘 보이도록 카메라 정면에서 표현합니다.",
      "손이 화면 밖으로 나가지 않도록 합니다."
    ]
  },
  {
    label: "thanks",
    name: "감사합니다",
    description: "감사의 마음을 전달할 때 사용하는 기초 수어입니다.",
    difficulty: "normal",
    category: "greeting",
    usageExamples: ["도와주셔서 감사합니다.", "선생님, 감사합니다."],
    guide: [
      "손을 가슴 앞쪽에 위치시킵니다.",
      "손의 이동 방향이 잘 보이도록 천천히 표현합니다."
    ]
  },
  {
    label: "help",
    name: "도와주세요",
    description: "도움을 요청할 때 사용하는 기초 수어입니다.",
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
    description: "물을 표현하는 생활 기초 수어입니다.",
    difficulty: "easy",
    category: "daily",
    usageExamples: ["물 주세요.", "물이 필요합니다."],
    guide: [
      "손가락 모양이 잘 보이도록 카메라에 가깝게 표현합니다.",
      "손이 얼굴이나 몸에 가려지지 않도록 합니다."
    ]
  }
];
