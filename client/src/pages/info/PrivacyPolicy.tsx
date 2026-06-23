import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Shield, Mail } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const SECTIONS = [
  { id: "collect", title: "1. Information We Collect" },
  { id: "use", title: "2. How We Use Your Information" },
  { id: "share", title: "3. Data Sharing" },
  { id: "security", title: "4. Data Security" },
  { id: "rights", title: "5. Your Rights" },
  { id: "cookies", title: "6. Cookies" },
  { id: "contact", title: "7. Contact" },
];

const CONTENT: Record<string, string> = {
  collect: "We collect information you provide when creating an account, making a booking, or contacting support. This includes your name, email address, phone number, payment details, and profile photos. We also collect usage data such as pages visited, features used, session duration, and device information to improve our service. Stylists additionally provide portfolio images, certifications, and service descriptions.",
  use: "Your information is used to provide and improve our services, process bookings and payments, send appointment reminders and notifications, personalize your experience with AI recommendations, and communicate important updates. We may use aggregated, anonymized data for analytics, product development, and marketing. We never use your personal data for purposes you haven't consented to.",
  share: "We do not sell your personal data. We may share information with trusted third parties who assist in operating our platform — including payment processors (Paystack, PayPal), cloud hosting providers, and analytics services — under strict confidentiality agreements. Stylists receive only the information needed to fulfill your booking (name, phone, appointment details). We may disclose information if required by law.",
  security: "We implement industry-standard security measures including TLS 1.3 encryption for all data in transit, AES-256 encryption for data at rest, regular security audits, and strict access controls. Our infrastructure is monitored 24/7 for threats. However, no method of transmission over the Internet is 100% secure. We strongly recommend using strong passwords and enabling two-factor authentication.",
  rights: "You have the right to access, correct, or delete your personal data at any time. You can manage most data in your account settings. You may also request a copy of your data, withdraw consent for marketing communications, or request account deletion. To exercise these rights, contact our Data Protection Officer. We will respond within 30 days.",
  cookies: "We use essential cookies for authentication and security, functional cookies to remember your preferences, analytics cookies (via Google Analytics) to understand usage patterns, and advertising cookies to deliver relevant content. You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality.",
  contact: "For privacy-related inquiries, data access requests, or to report a concern, contact our Data Protection Officer at asantekelvin229@gmail.com. We're committed to resolving any privacy concerns promptly and transparently.",
};

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

export default function PrivacyPolicy() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium tracking-wide mb-6 w-fit">
              <Shield size={12} />
              Privacy Policy
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Privacy Policy</h1>
            <p className="text-neutral-400 mb-2">Last updated: January 1, 2026</p>
            <p className="text-sm text-neutral-500 mb-12">This policy describes how GlowUp Technologies Ltd. collects, uses, and protects your personal data.</p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
            {/* TOC */}
            <FadeIn delay={0.1}>
              <nav className="lg:sticky lg:top-28 lg:self-start space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3">On this page</p>
                {SECTIONS.map(({ id, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`block text-xs py-1.5 px-3 rounded-lg transition-all ${
                      active === id
                        ? "text-brand-400 bg-brand-500/10"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {title}
                  </a>
                ))}
              </nav>
            </FadeIn>

            {/* Content */}
            <div className="space-y-12">
              {SECTIONS.map(({ id, title }, i) => (
                <FadeIn key={id} delay={i * 0.05}>
                  <section id={id}>
                    <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">{CONTENT[id]}</p>
                  </section>
                </FadeIn>
              ))}

              <FadeIn delay={0.4}>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/5 via-neutral-900 to-neutral-950 border border-brand-500/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail size={16} className="text-brand-400" />
                    <p className="text-sm font-semibold text-white">Privacy inquiries</p>
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">For questions about this policy or to exercise your data rights:</p>
                  <a href="mailto:asantekelvin229@gmail.com" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    asantekelvin229@gmail.com
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
