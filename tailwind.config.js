/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue,svelte}"],
  theme: {
    extend: {
      fontSize: {
        base: "18px",
      },
      fontFamily: {
        sans: ["Noto Sans JP", "Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
