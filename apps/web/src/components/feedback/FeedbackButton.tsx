import { AnimatePresence, motion } from "framer-motion";
import {
  Bug,
  HelpCircle,
  MessageCircle,
  MessageSquarePlus,
  Send,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

type Priority = "low" | "normal" | "high" | "urgent";
type FeedbackType = "feedback" | "bug" | "feature" | "question" | "other";

const TYPE_OPTIONS: Array<{
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { value: "feedback", label: "General feedback", icon: <MessageCircle size={14} />, desc: "Share your thoughts" },
  { value: "bug", label: "Bug report", icon: <Bug size={14} />, desc: "Something is broken" },
  { value: "feature", label: "Feature request", icon: <Star size={14} />, desc: "Suggest something new" },
  { value: "question", label: "Question", icon: <HelpCircle size={14} />, desc: "Need help with something" },
];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; emoji: string }> = [
  { value: "low", label: "Low", emoji: "🟢" },
  { value: "normal", label: "Normal", emoji: "🔵" },
  { value: "high", label: "High", emoji: "🟡" },
  { value: "urgent", label: "Urgent", emoji: "🔴" },
];

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<FeedbackType>("feedback");
  const [priority, setPriority] = useState<Priority>("normal");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function resetState() {
    setStep("type");
    setType("feedback");
    setPriority("normal");
    setTitle("");
    setMessage("");
    setSubmitted(false);
    setIsSubmitting(false);
  }

  function handleClose() {
    if ((title || message) && !submitted) {
      if (!window.confirm("Discard your feedback?")) return;
    }
    setIsOpen(false);
    window.setTimeout(resetState, 250);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please add a message.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/feedback", {
        title: title.trim(),
        message: message.trim(),
        priority,
        type,
      });
      setSubmitted(true);
      toast.success("Feedback submitted");
    } catch (err) {
      toast.error("Failed to send feedback", apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <motion.button
        className="feedback-fab"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquarePlus size={16} />
        <span className="feedback-fab-label">Feedback</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="feedback-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              className="feedback-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {submitted ? (
                <div className="feedback-success">
                  <motion.div
                    className="feedback-success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    ✓
                  </motion.div>
                  <h3>Thanks for your feedback!</h3>
                  <p>We review every submission and use it to improve Luminary.</p>
                  <button className="feedback-close-success-btn" onClick={handleClose}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="feedback-panel-header">
                    <div className="feedback-panel-title">
                      <MessageSquarePlus size={15} />
                      <span>Send Feedback</span>
                    </div>
                    <button className="feedback-x-btn" onClick={handleClose}>
                      <X size={15} />
                    </button>
                  </div>

                  <div className="feedback-panel-body">
                    {step === "type" && (
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="feedback-step-label">What kind of feedback is this?</p>
                        <div className="feedback-type-grid">
                          {TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              className={`feedback-type-card ${type === opt.value ? "is-selected" : ""}`}
                              onClick={() => {
                                setType(opt.value);
                                setStep("form");
                              }}
                            >
                              <span className="feedback-type-icon">{opt.icon}</span>
                              <span className="feedback-type-label">{opt.label}</span>
                              <span className="feedback-type-desc">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === "form" && (
                      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="feedback-form-top">
                          <button className="feedback-back-btn" onClick={() => setStep("type")}>
                            ← Back
                          </button>
                          <span className="feedback-selected-type">
                            {TYPE_OPTIONS.find((t) => t.value === type)?.icon}
                            {TYPE_OPTIONS.find((t) => t.value === type)?.label}
                          </span>
                        </div>

                        <div className="feedback-field">
                          <label className="feedback-field-label">Title *</label>
                          <input
                            className="feedback-field-input"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            placeholder="Brief summary..."
                          />
                          <span className="feedback-char">{title.length}/120</span>
                        </div>

                        <div className="feedback-field">
                          <label className="feedback-field-label">Message *</label>
                          <textarea
                            className="feedback-field-textarea"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            maxLength={3000}
                            placeholder="Tell us more..."
                          />
                          <span className="feedback-char">{message.length}/3000</span>
                        </div>

                        <div className="feedback-field">
                          <label className="feedback-field-label">Priority</label>
                          <div className="feedback-priority-row">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                className={`feedback-priority-btn ${priority === opt.value ? "is-active" : ""}`}
                                onClick={() => setPriority(opt.value)}
                              >
                                {opt.emoji} {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {step === "form" && (
                    <div className="feedback-panel-footer">
                      <p className="feedback-footer-note">Linked to your account.</p>
                      <button
                        className="feedback-submit-btn"
                        onClick={handleSubmit}
                        disabled={!title.trim() || !message.trim() || isSubmitting}
                      >
                        {isSubmitting ? <span className="feedback-spinner" /> : <Send size={13} />}
                        {isSubmitting ? "Sending..." : "Send feedback"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
