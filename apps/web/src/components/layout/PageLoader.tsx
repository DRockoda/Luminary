import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div
      className="page-loader-root flex items-center justify-center"
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "2px solid var(--border-default)",
          borderTopColor: "var(--accent)",
        }}
      />
    </div>
  );
}
