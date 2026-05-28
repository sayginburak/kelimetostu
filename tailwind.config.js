/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#222327",
        paper: "#f6f1e8",
        bound: "#168aad",
        boundSoft: "#9bd3df",
        active: "#f47c20",
        win: "#2f9e44",
        clay: "#9a6f61"
      }
    }
  },
  plugins: []
};
