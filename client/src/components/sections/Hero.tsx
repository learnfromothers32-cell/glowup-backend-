import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Star,
  PlayCircle,
  ShieldCheck,
  Users,
  Scissors,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";

/* ─── Google Fonts ─── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ─── Animated Counter ─── */
function AnimatedCounter({
  target,
  duration = 2000,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let start: number | null = null;
    let raf: number;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, target, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Main Component ─── */
export default function Hero() {
  const navigate = useNavigate();
  const [activeSlot, setActiveSlot] = useState(0);
  const timeSlots = ["2:30 PM", "4:00 PM", "6:15 PM"];

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlot((prev) => (prev + 1) % timeSlots.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#FAF8F4] font-['DM_Sans',sans-serif] text-[#1C1510]">
      {/* ─── Background texture ─── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 79px,#E2DDD655 79px,#E2DDD655 80px)`,
        }}
      />

      {/* ─── Accent stripe ─── */}
      <div className="h-1 bg-gradient-to-r from-[#C4410C] via-[#E8651A] to-[#92400E]" />

      {/* ─── Main content grid ─── */}
      <div className="relative z-[5] mx-auto grid max-w-[1280px] grid-cols-1 gap-0 px-6 pt-12 pb-14 sm:px-9 sm:pt-14 sm:pb-16 lg:grid-cols-[1fr_1px_480px] lg:gap-x-[60px] lg:px-12 lg:pt-[72px] lg:pb-20 xl:gap-x-[60px]">
        {/* ═══ LEFT COLUMN ═══ */}
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {/* Category tag */}
          <motion.div variants={fadeUp} custom={0}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-[4px] border border-[#F5C4AE] bg-[#FBE9E2] px-3 py-[5px] sm:mb-8">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4410C]" />
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#C4410C]">
                AI beauty matching is now live
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={0.05}
            className="m-0 font-['Cormorant_Garant',serif] text-[clamp(2.2rem,9vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#1C1510] sm:text-[clamp(2.8rem,6vw,4rem)] lg:text-[clamp(3rem,5.5vw,5rem)]"
          >
            Where beauty
            <br />
            meets <em className="italic text-[#C4410C]">intelligence.</em>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            custom={0.1}
            className="mt-4 max-w-[480px] text-[15px] font-light leading-[1.7] text-[#7A7168] sm:mt-6 sm:text-[17px]"
          >
            Discover verified stylists, watch live beauty sessions, get
            AI-powered matches, and earn rewards — the premium platform for
            modern clients and professionals.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={fadeUp}
            custom={0.15}
            className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <button
              onClick={() => navigate("/signup")}
              className="group flex items-center justify-center gap-2 rounded-lg bg-[#1C1510] px-7 py-[14px] text-[15px] font-medium tracking-[-0.01em] text-[#FAF8F4] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_rgba(28,21,16,0.3)]"
            >
              Get started free
              <ArrowUpRight size={16} />
            </button>

            <button
              onClick={() => navigate("/stylist/signup")}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#E2DDD6] bg-white px-7 py-[14px] text-[15px] font-normal text-[#1C1510] transition-all duration-200 hover:border-[#C9C3BA] hover:bg-[#F5F2EE]"
            >
              <Scissors size={15} />
              I'm a stylist
            </button>
          </motion.div>

          {/* ─── Stats row ─── */}
          <motion.div
            variants={fadeUp}
            custom={0.2}
            className="mt-12 grid grid-cols-1 gap-6 border-t border-[#E2DDD6] pt-7 sm:mt-16 sm:grid-cols-3 sm:gap-0 sm:pt-9"
          >
            {[
              {
                value: "500+",
                label: "Verified stylists",
                sub: "Accra & beyond",
              },
              {
                value: "50K+",
                label: "Bookings completed",
                sub: "Since launch",
              },
              {
                value: "4.9",
                label: "Average rating",
                sub: "From 10K+ clients",
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`sm:pr-7 sm:mr-7 ${i < 2 ? "border-b pb-6 sm:border-b-0 sm:pb-0" : ""} ${i < 2 ? "sm:border-r" : ""} border-[#E2DDD6]`}
              >
                <p className="m-0 font-['Cormorant_Garant',serif] text-[30px] font-bold leading-none tracking-[-0.03em] text-[#1C1510] sm:text-[36px]">
                  {stat.value}
                </p>
                <p className="mb-[2px] mt-2 text-[13px] font-medium text-[#1C1510]">
                  {stat.label}
                </p>
                <p className="m-0 text-[12px] text-[#7A7168]">{stat.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* ─── Social proof ─── */}
          <motion.div
            variants={fadeUp}
            custom={0.25}
            className="mt-7 flex flex-wrap items-center gap-4 sm:mt-9"
          >
            <div className="flex">
              {["A", "N", "E", "K", "M"].map((letter, i) => (
                <div
                  key={i}
                  className="-ml-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#FAF8F4] text-[10px] font-semibold text-white sm:-ml-2.5 sm:h-[34px] sm:w-[34px] sm:text-[11px]"
                  style={{
                    background:
                      i % 3 === 0
                        ? "#C4410C"
                        : i % 3 === 1
                          ? "#92400E"
                          : "#8B5CF6",
                    zIndex: 5 - i,
                    position: "relative",
                    marginLeft: i === 0 ? 4 : undefined,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-[2px] flex items-center gap-[2px]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="#C4410C" color="#C4410C" />
                ))}
                <span className="ml-1.5 text-[13px] font-semibold text-[#1C1510]">
                  4.9
                </span>
              </div>
              <p className="m-0 text-[12px] text-[#7A7168]">
                Loved by 10K+ clients across Ghana
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Vertical divider (desktop only) ─── */}
        <div className="hidden w-px self-stretch bg-[#E2DDD6] lg:block" />

        {/* ═══ RIGHT COLUMN — Booking card ═══ */}
        {/* Mobile divider */}
        <motion.div
          className="mb-2 h-px w-full bg-[#E2DDD6] lg:hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Live indicator */}
          <span className="mb-5 inline-flex items-center gap-2 rounded-[4px] border border-[#BBF7D0] bg-[#DCFCE7] px-3 py-[5px]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#166534] shadow-[0_0_0_3px_#D1FAE5]" />
            <span className="text-[12px] font-medium tracking-[0.04em] text-[#166534]">
              47 stylists available now
            </span>
          </span>

          {/* Section label */}
          <p className="mb-[6px] text-[11px] font-medium uppercase tracking-[0.14em] text-[#7A7168]">
            AI-matched for you
          </p>
          <h3 className="mb-6 font-['Cormorant_Garant',serif] text-[22px] font-bold tracking-[-0.02em] text-[#1C1510] sm:text-[26px]">
            Find your perfect stylist
          </h3>

          {/* ─── Stylist card ─── */}
          <div className="overflow-hidden rounded-xl border border-[#E2DDD6] bg-white">
            {/* Profile section */}
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#C4410C] to-[#E8651A] text-[14px] font-bold text-white sm:h-[58px] sm:w-[58px] sm:text-[16px]">
                    AK
                  </div>
                  <div className="absolute -bottom-[3px] -right-[3px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#22C55E]">
                    <CheckCircle2 size={10} color="white" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#1C1510]">
                      Ama K.
                    </h4>
                    <Award size={15} color="#92400E" />
                  </div>
                  <p className="mb-2.5 text-[13px] leading-[1.4] text-[#7A7168]">
                    Bridal makeup · Braids · Natural glam
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Verified", icon: ShieldCheck },
                      { label: "120+ bookings", icon: TrendingUp },
                      { label: "4.9 ★", icon: Star },
                    ].map(({ label, icon: Ic }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 rounded-[4px] border border-[#E2DDD6] bg-[#F5F2EE] px-2 py-[3px] text-[11px] font-medium text-[#1C1510]"
                      >
                        <Ic size={10} color="#7A7168" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Booking row */}
              <div className="flex flex-col items-stretch gap-3 rounded-lg border border-[#E2DDD6] bg-[#F5F2EE] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-[14px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7]">
                    <Clock size={15} color="#166534" />
                  </div>
                  <div>
                    <p className="mb-1 text-[13px] font-semibold text-[#1C1510]">
                      Available today
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {timeSlots.map((slot, i) => (
                        <span
                          key={slot}
                          className={`rounded-[4px] px-2 py-[2px] text-[11px] font-medium transition-all duration-[400ms] ${
                            activeSlot === i
                              ? "border border-[#C4410C] bg-[#C4410C] text-white"
                              : "border border-[#E2DDD6] bg-white text-[#7A7168]"
                          }`}
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/signup")}
                  className="w-full shrink-0 rounded-[7px] bg-[#1C1510] px-5 py-3 text-[13px] font-medium tracking-[-0.01em] text-white transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(28,21,16,0.2)] sm:w-auto sm:py-2.5"
                >
                  Book now
                </button>
              </div>
            </div>

            {/* Feature row */}
            <div className="grid grid-cols-1 border-t border-[#E2DDD6] sm:grid-cols-2">
              {[
                {
                  icon: PlayCircle,
                  color: "#C4410C",
                  bg: "#FBE9E2",
                  title: "Live sessions",
                  desc: "Watch real-time tutorials from top stylists.",
                  num: "01",
                },
                {
                  icon: Users,
                  color: "#92400E",
                  bg: "#FEF3C7",
                  title: "Rewards & loyalty",
                  desc: "Earn points on every booking.",
                  num: "02",
                },
              ].map(({ icon: Icon, color, bg, title, desc, num }, i) => (
                <div
                  key={title}
                  className={`p-4 sm:p-5 ${i === 0 ? "border-b sm:border-b-0 sm:border-r" : ""} border-[#E2DDD6]`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg"
                      style={{ background: bg }}
                    >
                      <Icon size={17} color={color} />
                    </div>
                    <span className="font-['Cormorant_Garant',serif] text-[18px] font-semibold text-[#E2DDD6]">
                      {num}
                    </span>
                  </div>
                  <h4 className="mb-1 text-[14px] font-semibold text-[#1C1510]">
                    {title}
                  </h4>
                  <p className="m-0 text-[12px] leading-[1.5] text-[#7A7168]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Booking counter card ─── */}
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E2DDD6] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-5 sm:py-[18px]">
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#7A7168]">
                This week
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-['Cormorant_Garant',serif] text-[28px] font-bold leading-none tracking-[-0.03em] text-[#1C1510] sm:text-[32px]">
                  <AnimatedCounter target={2500} duration={2500} />+
                </span>
                <span className="text-[13px] text-[#7A7168]">bookings</span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="mb-1 inline-flex items-center gap-[5px] rounded-[4px] border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-1">
                <TrendingUp size={11} color="#166534" />
                <span className="text-[11px] font-semibold text-[#166534]">
                  +24%
                </span>
              </span>
              <p className="m-0 text-[11px] text-[#7A7168]">vs last week</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Brand bar ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-[5] flex flex-col gap-4 border-t border-[#E2DDD6] px-6 py-5 sm:px-9 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-7"
      >
        <p className="m-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-[#7A7168]">
          Trusted by leading beauty brands
        </p>
        <div className="flex flex-wrap items-center gap-5 sm:gap-7 lg:gap-10">
          {["L'Oréal", "MAC", "Fenty Beauty", "NARS", "Dyson Hair"].map(
            (brand) => (
              <span
                key={brand}
                className="whitespace-nowrap font-['DM_Sans',sans-serif] text-[12px] font-semibold tracking-[0.03em] text-[#C9C3BA] transition-colors duration-200 hover:text-[#1C1510] sm:text-[13px]"
              >
                {brand}
              </span>
            ),
          )}
        </div>
      </motion.div>

      {/* ─── Bottom spacer on mobile ─── */}
      <div className="h-8 sm:h-0" />
    </section>
  );
}
