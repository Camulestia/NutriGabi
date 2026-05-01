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
        ink: "#1f2937",
        sand: "#f7f9fa",
        sage: "#dff5f2",
        moss: "#1f9d8b",
        coral: "#f3a68c",
        gold: "#f3cf95",
        line: "#e5eaee",
        muted: "#6b7280"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(31, 41, 55, 0.06)",
        card: "0 6px 24px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
