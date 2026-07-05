import { createSignMate } from "../src/signmate-engine.js";

const video = document.querySelector("#video");
const canvas = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const wordEl = document.querySelector("#word");
const confidenceEl = document.querySelector("#confidence");
const handsEl = document.querySelector("#hands");
const rawLabelEl = document.querySelector("#rawLabel");

let signmate = null;

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  wordEl.textContent = "로딩";

  signmate = await createSignMate({
    videoElement: video,
    canvasElement: canvas,
    modelUrl: "../assets/signmate_model.json",
    threshold: 0.7,
    smoothingWindow: 12,
    onPrediction(prediction) {
      wordEl.textContent = prediction.name;
      confidenceEl.textContent = prediction.confidence.toFixed(2);
      handsEl.textContent = String(prediction.handCount);
      rawLabelEl.textContent = prediction.label;
    },
    onError(error) {
      console.error(error);
      rawLabelEl.textContent = "error";
    },
  });

  await signmate.start();
  stopButton.disabled = false;
});

stopButton.addEventListener("click", () => {
  if (signmate) signmate.stop();
  startButton.disabled = false;
  stopButton.disabled = true;
  wordEl.textContent = "대기";
  confidenceEl.textContent = "0.00";
  handsEl.textContent = "0";
  rawLabelEl.textContent = "stopped";
});
