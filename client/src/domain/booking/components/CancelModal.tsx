import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { Modal } from "./SharedUI";
import { fmtDate, fmtTime, initials, fmtISO } from "./StatusBadge";
import { Button } from "../../../components/ui/Button";
import type { Booking } from "../booking.types";

function getStylistName(b: Booking): string {
  if (typeof b.stylistId === "object" && b.stylistId !== null) return (b.stylistId as any).name || "Stylist";
  return "Stylist";
}

function getServiceName(b: Booking): string {
  if (typeof b.serviceId === "object" && b.serviceId !== null) return (b.serviceId as any).name || "Service";
  return "Service";
}

interface CancelModalProps {
  booking: Booking;
  stylistImage?: string;
  stylistName?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export default function CancelModal({
  booking,
  stylistImage,
  stylistName,
  onConfirm,
  onClose,
  loading,
}: CancelModalProps) {
  const name = stylistName || getStylistName(booking);
  const serviceName = getServiceName(booking);
  const price = typeof booking.serviceId === "object" && booking.serviceId !== null
    ? (booking.serviceId as any).price || booking.totalPrice
    : booking.totalPrice;

  return (
    <Modal onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-red-500 to-red-300 dark:from-red-600 dark:to-red-400" />
      <div className="p-5">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/50 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-3">
          Cancel this booking?
        </h3>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 mb-3">
          <div className="flex items-center gap-3">
            {stylistImage ? (
              <img src={stylistImage} alt={name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-surface-dark-tertiary flex items-center justify-center">
                <span className="text-xs font-bold text-text-muted dark:text-text-dark-muted">{initials(name)}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{name}</p>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{serviceName}</p>
              <p className="flex items-center gap-1 text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                <Calendar size={10} />
                {booking.startTime ? fmtDate(new Date(booking.startTime)) : "—"} at {booking.startTime ? fmtISO(booking.startTime) : "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50 mb-5">
          <AlertTriangle size={13} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            Late cancellations within 24 hours may incur a fee of ${Math.round((price || 0) * 0.5)}.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
