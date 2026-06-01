import { useState, useEffect, useRef } from "react";
import {
  Star, TrendingUp, Users, Clock, Heart,
  Quote, ArrowLeft, ArrowRight, Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Data ────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Ama Koranteng",
    role: "Client",
    text: "I booked my stylist in under a minute. Watching them live made it so much easier to trust the process. The AI match was scary accurate.",
    avatar: "AK",
    rating: 5,
    location: "East Legon",
    service: "Volume blow-out",
  },
  {
    name: "Kofi Mensah",
    role: "Stylist",
    text: "GlowUp completely changed how I get clients. I go live and get booked instantly. My revenue went up 40% in the first month.",
    avatar: "KM",
    rating: 5,
    location: "Osu",
    service: "Barber",
  },
  {
    name: "Efia Asante",
    role: "Client",
    text: "The AI match is scary accurate. It found a stylist that matched my vibe perfectly. Best braids I've ever had — and I found them through a phone app.",
    avatar: "EA",
    rating: 5,
    location: "Cantonments",
    service: "Knotless braids",
  },
  {
    name: "Kwame Boateng",
    role: "Client",
    text: "I used to wait forever at the barbershop. Now I just check the queue, join remotely, and show up right on time. Game changer.",
    avatar: "KB",
    rating: 5,
    location: "Dansoman",
    service: "Signature fade",
  },
  {
    name: "Nana Ama Osei",
    role: "Stylist",
    text: "The analytics dashboard alone is worth the Pro plan. I can see which services are trending and adjust my pricing in real time.",
    avatar: "NO",
    rating: 5,
    location: "Airport",
    service: "Hair stylist",
  },
  {
    name: "Abena Darko",
    role: "Client",
    text: "I love the Glow Score rewards. I've already earned a free session just from bookings I was going to make anyway. It's a no-brainer.",
    avatar: "AD",
    rating: 5,
    location: "Labone",
    service: "Nail art",
  },
];

const STATS = [
  { value: "12,400+", label: "Bookings completed", icon: TrendingUp },
  { value: "350+", label: "Verified stylists", icon: Users },
  { value: "< 3s", label: "Avg. booking time", icon: Clock },
  { value: "4.93", label: "Platform rating", icon: Heart },
];

const PARTNERS = [
  "Beauty Inc.",
  "StyleHub",
  "Dapper",
  "GlowLab",
  "ManeSociety",
  "Tress Co.",
  "Curl Club",
  "Roots & Crowns",
];

const APP_STORE_RATINGS = [
  { store: "App Store", rating: "4.9", reviews: "2.1K" },
  { store: "Google Play", rating: "4.8", reviews: "1.8K" },
];

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
  green: "#1A5C38",
  greenBg: "#EAF6EF",
  greenBorder: "#85CCA8",
  amber: "#D97706",
  amberBg: "#FEF3C7",
  amberBorder: "#FDE68A",
  purple: "#5A2E96",
  purpleBg: "#F3EEFE",
  shadow: "0 1px 2px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  shadowHover: "0 2px 4px rgba(26,23,20,0.04), 0 8px 24px rgba(26,23,20,0.08)",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const PALETTES = [
  { bg: "#E7F0FF", fg: "#3B5BDB" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#EAF6EF", fg: "#1A5C38" },
  { bg: "#F3EEFE", fg: "#5A2E96" },
  { bg: "#FFF1F2", fg: "#E11D48" },
  { bg: "#FEF1F1", fg: "#DC2626" },
];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = PALETTES[name.charCodeAt(0) % PALETTES.length];
  const fontSize = Math.round(size * 0.34);

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: palette.bg, color: palette.fg,
      fontSize, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      border: "1.5px solid rgba(0,0,0,0.06)",
      letterSpacing: "-0.01em",
    }}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({
  testimonial,
  featured = false,
}: {
  testimonial: typeof TESTIMONIALS[number];
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isStylist = testimonial.role === "Stylist";
  const accentColor = isStylist ? T.purple : T.blue;
  const accentBg = isStylist ? T.purpleBg : T.blueLight;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? accentColor + "30" : T.border}`,
        borderRadius: 24,
        padding: featured ? "28px" : "24px",
        display: "flex", flexDirection: "column",
        boxShadow: hovered ? T.shadowHover : T.shadow,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        minHeight: featured ? 280 : 240,
      }}
    >
      {/* Top: stars + role badge */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16,
      }}>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={13}
              color={i < testimonial.rating ? T.amber : T.border}
              fill={i < testimonial.rating ? T.amber : "transparent"}
            />
          ))}
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 100,
          background: isStylist ? accentBg : T.greenBg,
          border: `1px solid ${isStylist ? accentColor + "30" : T.greenBorder}`,
          fontSize: 10, fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: isStylist ? accentColor : T.green,
        }}>
          {testimonial.role === "Stylist" ? "✂ Stylist" : "★ Client"}
        </span>
      </div>

      {/* Quote icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: accentBg,
        border: `1px solid ${accentColor}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <Quote size={13} color={accentColor} strokeWidth={2} />
      </div>

      {/* Quote text */}
      <p style={{
        margin: 0, flex: 1,
        fontSize: featured ? 16 : 14,
        fontWeight: 500, color: T.ink,
        lineHeight: 1.7, letterSpacing: "-0.01em",
      }}>
        "{testimonial.text}"
      </p>

      {/* Service tag */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 100,
        background: T.muted, border: `1px solid ${T.borderLight}`,
        marginTop: 14, alignSelf: "flex-start",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.inkLight,
        }}>
          {testimonial.service}
        </span>
      </div>

      {/* Divider */}
      <div style={{
        height: 1, background: T.borderLight, margin: "16px 0",
      }} />

      {/* User info */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Avatar name={testimonial.name} size={38} />
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 700, color: T.ink,
          }}>
            {testimonial.name}
          </p>
          <p style={{
            margin: "1px 0 0", fontSize: 12, color: T.inkLight,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {testimonial.role} · {testimonial.location}
          </p>
        </div>
        <CheckCircle2 size={16} color={T.green} />
      </div>
    </div>
  );
}

