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
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        surface: {
          DEFAULT: "oklch(var(--surface) / <alpha-value>)",
          muted: "oklch(var(--surface-muted) / <alpha-value>)",
          elevated: "oklch(var(--surface-elevated) / <alpha-value>)",
          strong: "oklch(var(--surface-strong) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
          soft: "oklch(var(--primary-soft) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
          soft: "oklch(var(--accent-soft) / <alpha-value>)",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(var(--success-foreground) / <alpha-value>)",
          soft: "oklch(var(--success-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          foreground: "oklch(var(--warning-foreground) / <alpha-value>)",
          soft: "oklch(var(--warning-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "oklch(var(--danger) / <alpha-value>)",
          foreground: "oklch(var(--danger-foreground) / <alpha-value>)",
          soft: "oklch(var(--danger-soft) / <alpha-value>)",
        }
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "sans-serif"],
        display: ["Sora", "Public Sans", "system-ui", "sans-serif"],
        headline: ["Sora", "Public Sans", "system-ui", "sans-serif"],
        body: ["Public Sans", "system-ui", "sans-serif"],
        label: ["Public Sans", "system-ui", "sans-serif"]
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.5rem",
        xl: "0.5rem",
        "2xl": "0.5rem",
        "3xl": "0.5rem",
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
