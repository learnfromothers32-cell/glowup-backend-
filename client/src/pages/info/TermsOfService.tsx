import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Scale } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "accounts", title: "2. User Accounts" },
  { id: "bookings", title: "3. Bookings & Payments" },
  { id: "stylists", title: "4. Stylist Terms" },
  { id: "conduct", title: "5. Prohibited Conduct" },
  { id: "liability", title: "6. Limitation of Liability" },
  { id: "changes", title: "7. Changes to Terms" },
];

const CONTENT: Record<string, string> = {
  acceptance: "By accessing or using GlowUp, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our platform. We recommend reviewing these terms periodically, as they may be updated. Continued use after changes constitutes acceptance of the updated terms.",
  accounts: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You must be at least 18 years old to create an account. We reserve the right to suspend or terminate accounts that violate these terms.",
  bookings: "All bookings are subject to stylist confirmation and availability. Prices are set by individual stylists and may vary. Payments are processed securely through our payment partners (Paystack, PayPal). Cancellation and refund policies are outlined in our Refund Policy. We are not liable for disputes between clients and stylists regarding service quality.",
  stylists: "Stylists are independent professionals and are not employees, agents, or contractors of GlowUp Technologies Ltd. Stylists are responsible for setting their own prices, availability, and service offerings. Stylists must maintain accurate availability, deliver services as described, hold valid certifications, and maintain professional conduct. Violations may result in removal from the platform.",
  conduct: "Users agree not to misuse the platform. Prohibited conduct includes: creating false accounts, engaging in fraudulent transactions, harassing other users, posting inappropriate content, attempting to circumvent our payment system, violating any applicable laws, or using the platform for unauthorized commercial purposes. Violations may result in immediate account termination.",
  liability: "GlowUp is provided on an 'as is' and 'as available' basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.",
  changes: "We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Your continued use of the platform after changes become effective constitutes acceptance of the revised terms. If you disagree with changes, you may stop using the platform and delete your account.",
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

export default function TermsOfService() {
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
              <Scale size={12} />
              Terms & Conditions
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Terms & Conditions</h1>
            <p className="text-neutral-400 mb-2">Last updated: January 1, 2026</p>
            <p className="text-sm text-neutral-500 mb-12">These terms govern your use of the GlowUp platform and services.</p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
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

            <div className="space-y-12">
              {SECTIONS.map(({ id, title }, i) => (
                <FadeIn key={id} delay={i * 0.05}>
                  <section id={id}>
                    <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">{CONTENT[id]}</p>
                  </section>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
