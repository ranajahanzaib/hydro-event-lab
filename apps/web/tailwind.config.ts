import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hydro: {
          bg: "#080F18",
          surface: "#101B27",
          elevated: "#162433",
          border: "#263747",
          text: "#E7EEF5",
          muted: "#94A7B8",
          streamflow: "#46B5F5",
          precip: "#5C82FF",
          direct: "#2DD4BF",
          baseflow: "#E3BD69",
          selected: "#F0D58C",
          flag: "#F87171",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
