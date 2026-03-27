import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        // Brand: Deep indigo-violet
        brand: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#c7c4ff",
          300: "#a5a0ff",
          400: "#8278ff",
          500: "#6c5ce7",
          600: "#5a45d6",
          700: "#4a37b8",
          800: "#3d2e96",
          900: "#2d2270",
          950: "#1a1445",
        },
        // Accent: Bright teal-green
        accent: {
          50: "#eefff6",
          100: "#d7ffeb",
          200: "#b2ffd9",
          300: "#76ffbe",
          400: "#33f59c",
          500: "#00d97e",
          600: "#00b368",
          700: "#008f54",
          800: "#007044",
          900: "#005c3a",
          DEFAULT: "#00d97e",
          foreground: "#005c3a",
        },
        // Surface: Warm slate grays
        surface: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        // shadcn/ui semantic tokens (mapped to brand/surface)
        border: "#e7e5e4",
        input: "#e7e5e4",
        ring: "#6c5ce7",
        background: "#fafaf9",
        foreground: "#292524",
        primary: {
          DEFAULT: "#6c5ce7",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5f5f4",
          foreground: "#44403c",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f5f5f4",
          foreground: "#78716c",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#292524",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#292524",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover":
          "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
