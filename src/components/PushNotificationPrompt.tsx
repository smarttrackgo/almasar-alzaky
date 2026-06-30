/* PushNotificationPrompt — نافذة طلب إذن الإشعارات المنبثقة */
import { Bell, BellOff, X, Smartphone } from "lucide-react";

interface Props {
  onAllow:   () => void;
  onDismiss: () => void;
}

export default function PushNotificationPrompt({ onAllow, onDismiss }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <button onClick={onDismiss} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">فعّل إشعارات رحلتك</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">احصل على إشعار فوري على جوالك عند:</p>
          <div className="space-y-2.5 mb-6">
            {[
              { icon: "🚌", text: "تعيين السائق لرحلتك" },
              { icon: "🚀", text: "انطلاق الحافلة" },
              { icon: "📍", text: "تحديثات الموقع المباشرة" },
              { icon: "🏁", text: "الوصول إلى الوجهة" },
              { icon: "✅", text: "تأكيد الحجوزات" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-3 py-2.5">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="text-sm font-semibold text-emerald-800">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-5">
            <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-400">تعمل حتى لو أغلقت التطبيق — يمكنك إيقافها في أي وقت</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onDismiss} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <BellOff className="w-4 h-4" />
              لاحقاً
            </button>
            <button onClick={onAllow} className="flex-[2] py-3 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 text-white font-black text-sm hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95">
              <Bell className="w-4 h-4" />
              تفعيل الإشعارات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
