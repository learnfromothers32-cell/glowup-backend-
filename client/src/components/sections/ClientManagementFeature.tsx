import { Users, Calendar, FileText, MessageCircle, Clock, TrendingUp } from "lucide-react";

const CLIENTS = [
  { name: "Esi Koranteng", lastVisit: "2 days ago", totalVisits: 12, spent: "GH₵2,400", note: "Prefers medium braids, allergic to certain products" },
  { name: "Kofi Adjei", lastVisit: "1 week ago", totalVisits: 8, spent: "GH₵640", note: "Likes fade with 0.5 guard, come in every 3 weeks" },
  { name: "Ama Boateng", lastVisit: "3 days ago", totalVisits: 23, spent: "GH₵5,750", note: "VIP client, always books box braids" },
];

export default function ClientManagementFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-stylist-500 mb-3">For Stylists</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Manage your{" "}
              <span className="text-stylist-500">clients</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Track client history, add notes, manage bookings, and build lasting relationships — all from your dashboard.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Users, label: "Client Profiles", desc: "View full client history and preferences" },
                { icon: FileText, label: "Client Notes", desc: "Add notes about preferences and allergies" },
                { icon: Calendar, label: "Booking History", desc: "See past and upcoming appointments" },
                { icon: TrendingUp, label: "Revenue Tracking", desc: "Track earnings per client and overall" },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stylist-50 dark:bg-stylist-950/30">
                    <f.icon size={14} className="text-stylist-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{f.label}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-stylist-50 to-stylist-100 dark:from-stylist-950/30 dark:to-stylist-900/20 p-8 shadow-[0_20px_60px_rgba(99,102,241,0.08)]">
              <div className="mx-auto max-w-sm rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-stylist-500 to-stylist-600 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Client List</p>
                      <p className="text-base font-extrabold text-white mt-1">23 Active Clients</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-1">
                      <TrendingUp size={10} className="text-white" />
                      <span className="text-[10px] font-bold text-white">+12%</span>
                    </div>
                  </div>
                </div>
                {/* Stats bar */}
                <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800">
                  {[
                    { label: "Total Visits", value: "156" },
                    { label: "Revenue", value: "GH₵12K" },
                    { label: "Avg Rating", value: "4.9" },
                  ].map((stat) => (
                    <div key={stat.label} className="px-3 py-3 text-center border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                      <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{stat.label}</p>
                      <p className="text-sm font-extrabold text-stylist-600 dark:text-stylist-400 mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Client list */}
                <div className="px-4 py-3 space-y-2.5">
                  {CLIENTS.map((c) => (
                    <div key={c.name} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-stylist-400 to-stylist-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-muted dark:text-text-dark-muted">{c.totalVisits} visits</span>
                            <span className="text-[10px] text-text-muted dark:text-text-dark-muted">·</span>
                            <span className="text-[10px] text-text-muted dark:text-text-dark-muted">{c.spent}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-text-muted dark:text-text-dark-muted">Last visit</p>
                          <p className="text-[10px] font-semibold text-stylist-500">{c.lastVisit}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-start gap-1.5">
                        <FileText size={9} className="text-text-muted dark:text-text-dark-muted mt-0.5 shrink-0" />
                        <p className="text-[9px] text-text-muted dark:text-text-dark-muted leading-relaxed">{c.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Quick actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-stylist-500 py-2.5 text-[10px] font-bold text-white">
                    <MessageCircle size={11} /> Message All
                  </button>
                  <button className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-[10px] font-semibold text-text-secondary dark:text-text-dark-secondary">
                    <Clock size={11} /> View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
