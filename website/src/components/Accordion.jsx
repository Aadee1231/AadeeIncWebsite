import { motion, AnimatePresence } from "framer-motion";

/** Controlled accordion: parent passes `open` and `onToggle` */
export default function Accordion({ title, children, open = false, onToggle }) {
  return (
    <div className={`accent-card card ${open ? "accordion-open glow" : ""}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="accordion-head"
        style={{
          width: "100%",
          background: "transparent",
          color: "inherit",
          border: 0,
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="chev" aria-hidden>›</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: ".65rem", color: "var(--muted)" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
