import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
        active: "var(--bg-active)",

        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",

        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        disabled: "var(--text-disabled)",

        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-subtle": "var(--accent-subtle)",
        "accent-border": "var(--accent-border)",

        "today-bg": "var(--today-bg)",
        "today-text": "var(--today-text)",

        success: "var(--success)",
        "success-subtle": "var(--success-subtle)",
        warning: "var(--warning)",
        "warning-subtle": "var(--warning-subtle)",
        danger: "var(--danger)",
        "danger-subtle": "var(--danger-subtle)",

        "mood-great": "var(--mood-great)",
        "mood-good": "var(--mood-good)",
        "mood-okay": "var(--mood-okay)",
        "mood-low": "var(--mood-low)",
        "mood-bad": "var(--mood-bad)",
      },
      fontFamily: {
        sans: ['"Nunito"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["12px", { lineHeight: "1.4" }],
        base: ["13px", { lineHeight: "1.5" }],
        md: ["14px", { lineHeight: "1.5" }],
        lg: ["16px", { lineHeight: "1.4" }],
        xl: ["20px", { lineHeight: "1.3" }],
        "2xl": ["28px", { lineHeight: "1.2" }],
      },
      spacing: {
        "0.5": "2px",
        "1": "4px",
        "1.5": "6px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "panel-in": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 180ms ease both",
        "modal-in": "modal-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "sheet-in": "sheet-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "panel-in": "panel-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
