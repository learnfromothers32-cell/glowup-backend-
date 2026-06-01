import { useState } from "react";
import {
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Data ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Starter",
    icon: Zap,
    priceMonthly: "0",
    priceLabel: "Free forever",
    description: "Get on the platform and start accepting bookings today.",
    cta: "Start for free",
    ctaStyle: "secondary" as const,
    features: [
      "Standard listing in search",
      "Basic queue management",
      "In-app booking & payments",
      "Customer reviews",
      "Up to 30 bookings/month",
    ],
    limitations: [
      "No AI recommendations",
      "No live streaming",
      "No analytics dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Sparkles,
    priceMonthly: "9.99",
    priceLabel: "/month",
    description: "Premium tools to grow your client base and income.",
    cta: "Go Pro",
    ctaStyle: "primary" as const,
    badge: "Most popular",
    features: [
      "Everything in Starter",
      "AI stylist recommendations",
      "Advanced analytics dashboard",
      "Priority listing in search results",
      "Live stream access",
      "Unlimited bookings",
      "Custom booking page",
    ],
    limitations: [],
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    priceMonthly: "24.99",
    priceLabel: "/month",
    description: "Maximum exposure and zero commission for top performers.",
    cta: "Go Elite",
    ctaStyle: "primary" as const,
    features: [
      "Everything in Pro",
      "Zero commission up to $500/mo",
      "Featured on home screen",
      "Dedicated account manager",
      "Exclusive creator program",
      "Early access to new features",
      "Priority support (1hr response)",
      "Custom branding tools",
    ],
    limitations: [],
  },
] as const;

const COMPARISON_ROWS = [
  { feature: "Booking via the app", starter: true, pro: true, elite: true },
  { feature: "Customer reviews", starter: true, pro: true, elite: true },
  {
    feature: "Queue management",
    starter: "Basic",
    pro: "Smart",
    elite: "Smart",
  },
  { feature: "AI recommendations", starter: false, pro: true, elite: true },
  { feature: "Analytics dashboard", starter: false, pro: true, elite: true },
  { feature: "Live streaming", starter: false, pro: true, elite: true },
  { feature: "Search priority", starter: false, pro: "High", elite: "Highest" },
  { feature: "Commission", starter: "15%", pro: "10%", elite: "0% up to $500" },
  { feature: "Home screen feature", starter: false, pro: false, elite: true },
  { feature: "Dedicated support", starter: false, pro: false, elite: true },
];

// ─── Brand Tokens (aligned with GlowUp) ──────────────────────────────────────

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
  gold: "#C9A870",
  goldLight: "#FEF5E4",
  goldBorder: "#F2CC80",
  purple: "#8B5CF6",
  purpleLight: "#F3EEFE",
  purpleBorder: "#C4A2EC",
  amber: "#F59E0B",
  amberLight: "#FFFBEB",
  amberBorder: "#FDE68A",
  green: "#1A5C38",
  greenBg: "#EAF6EF",
  greenBorder: "#85CCA8",
  shadow: "0 1px 2px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.06)",
  shadowHover: "0 2px 4px rgba(26,23,20,0.04), 0 12px 32px rgba(26,23,20,0.08)",
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        justifyContent: "center",
        marginTop: 28,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: !annual ? T.ink : T.inkLight,
          transition: "color 0.2s",
        }}
      >
        Monthly
      </span>

      <button
        onClick={() => onChange(!annual)}
        style={{
          position: "relative",
          width: 48,
          height: 26,
          borderRadius: 13,
          background: annual ? T.gold : T.border,
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          padding: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: annual ? 25 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transition: "left 0.2s cubic-bezier(0.34,1.5,0.64,1)",
          }}
        />
      </button>

      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: annual ? T.ink : T.inkLight,
          transition: "color 0.2s",
        }}
      >
        Annual
      </span>

      {annual && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: T.green,
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            padding: "2px 8px",
            borderRadius: 100,
          }}
        >
          Save 20%
        </span>
      )}
    </div>
  );
}

