import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";
import { Sparkles, Shield, Zap, Star, Check, X } from "lucide-react";
import { fadeSlideUp, pageTransition } from "../../utils/animations";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { register, socialLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "stylist" ? "/stylist/dashboard" : "/app", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = password.length >= 6;
  const nameValid = name.trim().length >= 2;
  const allValid = emailValid && passwordValid && nameValid;

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setTouched({ name: true, email: true, password: true });
    if (!nameValid) { setError("Name must be at least 2 characters"); return; }
    if (!emailValid) { setError("Please enter a valid email address"); return; }
    if (!passwordValid) { setError("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const user = await register(name.trim(), email.trim(), password, "client");
      setSuccess(`Account created! Check ${email.trim()} to verify your email.`);
      setTimeout(() => navigate("/app", { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeSlideUp}
      transition={pageTransition}
      className="flex min-h-screen bg-surface dark:bg-surface-dark"
    >
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">GlowUp</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">Find your perfect style match</h1>
            <p className="text-brand-200 text-sm leading-relaxed mb-8">
              Join thousands discovering talented stylists in their area. Book appointments, explore transformations, and elevate your look.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.3 }} className="space-y-4">
            {[
              { icon: Star, text: "Browse 500+ verified stylists in your area", sub: "Filter by style, price, location, and rating" },
              { icon: Zap, text: "Book appointments in seconds", sub: "Real-time availability with instant confirmation" },
              { icon: Shield, text: "Secure payments & protected bookings", sub: "Your satisfaction is always guaranteed" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <Icon size={15} className="text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{text}</p>
                  <p className="text-xs text-brand-300 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.3 }} className="mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-800 bg-gradient-to-br from-brand-400 to-brand-600" />
                ))}
              </div>
              <p className="text-xs text-brand-300">Join <span className="text-white font-semibold">12,000+</span> happy customers</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Sparkles size={17} className="text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">GlowUp</span>
            </div>
            <h1 className="text-h3 font-display text-text-primary">Create your account</h1>
            <p className="text-body-sm text-text-secondary mt-1">Start your style journey today</p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="p-3 rounded-xl bg-error/10 border border-error/20 text-sm text-error text-center">{error}</div>
          )}
          {success && (
            <div role="alert" aria-live="polite" className="p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success text-center">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-body-sm font-semibold text-text-primary mb-1.5">Full name</label>
              <div className="relative">
                <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} onBlur={() => markTouched("name")}
                  className={`input-field pr-9 ${touched.name && !nameValid ? "input-error" : ""}`} placeholder="Your name" />
                {touched.name && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nameValid ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-body-sm font-semibold text-text-primary mb-1.5">Email address</label>
              <div className="relative">
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => markTouched("email")}
                  className={`input-field pr-9 ${touched.email && !emailValid ? "input-error" : ""}`} placeholder="you@example.com" />
                {touched.email && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValid ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-body-sm font-semibold text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => markTouched("password")}
                  className={`input-field pr-9 ${touched.password && !passwordValid ? "input-error" : ""}`} placeholder="At least 6 characters" />
                {touched.password && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordValid ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  </span>
                )}
              </div>
              {touched.password && !passwordValid && (
                <p className="mt-1 text-xs text-error">Must be at least 6 characters</p>
              )}
            </div>
            <Button type="submit" disabled={!allValid} loading={isSubmitting} className="w-full">
              <Sparkles size={14} /> Create account
            </Button>
          </form>

          <p className="text-center text-body-sm text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">Log in</Link>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface dark:bg-surface-dark px-2 text-text-muted">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={async () => {
              try {
                const u = await socialLogin("google", "client");
                setSuccess(`Signed up with Google! Check ${u.email} to verify.`);
                setTimeout(() => navigate("/app", { replace: true }), 2000);
              } catch (err: any) { setError(err.message || "Google signup failed"); }
            }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button variant="secondary" onClick={async () => {
              try {
                const u = await socialLogin("apple", "client");
                setSuccess(`Signed up with Apple! Check ${u.email} to verify.`);
                setTimeout(() => navigate("/app", { replace: true }), 2000);
              } catch (err: any) { setError(err.message || "Apple signup failed"); }
            }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/></svg>
              Apple
            </Button>
          </div>

          <p className="text-center text-caption text-text-muted">
            Are you a stylist?{" "}
            <Link to="/stylist/signup" className="font-semibold text-brand-500 hover:text-brand-600">List your services</Link>
          </p>
        </motion.div>
      </div>
      </motion.div>
  );
}
