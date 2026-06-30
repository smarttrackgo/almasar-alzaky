import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  MessageCircle, Send, Copy, History, ChevronDown, ChevronUp,
  Bell, CheckCheck, AlertCircle, Edit3, Phone, X, Zap,
  CheckCircle, Clock, TrendingUp, Filter,
} from "lucide-react";

// ── قوالب الرسائل ──
export const WA_TEMPLATES = {
  confirmed: (name: string, ref: string, pkg: string, price: string, office: string) =>
    `السلام عليكم ${name} 🌙\n\nيسعدنا إبلاغكم بأنه تم *تأكيد حجزكم* بنجاح ✅\n\n📋 رقم الحجز: *${ref}*\n🕌 البرنامج: ${pkg}\n🏢 مكتب السفر: ${office}\n💰 الإجمالي: ${price} ر.س\n\nنتمنى لكم رحلة مباركة وعمرة مقبولة 🤲\nالمسار الذكي للعمرة`,

  pending: (name: string, ref: string, pkg: string, office: string) =>
    `السلام عليكم ${name} 🌙\n\nتم استلام طلب حجزكم بنجاح ⏳\n\n📋 رقم الحجز: *${ref}*\n🕌 البرنامج: ${pkg}\n🏢 مكتب السفر: ${office}\n\nسيتم مراجعة طلبكم وتأكيده في أقرب وقت.\nالمسار الذكي للعمرة`,

  cancelled: (name: string, ref: string) =>
    `السلام عليكم ${name}\n\nنأسف لإبلاغكم بأنه تم *إلغاء حجزكم* ❌\n\n📋 رقم الحجز: *${ref}*\n\nللاستفسار أو إعادة الحجز، يرجى التواصل معنا.\nنعتذر عن أي إزعاج 🙏\nالمسار الذكي للعمرة`,

  completed: (name: string, ref: string) =>
    `السلام عليكم ${name} 🌟\n\nنبارك لكم إتمام رحلة العمرة المباركة ✨\n\n📋 رقم الحجز: *${ref}*\n\nتقبّل الله منكم صالح الأعمال 🤲\nيسعدنا تقييمكم لتجربتكم معنا.\nالمسار الذكي للعمرة`,

  reminder: (name: string, ref: string, pkg: string, date: string) =>
    `السلام عليكم ${name} 🌙\n\nتذكير بموعد رحلتكم القادمة 📅\n\n📋 رقم الحجز: *${ref}*\n🕌 البرنامج: ${pkg}\n📆 تاريخ الانطلاق: ${date}\n\nيرجى التأكد من جاهزية الوثائق المطلوبة.\nالمسار الذكي للعمرة`,

  documents: (name: string, ref: string) =>
    `السلام عليكم ${name} 📄\n\nتذكير بالوثائق المطلوبة لرحلة العمرة:\n\n✅ جواز السفر (ساري المفعول)\n✅ صورة من الهوية الوطنية\n✅ صورة شخصية بيضاء الخلفية\n✅ شهادة التطعيمات\n\n📋 رقم الحجز: *${ref}*\n\nالمسار الذكي للعمرة`,

  custom: () => "",
};

export const TEMPLATE_LABELS: Record<string, { label: string; color: string; icon: any; emoji: string }> = {
  confirmed:  { label: "تأكيد الحجز",      color: "emerald", icon: CheckCheck,  emoji: "✅" },
  pending:    { label: "استلام الطلب",      color: "amber",   icon: Clock,       emoji: "⏳" },
  cancelled:  { label: "إلغاء الحجز",      color: "red",     icon: AlertCircle, emoji: "❌" },
  completed:  { label: "إتمام الرحلة",     color: "blue",    icon: CheckCircle, emoji: "🌟" },
  reminder:   { label: "تذكير بالرحلة",    color: "purple",  icon: Bell,        emoji: "📅" },
  documents:  { label: "الوثائق المطلوبة", color: "orange",  icon: Edit3,       emoji: "📄" },
  custom:     { label: "رسالة مخصصة",      color: "gray",    icon: Edit3,       emoji: "✏️" },
};

