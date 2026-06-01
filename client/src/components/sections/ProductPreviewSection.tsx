import { useState, useEffect } from "react";
import {
  Smartphone,
  Monitor,
  Sparkles,
  Play,
  Calendar,
  Clock,
  Star,
  ChevronRight,
  TrendingUp,
  Users,
  Bell,
  Search,
  Heart,
  Bookmark,
  Zap,
  Scissors,
} from "lucide-react";

// ─── Tokens (aligned with GlowUp) ───────────────────────────────────────────

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
  blue: "#3B5BDB", // kept for UI elements
  blueLight: "#E7F0FF",
  blueMid: "#D0E1FF",
  green: "#1A5C38",
  greenBg: "#EAF6EF",
  greenBorder: "#85CCA8",
  red: "#DC2626",
  redBg: "#FEF1F1",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  purple: "#5A2E96",
  purpleBg: "#F3EEFE",
  purpleBorder: "#C4A2EC",
  shadow: "0 1px 2px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  shadowLg: "0 20px 60px rgba(26,23,20,0.12)",
};

// ─── Phone Frame ────────────────────────────────────────────────────────────

function PhoneFrame({
  children,
  width = 260,
  height = 440,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 36,
        background: "#FFFFFF",
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowLg,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: 28,
          background: "#FFFFFF",
          borderRadius: "0 0 18px 18px",
          zIndex: 20,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 60,
            height: 6,
            borderRadius: 3,
            background: T.border,
          }}
        />
      </div>

      <div
        style={{
          height: "100%",
          paddingTop: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: 4,
          borderRadius: 2,
          background: T.border,
        }}
      />
    </div>
  );
}

// ─── Client App Screen ─────────────────────────────────────────────────────

