import { Clock, Users, Bell, XCircle, ChevronRight } from "lucide-react";

const QUEUE_FEATURES = [
  { icon: Users, label: "Live Queue Position", desc: "See exactly where you are in the queue — updated in real-time." },
  { icon: Clock, label: "Estimated Wait Time", desc: "AI-powered predictions tell you when it's your turn." },
  { icon: Bell, label: "Almost Your Turn", desc: "Get notified the moment you're 2 clients away." },
  { icon: XCircle, label: "Skip / Leave Queue", desc: "Leave or skip the queue anytime — no pressure." },
];

export default function QueueFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Real-Time Queue</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              No more waiting{" "}
              <span className="text-brand-500">in lines</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Join a queue from your phone. Watch your position update live. Get notified when it's almost your turn. Never miss your slot again.
            </p>
            <div className="mt-8 space-y-4">
              {QUEUE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30">
                    <f.icon size={18} className="text-brand-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{f.label}</h4>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/30 dark:to-brand-900/20 p-8 shadow-[0_20px_60px_rgba(244,63,94,0.08)]">
              <div className="mx-auto max-w-xs rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Your Queue</p>
                  <p className="text-lg font-extrabold mt-1">Box Braids — Ama Beauty Salon</p>
                </div>
                {/* Position */}
                <div className="px-5 py-6 text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-brand-50 dark:bg-brand-950/30 mb-3">
                    <span className="text-3xl font-extrabold text-brand-500">3</span>
                  </div>
                  <p className="text-xs font-semibold text-text-primary dark:text-text-dark-primary">Your position</p>
                  <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-1">Est. wait: <span className="font-bold text-brand-500">~25 min</span></p>
                  {/* Progress */}
                  <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
                  </div>
                  <p className="mt-2 text-[10px] text-success font-semibold">Almost your turn! 2 clients ahead</p>
                </div>
                {/* Clients ahead */}
                <div className="px-5 pb-5 space-y-2">
                  {["Kofi A.", "Efua B."].map((name, i) => (
                    <div key={name} className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{i + 1}</div>
                      <span className="text-xs font-medium text-text-primary dark:text-text-dark-primary">{name}</span>
                      <span className="ml-auto text-[10px] text-text-muted dark:text-text-dark-muted">Serving…</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 px-3 py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">3</div>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">You</span>
                    <ChevronRight size={12} className="ml-auto text-brand-400" />
                  </div>
                </div>
                {/* Buttons */}
                <div className="px-5 pb-5 flex gap-2">
                  <button className="flex-1 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white">Join Queue</button>
                  <button className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">Leave</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
