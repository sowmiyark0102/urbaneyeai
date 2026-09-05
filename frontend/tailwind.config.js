/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0F2A43",
          700: "#1E3A56",
          500: "#3D5A73",
          300: "#7690A3",
        },
        surface: {
          DEFAULT: "#F5F7F9",
          card: "#FFFFFF",
          line: "#DDE4EA",
        },
        accent: {
          DEFAULT: "#0B5FA8",
          dark: "#084A85",
          light: "#E7F1FA",
        },
        critical: { DEFAULT: "#C0392B", light: "#FBEAE8" },
        warning: { DEFAULT: "#C9791C", light: "#FCF1E3" },
        success: { DEFAULT: "#1E8449", light: "#E7F5EC" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,42,67,0.06), 0 1px 8px rgba(15,42,67,0.04)",
      },
    },
  },
  plugins: [],
}
