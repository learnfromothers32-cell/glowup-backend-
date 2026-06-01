import { useState, useRef, useEffect } from "react";
import {
  Video,
  ListOrdered,
  Sparkles,
  Gamepad2,
  Zap,
  Bot,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "live",
    title: "Live Beauty Stream",
    shortTitle: "Live Stream",
    desc: "Watch real transformations happen live. See every cut, curl, and color as it happens — then book the stylist the moment you see a look you love.",
    benefit: "No more guessing. See the work before you commit.",
    icon: Video,
    stat: "12 watching now",
    statLabel: "Average viewers per session",
  },
  {
    id: "ai-match",
    title: "Vibe Match AI",
    shortTitle: "Vibe Match",
    desc: "Describe your mood, share a reference photo, or just drop an emoji. Our AI finds your perfect stylist match in under 5 seconds.",
    benefit: "Skip the scroll. Get matched instantly.",
    icon: Sparkles,
    stat: "5 sec",
    statLabel: "Average match time",
  },
  {
    id: "queue",
    title: "Smart Queue",
    shortTitle: "Smart Queue",
    desc: "Join a queue from your couch. Our AI predicts your wait down to the minute so you can plan your day without sitting in a waiting area.",
    benefit: "Your time is valuable. Don't waste it waiting.",
    icon: ListOrdered,
    stat: "18 min",
    statLabel: "Average wait saved per visit",
  },
  {
    id: "booking",
    title: "Micro-Slot Booking",
    shortTitle: "Micro-Slots",
    desc: "15-minute slots open in real time across hundreds of verified stylists near you. The best ones fill fast — grab yours before they're gone.",
    benefit: "More slots. More options. Less waiting.",
    icon: Zap,
    stat: "200+",
    statLabel: "Daily available slots",
  },
  {
    id: "agent",
    title: "AI Beauty Agent",
    shortTitle: "AI Agent",
    desc: "A personal AI that learns your style preferences, tracks your booking history, and can even book sessions on your behalf with your approval.",
    benefit: "It gets smarter every time you use it.",
    icon: Bot,
    stat: "12",
    statLabel: "Preferences learned per user",
  },
  {
    id: "trust",
    title: "Verified Trust",
    shortTitle: "Verified",
    desc: "Every stylist on GlowUp is ID-verified, reviewed by real clients, and fully insured. Pricing is transparent with zero hidden fees — ever.",
    benefit: "Book with confidence. Every single time.",
    icon: ShieldCheck,
    stat: "100%",
    statLabel: "Stylists verified",
  },
  {
    id: "social",
    title: "Social Beauty Graph",
    shortTitle: "Social Feed",
    desc: "A discovery feed of real transformations from real clients. Scroll trending looks, save your favorites, and book from any post with a single tap.",
    benefit: "Discover your next look. Not someone else's dream.",
    icon: TrendingUp,
    stat: "4.9★",
    statLabel: "Average stylist rating",
  },
  {
    id: "glow",
    title: "Glow Score",
    shortTitle: "Glow Score",
    desc: "Earn XP with every session. Level up through tiers, unlock exclusive deals, and access perks reserved only for GlowUp's most loyal members.",
    benefit: "The more you glow, the more you save.",
    icon: Gamepad2,
    stat: "2,340 XP",
    statLabel: "Average user balance",
  },
] as const;

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  muted: "#F5F3EE",
  border: "#E8E4DC",
  borderLight: "#F0ECE4",
  ink: "#1A1714",
  inkMid: "#5C554A",
  inkLight: "#8A7F72",
  inkXLight: "#B5AD9E",
  blue: "#3B5BDB",
  blueLight: "#E7F0FF",
  blueMid: "#D0E1FF",
  shadow: "0 1px 2px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  shadowHover: "0 2px 4px rgba(26,23,20,0.04), 0 8px 24px rgba(26,23,20,0.08)",
};

// ─── Pill Tab Selector ────────────────────────────────────────────────────────

