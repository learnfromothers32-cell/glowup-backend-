import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Wallet, Check, Shield, AlertCircle, ArrowRight, Lock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import Section from "./Section";
import type { PaymentMethod } from "@/domain/booking/booking.types";
import type { ServiceObject, BookingPhase } from "./BookingModal";

const PLATFORM_FEE_PERCENT = 0.13;

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  detail: string;
  icon: typeof CreditCard;
  badge?: string;
}[] = [
  { id: "card", label: "Credit / Debit Card", detail: "Visa, Mastercard, Amex", icon: CreditCard, badge: "Popular" },
  { id: "mobile-money", label: "Mobile Money", detail: "MTN MoMo · Vodafone Cash · AirtelTigo", icon: Smartphone, badge: "Fast" },
  { id: "cash", label: "Cash at Salon", detail: "Pay on arrival after service", icon: Wallet },
];

function calcPrice(priceStr: string | undefined) {
  const subtotal = Math.round(parseFloat((priceStr || "0").replace(/[^0-9.]/g, "")) * 100) / 100;
  const fee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
  return { subtotal, fee, total: subtotal + fee };
}

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  note: string;
  paymentError: string | null;
  phase: BookingPhase;
  selectedService: ServiceObject | null;
  selectedDate: string | null;
  selectedTime: string | null;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onNoteChange: (n: string) => void;
  onPay: () => void;
  active: boolean;
  disabled: boolean;
}

export default function PaymentStep({
  paymentMethod,
  note,
  paymentError,
  phase,
  selectedService,
  selectedDate,
  selectedTime,
  onPaymentMethodChange,
  onNoteChange,
  onPay,
  active,
  disabled,
}: PaymentStepProps) {
  const [noteId] = useState(() => `note-${Math.random().toString(36).slice(2)}`);
  const price = calcPrice(selectedService?.price);

  const formatSlot = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Section
      id="section-pay"
      number={4}
      title="Review & Pay"
      subtitle="Almost there!"
      completed={false}
      active={active}
      disabled={disabled}
    >
      <div className="mt-2 space-y-5">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-gray-50/50 dark:bg-surface-dark-tertiary/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/40 flex items-center gap-2">
            <Receipt size={13} className="text-text-muted dark:text-text-dark-muted" />
            <span className="text-[11px] font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">Order Summary</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary dark:text-text-dark-secondary">{selectedService?.name || "Service"}</span>
              <span className="font-semibold text-text-primary dark:text-text-dark-primary">GH₵ {price.subtotal.toFixed(2)}</span>
            </div>
            {selectedDate && selectedTime && (
              <div className="text-xs text-text-muted dark:text-text-dark-muted">
                {formatDate(selectedDate)} · {formatSlot(selectedTime)}
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted dark:text-text-dark-muted">Platform fee <span className="text-[10px]">(13%)</span></span>
                <span className="text-text-secondary dark:text-text-dark-secondary">GH₵ {price.fee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-600 pt-1.5">
                <span className="text-text-primary dark:text-text-dark-primary">Total</span>
                <span className="text-text-primary dark:text-text-dark-primary">GH₵ {price.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-2.5">Payment Method</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20" : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-surface-dark-secondary"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted"
                  }`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{method.label}</p>
                      {method.badge && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand-500 text-white">{method.badge}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted dark:text-text-dark-muted">{method.detail}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor={noteId} className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider block mb-2">
            Note <span className="normal-case font-normal text-text-muted dark:text-text-dark-muted">(optional)</span>
          </label>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Any special requests for your stylist?"
            className="resize-none min-h-0"
          />
          <p className="text-right text-[11px] text-text-muted dark:text-text-dark-muted mt-1">{note.length}/200</p>
        </div>

        <AnimatePresence>
          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{paymentError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted dark:text-text-dark-muted">
          <span className="flex items-center gap-1.5"><Lock size={11} /> 256-bit SSL</span>
          <span className="flex items-center gap-1.5"><Shield size={11} /> Secured by Paystack</span>
          <span className="flex items-center gap-1.5 text-green-600 font-medium">No hidden fees</span>
        </div>

        <Button
          onClick={onPay}
          disabled={phase === "paying"}
          variant="primary"
          size="lg"
          loading={phase === "paying"}
          className="w-full shadow-lg shadow-brand-500/20"
        >
          {phase === "paying" ? "Processing payment…" : (
            <>
              Pay GH₵ {price.total.toFixed(2)}
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </div>
    </Section>
  );
}
