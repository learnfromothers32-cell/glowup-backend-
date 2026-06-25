import { X, Download, Share, Plus, CheckCircle } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";

export default function PwaInstallModal() {
  const { isIOS, isAndroid, promptInstall, isInstalled } = usePwaInstall();

  if (isInstalled) return null;

  const closeModal = () => {
    const modal = document.getElementById("pwa-install-modal");
    if (modal) modal.classList.add("hidden");
  };

  const handleInstall = async () => {
    if (isAndroid) {
      const result = await promptInstall();
      if (result) closeModal();
    }
  };

  return (
    <div id="pwa-install-modal" className="hidden fixed inset-0 z-[200] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 text-white relative">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Install GlowUp</h3>
              <p className="text-xs text-white/70 mt-0.5">Add to your home screen</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Follow these steps to install on your iPhone:
              </p>
              {[
                { icon: Share, step: "Tap the Share button", desc: "Bottom center of Safari (square with arrow)" },
                { icon: Plus, step: 'Tap "Add to Home Screen"', desc: "Scroll down in the share menu" },
                { icon: CheckCircle, step: 'Tap "Add"', desc: "Confirm to install GlowUp" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30">
                    <item.icon size={18} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.step}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Install GlowUp directly on your device:
              </p>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] hover:bg-brand-600 hover:shadow-[0_4px_16px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Download size={18} />
                Install App
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Open this page on your Android or iOS device to install the app.
              </p>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  On desktop, you can still use GlowUp in your browser. For the best experience with push notifications and offline access, install the app on your phone.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
