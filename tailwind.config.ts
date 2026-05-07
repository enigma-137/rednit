import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        white: "#FFFFFF",
        "gray-100": "#F5F5F5",
        "gray-200": "#E0E0E0",
        "gray-400": "#999999",
        "gray-600": "#555555",
        "gray-800": "#222222"
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "IBM Plex Mono", "monospace"]
      },
      borderRadius: {
        DEFAULT: "0px"
      },
      animation: {
        "fade-up": "fadeUp 200ms cubic-bezier(0.16, 1, 0.3, 1)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
