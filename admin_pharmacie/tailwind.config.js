/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
          elevated: "hsl(var(--surface-elevated))",
          strong: "hsl(var(--surface-strong))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          soft: "hsl(var(--danger-soft))",
        }
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "sans-serif"],
        display: ["Manrope", "system-ui", "sans-serif"],
        headline: ["Manrope", "system-ui", "sans-serif"],
        body: ["Public Sans", "system-ui", "sans-serif"],
        label: ["Public Sans", "system-ui", "sans-serif"]
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.375rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06)",
        panel: "0 12px 40px rgba(15, 23, 42, 0.12)",
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
}
