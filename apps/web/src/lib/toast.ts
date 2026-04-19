import type { CSSProperties } from "react";
import hotToast from "react-hot-toast";

const base: CSSProperties = {
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-strong)",
  borderRadius: "var(--radius-lg, 10px)",
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
  boxShadow: "var(--shadow-md)",
  padding: "10px 14px",
  maxWidth: 360,
};

function message(title: string, description?: string) {
  return description ? `${title}\n${description}` : title;
}

export const toast = {
  success(title: string, description?: string) {
    hotToast.success(message(title, description), {
      duration: 3000,
      style: {
        ...base,
        borderLeft: "3px solid var(--success)",
        whiteSpace: "pre-line",
      },
    });
  },
  error(title: string, description?: string) {
    hotToast.error(message(title, description), {
      duration: 4000,
      style: {
        ...base,
        borderLeft: "3px solid var(--danger)",
        whiteSpace: "pre-line",
      },
    });
  },
  info(title: string, description?: string) {
    hotToast(message(title, description), {
      duration: 3000,
      style: {
        ...base,
        borderLeft: "3px solid var(--accent)",
        whiteSpace: "pre-line",
      },
    });
  },
};
