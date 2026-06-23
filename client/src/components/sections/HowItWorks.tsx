import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Play,
  Gift,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

// ─── Step Data ────────────────────────────────────────────────────────────────

const steps = [
  {
    id: 1,
    icon: Sparkles,
    label: "Step 1",
    title: "Choose your vibe",
    heading: "Tell us your style",
    desc: "Pick from curated styles or describe your mood — our AI understands instantly and narrows down the perfect match.",
    points: [
      "Choose by style, mood, or emoji",
      "Personalized to your hair type",
      "Takes less than 10 seconds",
    ],
    image: "/v.avif",
    accent: "#C9A870", // gold
    accentBg: "#FEF5E4",
  },
  {
    id: 2,
    icon: Zap,
    label: "Step 2",
    title: "AI matching",
    heading: "Get matched instantly",
    desc: "Our engine scans ratings, distance, and availability to surface top-rated stylists near you — in real time.",
    points: [
      "Smart style-to-stylist matching",
      "Pricing & reviews upfront",
      "Only verified professionals",
    ],
    image: "/ai.jpg",
    accent: "#e11d48", // brand-600
    accentBg: "#fef1f4",
  },
  {
    id: 3,
    icon: Play,
    label: "Step 3",
    title: "Watch or book",
    heading: "See it live, then decide",
    desc: "Browse live transformations happening right now, compare results, and book your session with a single tap.",
    points: [
      "Watch live makeover sessions",
      "Compare before & after styles",
      "1-tap instant booking",
    ],
    image: "/b.jpg",
    accent: "#fb7188", // brand-400
    accentBg: "#ffe4e8",
  },
  {
    id: 4,
    icon: Gift,
    label: "Step 4",
    title: "Glow up & earn",
    heading: "Look great, earn rewards",
    desc: "Walk out looking incredible and automatically earn loyalty points redeemable for discounts on future bookings.",
    points: [
      "Points on every booking",
      "Unlock exclusive deals",
      "Get smarter recommendations",
    ],
    image: "/earn.png",
    accent: "#d4a76a", // gold-500
    accentBg: "#fffbeb",
  },
];

// ─── Design Tokens – using CSS variables for dark mode support ────────────────

const T = {
  bg: "var(--section-bg)",
  card: "var(--section-surface)",
  cardSubtle: "#FDFCFA",
  border: "var(--section-border)",
  borderMed: "var(--section-border)",
  ink: "var(--section-ink)",
  inkMid: "var(--section-ink-mid)",
  inkLight: "var(--section-ink-light)",
  inkXLight: "var(--section-ink-xlight)",
  shadowSm: "0 1px 3px rgba(24,21,15,0.06), 0 1px 2px rgba(24,21,15,0.04)",
  shadowMd: "0 4px 12px rgba(24,21,15,0.08), 0 2px 4px rgba(24,21,15,0.04)",
  shadowLg: "0 12px 32px rgba(24,21,15,0.10), 0 4px 12px rgba(24,21,15,0.06)",
  shadowXl: "0 24px 48px rgba(24,21,15,0.12), 0 8px 24px rgba(24,21,15,0.08)",
};

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgress({ total, active }: { total: number; active: number }) {
  const step = steps[active];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        maxWidth: 360,
      }}
    >  
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i <= active ? step.accent : T.border,
            transition: "background 0.4s ease",
          }}
        />
      ))}
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.inkLight,
          marginLeft: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {active + 1}/{total}
      </span>
    </div>
  );
}

// ─── Step Nav (Desktop vertical, Mobile horizontal scroll) ────────────────────

function StepNav({
  steps: s,
  active,
  onChange,
}: {
  steps: typeof steps;
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: 4,
      }}
    >
      {s.map((step, i) => {
        const on = i === active;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => onChange(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 16,
              border: on
                ? `1.5px solid ${step.accent}40`
                : "1.5px solid transparent",
              background: on ? step.accentBg : "transparent",
              cursor: "pointer",
              textAlign: "left" as const,
              transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
              transform: on ? "translateX(4px)" : "translateX(0)",
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: on ? step.accent : T.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.3s ease",
                boxShadow: on ? `0 4px 12px ${step.accent}30` : "none",
              }}
            >
              <Icon
                size={18}
                color={on ? "#FFFFFF" : T.inkLight}
                style={{ transition: "color 0.2s" }}
              />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  color: on ? step.accent : T.inkXLight,
                  transition: "color 0.2s",
                }}
              >
                {step.label}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 14,
                  fontWeight: 800,
                  color: on ? T.ink : T.inkMid,
                  transition: "color 0.2s",
                }}
              >
                {step.title}
              </p>
            </div>

            {/* Active indicator */}
            {on && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: step.accent,
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step Mobile Chips (horizontal scroll) ────────────────────────────────────

function StepChips({
  steps: s,
  active,
  onChange,
}: {
  steps: typeof steps;
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch" as any,
      }}
    >
      {s.map((step, i) => {
        const on = i === active;
        return (
          <button
            key={step.id}
            onClick={() => onChange(i)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 100,
              border: on
                ? `1.5px solid ${step.accent}`
                : `1px solid ${T.border}`,
              background: on ? step.accentBg : T.card,
              color: on ? step.accent : T.inkMid,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              boxShadow: on ? `0 0 0 3px ${step.accent}18` : T.shadowSm,
              transition: "all 0.18s ease",
            }}
          >
            <step.icon size={13} />
            {step.title}
          </button>
        );
      })}
    </div>
  );
}

