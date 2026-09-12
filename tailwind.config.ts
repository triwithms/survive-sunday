import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stadium: {
          950: "#0B0E12",
          900: "#12171F",
          800: "#1A222D",
          700: "#243040",
          border: "#2E3A4A",
        },
        gold: {
          400: "#E8C547",
          500: "#D4AF37",
        },
        field: {
          400: "#3DDC97",
          600: "#1FA971",
        },
        crimson: {
          400: "#E85D5D",
        },
        sky: {
          400: "#6CB6FF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        pool: "720px",
        sheet: "480px",
      },
    },
  },
  plugins: [],
};
export default config;
