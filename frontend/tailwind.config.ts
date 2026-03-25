import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#06050f",
        ink: "#efeefe",
        accent: "#8d67ff",
        panel: "#111023",
        line: "#2b2a47",
        glow: "#4be7ff"
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
