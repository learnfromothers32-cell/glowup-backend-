import { Shield, CreditCard, Smartphone, CheckCircle, Lock, Banknote } from "lucide-react";

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Debit/Credit Card", desc: "Visa, Mastercard", color: "text-stylist-500", bg: "bg-stylist-50 dark:bg-stylist-950/30" },
  { icon: Smartphone, label: "Mobile Money", desc: "MTN MoMo, Vodafone Cash", color: "text-gold-500", bg: "bg-gold-50 dark:bg-gold-900/20" },
  { icon: Banknote, label: "Pay on Delivery", desc: "Cash at appointment", color: "text-success", bg: "bg-success/10 dark:bg-success/10" },
];

const SECURITY = [
  "256-bit SSL encryption",
  "PCI DSS compliant",
  "No card data stored",
  "Instant refunds",
];

export default function PaymentsFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-success mb-3">Secure Payments</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Pay securely{" "}
              <span className="text-success">in GHS</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Multiple payment methods, all secured. Pay with card, mobile money, or cash. Instant confirmation, instant receipts.
            </p>
            <div className="mt-6 space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.label} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.bg}`}>
                    <m.icon size={18} className={m.color} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{m.label}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {SECURITY.map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-text-dark-secondary">
                  <Shield size={12} className="text-success" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-success/5 to-emerald-50 dark:from-success/5 dark:to-emerald-950/20 p-8 shadow-[0_20px_60px_rgba(16,185,129,0.06)]">
              <div className="mx-auto max-w-xs rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-success to-emerald-600 px-5 py-4 text-white">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-white" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Secure Payment</p>
                  </div>
                  <p className="text-2xl font-extrabold text-white mt-2">GH₵ 250.00</p>
                  <p className="text-[10px] text-white/70 mt-1">Box Braids — Ama Boateng</p>
                </div>
                {/* Payment method */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider mb-2">Payment Method</p>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((m, i) => (
                      <div key={m.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === 1 ? "bg-success/5 border border-success/20" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 1 ? "bg-success/10" : "bg-gray-200 dark:bg-gray-700"}`}>
                          <m.icon size={14} className={i === 1 ? "text-success" : "text-text-muted dark:text-text-dark-muted"} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{m.label}</p>
                          <p className="text-[9px] text-text-muted dark:text-text-dark-muted">{m.desc}</p>
                        </div>
                        {i === 1 && <CheckCircle size={14} className="text-success" />}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Summary */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
                  {[
                    { label: "Service", value: "Box Braids (Medium)" },
                    { label: "Duration", value: "3 hours" },
                    { label: "Tax", value: "GH₵ 0.00" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted dark:text-text-dark-muted">{row.label}</span>
                      <span className="text-[10px] font-semibold text-text-primary dark:text-text-dark-primary">{row.value}</span>
                    </div>
                  ))}
                </div>
                {/* Total + Pay */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-primary dark:text-text-dark-primary">Total</span>
                    <span className="text-lg font-extrabold text-success">GH₵ 250.00</span>
                  </div>
                  <button className="w-full rounded-xl bg-gradient-to-r from-success to-emerald-600 py-3 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2">
                    <Lock size={12} /> Pay Securely
                  </button>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <Shield size={10} className="text-success" />
                    <span className="text-[9px] text-text-muted dark:text-text-dark-muted">Secured by 256-bit SSL encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
