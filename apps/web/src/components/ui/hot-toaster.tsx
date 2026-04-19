import { Toaster } from "react-hot-toast";

export function HotToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      containerClassName="luminary-toaster"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
          boxShadow: "var(--shadow-md)",
        },
      }}
    />
  );
}
