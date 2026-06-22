import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { CheckCircle, XCircle, Sparkles } from "lucide-react";
import api from "../../api/axios";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }
    api.post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F4] via-white to-[#F4F1EC] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1C1510] dark:bg-brand-600 rounded-xl mb-4">
            <Sparkles className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-text-dark-primary">Email Verification</h1>
        </div>

        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          {status === "loading" && (
            <div className="py-8">
              <svg className="animate-spin h-10 w-10 text-brand-500 dark:text-brand-400 mx-auto" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="mt-4 text-sm text-gray-500 dark:text-text-dark-secondary">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-text-dark-primary mb-2">Verified!</h2>
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block py-2.5 px-6 bg-brand-600 dark:bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 dark:hover:bg-brand-500 transition"
              >
                Go to login
              </Link>
            </motion.div>
          )}

          {status === "error" && (
            <div className="py-4">
              <XCircle size={56} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-text-dark-primary mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary mb-6">{message}</p>
              <Link
                to="/login"
                className="text-sm text-brand-500 dark:text-brand-400 hover:underline font-medium"
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
