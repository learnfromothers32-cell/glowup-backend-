import { useState } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Sparkles, Send, Check, Mail, Phone, MapPin, Clock } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const CONTACT_INFO = [
  { icon: Mail, label: "Email", value: "asantekelvin229@gmail.com", href: "mailto:asantekelvin229@gmail.com", desc: "We reply within 24 hours" },
  { icon: Phone, label: "Phone", value: "+233 538-281-749", href: "tel:+233538281749", desc: "Mon–Fri, 9AM–6PM GMT" },
  { icon: MapPin, label: "Location", value: "Accra, Ghana", desc: "Headquarters" },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

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
              Contact
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Get in Touch</h1>
            <p className="text-lg text-neutral-400 max-w-xl mb-12">Have a question, feedback, or partnership idea? We'd love to hear from you.</p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-10 lg:gap-16">
            {/* Contact Info Sidebar */}
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                {CONTACT_INFO.map(({ icon: Icon, label, value, href, desc }) => (
                  <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                        <Icon size={16} className="text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">{label}</p>
                        <p className="text-xs text-neutral-600">{desc}</p>
                      </div>
                    </div>
                    {href ? (
                      <a href={href} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-white">{value}</p>
                    )}
                  </div>
                ))}

                <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-500/5 via-neutral-900 to-neutral-950 border border-brand-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-brand-400" />
                    <p className="text-xs font-semibold text-white">Response times</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-neutral-500">
                    <p>General inquiries: within 24 hours</p>
                    <p>Technical support: within 2 hours</p>
                    <p>Press inquiries: within 48 hours</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn delay={0.15}>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-10 sm:p-16 rounded-2xl bg-brand-500/5 border border-brand-500/10 text-center h-full"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-5">
                    <Check size={24} className="text-brand-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Message sent!</h2>
                  <p className="text-sm text-neutral-400 max-w-xs">Thanks for reaching out. Our team will get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Full name</label>
                      <input type="text" required
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email address</label>
                      <input type="email" required
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/10 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Subject</label>
                    <select required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-neutral-400 focus:outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/10 transition-all"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Message</label>
                    <textarea rows={5} required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/10 transition-all resize-none" />
                  </div>
                  <button type="submit"
                    className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/10">
                    <Send size={14} />
                    Send Message
                  </button>
                </form>
              )}
            </FadeIn>
          </div>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
