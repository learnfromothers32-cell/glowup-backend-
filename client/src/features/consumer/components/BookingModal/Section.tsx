import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SectionProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  disabled: boolean;
  children: React.ReactNode;
  summary?: string;
}

export default function Section({
  id,
  number,
  title,
  subtitle,
  completed,
  active,
  disabled,
  children,
  summary,
}: SectionProps) {
  return (
    <div
      id={id}
      className={`rounded-2xl border transition-all duration-300 ${
        active
          ? "border-brand-500 bg-white dark:bg-surface-dark-secondary shadow-lg shadow-gray-100 dark:shadow-gray-900/30"
          : completed
            ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary"
            : "border-gray-100 dark:border-gray-700/40 bg-gray-50/50 dark:bg-surface-dark-tertiary/50"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
            completed
              ? "bg-green-500 text-white"
              : active
                ? "bg-brand-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          {completed ? <Check size={14} strokeWidth={3} /> : number}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${
            active ? "text-text-primary dark:text-text-dark-primary" : completed ? "text-text-secondary dark:text-text-dark-secondary" : "text-text-muted dark:text-text-dark-muted"
          }`}>
            {title}
          </p>
          {!active && completed && summary ? (
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">{summary}</p>
          ) : active ? (
            <p className="text-xs text-text-muted dark:text-text-dark-muted">{subtitle}</p>
          ) : null}
        </div>

        {completed && !disabled && (
          <button
            className="text-xs font-medium text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary transition-colors px-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Edit
          </button>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700/40">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
