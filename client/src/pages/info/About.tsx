import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Users, Calendar, MapPin, Award, Quote } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const STATS = [
  { value: "10K+", label: "Active Users", icon: Users },
  { value: "500+", label: "Stylists", icon: Award },
  { value: "25K+", label: "Bookings", icon: Calendar },
  { value: "12", label: "Cities", icon: MapPin },
];

const TEAM = [
  { name: "Kelvin Asante", role: "Founder & CEO", initials: "KA" },
  { name: "Abena Osei", role: "Head of Product", initials: "AO" },
  { name: "Kofi Mensah", role: "CTO", initials: "KM" },
  { name: "Nana Yaa", role: "Lead Designer", initials: "NY" },
  { name: "Esi Amoako", role: "Marketing Lead", initials: "EA" },
  { name: "Yaw Sarpong", role: "Operations", initials: "YS" },
];

const timeline = [
  { year: "2023", event: "GlowUp founded in Accra, Ghana" },
  { year: "2024", event: "Pilot launch with 50 stylists" },
  { year: "2024", event: "Reached 5,000 active users" },
  { year: "2025", event: "Launched Vibe Match AI & Live Sessions" },
  { year: "2025", event: "Expanded to 12 cities across Ghana" },
  { year: "2026", event: "10K+ users & 500+ stylists on platform" },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-neutral-950"
      >
      <LandingNavbar />

      <main className="pt-28 pb-24">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              About GlowUp
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              We're on a mission to{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                transform beauty
              </span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
              GlowUp connects people with top beauty professionals through live sessions, AI-powered matching, 
              and seamless booking. Founded in Accra, Ghana — built for Africa, designed for the world.
            </p>
          </FadeIn>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <FadeIn key={label}>
                <div className="relative group">
                  <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                    <Icon size={18} className="text-amber-400/70 mb-3" />
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    <p className="text-sm text-neutral-500">{label}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">Our Journey</h2>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />
            <div className="space-y-8">
              {timeline.map(({ year, event }, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <div className="relative pl-12">
                    <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-neutral-950" />
                    <span className="text-xs font-bold text-amber-400 tracking-wider">{year}</span>
                    <p className="text-sm text-neutral-300 mt-0.5">{event}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Meet the Team</h2>
            <p className="text-neutral-400 mb-10">The people building the future of beauty.</p>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TEAM.map(({ name, role, initials }) => (
              <FadeIn key={name}>
                <div className="group text-center p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3 ring-2 ring-white/[0.06] group-hover:ring-amber-500/30 transition-all duration-300">
                    <span className="text-sm font-bold text-neutral-950">{initials}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/10 p-10 sm:p-14 text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
              <Quote size={32} className="text-amber-500/20 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Want to be part of our story?</h2>
              <p className="text-neutral-400 mb-6 max-w-md mx-auto">We're always looking for talented people who believe in making beauty accessible to everyone.</p>
              <Link to="/careers" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/10">
                View Openings <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <AppFooter variant="landing" />
    </motion.div>
  );
}
