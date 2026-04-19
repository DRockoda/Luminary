import { getAvatarLibraryPublicUrl } from "@luminary/shared";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Github,
  HeartPulse,
  Instagram,
  Lock,
  Menu,
  Mic,
  Minus,
  Play,
  Plus,
  Send,
  Smartphone,
  Twitter,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "@/lib/api";

import "./LandingPage.css";

const ROTATING_WORDS = ["reflect", "remember", "grow"];

const FEATURES = [
  {
    icon: <Mic className="h-5 w-5" strokeWidth={1.75} />,
    title: "Audio & Video Entries",
    description: "Record in the moment. Your voice, your face, your story.",
  },
  {
    icon: <CalendarDays className="h-5 w-5" strokeWidth={1.75} />,
    title: "Smart Calendar",
    description: "Every day at a glance. Tap any past date to fill in what you missed.",
  },
  {
    icon: <HeartPulse className="h-5 w-5" strokeWidth={1.75} />,
    title: "Mood Tracking",
    description: "10-point mood scale that builds into beautiful trends over time.",
  },
  {
    icon: <Lock className="h-5 w-5" strokeWidth={1.75} />,
    title: "Private by Design",
    description: "End-to-end encrypted. Stored in your own Google Drive.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" strokeWidth={1.75} />,
    title: "Powerful Stats",
    description: "Streaks, completion rates, best mood days. Learn your patterns.",
  },
  {
    icon: <Smartphone className="h-5 w-5" strokeWidth={1.75} />,
    title: "Works Everywhere",
    description: "Web, iOS, Android. Journal from anywhere, anytime.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Record",
    text: "Capture your day in audio, video, or writing. Whatever feels right today.",
  },
  {
    n: 2,
    title: "Reflect",
    text: "Revisit past entries whenever you need to remember a feeling or a moment.",
  },
  {
    n: 3,
    title: "Remember",
    text: "See your story unfold through streaks, moods, and yearly recaps.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried every journaling app. Luminary is the first one I actually stick with.",
    name: "Sarah K.",
    role: "Teacher",
    avatar: "adv-03",
  },
  {
    quote:
      "Being able to record a voice note when I can't find the words — that's the killer feature.",
    name: "Marcus L.",
    role: "Therapist",
    avatar: "lor-02",
  },
  {
    quote:
      "The mood tracking helped me realize I'm happier on days I get outside. That changed my life.",
    name: "Priya S.",
    role: "Product Manager",
    avatar: "not-04",
  },
  {
    quote: "Clean, private, no ads. Everything I want in a journaling app.",
    name: "James R.",
    role: "Writer",
    avatar: "adv-07",
  },
  {
    quote:
      "Looking back a year later and seeing how far I've come — that's priceless.",
    name: "Emma T.",
    role: "Medical Student",
    avatar: "lor-06",
  },
];

