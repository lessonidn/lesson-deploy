import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./admin/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography, // ✅ aktifkan plugin prose
  ],
}