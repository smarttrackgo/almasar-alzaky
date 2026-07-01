import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Smartphone, Settings, Send, CheckCircle, XCircle,
  Clock, MessageSquare, Save,
  Loader2, AlertCircle, BarChart3, Phone,
  Building2, Calendar, User, Zap,
  ChevronDown, ChevronUp, Info, Wifi, CheckCircle2, Eye, EyeOff,
} from "lucide-react";

const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

export default function WhatsAppTab() {
  const adminStats = useQuery(api.whatsapp.getAdminStats);
  const adminLogs  = useQuery(api.whatsapp.getAdminLogs, { limit: 50 });

  const [activeSection, setActiveSection] = useState<"overview" | "settings" | "test" | "logs">("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black">واتساب GCCMSG API</h2>
            <p className="text-green-200 text-sm">إشعارات واتساب تلقائية عبر منصة GCCMSG</p>
          </div>
          {/* شارة الاتصال */}
          <div className="me-auto flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <Wifi className="w-4 h-4 text-green-200" />
            <span className="text-xs font-bold text-green-100">متصل</span>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {adminStats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{adminStats.total}</div>
              <div className="text-xs text-green-200">إجمالي الرسائل</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{adminStats.thisWeek}</div>
              <div className="text-xs text-green-200">هذا الأسبوع</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">
                {Object.keys(adminStats.byType ?? {}).length}
              </div>
              <div className="text-xs text-green-200">أنواع الرسائل</div>
            </div>
          </div>
        )}

      </div>

      {/* تبويبات داخلية */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="admin-tabs-scroll flex border-b border-gray-100 overflow-x-auto">
          {[
            { key: "overview", label: "نظرة عامة",    Icon: BarChart3 },
            { key: "settings", label: "إعدادات API",  Icon: Settings },
            { key: "test",     label: "اختبار الإرسال", Icon: Send },
            { key: "logs",     label: "سجل الرسائل",  Icon: MessageSquare },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex min-w-[138px] items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeSection === key
                  ? "border-green-600 text-green-700 bg-green-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeSection === "overview" && <OverviewSection stats={adminStats} />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "test"     && <TestSection />}
          {activeSection === "logs"     && <LogsSection logs={adminLogs} />}
        </div>
      </div>
    </div>
  );
}

/* ── نظرة عامة ── */
function OverviewSection({ stats }: { stats: any }) {
  const TYPE_LABELS: Record<string, string> = {
    confirmed_auto:      "تأكيد حجز (تلقائي)",
    cancelled_auto:      "إلغاء حجز (تلقائي)",
    payment_confirmed_auto: "تأكيد دفع (تلقائي)",
    confirmed_failed:    "تأكيد فاشل",
    cancelled_failed:    "إلغاء فاشل",
    payment_confirmed_failed: "دفع فاشل",
    manual:              "يدوي",
    test:                "اختبار",
  };

  const TYPE_COLORS: Record<string, string> = {
    confirmed_auto:         "bg-emerald-100 text-emerald-700",
    cancelled_auto:         "bg-red-100 text-red-700",
    payment_confirmed_auto: "bg-blue-100 text-blue-700",
    confirmed_failed:       "bg-orange-100 text-orange-700",
    cancelled_failed:       "bg-rose-100 text-rose-700",
    payment_confirmed_failed: "bg-orange-100 text-orange-700",
    manual:                 "bg-blue-100 text-blue-700",
    test:                   "bg-purple-100 text-purple-700",
  };

  // قراءة الإعدادات من قاعدة البيانات
  const gccInstance = useQuery(api.appSettings.get, { key: "gccmsg_instance" });
  const gccToken    = useQuery(api.appSettings.get, { key: "gccmsg_token" });
  const gccBaseUrl  = useQuery(api.appSettings.get, { key: "gccmsg_base_url" });

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const byType = stats.byType ?? {};
  const total  = stats.total ?? 0;

  return (
    <div className="space-y-6">
      {/* بطاقة حالة الاتصال */}
      <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-green-800">GCCMSG API — متصل ✅</h3>
            <p className="text-xs text-green-600">الإرسال التلقائي يعمل عبر الرابط المباشر</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <div className="text-gray-400 mb-0.5">الـ Instance</div>
            <div className="font-mono font-bold text-gray-700 truncate">
              {gccInstance ?? "instance2026062202153"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <div className="text-gray-400 mb-0.5">الـ Token</div>
            <div className="font-mono font-bold text-gray-700">
              {gccToken ? `${gccToken.slice(0, 8)}••••` : "db52b59f••••"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <div className="text-gray-400 mb-0.5">الـ Base URL</div>
            <div className="font-mono font-bold text-gray-700 truncate text-[10px]">
              {gccBaseUrl ?? "https://api.gccmsg.com/api"}
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-5 text-white">
          <MessageSquare className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{total}</div>
          <div className="text-white/80 text-xs mt-0.5">إجمالي الرسائل المرسلة</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
          <Calendar className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{stats.thisWeek}</div>
          <div className="text-white/80 text-xs mt-0.5">رسائل هذا الأسبوع</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white">
          <Zap className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">
            {total > 0
              ? Math.round(
                  ((byType["confirmed_auto"] ?? 0) +
                   (byType["cancelled_auto"] ?? 0) +
                   (byType["payment_confirmed_auto"] ?? 0)) /
                  total * 100
                )
              : 0}%
          </div>
          <div className="text-white/80 text-xs mt-0.5">نسبة الإرسال التلقائي</div>
        </div>
      </div>

      {/* توزيع أنواع الرسائل */}
      {Object.keys(byType).length > 0 ? (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-600" />
            توزيع أنواع الرسائل
          </h3>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, count]) => {
              const pct = total > 0 ? Math.round((count as number) / total * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[type] ?? type}
                    </span>
                    <span className="text-xs font-black text-gray-700">{count as number} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
          <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">لم يتم إرسال أي رسائل بعد</p>
          <p className="text-gray-400 text-sm mt-1">ستظهر الإحصائيات هنا بعد أول إرسال</p>
        </div>
      )}

      {/* متى تُرسل الرسائل */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" />
          متى تُرسل رسائل الواتساب تلقائياً؟
        </h3>
        <div className="space-y-2 text-sm text-amber-700">
          {[
            { icon: "💳", text: "عند إتمام العميل للدفع بنجاح — رسالة تأكيد الدفع" },
            { icon: "✅", text: "عند تأكيد الحجز من قِبل المكتب — رسالة تأكيد الحجز" },
            { icon: "❌", text: "عند إلغاء الحجز من المكتب أو العميل — رسالة الإلغاء" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── إعدادات API ── */
function SettingsSection() {
  const upsert = useMutation(api.appSettings.upsert);

  // قراءة القيم الحالية من قاعدة البيانات
  const dbAutoSend  = useQuery(api.appSettings.get, { key: "wa_auto_send" });
  const dbBaseUrl   = useQuery(api.appSettings.get, { key: "gccmsg_base_url" });
  const dbInstance  = useQuery(api.appSettings.get, { key: "gccmsg_instance" });
  const dbToken     = useQuery(api.appSettings.get, { key: "gccmsg_token" });

  // حالة محلية للتعديل
  const [localAutoSend, setLocalAutoSend] = useState<string | null>(null);
  const [localBaseUrl,  setLocalBaseUrl]  = useState<string | null>(null);
  const [localInstance, setLocalInstance] = useState<string | null>(null);
  const [localToken,    setLocalToken]    = useState<string | null>(null);
  const [showToken, setShowToken]         = useState(false);
  const [saving, setSaving]               = useState(false);

  const currentAutoSend = localAutoSend ?? dbAutoSend ?? "true";
  const currentBaseUrl  = localBaseUrl  ?? dbBaseUrl  ?? "https://api.gccmsg.com/api";
  const currentInstance = localInstance ?? dbInstance ?? "instance2026062202153";
  const currentToken    = localToken    ?? dbToken    ?? "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsert({ key: "wa_auto_send",    value: currentAutoSend }),
        upsert({ key: "gccmsg_base_url", value: currentBaseUrl }),
        upsert({ key: "gccmsg_instance", value: currentInstance }),
        upsert({ key: "gccmsg_token",    value: currentToken }),
      ]);
      toast.success("✅ تم حفظ إعدادات GCCMSG بنجاح");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* إعدادات GCCMSG API */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-600" />
          إعدادات GCCMSG API
        </h3>

        {/* Base URL */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            رابط الـ API (Base URL)
          </label>
          <input
            value={currentBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
            placeholder="https://api.gccmsg.com/api"
            className={inp}
            dir="ltr"
          />
        </div>

        {/* Instance ID */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            معرّف الـ Instance (Instance ID)
          </label>
          <input
            value={currentInstance}
            onChange={(e) => setLocalInstance(e.target.value)}
            placeholder="instance2026062202153"
            className={inp}
            dir="ltr"
          />
        </div>

        {/* Token */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            رمز المصادقة (Token)
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={currentToken}
              onChange={(e) => setLocalToken(e.target.value)}
              placeholder="أدخل الـ Token هنا"
              className={`${inp} pe-10`}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-blue-600 flex items-start gap-1.5 bg-blue-50 rounded-xl p-3 border border-blue-100">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          يمكنك الحصول على هذه البيانات من لوحة تحكم GCCMSG الخاصة بك.
          سيتم استخدامها تلقائياً عند إرسال رسائل الواتساب.
        </p>
      </div>

      {/* الإرسال التلقائي */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">الإرسال التلقائي</p>
            <p className="text-xs text-gray-500 mt-0.5">
              إرسال رسائل واتساب تلقائياً عند الدفع وتأكيد أو إلغاء الحجوزات
            </p>
          </div>
          <button
            onClick={() => setLocalAutoSend(currentAutoSend === "true" ? "false" : "true")}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              currentAutoSend === "true" ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              currentAutoSend === "true" ? "left-6" : "left-0.5"
            }`} />
          </button>
        </div>
        <div className={`mt-2 text-xs font-semibold ${
          currentAutoSend === "true" ? "text-green-600" : "text-gray-400"
        }`}>
          {currentAutoSend === "true" ? "✅ مفعّل" : "⏸️ موقوف"}
        </div>
      </div>

      {/* زر الحفظ */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-green-700 to-emerald-600 text-white font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</>
        ) : (
          <><Save className="w-4 h-4" />حفظ جميع الإعدادات</>
        )}
      </button>
    </div>
  );
}

/* ── اختبار الإرسال ── */
function TestSection() {
  const sendManual = useAction(api.whatsappActions.sendManual);

  const dbInstance = useQuery(api.appSettings.get, { key: "gccmsg_instance" });
  const dbToken    = useQuery(api.appSettings.get, { key: "gccmsg_token" });
  const dbBaseUrl  = useQuery(api.appSettings.get, { key: "gccmsg_base_url" });

  const currentInstance = dbInstance ?? "instance2026062202153";
  const currentToken    = dbToken    ?? "db52b59f8ff8653d0f01";
  const currentBaseUrl  = (dbBaseUrl ?? "https://api.gccmsg.com/api").replace(/\/$/, "");

  const [testPhone, setTestPhone]   = useState("");
  const [testMsg, setTestMsg]       = useState("🕌 مرحباً! هذه رسالة اختبار من منصة المسار الذكي. إذا وصلتك هذه الرسالة فإن إعداد GCCMSG API يعمل بشكل صحيح ✅");
  const [sending, setSending]       = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showUrlInfo, setShowUrlInfo] = useState(false);

  const bookings = useQuery(api.admin.getAllBookings);
  const firstBookingId = bookings?.[0]?._id;

  // بناء الـ URL المتوقع للعرض
  const cleanedPhone = testPhone.trim().replace(/[\s\-\(\)]/g, "").replace(/^\+/, "").replace(/^0([^0])/, "966$1");
  const previewUrl = `${currentBaseUrl}/${currentInstance}/messages/chat`;
  const previewBody = JSON.stringify({
    token: currentToken ? `${currentToken.slice(0,8)}••••` : "—",
    to: `${cleanedPhone || "9665xxxxxxxx"}@c.us`,
    body: testMsg.slice(0, 40) + "...",
    priority: 10,
  }, null, 2);

  const handleTest = async () => {
    if (!testPhone.trim()) { toast.error("أدخل رقم الهاتف"); return; }
    if (!firstBookingId) { toast.error("لا يوجد حجز في النظام لاختبار الإرسال"); return; }

    setSending(true);
    setLastResult(null);
    try {
      const result = await sendManual({
        bookingId: firstBookingId,
        phone: testPhone.trim(),
        messageText: testMsg,
        messageType: "test",
      });
      setLastResult(result);
      if (result.success) {
        toast.success("✅ تم إرسال رسالة الاختبار بنجاح!");
      } else {
        toast.error(`فشل الإرسال: ${result.error ?? "خطأ غير معروف"}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ";
      setLastResult({ success: false, error: msg });
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* معلومات الاتصال الحالية */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <button
          onClick={() => setShowUrlInfo(!showUrlInfo)}
          className="w-full flex items-center justify-between text-sm font-semibold text-blue-800"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            تفاصيل طلب الـ API (للتشخيص)
          </span>
          {showUrlInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showUrlInfo && (
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs text-blue-600 font-semibold mb-1">POST URL:</p>
              <code className="block text-xs bg-white border border-blue-100 rounded-lg p-2 font-mono text-blue-900 break-all">
                {previewUrl}
              </code>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold mb-1">Request Body (JSON):</p>
              <pre className="text-xs bg-white border border-blue-100 rounded-lg p-2 font-mono text-blue-900 overflow-x-auto">
                {previewBody}
              </pre>
            </div>
            <p className="text-xs text-blue-500 mt-1">
              💡 إذا فشل الإرسال، تحقق من صحة الـ Instance ID والـ Token في تبويب "إعدادات API"
            </p>
          </div>
        )}
      </div>

      {/* رقم الهاتف */}
      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-600" />
          رقم الهاتف للاختبار
        </label>
        <input
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          placeholder="05xxxxxxxx أو 9665xxxxxxxx"
          className={inp}
          dir="ltr"
        />
        {testPhone && (
          <p className="text-xs text-gray-400 mt-1 font-mono">
            سيُرسل إلى: <span className="text-emerald-600 font-bold">{cleanedPhone}@c.us</span>
          </p>
        )}
      </div>

      {/* نص الرسالة */}
      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          نص رسالة الاختبار
        </label>
        <textarea
          value={testMsg}
          onChange={(e) => setTestMsg(e.target.value)}
          rows={4}
          className={`${inp} resize-none`}
          dir="rtl"
        />
      </div>

      {/* زر الإرسال */}
      <button
        onClick={handleTest}
        disabled={sending || !testPhone.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-green-700 to-emerald-600 text-white font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" />جاري الإرسال...</>
        ) : (
          <><Send className="w-4 h-4" />إرسال رسالة اختبار عبر GCCMSG</>
        )}
      </button>

      {/* نتيجة الاختبار */}
      {lastResult && (
        <div className={`rounded-xl p-4 border ${
          lastResult.success
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${lastResult.success ? "text-emerald-800" : "text-red-700"}`}>
                {lastResult.success ? "تم الإرسال بنجاح ✅" : "فشل الإرسال ❌"}
              </p>
              {lastResult.error && (
                <div className="mt-2">
                  <p className="text-xs text-red-500 font-semibold mb-1">تفاصيل الخطأ:</p>
                  <pre className="text-xs text-red-600 font-mono bg-red-100 rounded-lg p-2 whitespace-pre-wrap break-all">
                    {lastResult.error}
                  </pre>
                  {lastResult.error.includes("404") && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                      ⚠️ خطأ 404: الـ Instance ID غير صحيح أو غير موجود. تحقق من الـ Instance ID في إعدادات GCCMSG.
                    </p>
                  )}
                  {lastResult.error.includes("401") && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                      ⚠️ خطأ 401: الـ Token غير صحيح. تحقق من الـ Token في إعدادات GCCMSG.
                    </p>
                  )}
                  {lastResult.error.includes("فشل الاتصال") && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                      ⚠️ تعذّر الوصول إلى الـ API. تحقق من صحة الـ Base URL.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* تعليمات الإعداد */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          كيفية الحصول على بيانات GCCMSG:
        </p>
        <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
          <li>سجّل دخولك على <span className="font-mono font-bold">gccmsg.com</span></li>
          <li>اذهب إلى لوحة التحكم ← الـ Instances</li>
          <li>انسخ الـ Instance ID والـ Token</li>
          <li>احفظهما في تبويب "إعدادات API" أعلاه</li>
        </ol>
      </div>
    </div>
  );
}

/* ── سجل الرسائل ── */
function LogsSection({ logs }: { logs: any[] | undefined }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TYPE_LABELS: Record<string, { label: string; cls: string; Icon: any }> = {
    confirmed_auto:         { label: "تأكيد تلقائي",    cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
    cancelled_auto:         { label: "إلغاء تلقائي",    cls: "bg-red-100 text-red-700",         Icon: XCircle },
    payment_confirmed_auto: { label: "دفع مؤكد تلقائي", cls: "bg-blue-100 text-blue-700",       Icon: CheckCircle },
    confirmed_failed:       { label: "تأكيد فاشل",      cls: "bg-orange-100 text-orange-700",   Icon: AlertCircle },
    cancelled_failed:       { label: "إلغاء فاشل",      cls: "bg-rose-100 text-rose-700",       Icon: AlertCircle },
    payment_confirmed_failed: { label: "دفع فاشل",      cls: "bg-orange-100 text-orange-700",   Icon: AlertCircle },
    manual:                 { label: "يدوي",             cls: "bg-blue-100 text-blue-700",       Icon: Send },
    test:                   { label: "اختبار",           cls: "bg-purple-100 text-purple-700",   Icon: Zap },
  };

  if (logs === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">لا توجد رسائل مسجّلة بعد</p>
        <p className="text-gray-400 text-sm mt-1">ستظهر هنا جميع رسائل واتساب المرسلة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          آخر {logs.length} رسالة
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          يتحدث تلقائياً
        </span>
      </div>

      {logs.map((log: any) => {
        const typeInfo = TYPE_LABELS[log.messageType] ?? {
          label: log.messageType,
          cls: "bg-gray-100 text-gray-600",
          Icon: MessageSquare,
        };
        const TypeIcon = typeInfo.Icon;
        const isExpanded = expandedId === log._id;

        return (
          <div key={log._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.cls}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeInfo.cls}`}>
                        {typeInfo.label}
                      </span>
                      <span className="font-mono text-xs text-emerald-700 font-bold">
                        {log.bookingReference}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.passengerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {log.officeName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {log.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-left">
                    <div className="text-xs text-gray-400">
                      {new Date(log.sentAt).toLocaleDateString("ar-SA")}
                    </div>
                    <div className="text-xs text-gray-300">
                      {new Date(log.sentAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* نص الرسالة */}
            {isExpanded && (
              <div className="border-t border-gray-50 bg-gray-50/50 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  نص الرسالة:
                </p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
                  {log.messageText}
                </pre>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  أُرسل بواسطة: {log.sentByName}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
