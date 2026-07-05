import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const FEATURE_SIZE = 126;
const HAND_ORDER = ["Left", "Right"];
const DEFAULT_HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const DEFAULT_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

export async function createSignMate(options) {
  const engine = new SignMateEngine(options);
  await engine.load();
  return engine;
}

export async function preloadSignMateRuntime(modelUrl) {
  const response = await fetch(modelUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`SignMate model preload failed: HTTP ${response.status}`);
  }
}

globalThis.SignMateMediaPipe = { createSignMate, preloadSignMateRuntime };

class SignMateEngine {
  constructor({
    videoElement,
    canvasElement = null,
    modelUrl = "./assets/signmate_model.json",
    threshold = 0.7,
    smoothingWindow = 12,
    mirrorCamera = true,
    drawLandmarks = true,
    mediaConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    },
    onPrediction = () => {},
    onError = console.error,
  }) {
    if (!videoElement) throw new Error("videoElement is required.");

    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
    this.modelUrl = modelUrl;
    this.threshold = threshold;
    this.smoothingWindow = smoothingWindow;
    this.mirrorCamera = mirrorCamera;
    this.drawLandmarks = drawLandmarks;
    this.mediaConstraints = mediaConstraints;
    this.onPrediction = onPrediction;
    this.onError = onError;

    this.handLandmarker = null;
    this.drawingUtils = null;
    this.model = null;
    this.stream = null;
    this.animationId = null;
    this.lastVideoTime = -1;
    this.probabilityWindow = [];
    this.lastPrediction = null;
  }

  async load() {
    const [vision, model] = await Promise.all([
      FilesetResolver.forVisionTasks(DEFAULT_WASM_URL),
      this.loadModel(),
    ]);

    this.model = model;
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: DEFAULT_HAND_MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });

    if (this.ctx) this.drawingUtils = new DrawingUtils(this.ctx);
  }

  async loadModel() {
    const response = await fetch(this.modelUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`SignMate model load failed: HTTP ${response.status}`);
    }

    const model = await response.json();
    if (model.feature_size !== FEATURE_SIZE) {
      throw new Error(`Invalid feature_size: ${model.feature_size}`);
    }
    return model;
  }

  async start() {
    if (!this.handLandmarker || !this.model) await this.load();

    this.stream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    this.video.srcObject = this.stream;
    await this.video.play();
    this.loop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.resetSmoothing();
    this.clearCanvas();
  }

  dispose() {
    this.stop();
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }

  loop = () => {
    try {
      if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.resizeCanvas();
        if (this.video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = this.video.currentTime;
          const results = this.handLandmarker.detectForVideo(this.video, performance.now());
          this.handleResults(results);
        }
      }
    } catch (error) {
      this.onError(error);
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  handleResults(results) {
    this.clearCanvas();
    if (this.drawLandmarks && this.ctx) this.draw(results);

    const { features, seen } = this.extractFeatures(results);
    const handCount = Number(seen.Left) + Number(seen.Right);

    if (handCount === 0) {
      this.resetSmoothing();
      this.emit({
        label: "wait",
        name: "대기",
        confidence: 0,
        rawLabel: "no-hands",
        handCount,
        seen,
        accepted: false,
      });
      return;
    }

    const probabilities = this.predict(features);
    this.probabilityWindow.push(probabilities);
    if (this.probabilityWindow.length > this.smoothingWindow) {
      this.probabilityWindow.shift();
    }

    const smoothed = averageProbabilities(this.probabilityWindow);
    const { index, value } = argMax(smoothed);
    const predicted = this.model.classes[index];
    const accepted = value >= this.threshold;

    this.emit({
      label: accepted ? predicted.label : "uncertain",
      name: accepted ? predicted.name : "인식 대기",
      confidence: value,
      rawLabel: predicted.label,
      handCount,
      seen,
      accepted,
      probabilities: smoothed,
    });
  }

  emit(prediction) {
    this.lastPrediction = prediction;
    this.onPrediction(prediction);
  }

  draw(results) {
    if (!results.landmarks) return;

    for (const landmarks of results.landmarks) {
      this.drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#16a673",
        lineWidth: 4,
      });
      this.drawingUtils.drawLandmarks(landmarks, {
        color: "#ffb547",
        lineWidth: 2,
        radius: 4,
      });
    }
  }

  extractFeatures(results) {
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
      const handedness = this.mirrorCamera ? oppositeHand(rawHandedness) : rawHandedness;
      if (!HAND_ORDER.includes(handedness)) continue;

      const landmarks = this.mirrorCamera
        ? mirrorLandmarks(results.landmarks[index])
        : results.landmarks[index];
      slots[handedness] = normalizeLandmarks(landmarks);
      seen[handedness] = true;
    }

    return { features: [...slots.Left, ...slots.Right], seen };
  }

  predict(features) {
    let values = features;
    for (const layer of this.model.layers) {
      if (layer.type === "batch_norm") {
        values = batchNorm(values, layer);
      } else if (layer.type === "dense") {
        values = dense(values, layer);
      }
    }
    return values;
  }

  resetSmoothing() {
    this.probabilityWindow = [];
  }

  clearCanvas() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const width = this.video.videoWidth || this.canvas.clientWidth;
    const height = this.video.videoHeight || this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
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
