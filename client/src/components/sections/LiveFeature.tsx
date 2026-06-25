import { Radio, Heart, MessageCircle, Eye, Users, Send } from "lucide-react";

const COMMENTS = [
  { user: "Esi K.", text: "This technique is amazing! 😍", time: "2m ago" },
  { user: "Kofi A.", text: "Can you do a tutorial on fades?", time: "1m ago" },
  { user: "Ama B.", text: "🔥🔥🔥", time: "just now" },
];

export default function LiveFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-error mb-3">Live Streaming</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Watch live{" "}
              <span className="text-error">beauty tutorials</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Stylists stream their work live. Watch techniques in real-time, ask questions, and interact with the community.
            </p>
            <div className="mt-6 space-y-3">
              {["Real-time video streaming", "Live likes and heart animations", "Interactive comments and questions", "Viewer count and engagement"].map((b) => (
                <div key={b} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-error-light dark:bg-error/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-error" />
                  </div>
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup - Live Stream */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-error/5 to-brand-50 dark:from-error/5 dark:to-brand-950/30 p-8 shadow-[0_20px_60px_rgba(244,63,94,0.06)]">
              <div className="mx-auto max-w-xs rounded-3xl bg-black shadow-2xl overflow-hidden">
                {/* Video area */}
                <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 mx-auto flex items-center justify-center text-white text-xl font-bold">AB</div>
                    <p className="text-white text-xs font-bold mt-3">Ama Boateng</p>
                    <p className="text-white/60 text-[10px] mt-1">Box Braids Tutorial</p>
                  </div>
                  {/* Live badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-error px-2.5 py-1">
                    <Radio size={10} className="text-white animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase">Live</span>
                  </div>
                  {/* Viewer count */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1">
                    <Eye size={10} className="text-white" />
                    <span className="text-[10px] font-bold text-white">1,247</span>
                  </div>
                  {/* Floating hearts */}
                  <div className="absolute bottom-16 right-3 space-y-1.5 animate-float">
                    <Heart size={16} fill="#f43f5e" className="text-brand-500 opacity-80" />
                    <Heart size={12} fill="#f43f5e" className="text-brand-500 opacity-60 ml-2" />
                    <Heart size={14} fill="#f43f5e" className="text-brand-500 opacity-70" />
                  </div>
                  {/* Interaction bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5">
                      <Heart size={12} fill="#f43f5e" className="text-brand-500" />
                      <span className="text-[10px] font-bold text-white">3.2K</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5">
                      <MessageCircle size={12} className="text-white" />
                      <span className="text-[10px] font-bold text-white">248</span>
                    </div>
                  </div>
                </div>
                {/* Comments */}
                <div className="px-4 py-3 space-y-2 bg-gray-900">
                  {COMMENTS.map((c) => (
                    <div key={c.user + c.text} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center text-[8px] font-bold text-white shrink-0">{c.user[0]}</div>
                      <div>
                        <span className="text-[10px] font-bold text-brand-400">{c.user}</span>
                        <span className="text-[10px] text-gray-300 ml-1.5">{c.text}</span>
                      </div>
                      <span className="ml-auto text-[8px] text-gray-500 shrink-0">{c.time}</span>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex items-center gap-2">
                  <input type="text" placeholder="Say something…" className="flex-1 bg-gray-800 rounded-full px-3 py-1.5 text-[10px] text-white placeholder-gray-500 outline-none" />
                  <button className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center">
                    <Send size={10} className="text-white" />
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
