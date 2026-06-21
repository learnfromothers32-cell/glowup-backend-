import React, { useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, Sparkles, Check, X, CheckCircle } from "lucide-react";
import api from "../../api/axios";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = useMemo(() => passwordRules.map((r) => r.test(password)), [password]);
  const allValid = checks.every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || !token) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F4] via-white to-[#F4F1EC] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-text-dark-primary mb-2">Invalid reset link</h2>
          <p className="text-sm text-gray-500 dark:text-text-dark-muted mb-6">This link is missing or invalid. Request a new one.</p>
          <Link to="/forgot-password" className="text-brand-500 dark:text-brand-400 font-medium hover:underline text-sm">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F4] via-white to-[#F4F1EC] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1C1510] dark:bg-brand-600 rounded-xl mb-4">
            <Sparkles className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-text-dark-primary">Set a new password</h1>
          <p className="text-sm text-gray-500 dark:text-text-dark-secondary mt-1">Must be different from your previous one</p>
        </div>

        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-text-dark-primary mb-2">Password updated</h2>
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-text-dark-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-400/20 focus:border-brand-500 dark:focus:border-brand-400 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-dark-secondary hover:text-gray-600 dark:hover:text-text-dark-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password.length > 0 && (
                <ul className="space-y-1">
                  {passwordRules.map((rule, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs">
                      {checks[i] ? (
                        <Check size={12} className="text-green-500 shrink-0" />
                      ) : (
                        <X size={12} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      )}
                      <span className={checks[i] ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-text-dark-secondary"}>
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                disabled={loading || !allValid}
                className="w-full py-2.5 bg-brand-600 dark:bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 dark:hover:bg-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-sm text-center mt-6">
          <Link to="/login" className="text-gray-500 dark:text-text-dark-secondary hover:text-gray-700 dark:hover:text-text-dark-primary inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
