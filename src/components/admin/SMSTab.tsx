import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Smartphone, Send, CheckCircle, XCircle, Clock,
  Settings, BarChart3, MessageSquare, Eye, EyeOff,
  RefreshCw, AlertCircle, Info, ToggleLeft, ToggleRight,
  Phone, Hash, Key, Loader2, Globe,
} from "lucide-react";

const MSG_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  driver_assigned:   { label: "تعيين السائق",    color: "bg-amber-100 text-amber-700",     icon: "🚌" },
  driver_accepted:   { label: "قبول السائق",     color: "bg-blue-100 text-blue-700",       icon: "✅" },
  trip_started:      { label: "انطلاق الرحلة",   color: "bg-green-100 text-green-700",     icon: "🚀" },
  trip_completed:    { label: "اكتمال الرحلة",   color: "bg-emerald-100 text-emerald-700", icon: "🏁" },
  booking_confirmed: { label: "تأكيد الحجز",     color: "bg-purple-100 text-purple-700",   icon: "📋" },
  manual:            { label: "يدوي",             color: "bg-gray-100 text-gray-700",       icon: "✍️" },
};

export default function SMSTab() {
  const stats    = useQuery(api.sms.adminGetStats);
  const settings = useQuery(api.sms.adminGetSettings);
  const logs     = useQuery(api.sms.adminGetLogs, { limit: 50 });

  const saveSetting = useMutation(api.sms.adminSaveSetting);
  const sendManual  = useAction(api.smsActions.adminSendSMS);

  const [activeSection, setActiveSection] = useState<"overview" | "settings" | "logs" | "test">("overview");
  const [showTokens, setShowTokens]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [sending, setSending]             = useState(false);
  const [formLoaded, setFormLoaded]       = useState(false);

  const [form, setForm] = useState({
    sms_enabled:          "true",
    sms_provider:         "unifonic",
    twilio_account_sid:   "",
    twilio_auth_token:    "",
    twilio_from_number:   "",
    unifonic_app_sid:     "",
    unifonic_sender_id:   "",
    unifonic_base_url:    "https://el.cloud.unifonic.com/rest/SMS/messages",
    sms_driver_assigned:  "true",
    sms_driver_accepted:  "true",
    sms_trip_started:     "true",
    sms_trip_completed:   "true",
  });

  if (settings && !formLoaded) {
    setForm({
      sms_enabled:          settings.sms_enabled          || "true",
      sms_provider:         settings.sms_provider         || "unifonic",
      twilio_account_sid:   settings.twilio_account_sid   || "",
      twilio_auth_token:    settings.twilio_auth_token     || "",
      twilio_from_number:   settings.twilio_from_number    || "",
      unifonic_app_sid:     settings.unifonic_app_sid     || "",
      unifonic_sender_id:   settings.unifonic_sender_id   || "",
      unifonic_base_url:    settings.unifonic_base_url    || "https://el.cloud.unifonic.com/rest/SMS/messages",
      sms_driver_assigned:  settings.sms_driver_assigned   || "true",
      sms_driver_accepted:  settings.sms_driver_accepted   || "true",
      sms_trip_started:     settings.sms_trip_started      || "true",
      sms_trip_completed:   settings.sms_trip_completed    || "true",
    });
    setFormLoaded(true);
  }

  const [testPhone,   setTestPhone]   = useState("");
  const [testMessage, setTestMessage] = useState("مرحباً! هذه رسالة اختبار من المسار الذكي للعمرة.");

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        await saveSetting({ key, value });
      }
      toast.success("تم حفظ إعدادات SMS بنجاح!");
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) { toast.error("أدخل رقم الجوال"); return; }
    if (!testMessage.trim()) { toast.error("أدخل نص الرسالة"); return; }
    setSending(true);
    try {
      const result = await sendManual({ phone: testPhone, message: testMessage });
      if (result.success) {
        toast.success("تم إرسال SMS بنجاح!");
      } else {
        toast.error("فشل الإرسال: " + result.error);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const isEnabled = form.sms_enabled === "true";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">نظام SMS</h2>
              <p className="text-blue-200 text-sm mt-0.5">إشعارات نصية تلقائية عبر Twilio</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
            isEnabled ? "bg-green-500/30 border border-green-400/40" : "bg-red-500/30 border border-red-400/40"
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {isEnabled ? "SMS مفعّل" : "SMS موقوف"}
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "إجمالي الرسائل", value: stats.total,  color: "bg-white/15" },
              { label: "مُرسَلة",         value: stats.sent,   color: "bg-green-500/20" },
              { label: "فاشلة",           value: stats.failed, color: "bg-red-500/20" },
              { label: "اليوم",           value: stats.today,  color: "bg-amber-500/20" },
            ].map((s, i) => (
              <div key={i} className={`${s.color} rounded-xl p-3 text-center`}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {[
          { key: "overview", label: "نظرة عامة",  Icon: BarChart3 },
          { key: "settings", label: "الإعدادات",   Icon: Settings },
          { key: "logs",     label: "سجل الرسائل", Icon: MessageSquare },
          { key: "test",     label: "اختبار",       Icon: Send },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeSection === key ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {stats && Object.keys(stats.byType).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                توزيع الرسائل حسب النوع
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const info = MSG_TYPE_LABELS[type] ?? { label: type, color: "bg-gray-100 text-gray-700", icon: "📨" };
                  const pct = stats.total > 0 ? Math.round(((count as number) / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${info.color} whitespace-nowrap`}>
                        {info.icon} {info.label}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-black text-gray-700 w-8 text-left">{count as number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              متى تُرسَل رسائل SMS؟
            </h3>
            <div className="space-y-3">
              {[
                { icon: "🚌", event: "تعيين السائق",  desc: "عند تعيين سائق للرحلة من لوحة المكتب" },
                { icon: "✅", event: "قبول السائق",   desc: "عند قبول السائق للرحلة من لوحة السائق" },
                { icon: "🚀", event: "انطلاق الرحلة", desc: "عند ضغط السائق على زر بدء الرحلة" },
                { icon: "🏁", event: "اكتمال الرحلة", desc: "عند إنهاء السائق للرحلة" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{item.event}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              كيفية إعداد Twilio
            </h3>
            <ol className="space-y-2 text-sm text-blue-700">
              <li className="flex gap-2"><span className="font-black">1.</span> سجّل في <strong>twilio.com</strong> وأنشئ حساباً مجانياً</li>
              <li className="flex gap-2"><span className="font-black">2.</span> من لوحة Twilio، انسخ <strong>Account SID</strong> و <strong>Auth Token</strong></li>
              <li className="flex gap-2"><span className="font-black">3.</span> احصل على رقم هاتف Twilio (مجاني في التجربة)</li>
              <li className="flex gap-2"><span className="font-black">4.</span> أدخل البيانات في تبويب <strong>الإعدادات</strong> واحفظها</li>
              <li className="flex gap-2"><span className="font-black">5.</span> اختبر الإرسال من تبويب <strong>اختبار</strong></li>
            </ol>
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 font-medium">
                ملاحظة: في حساب Twilio التجريبي، يمكنك الإرسال فقط للأرقام المُتحقق منها. للإرسال لأي رقم، يجب ترقية الحساب.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {activeSection === "settings" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">تفعيل نظام SMS</h3>
                <p className="text-sm text-gray-500 mt-0.5">تفعيل أو إيقاف إرسال رسائل SMS تلقائياً</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, sms_enabled: f.sms_enabled === "true" ? "false" : "true" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  isEnabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {isEnabled ? "مفعّل" : "موقوف"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              مزود خدمة SMS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "unifonic", title: "Unifonic", desc: "أنسب للسعودية ويدعم Sender ID محلي" },
                { key: "twilio", title: "Twilio", desc: "موجود حالياً لكنه أعلى تكلفة داخل السعودية" },
              ].map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, sms_provider: provider.key }))}
                  className={`text-right rounded-2xl border-2 p-4 transition-all ${
                    form.sms_provider === provider.key
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                  }`}
                >
                  <div className="font-black">{provider.title}</div>
                  <div className="text-xs mt-1 opacity-75">{provider.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {form.sms_provider === "unifonic" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  بيانات Unifonic
                </h3>
                <button onClick={() => setShowTokens(!showTokens)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                  {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showTokens ? "إخفاء" : "إظهار"}
                </button>
              </div>
              {[
                { key: "unifonic_app_sid", label: "AppSid", placeholder: "Application SID", Icon: Key, secret: true },
                { key: "unifonic_sender_id", label: "SenderID", placeholder: "ALMASAR", Icon: Hash, secret: false },
                { key: "unifonic_base_url", label: "API URL", placeholder: "https://el.cloud.unifonic.com/rest/SMS/messages", Icon: Globe, secret: false },
              ].map(({ key, label, placeholder, Icon, secret }) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    <Icon className="w-4 h-4 inline ml-1.5 text-blue-500" />
                    {label}
                  </label>
                  <input
                    type={secret && !showTokens ? "password" : "text"}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm transition-all"
                  />
                </div>
              ))}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                يجب تسجيل SenderID واعتماده من مزود الخدمة قبل الإرسال الفعلي داخل السعودية.
              </div>
            </div>
          )}

          {form.sms_provider === "twilio" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                بيانات Twilio
              </h3>
              <button onClick={() => setShowTokens(!showTokens)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTokens ? "إخفاء" : "إظهار"}
              </button>
            </div>
            {[
              { key: "twilio_account_sid",  label: "Account SID",  placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", Icon: Hash },
              { key: "twilio_auth_token",   label: "Auth Token",   placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",   Icon: Key },
              { key: "twilio_from_number",  label: "رقم المُرسِل", placeholder: "+1xxxxxxxxxx",                       Icon: Phone },
            ].map(({ key, label, placeholder, Icon }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  <Icon className="w-4 h-4 inline ml-1.5 text-blue-500" />
                  {label}
                </label>
                <input
                  type={showTokens || key === "twilio_from_number" ? "text" : "password"}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm transition-all"
                />
              </div>
            ))}
          </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              أنواع الرسائل التلقائية
            </h3>
            <div className="space-y-3">
              {[
                { key: "sms_driver_assigned", label: "تعيين السائق",  icon: "🚌" },
                { key: "sms_driver_accepted", label: "قبول السائق",   icon: "✅" },
                { key: "sms_trip_started",    label: "انطلاق الرحلة", icon: "🚀" },
                { key: "sms_trip_completed",  label: "اكتمال الرحلة", icon: "🏁" },
              ].map(({ key, label, icon }) => {
                const enabled = form[key as keyof typeof form] !== "false";
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span className="font-semibold text-gray-700 text-sm">{label}</span>
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, [key]: enabled ? "false" : "true" }))}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${enabled ? "bg-blue-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${enabled ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-600 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      )}

      {/* Logs */}
      {activeSection === "logs" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              سجل رسائل SMS ({logs?.length ?? 0})
            </h3>
            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث
            </button>
          </div>
          {!logs || logs.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">لا توجد رسائل SMS بعد</p>
              <p className="text-gray-300 text-sm mt-1">ستظهر هنا الرسائل المُرسَلة تلقائياً</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log: any) => {
                const info = MSG_TYPE_LABELS[log.messageType] ?? { label: log.messageType, color: "bg-gray-100 text-gray-700", icon: "📨" };
                return (
                  <div key={log._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.status === "sent" ? "bg-green-100" : log.status === "failed" ? "bg-red-100" : "bg-amber-100"
                      }`}>
                        {log.status === "sent"   ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         log.status === "failed" ? <XCircle     className="w-4 h-4 text-red-500"   /> :
                                                   <Clock       className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.color}`}>
                            {info.icon} {info.label}
                          </span>
                          <span className="text-xs text-gray-400 font-mono" dir="ltr">{log.phone}</span>
                          {log.user?.name && <span className="text-xs text-gray-500">{log.user.name}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{log.messageText}</p>
                        {log.error && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {log.error}
                          </p>
                        )}
                        {log.twilioSid && (
                          <p className="text-[10px] text-gray-300 mt-1 font-mono" dir="ltr">SID: {log.twilioSid}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{new Date(log.sentAt).toLocaleDateString("ar-SA")}</p>
                        <p className="text-[10px] text-gray-300">{new Date(log.sentAt).toLocaleTimeString("ar-SA")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Test */}
      {activeSection === "test" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              إرسال SMS تجريبي
            </h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الجوال</label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="05xxxxxxxx أو +9665xxxxxxxx"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">نص الرسالة</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{testMessage.length} حرف</p>
            </div>
            <button
              onClick={handleSendTest}
              disabled={sending || !testPhone.trim() || !testMessage.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-blue-700 to-blue-600 text-white font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sending ? "جاري الإرسال..." : "إرسال SMS تجريبي"}
            </button>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">تأكد من إعداد Twilio أولاً</p>
              <p className="text-xs text-amber-600 mt-1">
                يجب إدخال Account SID وAuth Token ورقم المُرسِل في تبويب الإعدادات قبل الاختبار.
                في الحساب التجريبي، يمكن الإرسال فقط للأرقام المُتحقق منها في Twilio.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
