import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        panel: "#111823",
        panel2: "#0e141d",
        border: "#1e2a3a",
        muted: "#7d8ba1",
        text: "#e6edf3",
        brand: "#f59e0b",
        ok: "#22c55e",
        warn: "#f59e0b",
        bad: "#ef4444",
        info: "#3b82f6",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