// ─── Content Panel ────────────────────────────────────────────────────────────

function ContentPanel({ step }: { step: (typeof steps)[number] }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 440 }}
      >
        {/* Step label */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 100,
            background: step.accentBg,
            border: `1px solid ${step.accent}20`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: step.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <step.icon size={11} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
              color: step.accent,
            }}
          >
            {step.label}
          </span>
        </div>

        {/* Heading */}
        <h3
          style={{
            margin: 0,
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 900,
            color: T.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}
        >
          {step.heading}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 16,
            color: T.inkMid,
            lineHeight: 1.7,
          }}
        >
          {step.desc}
        </p>

        {/* Points */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column" as const,
            gap: 12,
          }}
        >
          {step.points.map((point, i) => (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                opacity: 0,
                animation: "fadeUp 0.4s ease forwards",
                animationDelay: `${0.1 + i * 0.08}s`,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: step.accentBg,
                  border: `1px solid ${step.accent}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <CheckCircle2 size={12} color={step.accent} />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.ink,
                  lineHeight: 1.5,
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Image Panel ──────────────────────────────────────────────────────────────

function ImagePanel({ step }: { step: (typeof steps)[number] }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.image}
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -16 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          maxHeight: 560,
          borderRadius: 24,
          overflow: "hidden",
          background: T.border,
          boxShadow: T.shadowXl,
          border: `1px solid ${T.borderMed}`,
        }}
      >
        {/* Accent border glow */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: 25,
            border: `2px solid ${step.accent}30`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {!imgErr ? (
          <img
            src={step.image}
            alt={`${step.title} — GlowUp step illustration`}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              background: step.accentBg,
              gap: 12,
            }}
          >
            <step.icon size={48} color={step.accent} style={{ opacity: 0.4 }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: step.accent,
                opacity: 0.5,
              }}
            >
              Step {step.id}
            </span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: `linear-gradient(to top, ${step.accent}15, transparent)`,
            pointerEvents: "none",
          }}
        />

        {/* Step badge overlay */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "6px 12px",
            borderRadius: 100,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: step.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <step.icon size={10} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: T.ink,
              letterSpacing: "0.03em",
            }}
          >
            {step.title}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowItWorks() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = steps[active];

  // Auto-play (pauses on hover/touch)
  useEffect(() => {
    if (!autoPlay) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay]);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        button:focus-visible {
          outline: 2px solid ${step.accent};
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .how-steps * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <section
        style={{
          padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px)",
          background: T.bg,
          overflow: "hidden",
        }}
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
        onTouchStart={() => setAutoPlay(false)}
        onTouchEnd={() => setAutoPlay(true)}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* ── Header ──────────────────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                color: T.inkLight,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(28px, 5vw, 44px)",
                fontWeight: 900,
                color: T.ink,
                lineHeight: 1.15,
                letterSpacing: "-0.035em",
                maxWidth: 520,
              }}
            >
              From vibe to booking — instantly
            </h2>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 17,
                color: T.inkMid,
                lineHeight: 1.6,
                maxWidth: 440,
              }}
            >
              GlowUp connects you to the right stylist in seconds using AI.
            </p>

            {/* Progress bar + step counter */}
            <div style={{ marginTop: 24 }}>
              <StepProgress total={steps.length} active={active} />
            </div>
          </div>

          {/* ── Mobile chips (hidden on lg) ─────────────────────────── */}
          <div className="mobile-only" style={{ marginBottom: 20 }}>
            <StepChips steps={steps} active={active} onChange={setActive} />
          </div>

          {/* ── Main layout ─────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Desktop step nav */}
            <div className="desktop-only">
              <StepNav steps={steps} active={active} onChange={setActive} />

              {/* Auto-play indicator */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: autoPlay ? `${step.accent}08` : T.bg,
                  border: `1px solid ${autoPlay ? step.accent + "15" : T.border}`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: autoPlay ? step.accent : T.inkXLight,
                    animation: autoPlay
                      ? "pulse 2s ease-in-out infinite"
                      : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: autoPlay ? T.inkMid : T.inkLight,
                  }}
                >
                  {autoPlay ? "Auto-playing" : "Paused"}
                </span>
              </div>
            </div>

            {/* Right side: content + image */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
                alignItems: "center",
              }}
            >
              <ContentPanel step={step} />
              <ImagePanel step={step} />
            </div>
          </div>

          {/* ── Mobile layout (stacked) ─────────────────────────────── */}
          <div className="mobile-layout">
            <ImagePanel step={step} />
            <div style={{ marginTop: 28 }}>
              <ContentPanel step={step} />
            </div>
          </div>

          {/* ── Bottom dots ─────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 40,
            }}
          >
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === active ? s.accent : T.borderMed,
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.35s cubic-bezier(0.34,1.5,0.64,1)",
                }}
              />
            ))}
          </div>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 28,
            }}
          >
            <button
              onClick={() => {
                navigate("/signup");
              }}
              className="how-cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 100,
                background: T.ink,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 800,
                boxShadow: T.shadowLg,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1)";
              }}
            >
              Get started free
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Responsive + dark mode media query styles ─────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.4); }
        }

        .mobile-only { display: none; }
        .mobile-layout { display: none; }
        .desktop-only { display: block; }

        @media (max-width: 960px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          .mobile-layout { display: block !important; }
        }

        @media (max-width: 960px) {
          [style*="grid-template-columns: 280px 1fr"] {
            display: none !important;
          }
        }

        .dark .how-cta-btn {
          background: #09090b !important;
        }
      `}</style>
    </>
  );
}
