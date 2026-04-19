import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

export function PageTransitionOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-full w-full"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
