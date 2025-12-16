/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",

        // Neo-Teal single accent system
        "neo-teal": "#14F1C6",
        "neo-teal-dim": "#14F1C680",
        "neo-teal-dark": "#0A9B7F",

        // Deep space backgrounds
        "space-dark": "#0A0E27",
        "space-card": "#0D1B2A",
        "space-border": "#1E2A3E",
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #14F1C6, 0 0 10px #14F1C6" },
          "100%": {
            boxShadow: "0 0 10px #14F1C6, 0 0 20px #14F1C6, 0 0 30px #14F1C6",
          },
        },
      },
    },
  },
  plugins: [],
};
