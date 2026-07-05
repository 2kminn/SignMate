import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SignMate",
        short_name: "SignMate",
        description: "MediaPipe 기반 기초 수어 학습 및 실시간 손동작 인식 PWA",
        lang: "ko",
        theme_color: "#10B981",
        background_color: "#F9FAFB",
        display: "standalone",
        orientation: "portrait",
        start_url: "/"
      }
    })
  ]
});
