import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Download } from "lucide-react";

interface FinalCTAProps {
  onOpenInstall?: () => void;
}

export default function FinalCTASection({ onOpenInstall }: FinalCTAProps) {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl animate-float-delay" />
      </div>

      <div className="relative mx-auto max-w-2xl px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 mb-5">
          <Sparkles size={12} className="text-white" />
          <span className="text-[11px] font-semibold text-white/90">10,000+ users</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Ready to transform your look?
        </h2>

        <p className="mt-4 text-sm sm:text-base text-white/70 max-w-md mx-auto">
          Connect with Ghana's top beauty professionals.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={() => navigate("/signup")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-5 text-sm font-semibold text-brand-600 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onOpenInstall}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white/15 border border-white/20 px-5 text-sm font-medium text-white hover:bg-white/25 transition-all duration-200"
          >
            <Download size={14} />
            Download App
          </button>
        </div>

        <p className="mt-5 text-[11px] text-white/40">
          Free to join · No credit card required
        </p>
      </div>
    </section>
  );
}
