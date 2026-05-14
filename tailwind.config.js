/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        script: ["Caveat", "cursive"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "#1a1a1a",
        light: "#f7f6f2",
        background: "#ffffff",
        accent: "#555555",
      },
    },
  },
  plugins: [],
};
