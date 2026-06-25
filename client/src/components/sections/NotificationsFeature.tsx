import { Bell, Calendar, Users, MessageCircle, Clock, CheckCircle, Star, TrendingUp } from "lucide-react";

const NOTIFICATIONS = [
  {
    icon: Users,
    title: "Almost your turn!",
    desc: "2 clients ahead of you in the queue",
    time: "2 min ago",
    color: "text-brand-500",
    bg: "bg-brand-50 dark:bg-brand-950/30",
    urgent: true,
  },
  {
    icon: CheckCircle,
    title: "You're being served!",
    desc: "Ama Boateng is ready for you",
    time: "5 min ago",
    color: "text-success",
    bg: "bg-success/10 dark:bg-success/10",
    urgent: true,
  },
  {
    icon: Calendar,
    title: "Booking Confirmed",
    desc: "Box Braids with Ama Boateng — Jun 28, 10:00 AM",
    time: "1 hr ago",
    color: "text-stylist-500",
    bg: "bg-stylist-50 dark:bg-stylist-950/30",
    urgent: false,
  },
  {
    icon: Star,
    title: "Rate your experience",
    desc: "How was your appointment with Kofi Mensah?",
    time: "3 hrs ago",
    color: "text-gold-500",
    bg: "bg-gold-50 dark:bg-gold-900/20",
    urgent: false,
  },
  {
    icon: MessageCircle,
    title: "New message",
    desc: "Efua Asante: Thank you for booking! See you soon 💕",
    time: "5 hrs ago",
    color: "text-stylist-500",
    bg: "bg-stylist-50 dark:bg-stylist-950/30",
    urgent: false,
  },
  {
    icon: TrendingUp,
    title: "Your stylist is trending!",
    desc: "Ama Boateng is now in the top 5 in Accra",
    time: "1 day ago",
    color: "text-brand-500",
    bg: "bg-brand-50 dark:bg-brand-950/30",
    urgent: false,
  },
];

export default function NotificationsFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Mockup */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/30 dark:to-brand-900/20 p-8 shadow-[0_20px_60px_rgba(244,63,94,0.08)]">
              <div className="mx-auto max-w-xs rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-white" />
                    <p className="text-base font-extrabold text-white">Notifications</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <span className="text-[10px] font-bold text-white">{NOTIFICATIONS.length}</span>
                  </div>
                </div>
                {/* Notification list */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={n.title} className={`px-4 py-3 flex items-start gap-3 ${i < 2 ? "bg-brand-50/50 dark:bg-brand-950/10" : ""}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.bg}`}>
                        <n.icon size={16} className={n.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{n.title}</p>
                          {n.urgent && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-0.5 leading-relaxed">{n.desc}</p>
                        <p className="text-[9px] text-text-muted dark:text-text-dark-muted mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Notifications</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Stay updated{" "}
              <span className="text-brand-500">in real-time</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Never miss an update. Get notified about queue position, booking confirmations, messages, and more.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Users, label: "Queue Updates", desc: "Know when it's almost your turn" },
                { icon: Calendar, label: "Booking Alerts", desc: "Confirmations, reminders, and changes" },
                { icon: MessageCircle, label: "Messages", desc: "Direct messages from stylists" },
                { icon: TrendingUp, label: "Trending Updates", desc: "When your favorite stylists go viral" },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                    <f.icon size={14} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{f.label}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{f.desc}</p>
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