// ─── Stats Grid ───────────────────────────────────────────────────────────────

function StatsGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
    }}>
      {STATS.map(({ value, label, icon: Icon }) => (
        <div key={label} style={{
          padding: "24px 16px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          textAlign: "center" as const,
          boxShadow: T.shadow,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.blueLight,
            border: `1px solid ${T.blueMid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Icon size={16} color={T.blue} strokeWidth={1.6} />
          </div>
          <p style={{
            margin: 0,
            fontSize: "clamp(24px, 3.5vw, 36px)",
            fontWeight: 900, color: T.ink,
            letterSpacing: "-0.03em", lineHeight: 1,
          }}>
            {value}
          </p>
          <p style={{
            margin: "8px 0 0", fontSize: 11, fontWeight: 700,
            color: T.inkLight,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── App Store Badges ─────────────────────────────────────────────────────────

function AppStoreBadges() {
  return (
    <div style={{
      display: "flex", gap: 12,
      justifyContent: "center",
    }}>
      {APP_STORE_RATINGS.map(({ store, rating, reviews }) => (
        <div key={store} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 14,
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
        }}>
          <div style={{ display: "flex", gap: 1 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={11} color={T.amber} fill={T.amber} />
            ))}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.ink }}>
              {rating}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {store}
            </p>
            <p style={{ margin: "1px 0 0", fontSize: 10, color: T.inkXLight }}>
              {reviews} reviews
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Marquee Logos ────────────────────────────────────────────────────────────

function MarqueeLogos() {
  const repeated = [...PARTNERS, ...PARTNERS];

  return (
    <div style={{
      overflow: "hidden",
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      padding: "18px 0",
      background: T.muted,
      maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
    }}>
      <div style={{
        display: "flex", gap: 64, whiteSpace: "nowrap",
        animation: "scrollLogos 25s linear infinite",
      }}>
        {repeated.map((brand, i) => (
          <span key={i} style={{
            fontSize: 14, fontWeight: 700,
            color: T.inkXLight,
            letterSpacing: "0.02em",
            display: "flex", alignItems: "center", gap: 64,
          }}>
            {brand}
            <span style={{
              width: 4, height: 4, borderRadius: "50%",
              background: T.border,
              display: "inline-block", flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Carousel Controls ────────────────────────────────────────────────────────

function CarouselControls({
  onPrev,
  onNext,
  active,
  total,
}: {
  onPrev: () => void;
  onNext: () => void;
  active: number;
  total: number;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
    }}>
      {/* Prev */}
      <button
        onClick={onPrev}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: T.shadow,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = T.muted;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = T.surface;
        }}
      >
        <ArrowLeft size={16} color={T.inkMid} />
      </button>

      {/* Dots */}
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: i === active ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i === active ? T.ink : T.borderMed ?? T.border,
            transition: "all 0.3s cubic-bezier(0.34,1.5,0.64,1)",
          }} />
        ))}
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: T.shadow,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = T.muted;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = T.surface;
        }}
      >
        <ArrowRight size={16} color={T.inkMid} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialProofSection() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Show 3 cards per page on desktop, 1 on mobile
  const perPage = isMobile ? 1 : 3;
  const totalPages = Math.ceil(TESTIMONIALS.length / perPage);

  const prev = () => setActivePage(p => (p - 1 + totalPages) % totalPages);
  const next = () => setActivePage(p => (p + 1) % totalPages);

  const visible = TESTIMONIALS.slice(
    activePage * perPage,
    activePage * perPage + perPage
  );

  return (
    <>
      <style>{`
        @keyframes scrollLogos {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.4); }
        }
        * { box-sizing: border-box; }
      `}</style>

      <section
        aria-labelledby="proof-heading"
        style={{
          padding: "clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)",
          background: T.bg,
          fontFamily: "-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: T.inkLight,
              marginBottom: 14,
            }}>
              Trusted by thousands
            </p>
            <h2
              id="proof-heading"
              style={{
                margin: 0,
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900, color: T.ink,
                lineHeight: 1.1, letterSpacing: "-0.04em",
                maxWidth: 600,
                marginLeft: "auto", marginRight: "auto",
              }}
            >
              Loved by clients.{" "}
              <span style={{
                fontStyle: "italic", fontWeight: 400, color: T.inkMid,
              }}>
                Built for stylists.
              </span>
            </h2>
            <p style={{
              margin: "16px auto 0",
              fontSize: 17, color: T.inkMid,
              lineHeight: 1.7, maxWidth: 460,
            }}>
              Real experiences from people already using GlowUp to book, discover,
              and grow.
            </p>
          </div>

          {/* ── Stats ────────────────────────────────────────────── */}
          <StatsGrid />

          {/* ── Partner logos ────────────────────────────────────── */}
          <div style={{ marginTop: 48 }}>
            <p style={{
              textAlign: "center" as const,
              fontSize: 11, fontWeight: 700,
              color: T.inkXLight,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}>
              Partnered with leading beauty brands
            </p>
            <MarqueeLogos />
          </div>

          {/* ── App store ratings ────────────────────────────────── */}
          <div style={{
            marginTop: 40,
            display: "flex", justifyContent: "center",
          }}>
            <AppStoreBadges />
          </div>

          {/* ── Testimonials header ──────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 56, marginBottom: 24,
          }}>
            <div>
              <p style={{
                margin: 0, fontSize: 11, fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: T.inkLight,
              }}>
                What people say
              </p>
              <h3 style={{
                margin: "6px 0 0", fontSize: 24, fontWeight: 800,
                color: T.ink, letterSpacing: "-0.02em",
              }}>
                Real reviews from real users
              </h3>
            </div>

            {!isMobile && (
              <CarouselControls
                onPrev={prev}
                onNext={next}
                active={activePage}
                total={totalPages}
              />
            )}
          </div>

          {/* ── Testimonial cards ────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(3, 1fr)",
            gap: 16,
          }}>
            {visible.map((t, i) => (
              <TestimonialCard
                key={t.name}
                testimonial={t}
                featured={i === 1 && !isMobile}
              />
            ))}
          </div>

          {/* ── Mobile dots ──────────────────────────────────────── */}
          {isMobile && (
            <div style={{
              display: "flex", justifyContent: "center",
              gap: 6, marginTop: 20,
            }}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePage(i)}
                  style={{
                    width: i === activePage ? 20 : 6,
                    height: 6, borderRadius: 3,
                    background: i === activePage ? T.ink : T.border,
                    border: "none", cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s cubic-bezier(0.34,1.5,0.64,1)",
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Summary callout ──────────────────────────────────── */}
          <div style={{
            marginTop: 56,
            display: "flex", flexDirection: "column",
            alignItems: "center", textAlign: "center" as const,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: T.amberBg,
              border: `1px solid ${T.amberBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Sparkles size={22} color={T.amber} />
            </div>

            <p style={{
              margin: 0,
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 800, color: T.ink,
              lineHeight: 1.3,
              maxWidth: 500,
              letterSpacing: "-0.02em",
            }}>
              Join 350+ stylists and 12,000+ happy clients
            </p>
            <p style={{
              margin: "10px 0 0",
              fontSize: 15, color: T.inkMid,
              lineHeight: 1.7, maxWidth: 400,
            }}>
              Start for free. No credit card needed. Upgrade anytime.
            </p>

            <button
              onClick={() => navigate("/signup")}
              style={{
              marginTop: 24,
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 100,
              background: T.ink, color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 800,
              boxShadow: "0 4px 16px rgba(26,23,20,0.18)",
              transition: "transform 0.15s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              Get started free
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}