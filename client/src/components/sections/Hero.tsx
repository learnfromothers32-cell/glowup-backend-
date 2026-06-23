import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowUpRight, Star, PlayCircle, ShieldCheck, Users, Scissors, CheckCircle2, Clock, Award, TrendingUp, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 900); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!ready) return;
    let start: number | null = null; let raf: number;
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
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Hero() {
  const navigate = useNavigate();
  const [activeSlot, setActiveSlot] = useState(0);
  const timeSlots = ["2:30 PM", "4:00 PM", "6:15 PM"];
  useEffect(() => { const id = setInterval(() => setActiveSlot((p) => (p + 1) % timeSlots.length), 2800); return () => clearInterval(id); }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-surface-secondary to-white dark:from-surface-dark dark:to-surface-dark-secondary">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, #f43f5e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #f43f5e 0%, transparent 50%)` }} />
      <div className="h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

      <div className="relative z-[5] mx-auto grid max-w-7xl grid-cols-1 gap-0 px-6 pt-12 pb-14 sm:px-9 sm:pt-14 sm:pb-16 lg:grid-cols-[1fr_1fr_480px] lg:gap-x-16 lg:px-12 lg:pt-[80px] lg:pb-20">
        {/* ═══ LEFT ═══ */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="lg:col-span-1">
          <motion.div variants={fadeUp} custom={0}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 dark:border-brand-800 dark:bg-brand-950/30 sm:mb-8">
              <Sparkles size={14} className="text-brand-500" />
              <span className="text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                AI beauty matching is now live
              </span>
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={0.05} className="text-display-sm sm:text-display-md lg:text-display-lg font-display text-text-primary dark:text-text-dark-primary">
            Where beauty
            <br />
            meets <span className="text-brand-500 italic">intelligence.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={0.1} className="mt-4 max-w-lg text-body text-text-secondary dark:text-text-dark-secondary sm:mt-6 sm:text-body">
            Discover verified stylists, watch live beauty sessions, get AI-powered matches, and earn rewards — the premium platform for modern clients and professionals.
          </motion.p>

          <motion.div variants={fadeUp} custom={0.15} className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <button onClick={() => navigate("/signup")} className="btn-primary btn-lg group">
              Get started free
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button onClick={() => navigate("/stylist/signup")} className="btn-secondary btn-lg">
              <Scissors size={15} />
              I'm a stylist
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} custom={0.2} className="mt-12 grid grid-cols-1 gap-6 border-t border-gray-200 dark:border-gray-700 pt-7 sm:mt-16 sm:grid-cols-3 sm:gap-0 sm:pt-9">
            {[
              { value: "500+", label: "Verified stylists", sub: "Accra & beyond" },
              { value: "50K+", label: "Bookings completed", sub: "Since launch" },
              { value: "4.9", label: "Average rating", sub: "From 10K+ clients" },
            ].map((stat, i) => (
              <div key={stat.label} className={`sm:pr-7 sm:mr-7 ${i < 2 ? "border-b pb-6 sm:border-b-0 sm:pb-0" : ""} ${i < 2 ? "sm:border-r" : ""} border-gray-200 dark:border-gray-700`}>
                <p className="text-display-sm font-display font-bold text-text-primary dark:text-text-dark-primary">{stat.value}</p>
                <p className="mt-2 text-body-sm font-medium text-text-primary dark:text-text-dark-primary">{stat.label}</p>
                <p className="text-caption text-text-muted">{stat.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} custom={0.25} className="mt-7 flex flex-wrap items-center gap-4 sm:mt-9">
            <div className="flex">
              {["A", "N", "E", "K", "M"].map((letter, i) => (
                <div key={i} className="-ml-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white dark:border-surface-dark text-[10px] font-semibold text-white sm:h-[34px] sm:w-[34px] sm:text-[11px]" style={{ background: i % 3 === 0 ? "#f43f5e" : i % 3 === 1 ? "#be123c" : "#d4a76a", zIndex: 5 - i, position: "relative", marginLeft: i === 0 ? 4 : undefined }}>
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-[2px] flex items-center gap-[2px]">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#f43f5e" color="#f43f5e" />)}
                <span className="ml-1.5 text-[13px] font-semibold text-text-primary dark:text-text-dark-primary">4.9</span>
              </div>
              <p className="text-caption text-text-muted">Loved by 10K+ clients across Ghana</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Spacer on mobile */}
        <div className="my-8 h-px w-full bg-gray-200 dark:bg-gray-700 lg:hidden" />

        {/* ═══ RIGHT — Booking card ═══ */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="lg:col-start-3">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
            <span className="text-xs font-semibold text-success-dark dark:text-success">47 stylists available now</span>
          </span>

          <p className="mb-[6px] text-label uppercase text-text-muted">AI-matched for you</p>
          <h3 className="mb-6 text-h2 font-display font-bold text-text-primary dark:text-text-dark-primary">Find your perfect stylist</h3>

          <div className="card overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-start gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white sm:h-[58px] sm:w-[58px] sm:text-base">AK</div>
                  <div className="absolute -bottom-[3px] -right-[3px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white dark:border-surface-dark bg-success text-white"><CheckCircle2 size={10} strokeWidth={2.5} /></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="text-body font-semibold text-text-primary dark:text-text-dark-primary">Ama K.</h4>
                    <Award size={15} className="text-gold-500" />
                  </div>
                  <p className="mb-2.5 text-body-sm text-text-secondary">Bridal makeup · Braids · Natural glam</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Verified", icon: ShieldCheck },
                      { label: "120+ bookings", icon: TrendingUp },
                      { label: "4.9 ★", icon: Star },
                    ].map(({ label, icon: Ic }) => (
                      <span key={label} className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary px-2 py-[3px] text-[11px] font-medium text-text-primary dark:text-text-dark-primary">
                        <Ic size={10} className="text-text-muted" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-[14px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-success/20"><Clock size={15} className="text-success-dark dark:text-success" /></div>
                  <div>
                    <p className="text-body-sm font-semibold text-text-primary dark:text-text-dark-primary">Available today</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {timeSlots.map((slot, i) => (
                        <span key={slot} className={`rounded-md px-2 py-[2px] text-[11px] font-medium transition-all duration-[400ms] ${activeSlot === i ? "bg-brand-500 text-white" : "border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-text-muted"}`}>
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate("/signup")} className="btn-primary btn-sm w-full sm:w-auto">Book now</button>
              </div>
            </div>

            <div className="grid grid-cols-1 border-t border-gray-100 dark:border-gray-700/50 sm:grid-cols-2">
              {[
                { icon: PlayCircle, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-950/20", title: "Live sessions", desc: "Watch real-time tutorials from top stylists.", num: "01" },
                { icon: Users, color: "text-gold-500", bg: "bg-gold-50 dark:bg-gold-900/20", title: "Rewards & loyalty", desc: "Earn points on every booking.", num: "02" },
              ].map(({ icon: Icon, color, bg, title, desc, num }, i) => (
                <div key={title} className={`p-4 sm:p-5 ${i === 0 ? "border-b sm:border-b-0 sm:border-r" : ""} border-gray-100 dark:border-gray-700/50`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg ${bg}`}><Icon size={17} className={color} /></div>
                    <span className="text-lg font-bold text-gray-300 dark:text-gray-600">{num}</span>
                  </div>
                  <h4 className="text-body-sm font-semibold text-text-primary dark:text-text-dark-primary">{title}</h4>
                  <p className="text-caption text-text-muted mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-[18px]">
            <div>
              <p className="text-label uppercase text-text-muted mb-1">This week</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-display-sm font-display font-bold text-text-primary dark:text-text-dark-primary"><AnimatedCounter target={2500} duration={2500} />+</span>
                <span className="text-body-sm text-text-muted">bookings</span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="inline-flex items-center gap-[5px] rounded-md border border-success/30 bg-success/10 px-2.5 py-1">
                <TrendingUp size={11} className="text-success-dark dark:text-success" />
                <span className="text-[11px] font-semibold text-success-dark dark:text-success">+24%</span>
              </span>
              <p className="text-caption text-text-muted mt-1">vs last week</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Brand bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="relative z-[5] flex flex-col gap-4 border-t border-gray-200 dark:border-gray-700 px-6 py-5 sm:px-9 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-7">
        <p className="text-label uppercase text-text-muted">Trusted by leading beauty brands</p>
        <div className="flex flex-wrap items-center gap-5 sm:gap-7 lg:gap-10">
          {["L'Oréal", "MAC", "Fenty Beauty", "NARS", "Dyson Hair"].map((brand) => (
            <span key={brand} className="text-body-sm font-semibold tracking-wider text-gray-400 dark:text-gray-500 transition-colors hover:text-text-primary dark:hover:text-text-dark-primary">
              {brand}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
