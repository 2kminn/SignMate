import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sign: {
          main: "#10B981",
          dark: "#047857",
          deep: "#064E3B",
          light: "#D1FAE5",
          soft: "#ECFDF5",
          outside: "#F0FDF4",
          app: "#F9FAFB",
          border: "#A7F3D0",
          text: "#111827",
          sub: "#6B7280",
          success: "#22C55E",
          error: "#EF4444",
          tip: "#FEF3C7",
          tipText: "#92400E"
        }
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
} satisfies Config;