function ClientAppScreen() {
  const stylists = [
    {
      name: "Ama Beauty",
      service: "Volume blow-out",
      rating: "4.9",
      live: true,
      color: "#DC2626",
    },
    {
      name: "Kofi Cuts",
      service: "Signature fade",
      rating: "4.8",
      live: false,
      color: "#1A5C38",
    },
    {
      name: "Efia Braids",
      service: "Knotless braids",
      rating: "4.7",
      live: false,
      color: "#3B5BDB",
    },
  ];

  return (
    <PhoneFrame>
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 20px",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>
          9:41
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div
            style={{
              width: 16,
              height: 7,
              borderRadius: 2,
              border: `1px solid ${T.inkXLight}`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 4,
                borderRadius: 1,
                background: T.green,
                margin: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* App header */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: T.inkLight,
                fontWeight: 600,
              }}
            >
              Good morning
            </p>
            <p
              style={{
                margin: "1px 0 0",
                fontSize: 18,
                fontWeight: 800,
                color: T.ink,
                letterSpacing: "-0.02em",
              }}
            >
              GlowUp
            </p>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: T.muted,
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={14} color={T.inkMid} />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div
        style={{
          margin: "0 20px",
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: 12,
          background: T.muted,
          border: `1px solid ${T.borderLight}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Search size={13} color={T.inkLight} />
        <span style={{ fontSize: 12, color: T.inkXLight }}>
          Search stylists or services…
        </span>
      </div>

      {/* Live now strip */}
      <div style={{ padding: "0 20px", marginBottom: 14 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: T.inkLight,
          }}
        >
          Live now
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {["AB", "KC", "EB"].map((initials, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: i === 0 ? T.redBg : T.muted,
                  border:
                    i === 0 ? `2px solid ${T.red}` : `2px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: i === 0 ? T.red : T.inkLight,
                  marginBottom: 4,
                }}
              >
                {initials}
              </div>
              {i === 0 && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    color: T.red,
                    background: T.redBg,
                    padding: "1px 5px",
                    borderRadius: 100,
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stylist cards */}
      <div
        style={{
          flex: 1,
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflow: "hidden",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: T.inkLight,
            marginBottom: 2,
          }}
        >
          Recommended
        </p>

        {stylists.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              background: T.surface,
              border: `1px solid ${T.borderLight}`,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: s.live ? T.redBg : T.muted,
                border: `1px solid ${s.live ? T.red : T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.live && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: T.red,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              )}
              {!s.live && <Scissors size={13} color={T.inkLight} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.ink,
                  lineHeight: 1.2,
                }}
              >
                {s.name}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: T.inkLight }}>
                {s.service}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Star size={9} color="#D97706" fill="#D97706" />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.ink }}>
                {s.rating}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 20px 20px",
          borderTop: `1px solid ${T.borderLight}`,
          background: "#FFFFFF",
        }}
      >
        {["Home", "Explore", "Book", "Profile"].map((item, i) => (
          <div
            key={item}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: i === 0 ? T.blue : "transparent",
                marginBottom: 2,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: i === 0 ? 800 : 600,
                color: i === 0 ? T.blue : T.inkXLight,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ─── Stylist Dashboard Screen ───────────────────────────────────────────────

function DashboardScreen() {
  const [activeStat, setActiveStat] = useState(0);

  const stats = [
    {
      label: "Bookings",
      value: "12",
      change: "+3",
      color: T.blue,
      bg: T.blueLight,
    },
    {
      label: "Revenue",
      value: "$485",
      change: "+18%",
      color: T.green,
      bg: T.greenBg,
    },
    {
      label: "Queue",
      value: "3",
      change: "Live",
      color: T.purple,
      bg: T.purpleBg,
    },
    {
      label: "Rating",
      value: "4.9",
      change: "+0.1",
      color: T.amber,
      bg: T.amberBg,
    },
  ];

  const upcoming = [
    {
      name: "Ama O.",
      service: "Volume blow-out",
      time: "2:00 PM",
      status: "next",
    },
    {
      name: "Kwame T.",
      service: "Fade + line-up",
      time: "2:30 PM",
      status: "confirmed",
    },
    {
      name: "Efia B.",
      service: "Box braids",
      time: "3:15 PM",
      status: "confirmed",
    },
  ];

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: T.shadowLg,
        width: 420,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "16px 20px",
          background: T.muted,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: T.inkLight,
            }}
          >
            Dashboard
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 15,
              fontWeight: 800,
              color: T.ink,
            }}
          >
            Good afternoon, Kofi
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 100,
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: T.green,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: T.green,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: T.border,
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            onClick={() => setActiveStat(i)}
            style={{
              padding: "14px 12px",
              background: activeStat === i ? stat.bg : T.surface,
              textAlign: "center",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 900,
                color: T.ink,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                margin: "4px 0 2px",
                fontSize: 9,
                fontWeight: 700,
                color: T.inkLight,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {stat.label}
            </p>
            <span style={{ fontSize: 9, fontWeight: 700, color: stat.color }}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div style={{ padding: "16px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: T.inkLight,
            }}
          >
            Upcoming
          </p>
          <span style={{ fontSize: 10, color: T.blue, fontWeight: 700 }}>
            View all →
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcoming.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: item.status === "next" ? T.blueLight : T.muted,
                border: `1px solid ${item.status === "next" ? T.blueMid : T.borderLight}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.status === "next" ? T.blue : T.border,
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{ margin: "1px 0 0", fontSize: 10, color: T.inkLight }}
                >
                  {item.service}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  {item.time}
                </p>
                {item.status === "next" && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: T.blue,
                      background: T.blueMid,
                      padding: "1px 6px",
                      borderRadius: 100,
                    }}
                  >
                    NEXT
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings bar */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: `1px solid ${T.borderLight}`,
          background: T.muted,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: T.ink }}>
            Today's earnings
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: T.ink }}>
            $485.00
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(0,0,0,0.04)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "72%",
              background: `linear-gradient(90deg, ${T.blue}, ${T.green})`,
              borderRadius: 3,
              transition: "width 1s ease",
            }}
          />
        </div>
        <p style={{ margin: "5px 0 0", fontSize: 10, color: T.inkLight }}>
          72% of daily goal ($675)
        </p>
      </div>
    </div>
  );
}

// ─── Feature Callout ─────────────────────────────────────────────────────────

function FeatureCallout({
  icon: Icon,
  title,
  desc,
  color,
  bg,
}: {
  icon: typeof Smartphone;
  title: string;
  desc: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 16,
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 3px rgba(26,23,20,0.04)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: bg,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} strokeWidth={1.6} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink }}>
          {title}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 12,
            color: T.inkMid,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── View Toggle ─────────────────────────────────────────────────────────────