// ─── Feature Check ────────────────────────────────────────────────────────────

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "3px 0",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: included ? T.greenBg : T.muted,
          border: `1px solid ${included ? T.greenBorder : T.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Check
          size={11}
          color={included ? T.green : T.inkXLight}
          strokeWidth={2.5}
        />
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: included ? T.ink : T.inkXLight,
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </li>
  );
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────

function PricingCard({
  plan,
  annual,
}: {
  plan: (typeof PLANS)[number];
  annual: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const Icon = plan.icon;
  const highlighted = plan.id === "pro";

  const monthlyPrice = parseFloat(plan.priceMonthly);
  const displayPrice = annual
    ? (monthlyPrice * 10 * 0.8).toFixed(2)
    : plan.priceMonthly;
  const periodLabel = annual ? "/month, billed annually" : plan.priceLabel;

  // Choose accent color based on plan
  const accentColor =
    plan.id === "pro" ? T.purple : plan.id === "elite" ? T.amber : T.gold;
  const accentLight =
    plan.id === "pro"
      ? T.purpleLight
      : plan.id === "elite"
        ? T.amberLight
        : T.goldLight;
  const accentBorder =
    plan.id === "pro"
      ? T.purpleBorder
      : plan.id === "elite"
        ? T.amberBorder
        : T.goldBorder;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: highlighted ? T.ink : T.surface,
        border: highlighted ? "none" : `1px solid ${T.border}`,
        borderRadius: 24,
        padding: highlighted ? "32px 28px 28px" : "28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered ? T.shadowHover : T.shadow,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Accent top bar for pro/elite */}
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accentColor}, ${plan.id === "elite" ? T.gold : accentColor})`,
          }}
        />
      )}

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: highlighted ? "rgba(255,255,255,0.1)" : accentLight,
              border: highlighted
                ? "1px solid rgba(255,255,255,0.12)"
                : `1px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              size={18}
              color={highlighted ? "#FFFFFF" : accentColor}
              strokeWidth={1.6}
            />
          </div>

          {plan.badge && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 100,
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}30`,
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: accentColor,
              }}
            >
              <Sparkles size={8} />
              {plan.badge}
            </span>
          )}
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: highlighted ? "#FFFFFF" : T.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {plan.name}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: "clamp(36px, 4vw, 44px)",
              fontWeight: 900,
              lineHeight: 1,
              color: highlighted ? "#FFFFFF" : T.ink,
              letterSpacing: "-0.04em",
            }}
          >
            {plan.priceMonthly === "0" ? "$0" : `$${displayPrice}`}
          </span>
          {plan.priceMonthly !== "0" && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: highlighted ? "rgba(255,255,255,0.5)" : T.inkLight,
              }}
            >
              {periodLabel}
            </span>
          )}
          {plan.priceMonthly === "0" && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: highlighted ? "rgba(255,255,255,0.5)" : T.inkLight,
                marginLeft: 4,
              }}
            >
              forever
            </span>
          )}
        </div>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14,
            lineHeight: 1.6,
            color: highlighted ? "rgba(255,255,255,0.6)" : T.inkMid,
          }}
        >
          {plan.description}
        </p>

        <div
          style={{
            height: 1,
            background: highlighted ? "rgba(255,255,255,0.08)" : T.borderLight,
            marginBottom: 20,
          }}
        />

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {plan.features.map((f) => (
            <li
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
                  background: highlighted ? "rgba(255,255,255,0.1)" : T.greenBg,
                  border: highlighted
                    ? "1px solid rgba(255,255,255,0.12)"
                    : `1px solid ${T.greenBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Check
                  size={11}
                  color={highlighted ? "#A78BFA" : T.green}
                  strokeWidth={2.5}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: highlighted ? "rgba(255,255,255,0.8)" : T.ink,
                  lineHeight: 1.5,
                }}
              >
                {f}
              </span>
            </li>
          ))}
        </ul>

        {plan.limitations.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {plan.limitations.map((l) => (
              <p
                key={l}
                style={{
                  margin: "0 0 4px",
                  paddingLeft: 30,
                  fontSize: 12,
                  color: highlighted ? "rgba(255,255,255,0.3)" : T.inkXLight,
                }}
              >
                ✗ {l}
              </p>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (plan.id === "free") {
            navigate("/signup");
          } else {
            navigate("/signup?plan=" + plan.id);
          }
        }}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 14,
          border: "none",
          marginTop: 24,
          background: highlighted ? "#FFFFFF" : T.ink,
          color: highlighted ? T.ink : "#FFFFFF",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
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
        {plan.cta}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Comparison Table (responsive) ───────────────────────────────────────────

function ComparisonTable() {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        overflowX: "auto",
        boxShadow: T.shadow,
        marginTop: 64,
      }}
    >
      <div
        style={{
          minWidth: 640, // ensures horizontal scroll on mobile
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 0,
            borderBottom: `1px solid ${T.border}`,
            background: T.muted,
          }}
        >
          <div style={{ padding: "16px 20px" }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 800,
                color: T.ink,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Compare plans
            </p>
          </div>
          {["Starter", "Pro", "Elite"].map((name) => (
            <div
              key={name}
              style={{
                padding: "16px 20px",
                textAlign: "center",
                borderLeft: `1px solid ${T.borderLight}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 800,
                  color: name === "Pro" ? T.purple : T.ink,
                }}
              >
                {name}
              </p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {COMPARISON_ROWS.map((row, i) => (
          <div
            key={row.feature}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 0,
              borderBottom:
                i < COMPARISON_ROWS.length - 1
                  ? `1px solid ${T.borderLight}`
                  : "none",
              background: i % 2 === 0 ? "transparent" : T.muted,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                fontSize: 13,
                fontWeight: 500,
                color: T.ink,
              }}
            >
              {row.feature}
            </div>

            {(["starter", "pro", "elite"] as const).map((tier) => {
              const val = row[tier];
              return (
                <div
                  key={tier}
                  style={{
                    padding: "14px 20px",
                    textAlign: "center",
                    borderLeft: `1px solid ${T.borderLight}`,
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      typeof val === "string"
                        ? T.inkMid
                        : val
                          ? T.green
                          : T.inkXLight,
                  }}
                >
                  {typeof val === "string" ? val : val ? "✓" : "—"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Can I switch plans at any time?",
      a: "Yes. Upgrade or downgrade anytime. Changes take effect immediately and we'll prorate the difference.",
    },
    {
      q: "Is there a contract or lock-in?",
      a: "No contracts. Cancel anytime. If you're on annual billing we'll refund the unused portion.",
    },
    {
      q: "What payment methods do you accept?",
      a: "All major credit cards, Apple Pay, Google Pay, and mobile money (MTN, Vodafone). Powered by Stripe.",
    },
    {
      q: "How does the zero commission on Elite work?",
      a: "On the Elite plan, your first $500 in monthly bookings are commission-free. After that, a reduced 5% rate applies.",
    },
  ];

  return (
    <div style={{ marginTop: 64 }}>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: T.inkLight,
          textAlign: "center",
        }}
      >
        Common questions
      </p>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${T.borderLight}`,
              }}
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                style={{
                  width: "100%",
                  padding: "18px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.ink,
                    lineHeight: 1.4,
                  }}
                >
                  {faq.q}
                </span>
                <HelpCircle
                  size={16}
                  color={T.inkXLight}
                  style={{
                    transform: open ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              </button>

              {open && (
                <p
                  style={{
                    margin: "0 0 18px",
                    fontSize: 14,
                    color: T.inkMid,
                    lineHeight: 1.7,
                    maxWidth: 520,
                  }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      style={{
        padding: "clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)",
        background: T.bg,
        fontFamily:
          "-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 0 }}>
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
            Pricing
          </p>
          <h2
            id="pricing-heading"
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900,
              color: T.ink,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Simple, transparent{" "}
            <span
              style={{ fontStyle: "italic", fontWeight: 400, color: T.inkMid }}
            >
              pricing.
            </span>
          </h2>
          <p
            style={{
              margin: "16px auto 0",
              fontSize: 17,
              color: T.inkMid,
              lineHeight: 1.7,
              maxWidth: 420,
            }}
          >
            Start for free. Upgrade as you grow. No surprises, no hidden fees.
          </p>

          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>

        {/* Pricing cards – responsive grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 48,
            alignItems: "start",
          }}
        >
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        {/* Trust row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {[
            "No credit card required",
            "Cancel anytime",
            "14-day Pro trial included",
          ].map((text) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={13} color={T.green} strokeWidth={2.5} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.inkLight,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <ComparisonTable />

        {/* FAQ */}
        <FAQ />
      </div>
    </section>
  );
}
