import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { verifyPayment } from "@/api/payments";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found");
      return;
    }
    verifyPayment(reference)
      .then((res) => {
        if (res.data?.status === "paid" || res.data?.status === "success") {
          setStatus("success");
          setMessage("Payment verified successfully");
        } else {
          setStatus("error");
          setMessage(res.data?.status === "failed" ? "Payment failed" : "Payment could not be verified");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Failed to verify payment. Please contact support.");
      });
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-black/5 p-8 text-center"
      >
        {status === "verifying" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-5 shadow-inner">
              <Loader2 size={28} className="animate-spin text-gray-500" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Verifying Payment</h1>
            <p className="text-sm text-gray-400">Please wait while we confirm your transaction…</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-green-200"
            >
              <CheckCircle2 size={28} className="text-white" />
            </motion.div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Payment Successful</h1>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate("/app/my-bookings")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              View My Bookings <ArrowRight size={14} />
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-5">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Payment Issue</h1>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/app/my-bookings")}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Go to My Bookings
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
