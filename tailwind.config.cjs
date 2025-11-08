/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/preline/preline.js",
  ],
  theme: {
    extend: {
      lineClamp: {
        6: '6', 
      },
    },
  },
  plugins: [
    require("preline/plugin"),
    require('@tailwindcss/line-clamp'), 
  ],
};
