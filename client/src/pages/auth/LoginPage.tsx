import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login, socialLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please fill in all fields"); return; }
    setIsSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      navigate(u.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50 dark:bg-surface-dark">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-12 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 50%, #fff 0%, transparent 50%)` }} />
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><Sparkles size={18} /></div>
          <span className="text-xl font-bold">GlowUp</span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-lg font-light leading-relaxed opacity-90 max-w-md">
            "The platform transformed my salon. I've tripled my bookings since joining."
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold">AK</div>
            <div>
              <p className="text-sm font-semibold">Ama K.</p>
              <p className="text-xs text-white/70">Premium Stylist, Accra</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-white/60 relative z-10">© 2026 GlowUp OS</p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
              <span className="text-lg font-bold text-text-primary">GlowUp</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-h1 font-display text-text-primary">Welcome back</h1>
            <p className="mt-1 text-body-sm text-text-secondary">Sign in to your account</p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error-dark dark:text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-text-primary">Email</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-500 hover:text-brand-600">Forgot?</Link>
              </div>
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" placeholder="Your password"
              />
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-surface-dark-secondary px-2 text-text-muted">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={async () => {
              try {
                const u = await socialLogin("google");
                navigate(u.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
              } catch { setError("Google login failed"); }
            }} className="btn-secondary py-2.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button type="button" onClick={async () => {
              try {
                const u = await socialLogin("apple");
                navigate(u.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
              } catch { setError("Apple login failed"); }
            }} className="btn-secondary py-2.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/></svg>
              Apple
            </button>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-brand-500 hover:text-brand-600">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
