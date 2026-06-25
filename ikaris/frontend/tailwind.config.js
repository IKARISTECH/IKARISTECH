/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta IKARIS — modo claro usa estos tonos cálidos
        ikaris: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#3b5bdb',
          600: '#2f4ac7',
          700: '#2840b0',
          900: '#1a2a7a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundColor: {
        // Modo claro: blanco hueso suave
        'light-base':    '#f7f7f5',
        'light-surface': '#ffffff',
        'light-muted':   '#f0eff4',
        // Modo oscuro: negro profundo
        'dark-base':     '#0a0a0f',
        'dark-surface':  '#0f0f13',
        'dark-elevated': '#18181f',
      },
    },
  },
  plugins: [],
}