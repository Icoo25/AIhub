import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        ink: "#f7f2e9",
        panel: "#fffaf2",
        line: "#ddd3c5",
        acid: "#7f9156",
        violet: "#8f75a8",
      },
      boxShadow: { glow: "0 0 28px rgba(184,243,74,.12)" },
    },
  },
  plugins: [],
} satisfies Config;
