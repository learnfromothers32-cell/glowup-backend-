import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Receipt } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const SECTIONS = [
  { id: "cancellation", title: "1. Cancellation Window" },
  { id: "stylist", title: "2. Stylist Cancellations" },
  { id: "processing", title: "3. Refund Processing" },
  { id: "noshow", title: "4. No-Show Policy" },
  { id: "disputes", title: "5. Disputes" },
];

const CONTENT: Record<string, string> = {
  cancellation: "You may cancel a booking up to 4 hours before the scheduled appointment time for a full refund — no questions asked. Cancellations made within 4 hours of the appointment may be subject to a 50% fee at the stylist's discretion. To cancel, go to My Bookings, select the appointment, and click Cancel. The refund will be processed automatically based on the timing of the cancellation.",
  stylist: "If a stylist cancels your booking for any reason, you will receive a full refund to your original payment method within 5–7 business days. You will also receive priority booking status and a notification when the stylist has new availability. In the event of repeated cancellations by a stylist, we may review their status on the platform.",
  processing: "Refunds are processed to your original payment method within 5–7 business days for card payments. Mobile money (MTN, Vodafone, AirtelTigo) refunds are typically processed within 24 hours. PayPal refunds are processed immediately but may take up to 3 business days to appear in your account. If your refund has not been credited within the stated timeframe, please contact our support team for assistance.",
  noshow: "If you do not show up for a scheduled appointment without prior cancellation, you will be charged the full amount of the booking. Repeated no-shows may result in restrictions on your ability to book certain stylists. We understand that emergencies happen — if you have a genuine reason for missing your appointment, please contact us and we'll review your case.",
  disputes: "If you believe a refund is owed beyond our standard policy — for example, if the service received was significantly different from what was advertised — please contact our support team. We review each dispute on a case-by-case basis and aim to resolve all disputes within 7 business days. Email us at asantekelvin229@gmail.com with your booking details and a description of the issue.",
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

export default function RefundPolicy() {
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6 w-fit">
              <Receipt size={12} />
              Refund Policy
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Refund Policy</h1>
            <p className="text-neutral-400 mb-2">Last updated: January 1, 2026</p>
            <p className="text-sm text-neutral-500 mb-12">Our policy on cancellations, refunds, and dispute resolution.</p>
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
                      ? "text-amber-400 bg-amber-500/10"
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

              <FadeIn delay={0.3}>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 via-neutral-900 to-neutral-950 border border-amber-500/10">
                  <p className="text-sm font-semibold text-white mb-2">Need help with a refund?</p>
                  <p className="text-xs text-neutral-500 mb-2">Contact our support team for assistance with any refund-related issue.</p>
                  <a href="mailto:asantekelvin229@gmail.com" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
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
