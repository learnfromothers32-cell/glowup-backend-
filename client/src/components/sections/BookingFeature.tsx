import { Calendar, Clock, User, CheckCircle, Star } from "lucide-react";

const BOOKING_STEPS = [
  { icon: User, label: "Pick Stylist", desc: "Browse profiles, ratings, and portfolios" },
  { icon: Calendar, label: "Choose Date", desc: "Select your preferred date and time slot" },
  { icon: Clock, label: "Select Service", desc: "Pick service, see duration & price" },
  { icon: CheckCircle, label: "Instant Confirm", desc: "Booking confirmed — add to calendar" },
];

export default function BookingFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2rem] bg-gradient-to-br from-stylist-50 to-stylist-100 dark:from-stylist-950/30 dark:to-stylist-900/20 p-8 shadow-[0_20px_60px_rgba(99,102,241,0.08)]">
              <div className="mx-auto max-w-xs rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-stylist-500 to-stylist-600 px-5 py-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Book Appointment</p>
                  <p className="text-base font-extrabold mt-1">Ama Beauty Salon</p>
                </div>
                {/* Stylist */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold">AB</div>
                    <div>
                      <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">Ama Boateng</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={9} fill="#f43f5e" className="text-brand-500" />
                        <span className="text-[10px] font-semibold text-brand-500">4.9</span>
                        <span className="text-[10px] text-text-muted dark:text-text-dark-muted">· Braids Specialist</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Service */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider mb-2">Service</p>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary dark:text-text-dark-primary">Box Braids (Medium)</span>
                      <span className="text-xs font-extrabold text-brand-500">GH₵250</span>
                    </div>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-1">Duration: ~3 hours</p>
                  </div>
                </div>
                {/* Date/Time */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider mb-2">Date & Time</p>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl bg-stylist-50 dark:bg-stylist-950/30 px-3 py-2.5 text-center">
                      <p className="text-[10px] text-text-muted dark:text-text-dark-muted">Date</p>
                      <p className="text-xs font-bold text-stylist-600 dark:text-stylist-400 mt-0.5">Jun 28</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-stylist-50 dark:bg-stylist-950/30 px-3 py-2.5 text-center">
                      <p className="text-[10px] text-text-muted dark:text-text-dark-muted">Time</p>
                      <p className="text-xs font-bold text-stylist-600 dark:text-stylist-400 mt-0.5">10:00 AM</p>
                    </div>
                  </div>
                </div>
                {/* Confirm */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 mb-3">
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-[10px] font-bold text-success">Instant Confirmation</span>
                  </div>
                  <button className="w-full rounded-xl bg-gradient-to-r from-stylist-500 to-stylist-600 py-3 text-xs font-bold text-white shadow-lg">
                    Confirm Booking — GH₵250
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-stylist-500 mb-3">Booking</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Book appointments{" "}
              <span className="text-stylist-500">instantly</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Pick a stylist, choose your service, select a date — done. Instant confirmation, no phone calls needed.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {BOOKING_STEPS.map((s, i) => (
                <div key={s.label} className="flex items-start gap-3 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stylist-50 dark:bg-stylist-950/30 text-[10px] font-extrabold text-stylist-500">{i + 1}</div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{s.label}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
