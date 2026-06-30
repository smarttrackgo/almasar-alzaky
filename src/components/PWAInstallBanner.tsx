import { useState, useEffect } from "react";
import { Download, X, Smartphone, Star } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    /* هل التطبيق مثبّت بالفعل؟ */
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    /* هل أغلق المستخدم البانر من قبل؟ */
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    /* iOS detection */
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      /* على iOS لا يوجد beforeinstallprompt — نعرض دليل يدوي */
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    /* Android / Desktop: نستمع لحدث التثبيت */
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (installed || !showBanner) return null;

  return (
    <>
      {/* ── البانر الرئيسي ── */}
      <div
        dir="rtl"
        className="fixed bottom-0 inset-x-0 z-[100] px-4 pb-4 pointer-events-none"
      >
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 rounded-2xl shadow-2xl border border-emerald-700/50 overflow-hidden">
            {/* شريط علوي ملوّن */}
            <div className="h-1 bg-gradient-to-l from-amber-400 via-emerald-400 to-teal-400" />

            <div className="p-4 flex items-center gap-4">
              {/* أيقونة التطبيق */}
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                <img
                  src="https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b"
                  alt="المسار الذكي"
                  className="w-10 h-10 object-contain rounded-xl"
                  style={{ mixBlendMode: "screen" }}
                />
              </div>

              {/* النص */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-black text-sm">حمّل التطبيق مجاناً</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-emerald-300 text-xs leading-relaxed">
                  {isIOS
                    ? "أضف المسار الذكي لشاشتك الرئيسية للوصول السريع"
                    : "ثبّت التطبيق على جوالك — أسرع وأسهل بدون متجر"}
                </p>
              </div>

              {/* أزرار */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-emerald-950 font-black text-sm hover:bg-amber-300 transition-all shadow-lg active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  {isIOS ? "كيف؟" : "تثبيت"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── دليل iOS ── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-l from-emerald-700 to-emerald-800 p-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-black text-lg">أضف للشاشة الرئيسية</h3>
              <p className="text-emerald-200 text-sm mt-1">خطوات بسيطة على iPhone / iPad</p>
            </div>

            {/* الخطوات */}
            <div className="p-5 space-y-4">
              {[
                {
                  step: "١",
                  icon: "⬆️",
                  title: "اضغط على زر المشاركة",
                  desc: 'الزر الموجود في أسفل المتصفح (Safari) — يشبه مربعاً بسهم للأعلى',
                },
                {
                  step: "٢",
                  icon: "➕",
                  title: 'اختر "إضافة إلى الشاشة الرئيسية"',
                  desc: 'مرّر للأسفل في القائمة وابحث عن هذا الخيار',
                },
                {
                  step: "٣",
                  icon: "✅",
                  title: 'اضغط "إضافة"',
                  desc: 'سيظهر التطبيق على شاشتك الرئيسية فوراً',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* زر الإغلاق */}
            <div className="px-5 pb-5">
              <button
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors"
              >
                فهمت، شكراً!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
