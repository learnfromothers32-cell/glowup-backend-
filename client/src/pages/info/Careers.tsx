import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, MapPin, Briefcase, Clock, Heart, Zap, Globe, Users } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const VALUES = [
  { icon: Heart, title: "Put Users First", desc: "Every decision starts with what's best for our community of stylists and clients." },
  { icon: Globe, title: "Build for Africa", desc: "We design solutions that work for the African context — reliable, accessible, and inclusive." },
  { icon: Zap, title: "Move Fast, Stay Quality", desc: "Speed without sacrificing craftsmanship. We ship often and ship well." },
  { icon: Users, title: "Be Inclusive", desc: "Beauty is for everyone — and so is our workplace. Diverse perspectives make us stronger." },
];

const ROLES = [
  { title: "Senior Full-Stack Engineer", dept: "Engineering", location: "Accra, Ghana", type: "Full-time" },
  { title: "Product Designer", dept: "Design", location: "Accra, Ghana", type: "Full-time" },
  { title: "Community Manager", dept: "Marketing", location: "Remote", type: "Full-time" },
  { title: "Mobile Engineer (React Native)", dept: "Engineering", location: "Accra, Ghana", type: "Full-time" },
  { title: "Customer Support Lead", dept: "Operations", location: "Remote", type: "Full-time" },
  { title: "Data Analyst", dept: "Data", location: "Accra, Ghana", type: "Full-time" },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Careers() {
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              Careers
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Join us in{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                transforming beauty
              </span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed mb-16">
              We're building the future of beauty services in Africa. If you're passionate about craftsmanship, 
              community, and innovation — we want to hear from you.
            </p>
          </FadeIn>

          {/* Values */}
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <Icon size={16} className="text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1.5">{title}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Perks */}
          <FadeIn>
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-amber-500/5 via-neutral-900 to-neutral-950 border border-amber-500/10 mb-20">
              <h2 className="text-xl font-bold text-white mb-6">Why join GlowUp?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                {["Competitive salary & equity", "Flexible remote-first culture", "Health & wellness benefits", "Annual learning budget", "Latest MacBook & gear", "Team retreats in Ghana"].map((perk) => (
                  <div key={perk} className="flex items-center gap-3 text-neutral-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Open Positions */}
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-2">Open Positions</h2>
            <p className="text-neutral-400 mb-8">6 roles available across engineering, design, marketing, and operations.</p>
          </FadeIn>

          <div className="space-y-3">
            {ROLES.map((role, i) => (
              <FadeIn key={role.title} delay={i * 0.05}>
                <button className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 hover:shadow-lg transition-all duration-300 text-left group">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">{role.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Briefcase size={11} />{role.dept}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{role.location}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{role.type}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 group-hover:gap-2 transition-all">
                    Apply Now <ArrowRight size={14} />
                  </span>
                </button>
              </FadeIn>
            ))}
          </div>

          {/* CTA */}
          <FadeIn>
            <div className="mt-16 p-8 sm:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <p className="text-white font-semibold mb-1">Don't see a role that fits?</p>
              <p className="text-sm text-neutral-500 mb-5">We're always open to connecting with talented people. Send us your portfolio or resume.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/10">
                Get in Touch <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
