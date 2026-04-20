import { MessageSquarePlus, Send, X } from "lucide-react";
import { useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/authStore";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", desc: "Nice to have" },
  { value: "normal", label: "Normal", desc: "Standard feedback" },
  { value: "high", label: "High", desc: "Affecting my usage" },
  { value: "urgent", label: "Urgent", desc: "Blocking me completely" },
] as const;

const TYPE_OPTIONS = [
  { value: "feedback", label: "General" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "question", label: "Question" },
] as const;

export function FeedbackButton() {
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]["value"]>("normal");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("feedback");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/feedback", {
        name: user?.displayName,
        email: user?.email,
        title: title.trim(),
        message: message.trim(),
        priority,
        type,
      });
      toast.success("Thanks for your feedback.");
      setIsOpen(false);
      setTitle("");
      setMessage("");
      setPriority("normal");
      setType("feedback");
    } catch (err) {
      toast.error("Failed to send feedback", apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if ((title || message) && !window.confirm("Discard your feedback?")) return;
    setIsOpen(false);
    setTitle("");
    setMessage("");
  }

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquarePlus size={18} />
      </button>

      {isOpen && (
        <div className="feedback-overlay" onClick={handleClose}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <div className="feedback-modal-title-row">
                <MessageSquarePlus size={16} />
                <h3>Send Feedback</h3>
              </div>
              <button type="button" className="feedback-close-btn" onClick={handleClose}>
                <X size={15} />
              </button>
            </div>

            <div className="feedback-type-row">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`feedback-type-chip ${type === opt.value ? "is-active" : ""}`}
                  onClick={() => setType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="feedback-field">
              <label className="feedback-label">Title</label>
              <input
                className="feedback-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary..."
                maxLength={100}
              />
              <span className="feedback-char-count">{title.length}/100</span>
            </div>

            <div className="feedback-field">
              <label className="feedback-label">Message</label>
              <textarea
                className="feedback-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Describe your feedback..."
              />
              <span className="feedback-char-count">{message.length}/2000</span>
            </div>

            <div className="feedback-field">
              <label className="feedback-label">Priority</label>
              <div className="feedback-priority-grid">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`feedback-priority-card ${priority === opt.value ? "is-active" : ""}`}
                    onClick={() => setPriority(opt.value)}
                  >
                    <span className="feedback-priority-label">{opt.label}</span>
                    <span className="feedback-priority-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-modal-footer">
              <p className="feedback-footer-note">
                Your feedback is linked to your account.
              </p>
              <button
                type="button"
                className="feedback-submit-btn"
                onClick={handleSubmit}
                disabled={!title.trim() || !message.trim() || isSubmitting}
              >
                {isSubmitting ? <span className="feedback-spinner" /> : <Send size={14} />}
                {isSubmitting ? "Sending..." : "Send feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
