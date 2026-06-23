import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Sparkles, Download, Mail, Image, FileText, Palette } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const BRAND_COLORS = [
  { name: "Amber", hex: "#F59E0B" },
  { name: "Gold", hex: "#C9A96E" },
  { name: "Dark", hex: "#0A0A0A" },
  { name: "Light", hex: "#FAF8F4" },
  { name: "Neutral", hex: "#737373" },
];

const ASSETS = [
  { name: "GlowUp Logo (PNG)", desc: "Full-color logo, transparent background", size: "2.4 MB", icon: Image },
  { name: "GlowUp Logo (SVG)", desc: "Vector — for web and design tools", size: "48 KB", icon: Image },
  { name: "GlowUp Logo White", desc: "Single-color white, dark backgrounds", size: "1.8 MB", icon: Image },
  { name: "App Icon Pack", desc: "iOS & Android icons, all sizes", size: "1.2 MB", icon: Image },
  { name: "Brand Guidelines", desc: "Full PDF with usage rules & typography", size: "12 MB", icon: FileText },
  { name: "Product Screenshots", desc: "App screenshots for press and media", size: "8.5 MB", icon: Image },
  { name: "Font Files", desc: "Cormorant Garamond & DM Sans (OTF)", size: "3.2 MB", icon: Palette },
  { name: "Social Media Kit", desc: "Cover photos, profile pics & templates", size: "6.7 MB", icon: Image },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function PressKit() {
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
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              Press Kit
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Brand Assets</h1>
            <p className="text-lg text-neutral-400 max-w-xl mb-12">Download official GlowUp logos, brand guidelines, screenshots, and other media resources.</p>
          </FadeIn>

          {/* Brand Colors */}
          <FadeIn delay={0.1}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Palette size={14} className="text-brand-400" />
              Brand Colors
            </h2>
            <div className="flex flex-wrap gap-3 mb-14">
              {BRAND_COLORS.map(({ name, hex }) => (
                <div key={name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg border border-white/[0.1]" style={{ backgroundColor: hex }} />
                  <div>
                    <p className="text-xs font-medium text-white">{name}</p>
                    <p className="text-[10px] text-neutral-500">{hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Typography Preview */}
          <FadeIn delay={0.15}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={14} className="text-brand-400" />
              Typography
            </h2>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-14">
              <p className="text-3xl text-white mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Cormorant Garamond</p>
              <p className="text-xs text-neutral-500 mb-4">Headings — Regular, Semibold, Bold</p>
              <p className="text-base text-white mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>DM Sans</p>
              <p className="text-xs text-neutral-500">Body — Light, Regular, Medium, Semibold</p>
            </div>
          </FadeIn>

          {/* Assets Grid */}
          <FadeIn delay={0.2}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Download size={14} className="text-brand-400" />
              Download Assets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
              {ASSETS.map(({ name, desc, size, icon: Icon }) => (
                <button
                  key={name}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    <Icon size={16} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-neutral-500 truncate">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-neutral-600">{size}</span>
                    <Download size={14} className="text-neutral-500 group-hover:text-brand-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Press Contact */}
          <FadeIn>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-500/5 via-neutral-900 to-neutral-950 border border-brand-500/10">
              <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-brand-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">Press Inquiries</h3>
                  <p className="text-xs text-neutral-500 mb-2">For media requests, interviews, and brand partnerships.</p>
                  <a href="mailto:asantekelvin229@gmail.com" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    asantekelvin229@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
