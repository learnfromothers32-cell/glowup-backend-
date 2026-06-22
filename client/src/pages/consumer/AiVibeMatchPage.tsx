import { Construction, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/seo/LanguageSwitcher";

export default function AiVibeMatchPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark-secondary">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 dark:bg-surface-dark/95 dark:border-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{t("app.name")}</h1>
                <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{t("app.tagline")}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
          <Construction size={36} className="text-amber-500" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-3">
          Coming Soon
        </h2>
        <p className="text-sm sm:text-base text-text-muted dark:text-text-dark-muted max-w-md mx-auto leading-relaxed mb-8">
          AI Vibe Match is currently in development. We're building an intelligent
          face shape analyzer and hairstyle recommender powered by AI.
          Check back soon for phase two!
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 text-xs text-text-muted dark:text-text-dark-muted">
          <Sparkles size={12} />
          Phase 2 – Coming Soon
        </div>
      </main>
    </div>
  );
}
