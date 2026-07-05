import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const video = document.querySelector("#video");
const canvas = document.querySelector("#overlay");
const ctx = canvas.getContext("2d");
const wordEl = document.querySelector("#word");
const confidenceEl = document.querySelector("#confidence");
const handsEl = document.querySelector("#hands");
const rawLabelEl = document.querySelector("#rawLabel");

const FEATURE_SIZE = 126;
const HAND_ORDER = ["Left", "Right"];
const MODEL_URL = "./assets/signmate_model.json";
const CONFIDENCE_THRESHOLD = 0.7;
const SMOOTHING_WINDOW = 12;
const MIRROR_CAMERA_FOR_MODEL = true;

let handLandmarker = null;
let drawingUtils = null;
let webModel = null;
let stream = null;
let animationId = null;
let lastVideoTime = -1;
let probabilityWindow = [];

startButton.addEventListener("click", startCamera);
resetButton.addEventListener("click", reset);

async function createHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
  drawingUtils = new DrawingUtils(ctx);
  return handLandmarker;
}

async function startCamera() {
  await Promise.all([createHandLandmarker(), loadWebModel()]);
  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  startButton.disabled = true;
  loop();
}

function loop() {
  if (!handLandmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    animationId = requestAnimationFrame(loop);
    return;
  }

  resizeCanvas();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());
    renderResults(results);
  }
  animationId = requestAnimationFrame(loop);
}

function renderResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { features, seen } = extractFeatures(results);

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#16a673",
        lineWidth: 4,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#ffb547",
        lineWidth: 2,
        radius: 4,
      });
    }
  }

  const handCount = Number(seen.Left) + Number(seen.Right);
  handsEl.textContent = String(handCount);

  if (!webModel) {
    wordEl.textContent = "모델 없음";
    confidenceEl.textContent = "0.00";
    rawLabelEl.textContent = "run export_web_assets.py";
    return;
  }

  if (handCount === 0) {
    probabilityWindow = [];
    wordEl.textContent = "대기";
    confidenceEl.textContent = "0.00";
    rawLabelEl.textContent = "no-hands";
    return;
  }

  const probabilities = predict(features);
  probabilityWindow.push(probabilities);
  if (probabilityWindow.length > SMOOTHING_WINDOW) probabilityWindow.shift();

  const smoothed = averageProbabilities(probabilityWindow);
  const { index, value } = argMax(smoothed);
  const predicted = webModel.classes[index];

  confidenceEl.textContent = value.toFixed(2);
  if (value >= CONFIDENCE_THRESHOLD) {
    wordEl.textContent = predicted.name;
    rawLabelEl.textContent = predicted.label;
  } else {
    wordEl.textContent = "인식 대기";
    rawLabelEl.textContent = "uncertain";
  }
}

function extractFeatures(results) {
  const slots = {
    Left: new Array(63).fill(0),
    Right: new Array(63).fill(0),
  };
  const seen = { Left: false, Right: false };

  if (!results.landmarks?.length) {
    return { features: new Array(FEATURE_SIZE).fill(0), seen };
  }

  for (let index = 0; index < results.landmarks.length; index += 1) {
    const rawHandedness = results.handednesses?.[index]?.[0]?.categoryName;
    const handedness = MIRROR_CAMERA_FOR_MODEL ? oppositeHand(rawHandedness) : rawHandedness;
    if (!HAND_ORDER.includes(handedness)) continue;

    const landmarks = MIRROR_CAMERA_FOR_MODEL
      ? mirrorLandmarks(results.landmarks[index])
      : results.landmarks[index];
    slots[handedness] = normalizeLandmarks(landmarks);
    seen[handedness] = true;
  }

  return { features: [...slots.Left, ...slots.Right], seen };
}

function normalizeLandmarks(landmarks) {
  const wrist = landmarks[0];
  const relative = landmarks.map((point) => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
    z: point.z - wrist.z,
  }));

  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const xySpan = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const wristDistance = Math.max(...relative.map((point) => Math.hypot(point.x, point.y)));
  const scale = Math.max(xySpan, wristDistance, 1e-6);

  return relative.flatMap((point) => [point.x / scale, point.y / scale, point.z / scale]);
}

async function loadWebModel() {
  if (webModel) return webModel;

  try {
    const response = await fetch(MODEL_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    webModel = await response.json();
    if (webModel.feature_size !== FEATURE_SIZE) {
      throw new Error(`feature_size ${webModel.feature_size} != ${FEATURE_SIZE}`);
    }
    rawLabelEl.textContent = "model-ready";
    return webModel;
  } catch (error) {
    console.warn("SignMate web model load failed:", error);
    webModel = null;
    return null;
  }
}

function predict(features) {
  let values = features;
  for (const layer of webModel.layers) {
    if (layer.type === "batch_norm") {
      values = batchNorm(values, layer);
    } else if (layer.type === "dense") {
      values = dense(values, layer);
    }
  }
  return values;
}

function batchNorm(values, layer) {
  return values.map((value, index) => (
    layer.gamma[index] * ((value - layer.moving_mean[index]) / Math.sqrt(layer.moving_variance[index] + layer.epsilon))
    + layer.beta[index]
  ));
}

function dense(values, layer) {
  const output = new Array(layer.bias.length);
  for (let column = 0; column < layer.bias.length; column += 1) {
    let sum = layer.bias[column];
    for (let row = 0; row < values.length; row += 1) {
      sum += values[row] * layer.kernel[row][column];
    }
    output[column] = sum;
  }

  if (layer.activation === "relu") return output.map((value) => Math.max(0, value));
  if (layer.activation === "softmax") return softmax(output);
  return output;
}

function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

function averageProbabilities(windowValues) {
  const output = new Array(windowValues[0].length).fill(0);
  for (const probabilities of windowValues) {
    for (let index = 0; index < output.length; index += 1) {
      output[index] += probabilities[index];
    }
  }
  return output.map((value) => value / windowValues.length);
}

function argMax(values) {
  return values.reduce(
    (best, value, index) => (value > best.value ? { index, value } : best),
    { index: 0, value: values[0] },
  );
}

function mirrorLandmarks(landmarks) {
  return landmarks.map((point) => ({ ...point, x: 1 - point.x }));
}

function oppositeHand(handedness) {
  if (handedness === "Left") return "Right";
  if (handedness === "Right") return "Left";
  return handedness;
}

function resizeCanvas() {
  const width = video.videoWidth || canvas.clientWidth;
  const height = video.videoHeight || canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function reset() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startButton.disabled = false;
  probabilityWindow = [];
  wordEl.textContent = "대기";
  confidenceEl.textContent = "0.00";
  handsEl.textContent = "0";
  rawLabelEl.textContent = webModel ? "model-ready" : "model-missing";
}