function PillSelector({
  features,
  activeId,
  onChange,
}: {
  features: typeof FEATURES;
  activeId: string;
  onChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector(
      `[data-id="${activeId}"]`,
    ) as HTMLElement;
    if (!activeBtn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const offset =
      btnRect.left -
      containerRect.left -
      containerRect.width / 2 +
      btnRect.width / 2;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {features.map((f) => {
        const active = f.id === activeId;
        return (
          <button
            key={f.id}
            data-id={f.id}
            onClick={() => onChange(f.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 100,
              border: "none",
              background: active ? T.ink : T.muted,
              color: active ? "#FFFFFF" : T.inkMid,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            {f.shortTitle}
          </button>
        );
      })}
    </div>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup({ feature }: { feature: (typeof FEATURES)[number] }) {
  const Icon = feature.icon;

  const screens: Record<
    string,
    { header: string; items: { primary: string; secondary: string }[] }
  > = {
    live: {
      header: "Live Stream",
      items: [
        {
          primary: "● Ama Beauty Studio",
          secondary: "12 watching · Volume blow-out",
        },
        { primary: "━━━━━━━━━━━━━ 4:32", secondary: "Elapsed time" },
        { primary: "Book this session", secondary: "₵85 · 45 min" },
      ],
    },
    "ai-match": {
      header: "Vibe Match",
      items: [
        { primary: "“Chill vibes, soft curls”", secondary: "Your input" },
        { primary: "Understanding mood…", secondary: "✓ Matched" },
        {
          primary: "Best match: Kofi Cuts",
          secondary: "94% fit · 0.8 km away",
        },
      ],
    },
    queue: {
      header: "Smart Queue",
      items: [
        { primary: "Queue #2", secondary: "18 min estimated wait" },
        { primary: "━━━━━━━━━━░░░░░░", secondary: "45% through queue" },
        { primary: "Remotely joined", secondary: "Est. service: 2:48 PM" },
      ],
    },
    booking: {
      header: "Micro-Slots",
      items: [
        { primary: "Thu · Jan 16", secondary: "3 slots left" },
        { primary: "2:00 PM", secondary: "✓ Available" },
        { primary: "2:15 PM", secondary: "✓ Available" },
        { primary: "2:30 PM", secondary: "⚠ 1 spot left" },
      ],
    },
    agent: {
      header: "AI Agent",
      items: [
        { primary: "Learning your style…", secondary: "12 preferences saved" },
        { primary: "Next suggestion:", secondary: "Kofi Cuts · Sat 10 AM" },
        { primary: "Auto-book enabled", secondary: "You'll be notified first" },
      ],
    },
    trust: {
      header: "Verified",
      items: [
        { primary: "ID verified ✓", secondary: "Background checked" },
        { primary: "Insured ✓", secondary: "Full coverage" },
        { primary: "Secure payments", secondary: "Powered by Stripe" },
      ],
    },
    social: {
      header: "Feed",
      items: [
        { primary: "🔥 Knotless Braids", secondary: "+42 saves · Efia Studio" },
        { primary: "🌸 Soft Locs", secondary: "+38 saves · Ama Beauty" },
        { primary: "Discover more", secondary: "Tap to book any style →" },
      ],
    },
    glow: {
      header: "Glow Score",
      items: [
        { primary: "Level 7 · Glow Pro", secondary: "🌟 2,340 / 3,000 XP" },
        { primary: "━━━━━━━━░░░░", secondary: "78% to next level" },
        { primary: "Next reward:", secondary: "Free styling session" },
      ],
    },
  };

  const screen = screens[feature.id] ?? screens.live;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        height: "auto",
        aspectRatio: "260/420",
        borderRadius: 32,
        background: "#FFFFFF",
        border: `1px solid ${T.border}`,
        boxShadow:
          "0 20px 60px rgba(26,23,20,0.12), 0 0 0 1px rgba(0,0,0,0.03)",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      {/* Notch */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "10px 0 6px",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: T.border,
          }}
        />
      </div>

      {/* Screen content */}
      <div
        style={{
          padding: "8px 16px 16px",
          height: "calc(100% - 26px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: T.ink }}>
            9:41
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div
              style={{
                width: 16,
                height: 7,
                borderRadius: 2,
                border: `1px solid ${T.inkXLight}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 1,
                  left: 1,
                  width: 10,
                  height: 4,
                  borderRadius: 1,
                  background: T.blue,
                }}
              />
            </div>
          </div>
        </div>

        {/* App header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>
            GlowUp
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: T.blueLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={13} color={T.blue} strokeWidth={1.6} />
          </div>
        </div>

        {/* Screen label */}
        <div
          style={{
            padding: "5px 10px",
            borderRadius: 100,
            background: T.blueLight,
            border: `1px solid ${T.blueMid}`,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 14,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: T.blue,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: T.blue,
            }}
          >
            {screen.header}
          </span>
        </div>

        {/* Screen items */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >
          {screen.items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: i === 0 ? T.blueLight : T.muted,
                border: `1px solid ${i === 0 ? T.blueMid : T.borderLight}`,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.ink,
                  lineHeight: 1.3,
                }}
              >
                {item.primary}
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 10,
                  color: T.inkLight,
                }}
              >
                {item.secondary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Detail Panel (responsive) ───────────────────────────────────────

function FeatureDetail({
  feature,
  isMobile,
}: {
  feature: (typeof FEATURES)[number];
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 32 : 48,
        alignItems: "center",
      }}
    >
      {/* Left: text */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 900,
            color: T.ink,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          {feature.title}
        </h3>

        <p
          style={{
            margin: "20px 0 0",
            fontSize: 17,
            color: T.inkMid,
            lineHeight: 1.75,
            maxWidth: 480,
          }}
        >
          {feature.desc}
        </p>

        {/* Benefit callout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            padding: "16px 18px",
            borderRadius: 16,
            background: T.blueLight,
            border: `1px solid ${T.blueMid}`,
            maxWidth: 440,
          }}
        >
          <ArrowRight
            size={16}
            color={T.blue}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: T.ink,
              lineHeight: 1.6,
            }}
          >
            {feature.benefit}
          </p>
        </div>

        {/* Stat */}
        <div style={{ marginTop: 28 }}>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              color: T.ink,
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {feature.stat}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              fontWeight: 600,
              color: T.inkLight,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {feature.statLabel}
          </p>
        </div>
      </div>

      {/* Right: phone mockup */}
      <div style={{ flexShrink: 0 }}>
        <PhoneMockup feature={feature} />
      </div>
    </div>
  );
}

// ─── Compact Feature List (sidebar on desktop) ──────────────────────────────

function CompactList({
  features,
  activeId,
  onChange,
}: {
  features: typeof FEATURES;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {features.map((f) => {
        const active = f.id === activeId;
        const Icon = f.icon;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 14,
              border: active
                ? `1px solid ${T.blueMid}`
                : "1px solid transparent",
              background: active ? T.blueLight : "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: active ? T.blueMid : T.muted,
                border: `1px solid ${active ? T.blueMid : T.borderLight}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <Icon
                size={14}
                color={active ? T.blue : T.inkLight}
                strokeWidth={1.6}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: active ? T.ink : T.inkMid,
                transition: "color 0.2s ease",
              }}
            >
              {f.shortTitle}
            </span>
            {active && (
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: T.blue,
                  marginLeft: "auto",
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

// ─── Bottom Stats ─────────────────────────────────────────────────────────────

function StatsRow() {
  const stats = [
    { value: "89", label: "Stylists" },
    { value: "4.9", label: "Avg rating" },
    { value: "12K+", label: "Bookings" },
    { value: "3s", label: "AI match" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
        marginTop: 64,
      }}
    >
      {stats.map(({ value, label }) => (
        <div
          key={label}
          style={{
            padding: "20px 0",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 900,
              color: T.ink,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              fontWeight: 600,
              color: T.inkLight,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(FEATURES[0].id);
  const [isMobile, setIsMobile] = useState(false);
  const activeFeature = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      aria-labelledby="features-heading"
      style={{
        padding: "clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)",
        background: T.bg,
        fontFamily:
          "-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: T.inkLight,
              marginBottom: 14,
            }}
          >
            Platform
          </p>
          <h2
            id="features-heading"
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900,
              color: T.ink,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Everything you need,{" "}
            <span
              style={{ fontStyle: "italic", fontWeight: 400, color: T.inkMid }}
            >
              built in.
            </span>
          </h2>
          <p
            style={{
              margin: "16px auto 0",
              fontSize: 17,
              color: T.inkMid,
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            A full-stack platform connecting clients and stylists — from
            discovery to booking to payment.
          </p>
        </div>

        {/* ── Pill selector ────────────────────────────────────── */}
        <div
          style={{
            marginBottom: 40,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <PillSelector
            features={FEATURES}
            activeId={activeId}
            onChange={setActiveId}
          />
        </div>

        {/* ── Desktop: sidebar + detail ───────────────────────── */}
        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: 32,
            }}
          >
            <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
              <CompactList
                features={FEATURES}
                activeId={activeId}
                onChange={setActiveId}
              />
            </div>

            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 24,
                padding: "clamp(24px, 4vw, 40px)",
                boxShadow: T.shadow,
              }}
            >
              <FeatureDetail feature={activeFeature} isMobile={false} />
            </div>
          </div>
        )}

        {/* ── Mobile: just the detail card ────────────────────── */}
        {isMobile && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: T.shadow,
            }}
          >
            <FeatureDetail feature={activeFeature} isMobile={true} />
          </div>
        )}

        {/* ── Stats ────────────────────────────────────────────── */}
        <StatsRow />
      </div>
    </section>
  );
}