function ViewToggle({
  view,
  onChange,
}: {
  view: "client" | "stylist";
  onChange: (v: "client" | "stylist") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 14,
        background: T.muted,
        border: `1px solid ${T.border}`,
        alignSelf: "center",
      }}
    >
      {[
        { key: "client" as const, label: "Client App", icon: Smartphone },
        { key: "stylist" as const, label: "Stylist Dashboard", icon: Monitor },
      ].map(({ key, label, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: active
                ? `1px solid ${T.border}`
                : "1px solid transparent",
              background: active ? T.surface : "transparent",
              boxShadow: active ? "0 1px 3px rgba(26,23,20,0.06)" : "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: active ? T.ink : T.inkMid,
              transition: "all 0.18s ease",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductPreviewSection() {
  const [view, setView] = useState<"client" | "stylist">("client");
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
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.4); }
        }
        * { box-sizing: border-box; }
      `}</style>

      <section
        style={{
          padding: "clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)",
          background: T.bg,
          fontFamily:
            "-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
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
              Product
            </p>
            <h2
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
              Designed for{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.inkMid,
                }}
              >
                real
              </span>{" "}
              beauty experiences.
            </h2>
            <p
              style={{
                margin: "16px auto 0",
                fontSize: 17,
                color: T.inkMid,
                lineHeight: 1.7,
                maxWidth: 460,
              }}
            >
              From discovery to booking to payment — everything happens in
              seconds, not minutes.
            </p>
          </div>

          {/* View toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 48,
            }}
          >
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* CLIENT VIEW */}
          {view === "client" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
                gap: isMobile ? 32 : 48,
                alignItems: isMobile ? "center" : "start",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  position: isMobile ? "static" : "relative",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    transform: isMobile ? "none" : "rotate(-2deg)",
                  }}
                >
                  <ClientAppScreen />

                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -16,
                      padding: "6px 12px",
                      borderRadius: 12,
                      background: T.blueLight,
                      border: `1px solid ${T.blueMid}`,
                      boxShadow: T.shadow,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Zap size={11} color={T.blue} />
                    <span
                      style={{ fontSize: 10, fontWeight: 800, color: T.blue }}
                    >
                      1-tap booking
                    </span>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: 80,
                      left: -16,
                      padding: "6px 12px",
                      borderRadius: 12,
                      background: T.greenBg,
                      border: `1px solid ${T.greenBorder}`,
                      boxShadow: T.shadow,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Star size={10} color={T.green} fill={T.green} />
                    <span
                      style={{ fontSize: 10, fontWeight: 800, color: T.green }}
                    >
                      4.9 avg rating
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxWidth: 400,
                  marginLeft: isMobile ? 0 : "auto",
                }}
              >
                <FeatureCallout
                  icon={Sparkles}
                  title="AI Vibe Matching"
                  desc="Upload a photo or describe your style. Get matched with the perfect stylist in seconds."
                  color="#6366f1"
                  bg="#EEF2FF"
                />
                <FeatureCallout
                  icon={Calendar}
                  title="Instant Booking"
                  desc="See available slots in real time. Book with a single tap — no calls, no DMs."
                  color="#1A5C38"
                  bg="#EAF6EF"
                />
                <FeatureCallout
                  icon={Users}
                  title="Live Sessions"
                  desc="Watch transformations live before you book. See real work from real stylists."
                  color="#DC2626"
                  bg="#FEF1F1"
                />
                <FeatureCallout
                  icon={Heart}
                  title="Social Discovery"
                  desc="Browse a feed of real transformations. Save looks, follow stylists, book instantly."
                  color="#E11D48"
                  bg="#FFF1F2"
                />
                <FeatureCallout
                  icon={TrendingUp}
                  title="Glow Score Rewards"
                  desc="Earn points on every booking. Level up and unlock exclusive deals for loyal members."
                  color="#D97706"
                  bg="#FEF3C7"
                />
              </div>
            </div>
          )}

          {/* STYLIST VIEW */}
          {view === "stylist" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
              }}
            >
              <DashboardScreen />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 12,
                  width: "100%",
                  maxWidth: 720,
                }}
              >
                <FeatureCallout
                  icon={Users}
                  title="Smart Queue"
                  desc="AI manages your walk-in queue remotely. Clients see real-time wait estimates."
                  color="#3B5BDB"
                  bg="#E7F0FF"
                />
                <FeatureCallout
                  icon={TrendingUp}
                  title="Analytics"
                  desc="Track revenue, ratings, and booking trends. Data-driven growth tools."
                  color="#1A5C38"
                  bg="#EAF6EF"
                />
                <FeatureCallout
                  icon={Sparkles}
                  title="AI Boost"
                  desc="AI suggests pricing, promotes your best work, and fills empty slots automatically."
                  color="#5A2E96"
                  bg="#F3EEFE"
                />
              </div>
            </div>
          )}

          {/* Bottom stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
              marginTop: 64,
            }}
          >
            {[
              { value: "< 3s", label: "Avg. booking time" },
              { value: "89", label: "Verified stylists" },
              { value: "12K+", label: "Sessions completed" },
              { value: "4.9", label: "Platform rating" },
            ].map(({ value, label }) => (
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
        </div>
      </section>
    </>
  );
}