const FAQS = [
  {
    q: "Is my data really private?",
    a: "Yes. Text entries are encrypted on the server with AES-256-GCM, and audio/video files can be stored in your own Google Drive — meaning we never have access to your unencrypted media. We don't sell, share, or train models on your data.",
  },
  {
    q: "What happens if I lose my password?",
    a: "Use the 'Forgot password?' link on the sign-in page. We'll email you a reset link that expires in 1 hour. If you've forgotten the encryption phrase you set on a device, decrypt is still possible from any other signed-in device.",
  },
  {
    q: "Can I use it offline?",
    a: "Most of Luminary works offline — you can write entries and revisit recent days without a connection. They'll sync as soon as you're back online.",
  },
  {
    q: "Is there a free tier?",
    a: "Luminary is free to use. Optional Google Drive storage is on your own free Drive quota — your entries don't cost us anything to host because you own them.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. From Settings → Data, you can export all your entries as a single archive. It's plain JSON plus your media files. Take it with you anywhere.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes — Luminary is a Progressive Web App. Add it to your home screen on iPhone or Android and it behaves just like a native app, with offline support and a full-screen experience.",
  },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accentIndex, setAccentIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** In-page #anchors: smooth scroll + offset for sticky nav (respects reduced motion). */
  useEffect(() => {
    const root = document.querySelector(".landing-page");
    if (!root) return;

    const reduceMotion = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onClick = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a || !root.contains(a)) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({
        behavior: reduceMotion() ? "auto" : "smooth",
        block: "start",
      });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setAccentIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const currentWord = ROTATING_WORDS[accentIndex];

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className={`landing-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="landing-container landing-nav-inner">
          <Link
            to="/"
            className="landing-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Luminary home"
          >
            <LandingLogoMark />
            <span>Luminary</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#testimonials">Reviews</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/auth" className="landing-btn-ghost-sm">
              Sign in
            </Link>
            <Link to="/auth?mode=signup" className="landing-btn-primary-sm">
              Start journaling
            </Link>
          </div>
          <button
            className="landing-nav-burger"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {navOpen && (
        <div className="landing-mobile-menu" onClick={() => setNavOpen(false)}>
          <div className="landing-mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="landing-mobile-menu-header">
              <Link to="/" className="landing-logo" onClick={() => setNavOpen(false)}>
                <LandingLogoMark />
                <span>Luminary</span>
              </Link>
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close"
                className="landing-mobile-menu-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="landing-mobile-menu-links">
              <a href="#features" onClick={() => setNavOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" onClick={() => setNavOpen(false)}>
                How it works
              </a>
              <a href="#testimonials" onClick={() => setNavOpen(false)}>
                Reviews
              </a>
              <a href="#faq" onClick={() => setNavOpen(false)}>
                FAQ
              </a>
            </div>
            <div className="landing-mobile-menu-actions">
              <Link to="/auth" className="landing-btn-ghost-sm" onClick={() => setNavOpen(false)}>
                Sign in
              </Link>
              <Link
                to="/auth?mode=signup"
                className="landing-btn-primary-sm"
                onClick={() => setNavOpen(false)}
              >
                Start journaling
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="landing-section landing-hero-section">
        <div className="landing-container hero">
          <div className="hero-text">
            <h1 className="hero-headline">
              Your private space to{" "}
              <span className="accent-word" key={currentWord}>
                {currentWord}
              </span>
              ,<br />
              and grow.
            </h1>
            <p className="hero-subhead">
              Capture your days in audio, video, or text. Track your mood. Own your memories.
            </p>
            <div className="hero-ctas">
              <Link to="/auth?mode=signup" className="landing-btn-primary">
                Start journaling free
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a href="#features" className="landing-btn-secondary">
                <Play className="h-4 w-4" strokeWidth={2} />
                Watch demo
              </a>
            </div>
            <div className="hero-trust-row">
              <span className="hero-trust-item">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                End-to-end encrypted
              </span>
              <span className="hero-trust-item">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                Your data in your Drive
              </span>
              <span className="hero-trust-item">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                No ads, ever
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <HeroAppMock />
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <SectionEyebrow>Features</SectionEyebrow>
          <h2 className="landing-section-headline">
            Everything you need to keep showing up.
          </h2>
          <p className="landing-section-sub">
            Tools designed for the quiet, daily practice of journaling.
          </p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-card">
                <div className="feature-icon-wrapper">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-description">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why journal */}
      <section className="landing-section landing-section--soft">
        <div className="landing-container why-journal">
          <div className="why-journal-text">
            <SectionEyebrow>Why journal</SectionEyebrow>
            <h2 className="why-journal-headline">
              Your life,
              <br /> in your own words.
            </h2>
            <div className="why-journal-body">
              <p>
                Memory is unreliable. The day you fought with your best friend but made up over
                coffee. The morning your daughter said her first word. The quiet Tuesday you
                realized you were finally okay.
              </p>
              <p>
                Luminary gives you a way to hold onto these moments — the ordinary and the
                extraordinary — in a space that belongs only to you.
              </p>
            </div>
          </div>
          <div className="why-journal-visual">
            <WhyVisual />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-container">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="landing-section-headline">Three small steps.</h2>
          <p className="landing-section-sub">
            No setup wizards. No streak guilt. Just open and write.
          </p>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-section landing-section--soft" id="testimonials">
        <div className="landing-container">
          <SectionEyebrow>Reviews</SectionEyebrow>
          <h2 className="landing-section-headline">Loved by quiet thinkers.</h2>
          <p className="landing-section-sub">
            Honest words from people who use Luminary every day.
          </p>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <article key={i} className="testimonial-card">
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <img
                    src={getAvatarLibraryPublicUrl(t.avatar)}
                    alt={t.name}
                    width={38}
                    height={38}
                  />
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="landing-section">
        <div className="landing-container feedback-section">
          <div className="feedback-text">
            <SectionEyebrow>Get in touch</SectionEyebrow>
            <h2 className="landing-section-headline">We'd love to hear from you.</h2>
            <p className="landing-section-sub">
              Feedback, feature ideas, bug reports — all welcome. We read every message.
            </p>
          </div>
          <FeedbackForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section landing-section--soft" id="faq">
        <div className="landing-container">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="landing-section-headline">Common questions.</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta">
            <h2 className="landing-cta-headline">Start journaling today.</h2>
            <p className="landing-cta-sub">Free forever. Your data stays yours.</p>
            <Link to="/auth?mode=signup" className="landing-btn-primary landing-cta-btn">
              Create your account
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="section-eyebrow">{children}</div>;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{question}</span>
        {open ? (
          <Minus className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
}

function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/feedback", {
        name: name.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
      });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="feedback-form feedback-form--sent">
        <CheckCircle2 className="h-6 w-6 text-accent" strokeWidth={2} />
        <h3 className="feedback-success-title">Thanks!</h3>
        <p className="feedback-success-text">
          We'll read every word. Expect a reply if you left an email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="feedback-form">
      <input
        type="text"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        autoComplete="name"
        className="feedback-input"
      />
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        autoComplete="email"
        className="feedback-input"
      />
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your feedback, ideas, or bug reports…"
        rows={5}
        required
        className="feedback-textarea"
      />
      {error && <p className="feedback-error">{error}</p>}
      <button type="submit" disabled={loading} className="landing-btn-primary feedback-submit">
        {loading ? "Sending…" : "Send feedback"}
        <Send className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </form>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <div className="landing-footer-brand">
          <div className="landing-logo">
            <LandingLogoMark />
            <span>Luminary</span>
          </div>
          <p className="landing-footer-tagline">
            A private space to reflect, remember, and grow.
          </p>
          <div className="landing-footer-socials">
            <a href="#" aria-label="Twitter">
              <Twitter className="h-4 w-4" strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="Instagram">
              <Instagram className="h-4 w-4" strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="GitHub">
              <Github className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </div>
        </div>
        <div className="landing-footer-cols">
          <div>
            <h4 className="landing-footer-title">Product</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#">Changelog</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="landing-footer-title">Company</h4>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="mailto:hello@luminary.app">Contact</a>
              </li>
              <li>
                <a href="#">Feedback</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="landing-footer-title">Legal</h4>
            <ul>
              <li>
                <a href="#">Privacy</a>
              </li>
              <li>
                <a href="#">Terms</a>
              </li>
              <li>
                <a href="#">Data policy</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="landing-container landing-footer-bottom">
        <p>© {new Date().getFullYear()} Luminary</p>
        <p>
          <a href="mailto:hello@luminary.app">hello@luminary.app</a>
        </p>
      </div>
    </footer>
  );
}

function LandingLogoMark() {
  return (
    <span className="landing-logo-mark" aria-hidden>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" opacity="0.5" />
      </svg>
    </span>
  );
}

/** Stylized in-product mock — calendar grid with a day panel preview. */
function HeroAppMock() {
  const days = useMemo(() => {
    // 5 weeks × 7 days
    const arr: { day: number; type?: "audio" | "video" | "text"; mood?: 0 | 1 | 2 | 3 }[] = [];
    let n = 1;
    for (let i = 0; i < 35; i++) {
      arr.push({ day: n });
      n++;
      if (n > 31) n = 1;
    }
    // sprinkle in some entries / moods
    const seeds: Array<[number, "audio" | "video" | "text", 0 | 1 | 2 | 3]> = [
      [3, "text", 2],
      [6, "audio", 3],
      [8, "text", 1],
      [11, "video", 3],
      [12, "text", 2],
      [15, "audio", 2],
      [17, "text", 1],
      [20, "video", 3],
      [22, "text", 0],
      [24, "audio", 2],
      [26, "text", 3],
      [29, "audio", 3],
    ];
    for (const [i, type, mood] of seeds) {
      if (arr[i]) {
        arr[i].type = type;
        arr[i].mood = mood;
      }
    }
    return arr;
  }, []);

  return (
    <div className="hero-mock" aria-hidden>
      <div className="hero-mock-window">
        <div className="hero-mock-toolbar">
          <span className="hero-mock-dot" />
          <span className="hero-mock-dot" />
          <span className="hero-mock-dot" />
          <span className="hero-mock-title">April · My Journal</span>
        </div>
        <div className="hero-mock-body">
          <div className="hero-mock-cal">
            <div className="hero-mock-cal-header">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="hero-mock-cal-grid">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`hero-mock-day ${d.mood !== undefined ? `mood-${d.mood}` : ""} ${
                    d.day === 17 ? "is-today" : ""
                  }`}
                >
                  <span className="hero-mock-day-num">{d.day}</span>
                  {d.type && <span className={`hero-mock-pip pip-${d.type}`} />}
                </div>
              ))}
            </div>
          </div>
          <div className="hero-mock-side">
            <div className="hero-mock-side-eyebrow">Wednesday · Apr 17</div>
            <div className="hero-mock-side-title">A quiet morning</div>
            <div className="hero-mock-side-tag">Mood · Good</div>
            <p className="hero-mock-side-text">
              Made coffee. Watched the rain pick up against the kitchen window. Nothing
              dramatic — just one of those mornings I'd like to remember.
            </p>
            <div className="hero-mock-side-meta">
              <span className="hero-mock-pip pip-text" /> 230 words
              <span className="hero-mock-pip pip-audio" /> 0:42
            </div>
          </div>
        </div>
      </div>
      <div className="hero-mock-blob hero-mock-blob--1" />
      <div className="hero-mock-blob hero-mock-blob--2" />
    </div>
  );
}

function WhyVisual() {
  return (
    <div className="why-visual" aria-hidden>
      <svg viewBox="0 0 320 280" width="100%" height="100%">
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="240" cy="80" r="80" fill="url(#g1)" />
        <circle cx="80" cy="220" r="100" fill="url(#g1)" />
        <g stroke="var(--accent)" strokeWidth="1.2" opacity="0.6">
          <circle cx="160" cy="140" r="60" fill="none" />
          <circle cx="160" cy="140" r="100" fill="none" opacity="0.4" />
          <circle cx="160" cy="140" r="20" fill="var(--accent)" opacity="0.85" />
        </g>
        <g fill="var(--text-secondary)" fontFamily="Nunito, sans-serif" fontSize="10">
          <text x="20" y="40">apr 17 · "first warm day"</text>
          <text x="200" y="60">may 02 · "quiet morning"</text>
          <text x="40" y="240">jul 11 · "made it through"</text>
          <text x="190" y="260">aug 23 · "small joy"</text>
        </g>
      </svg>
    </div>
  );
}
