import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} — Luminary`;
  }, [title]);

  return (
    <div
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "28px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: "4px 0 0",
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