// ── مكوّن بطاقة واتساب لحجز واحد (مُحسَّن) ──
export function WhatsAppCard({ booking, officeId }: { booking: any; officeId: any }) {
  const [open, setOpen]           = useState(false);
  const [template, setTemplate]   = useState<keyof typeof WA_TEMPLATES>("confirmed");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending]     = useState(false);
  const [showLogs, setShowLogs]   = useState(false);
  const [copied, setCopied]       = useState(false);

  const logNotification = useMutation(api.whatsapp.logNotification);
  const logs = useQuery(
    api.whatsapp.getLogsForBooking,
    showLogs ? { bookingId: booking._id } : "skip"
  );

  const buildMessage = () => {
    const name  = booking.leadPassengerName ?? "";
    const ref   = booking.bookingReference ?? "";
    const pkg   = booking.package?.title ?? "";
    const price = booking.totalPrice?.toLocaleString("ar-SA") ?? "";
    const office = booking.office?.name ?? "";
    const date  = booking.package?.departureDate
      ? new Date(booking.package.departureDate).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : "";

    if (template === "custom") return customMsg;
    if (template === "confirmed")  return WA_TEMPLATES.confirmed(name, ref, pkg, price, office);
    if (template === "pending")    return WA_TEMPLATES.pending(name, ref, pkg, office);
    if (template === "cancelled")  return WA_TEMPLATES.cancelled(name, ref);
    if (template === "completed")  return WA_TEMPLATES.completed(name, ref);
    if (template === "reminder")   return WA_TEMPLATES.reminder(name, ref, pkg, date);
    if (template === "documents")  return WA_TEMPLATES.documents(name, ref);
    return "";
  };

  const phone = (booking.leadPassengerPhone ?? "").replace(/\D/g, "");
  const intlPhone = phone.startsWith("0") ? "966" + phone.slice(1) : phone;

  const handleSend = async () => {
    const msg = buildMessage();
    if (!msg.trim()) { toast.error("الرسالة فارغة"); return; }
    if (!intlPhone) { toast.error("رقم الجوال غير متوفر"); return; }

    setSending(true);
    try {
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      await logNotification({
        bookingId: booking._id,
        phone: intlPhone,
        messageType: template as string,
        messageText: msg,
      });
      toast.success("✅ تم فتح واتساب وتسجيل الإشعار");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم نسخ الرسالة 📋");
  };

  const logsCount = logs?.length ?? 0;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* زر الإشعار الرئيسي */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-all border border-green-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          إشعار واتساب
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* زر السجل */}
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <History className="w-3.5 h-3.5" />
          السجل
          {logsCount > 0 && showLogs && (
            <span className="bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{logsCount}</span>
          )}
        </button>

        {/* رقم الجوال */}
        {intlPhone && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span dir="ltr">{intlPhone}</span>
          </span>
        )}
      </div>

      {/* لوحة إرسال الرسالة */}
      {open && (
        <div className="mt-3 bg-gradient-to-b from-green-50 to-white rounded-2xl p-4 border border-green-200 shadow-sm">
          {/* اختيار القالب */}
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-green-600" />
            اختر نوع الرسالة:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(Object.keys(TEMPLATE_LABELS) as Array<keyof typeof TEMPLATE_LABELS>).map((key) => {
              const { label, emoji } = TEMPLATE_LABELS[key];
              const active = template === key;
              return (
                <button
                  key={key}
                  onClick={() => setTemplate(key as keyof typeof WA_TEMPLATES)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-green-600 text-white shadow-sm scale-105"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-700"
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* معاينة / تحرير الرسالة */}
          <div className="relative">
            <textarea
              value={template === "custom" ? customMsg : buildMessage()}
              onChange={(e) => { if (template === "custom") setCustomMsg(e.target.value); }}
              readOnly={template !== "custom"}
              rows={6}
              className={`w-full text-sm rounded-xl border p-3 resize-none leading-relaxed ${
                template === "custom"
                  ? "bg-white border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                  : "bg-white/80 border-green-200 text-gray-700 cursor-default"
              }`}
              dir="rtl"
            />
            <button
              onClick={handleCopy}
              className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                copied ? "bg-green-100 text-green-700" : "bg-white/90 hover:bg-white text-gray-500 hover:text-gray-700 border border-gray-200"
              }`}
            >
              {copied ? <><CheckCheck className="w-3 h-3" />نُسخ!</> : <><Copy className="w-3 h-3" />نسخ</>}
            </button>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-md"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {sending ? "جاري الفتح..." : "فتح واتساب وإرسال"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-white text-gray-500 font-bold text-sm hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* سجل الإشعارات */}
      {showLogs && (
        <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            سجل الإشعارات المرسلة
          </p>
          {logs === undefined ? (
            <div className="text-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto" /></div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">لم يُرسل أي إشعار بعد</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log: any) => {
                const tpl = TEMPLATE_LABELS[log.messageType] ?? { label: log.messageType, emoji: "📨" };
                return (
                  <div key={log._id} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>{tpl.emoji}</span>{tpl.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.sentAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{log.messageText}</p>
                    <p className="text-xs text-gray-400 mt-1">بواسطة: {log.sentByName}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── تبويب مركز الإشعارات الكامل للمكتب ──
export function WhatsAppCenterTab({ officeId, officeName }: { officeId: any; officeName: string }) {
  const stats = useQuery(api.whatsapp.getOfficeStats, { officeId });
  const logs  = useQuery(api.whatsapp.getOfficeWhatsappLogs, { officeId, limit: 100 });
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = (logs ?? []).filter((log: any) => {
    const matchType = filterType === "all" || log.messageType === filterType;
    const matchSearch = !search ||
      log.passengerName?.includes(search) ||
      log.bookingReference?.includes(search) ||
      log.phone?.includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإشعارات", value: stats.total, color: "from-green-500 to-green-700", emoji: "📨" },
            { label: "تأكيد الحجز",      value: stats.byType["confirmed"] ?? 0,  color: "from-emerald-500 to-emerald-700", emoji: "✅" },
            { label: "تذكير بالرحلة",    value: stats.byType["reminder"] ?? 0,   color: "from-purple-500 to-purple-700",  emoji: "📅" },
            { label: "إتمام الرحلة",     value: stats.byType["completed"] ?? 0,  color: "from-blue-500 to-blue-700",      emoji: "🌟" },
          ].map(({ label, value, color, emoji }, i) => (
            <div key={i} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-2xl font-black">{value}</div>
              <div className="text-white/75 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* آخر إرسال */}
      {stats?.lastSentAt && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">آخر إشعار مُرسَل</p>
            <p className="text-xs text-green-600 mt-0.5">
              {new Date(stats.lastSentAt).toLocaleString("ar-SA", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
        </div>
      )}

      {/* فلاتر البحث */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">فلترة السجل</span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الحجز أو الجوال..."
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-green-500 transition-all"
          dir="rtl"
        />
        <div className="flex flex-wrap gap-2">
          {["all", ...Object.keys(TEMPLATE_LABELS)].map((type) => {
            const tpl = TEMPLATE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === type
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tpl ? <><span>{tpl.emoji}</span>{tpl.label}</> : `الكل (${logs?.length ?? 0})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* جدول السجل */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-l from-green-800 to-green-700 px-5 py-4 flex items-center justify-between">
          <h3 className="text-white font-black flex items-center gap-2">
            <History className="w-5 h-5" />
            سجل الإشعارات ({filtered.length})
          </h3>
          <div className="text-green-200 text-xs">{officeName}</div>
        </div>

        {logs === undefined ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((log: any) => {
              const tpl = TEMPLATE_LABELS[log.messageType] ?? { label: log.messageType, emoji: "📨", color: "gray" };
              return (
                <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* أيقونة النوع */}
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-lg">
                        {tpl.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-gray-800 text-sm">{log.passengerName}</span>
                          <span className="text-xs font-mono text-emerald-600 font-bold">{log.bookingReference}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{log.phone}</span>
                          <span>•</span>
                          <span>بواسطة: {log.sentByName}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg px-2 py-1">{log.messageText}</p>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <span className={`text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-full`}>
                        {tpl.label}
                      </span>
                      <div className="text-xs text-gray-400 mt-1 text-left">
                        {new Date(log.sentAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

