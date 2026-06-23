import { useState, useEffect } from "react";
import {
  ArrowRight,
  Smartphone,
  Scissors,
  CheckCircle2,
  Apple,
  Play,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  bg: "var(--section-bg)",
  dark: "#1A1714",
  darkSurface: "#221F1B",
  darkBorder: "rgba(255,255,255,0.08)",
  surface: "var(--section-surface)",
  muted: "var(--section-muted)",
  border: "var(--section-border)",
  ink: "var(--section-ink)",
  inkMid: "var(--section-ink-mid)",
  inkLight: "var(--section-ink-light)",
  inkXLight: "var(--section-ink-xlight)",
  white: "#FFFFFF",
  whiteMid: "rgba(255,255,255,0.7)",
  whiteLight: "rgba(255,255,255,0.4)",
  brand: "#f43f5e",
  brandLight: "#fef1f4",
  brandMid: "#fecdd6",
  gold: "#d4a76a",
  goldLight: "#fffbeb",
  amber: "#d4a76a",
  shadow: "0 1px 2px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  shadowLg: "0 12px 32px rgba(26,23,20,0.10)",
};

// ─── App Store Badge ──────────────────────────────────────────────────────────

function StoreBadge({
  store,
  icon: Icon,
}: {
  store: string;
  icon: typeof Apple;
}) {
  const [hovered, setHovered] = useState(false);

  const appStoreUrl =
    store === "App Store"
      ? "https://apps.apple.com/app/glowup/id123456789"
      : "https://play.google.com/store/apps/details?id=com.glowup.app";

  return (
    <a
      href={appStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        borderRadius: 14,
        background: hovered
          ? "rgba(255,255,255,0.12)"
          : "rgba(255,255,255,0.06)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <Icon size={20} color={T.white} />
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 9,
            fontWeight: 500,
            color: T.whiteLight,
          }}
        >
          Download on the
        </p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.white }}>
          {store}
        </p>
      </div>
    </a>
  );
}

// ─── Path Card ────────────────────────────────────────────────────────────────

function PathCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  title,
  desc,
  features,
  ctaLabel,
  ctaIcon: CtaIcon,
  variant,
  isMobile,
}: {
  icon: typeof Smartphone;
  iconColor: string;
  iconBg: string;
  label: string;
  title: string;
  desc: string;
  features: string[];
  ctaLabel: string;
  ctaIcon: typeof ArrowRight;
  variant: "light" | "dark";
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const isDark = variant === "dark";

  const cardBg = isDark ? T.darkSurface : T.surface;
  const cardBorder = isDark ? T.darkBorder : T.border;
  const textColor = isDark ? T.white : T.ink;
  const textMid = isDark ? T.whiteMid : T.inkMid;
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : T.border;
  const checkBg = isDark ? "rgba(255,255,255,0.12)" : T.goldLight;
  const checkColor = isDark ? T.gold : T.gold;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 24,
        padding: isMobile ? "24px" : "clamp(28px, 4vw, 36px)",
        display: "flex",
        flexDirection: "column",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isDark
          ? "0 20px 40px rgba(0,0,0,0.3)"
          : hovered
            ? T.shadowLg
            : T.shadow,
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: iconBg,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Icon size={22} color={iconColor} strokeWidth={1.6} />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: iconColor,
          marginBottom: 8,
        }}
      >
        {label}
      </span>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: isMobile ? 22 : 26,
          fontWeight: 900,
          color: textColor,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </h3>

      {/* Desc */}
      <p
        style={{
          margin: "14px 0 0",
          fontSize: isMobile ? 14 : 15,
          color: textMid,
          lineHeight: 1.7,
        }}
      >
        {desc}
      </p>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: dividerColor,
          margin: "20px 0",
        }}
      />

      {/* Features */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        {features.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: checkBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "transparent"}`,
              }}
            >
              <CheckCircle2 size={11} color={checkColor} strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontSize: isMobile ? 13 : 14,
                fontWeight: 500,
                color: textMid,
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => {
          if (ctaLabel.includes("Download")) {
            navigate("/signup");
          } else if (ctaLabel.includes("Join")) {
            navigate("/signup");
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "15px",
          borderRadius: 14,
          border: "none",
          background: isDark ? T.white : T.ink,
          color: isDark ? T.ink : T.white,
          fontSize: isMobile ? 14 : 15,
          fontWeight: 800,
          cursor: "pointer",
          textDecoration: "none",
          marginTop: 24,
          transition: "transform 0.15s, opacity 0.15s",
          opacity: hovered ? 1 : 0.92,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {ctaLabel}
        <CtaIcon size={15} />
      </button>
    </div>
  );
}

// ─── Email Capture ────────────────────────────────────────────────────────────

function EmailCapture({ isMobile }: { isMobile: boolean }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "14px 24px",
          background: "rgba(212,167,106,0.15)",
          border: "1px solid rgba(253,230,138,0.3)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        <CheckCircle2 size={16} color="#fde68a" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fde68a" }}>
          You're on the list! We'll be in touch.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 8,
        maxWidth: 500,
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
        }}
      >
        <Mail
          size={15}
          color={focused ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            transition: "color 0.15s",
            pointerEvents: "none",
          }}
        />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "13px 14px 13px 40px",
            borderRadius: 14,
            border: `1.5px solid ${focused ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
            background: "rgba(255,255,255,0.06)",
            color: T.white,
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.18s, background 0.18s",
          }}
        />
      </div>
      <button
        onClick={() => {
          if (email.includes("@")) setSubmitted(true);
        }}
        style={{
          padding: "13px 22px",
          borderRadius: 14,
          background: T.white,
          color: T.dark,
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: "nowrap",
          transition: "transform 0.15s",
          width: isMobile ? "100%" : "auto",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        Get Early Access
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinalCTASection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>

      <section
        aria-labelledby="cta-heading"
        style={{
          padding: "clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)",
          background: T.dark,
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 56,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: T.whiteLight,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 1,
                  background: "rgba(255,255,255,0.15)",
                  display: "inline-block",
                }}
              />
              Get Started
              <span
                style={{
                  width: 24,
                  height: 1,
                  background: "rgba(255,255,255,0.15)",
                  display: "inline-block",
                }}
              />
            </p>
            <h2
              id="cta-heading"
              style={{
                margin: 0,
                fontSize: "clamp(36px, 5.5vw, 56px)",
                fontWeight: 900,
                color: T.white,
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                maxWidth: 620,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Start your beauty journey{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.whiteMid,
                }}
              >
                in seconds.
              </span>
            </h2>
            <p
              style={{
                margin: "18px auto 0",
                fontSize: 17,
                color: T.whiteMid,
                lineHeight: 1.7,
                maxWidth: 460,
              }}
            >
              Choose your path. Download the app or join as a stylist. Either
              way, you'll be set up in under 30 seconds.
            </p>
          </div>

          {/* Dual path cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
            }}
          >
            <PathCard
              icon={Smartphone}
              iconColor="#fde68a"
              iconBg="rgba(253,230,138,0.12)"
              label="For Clients"
              title="Book your next look"
              desc="Discover stylists, watch live sessions, and book in seconds."
              features={[
                "AI-matched stylist recommendations",
                "Watch live transformations",
                "1-tap booking & payments",
                "Earn Glow Score rewards",
              ]}
              ctaLabel="Download the App"
              ctaIcon={ArrowRight}
              variant="light"
              isMobile={isMobile}
            />

            <PathCard
              icon={Scissors}
              iconColor="#fecdd6"
              iconBg="rgba(254,205,214,0.12)"
              label="For Stylists"
              title="Grow your business"
              desc="Get booked, go live, and manage everything from one dashboard."
              features={[
                "AI-powered client matching",
                "Live streaming to attract clients",
                "Smart queue & booking management",
                "Analytics to grow your revenue",
              ]}
              ctaLabel="Join as a Stylist"
              ctaIcon={ArrowRight}
              variant="dark"
              isMobile={isMobile}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              margin: "56px 0 48px",
            }}
          />

          {/* Email capture + app store badges */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div style={{ textAlign: "center", width: "100%" }}>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.whiteMid,
                }}
              >
                Not ready yet? Get notified when we launch in your area.
              </p>
              <EmailCapture isMobile={isMobile} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <StoreBadge
                store="App Store"
                icon={Apple}
              />
              <StoreBadge store="Google Play" icon={Play} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                "No credit card required",
                "Free forever on Starter",
                "Cancel anytime",
              ].map((text) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CheckCircle2
                    size={12}
                    color="rgba(253,230,138,0.6)"
                    strokeWidth={2}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.whiteLight,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
