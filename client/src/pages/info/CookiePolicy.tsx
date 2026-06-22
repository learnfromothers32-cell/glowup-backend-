import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Cookie } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const SECTIONS = [
  { id: "what", title: "1. What Are Cookies" },
  { id: "how", title: "2. How We Use Cookies" },
  { id: "third", title: "3. Third-Party Cookies" },
  { id: "manage", title: "4. Managing Cookies" },
  { id: "updates", title: "5. Updates" },
];

const CONTENT: Record<string, string> = {
  what: "Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website or use an app. They help the platform remember your actions and preferences over time, so you don't have to re-enter them every time you return. Cookies also help us understand how you use our platform so we can improve it.",
  how: "We use the following categories of cookies: Essential cookies are necessary for authentication, security, and basic platform functionality — without these, the platform cannot operate properly. Functional cookies remember your preferences, language, and region. Analytics cookies help us understand how users interact with our platform, which features are most popular, and where we can improve. Advertising cookies (where applicable) help deliver relevant content and measure campaign effectiveness.",
  third: "We may use third-party services that set their own cookies. These include: Google Analytics for usage analysis (see Google's Privacy Policy), Firebase for authentication and real-time features, Paystack and PayPal for payment processing, and social media platforms for sharing features. These third parties have their own privacy and cookie policies governing their use of data.",
  manage: "You can control and delete cookies through your browser settings. Most browsers allow you to block all cookies, block third-party cookies, or delete cookies when you close your browser. Please note that disabling certain cookies may affect platform functionality — for example, you may need to log in more frequently or some features may not work as intended. Instructions are typically found in your browser's Help or Settings section under Privacy.",
  updates: "We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. When we make material changes, we will notify you via email or in-app notification. Continued use of the platform after changes take effect constitutes acceptance of the updated policy. We encourage you to review this policy periodically.",
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

export default function CookiePolicy() {
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
              <Cookie size={12} />
              Cookie Policy
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Cookie Policy</h1>
            <p className="text-neutral-400 mb-2">Last updated: January 1, 2026</p>
            <p className="text-sm text-neutral-500 mb-12">How GlowUp uses cookies and similar tracking technologies.</p>
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
            </div>
          </div>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
