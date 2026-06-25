import { X, Download, Share, Plus, CheckCircle, Smartphone, Globe, Menu } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";

interface PwaInstallModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ open, onClose }: PwaInstallModalProps) {
  const { promptInstall, isIOS, isAndroid, isInstalled, canPromptNative } = usePwaInstall();

  if (!open) return null;

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result) onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-surface-dark-secondary shadow-2xl overflow-hidden sm:rounded-3xl rounded-t-3xl animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 sm:px-6 sm:py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold">Install GlowUp</h3>
              <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">Quick access from your home screen</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {isInstalled ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle size={32} className="text-success mb-3" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">GlowUp is already installed!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Open it from your home screen.</p>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                Install in 3 easy steps:
              </p>
              {[
                { icon: Share, step: "1", title: "Tap Share", desc: "the share button at the bottom of Safari" },
                { icon: Plus, step: "2", title: 'Scroll & tap "Add to Home Screen"', desc: "" },
                { icon: CheckCircle, step: "3", title: 'Tap "Add"', desc: "in the top right to confirm" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                    <item.icon size={16} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                    {item.desc && <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>}
                  </div>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{item.step}</span>
                </div>
              ))}
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                Make sure you're using <strong>Safari</strong> — this doesn't work in other browsers on iPhone.
              </p>
            </div>
          ) : isAndroid ? (
            canPromptNative ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3">
                  <Smartphone size={18} className="text-brand-500 shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    One tap to add GlowUp to your home screen.
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-sm hover:bg-brand-600 hover:shadow-glow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <Download size={16} />
                  Install Now
                </button>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                  <CheckCircle size={12} className="text-success shrink-0" />
                  <span>Free · No account needed · Takes 5 seconds</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Install in 2 easy steps:
                </p>
                {[
                  { icon: Menu, step: "1", title: "Tap the menu", desc: "the three dots ⋮ in Chrome's top-right" },
                  { icon: Plus, step: "2", title: 'Tap "Add to Home Screen"', desc: "" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3.5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                      <item.icon size={16} className="text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                      {item.desc && <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>}
                    </div>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{item.step}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3">
                <Globe size={18} className="text-brand-500 shrink-0" />
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Open this page on your phone to install.
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">How to install:</p>
                <ol className="space-y-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 list-decimal list-inside">
                  <li>Open <strong className="text-gray-700 dark:text-gray-300">glowup.app</strong> on your phone</li>
                  <li>Tap the browser menu <strong className="text-gray-700 dark:text-gray-300">⋮</strong> (<span className="inline-flex items-center gap-1"><Menu size={11} /></span>)</li>
                  <li>Select <strong className="text-gray-700 dark:text-gray-300">"Add to Home Screen"</strong></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pb-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
}
