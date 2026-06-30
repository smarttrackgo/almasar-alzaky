import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Mail, CheckCircle, XCircle, Clock, BarChart3,
  Loader2, AlertCircle, Send, RefreshCw,
  Calendar, User, Hash, Filter, Eye,
  TrendingUp, Inbox, ShieldCheck, Zap,
  Info, BookOpen,
} from "lucide-react";

/* ── تسميات أنواع الإيميل ── */
const TYPE_LABELS: Record<string, string> = {
  otp:               "رمز التحقق (OTP)",
  booking_confirmed: "تأكيد الحجز",
  booking_cancelled: "إلغاء الحجز",
  ticket:            "التذكرة الكاملة",
  payment_confirmed: "تأكيد الدفع",
  password_reset:    "إعادة تعيين كلمة المرور",
  welcome:           "ترحيب بالمستخدم",
  trip_reminder:     "تذكير قبل الرحلة",
};

const TYPE_COLORS: Record<string, string> = {
  otp:               "bg-purple-100 text-purple-700",
  booking_confirmed: "bg-emerald-100 text-emerald-700",
  booking_cancelled: "bg-red-100 text-red-700",
  ticket:            "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-teal-100 text-teal-700",
  password_reset:    "bg-orange-100 text-orange-700",
  welcome:           "bg-pink-100 text-pink-700",
  trip_reminder:     "bg-amber-100 text-amber-700",
};

const TYPE_ICONS: Record<string, string> = {
  otp:               "🔐",
  booking_confirmed: "🎉",
  booking_cancelled: "❌",
  ticket:            "🎫",
  payment_confirmed: "💳",
  password_reset:    "🔑",
  welcome:           "🤲",
  trip_reminder:     "⏰",
};

export default function EmailTab() {
  const stats = useQuery(api.email.getStats);
  const logs  = useQuery(api.email.getLogs, { limit: 100 });

  const [activeSection, setActiveSection] = useState<"overview" | "logs" | "info">("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-700 to-indigo-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black">نظام الإيميل — Resend</h2>
            <p className="text-blue-200 text-sm">إيميلات تلقائية احترافية عبر منصة Resend</p>
          </div>
          <div className="me-auto flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-bold text-blue-100">مفعّل</span>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{stats.total}</div>
              <div className="text-xs text-blue-200">إجمالي الإيميلات</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{stats.sent}</div>
              <div className="text-xs text-blue-200">تم الإرسال</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{stats.successRate}%</div>
              <div className="text-xs text-blue-200">نسبة النجاح</div>
            </div>
          </div>
        )}
      </div>

      {/* تبويبات داخلية */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { key: "overview", label: "نظرة عامة",    Icon: BarChart3 },
            { key: "logs",     label: "سجل الإيميلات", Icon: Inbox },
            { key: "info",     label: "متى تُرسل؟",   Icon: Info },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeSection === key
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeSection === "overview" && <OverviewSection stats={stats} />}
          {activeSection === "logs"     && <LogsSection logs={logs} />}
          {activeSection === "info"     && <InfoSection />}
        </div>
      </div>
    </div>
  );
}

/* ── نظرة عامة ── */
function OverviewSection({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const byType = stats.byType ?? {};
  const total  = stats.total ?? 0;

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl p-5 text-white">
          <Mail className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{total}</div>
          <div className="text-white/80 text-xs mt-0.5">إجمالي الإيميلات</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
          <CheckCircle className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{stats.sent}</div>
          <div className="text-white/80 text-xs mt-0.5">تم الإرسال بنجاح</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl p-5 text-white">
          <XCircle className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{stats.failed}</div>
          <div className="text-white/80 text-xs mt-0.5">فشل الإرسال</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white">
          <TrendingUp className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
          <div className="text-3xl font-black">{stats.successRate}%</div>
          <div className="text-white/80 text-xs mt-0.5">نسبة النجاح</div>
        </div>
      </div>

      {/* آخر 7 أيام */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" />
          إحصائيات آخر 7 أيام
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
            <div className="text-2xl font-black text-blue-700">{stats.recentTotal}</div>
            <div className="text-xs text-gray-500 mt-0.5">إجمالي</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
            <div className="text-2xl font-black text-emerald-600">{stats.recentSent}</div>
            <div className="text-xs text-gray-500 mt-0.5">ناجح</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
            <div className="text-2xl font-black text-red-500">{stats.recentFailed}</div>
            <div className="text-xs text-gray-500 mt-0.5">فاشل</div>
          </div>
        </div>
      </div>

      {/* توزيع أنواع الإيميلات */}
      {Object.keys(byType).length > 0 ? (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            توزيع أنواع الإيميلات
          </h3>
          <div className="space-y-3">
            {Object.entries(byType)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([type, count]) => {
                const pct = total > 0 ? Math.round((count as number) / total * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_ICONS[type] ?? "📧"} {TYPE_LABELS[type] ?? type}
                      </span>
                      <span className="text-xs font-black text-gray-700">{count as number} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
          <Mail className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">لم يتم إرسال أي إيميلات بعد</p>
          <p className="text-gray-400 text-sm mt-1">ستظهر الإحصائيات هنا بعد أول إرسال</p>
        </div>
      )}
    </div>
  );
}

/* ── سجل الإيميلات ── */
function LogsSection({ logs }: { logs: any[] | undefined }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const resendTicket = useAction(api.emailActions.resendTicket);
  const [resending, setResending] = useState<string | null>(null);

  if (!logs) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filtered = logs.filter((log) => {
    const typeOk   = filterType   === "all" || log.emailType === filterType;
    const statusOk = filterStatus === "all" || log.status    === filterStatus;
    return typeOk && statusOk;
  });

  const handleResend = async (bookingId: string) => {
    setResending(bookingId);
    try {
      const result = await resendTicket({ bookingId: bookingId as any });
      if (result.success) {
        toast.success("✅ تم إعادة إرسال التذكرة بنجاح");
      } else {
        toast.error(result.error ?? "فشل إعادة الإرسال");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* فلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
          >
            <option value="all">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
        >
          <option value="all">كل الحالات</option>
          <option value="sent">تم الإرسال</option>
          <option value="failed">فشل</option>
          <option value="pending">معلق</option>
        </select>
        <span className="text-xs text-gray-400 self-center">
          {filtered.length} سجل
        </span>
      </div>

      {/* الجدول */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
          <Inbox className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">لا توجد سجلات</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-l from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">الحالة</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">النوع</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">المستلم</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">رقم الحجز</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">الوقت</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600 text-xs">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  {/* الحالة */}
                  <td className="px-4 py-3">
                    {log.status === "sent" ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> أُرسل
                      </span>
                    ) : log.status === "failed" ? (
                      <span className="flex items-center gap-1 text-red-500 font-bold text-xs">
                        <XCircle className="w-3.5 h-3.5" /> فشل
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" /> معلق
                      </span>
                    )}
                  </td>
                  {/* النوع */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[log.emailType] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_ICONS[log.emailType] ?? "📧"} {TYPE_LABELS[log.emailType] ?? log.emailType}
                    </span>
                  </td>
                  {/* المستلم */}
                  <td className="px-4 py-3">
                    <span className="text-gray-700 font-mono text-xs">{log.recipientEmail}</span>
                  </td>
                  {/* رقم الحجز */}
                  <td className="px-4 py-3">
                    {log.bookingRef ? (
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {log.bookingRef}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  {/* الوقت */}
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs">
                      {new Date(log._creationTime).toLocaleString("ar-SA", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </td>
                  {/* إجراء */}
                  <td className="px-4 py-3">
                    {log.bookingId && log.emailType === "ticket" && (
                      <button
                        onClick={() => handleResend(log.bookingId)}
                        disabled={resending === log.bookingId}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                      >
                        {resending === log.bookingId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        إعادة إرسال
                      </button>
                    )}
                    {log.status === "failed" && log.error && (
                      <span className="text-xs text-red-400 truncate max-w-[120px] block" title={log.error}>
                        ⚠️ {log.error.slice(0, 30)}…
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── متى تُرسل الإيميلات؟ ── */
function InfoSection() {
  const triggers = [
    {
      icon: "🔐",
      title: "رمز التحقق (OTP)",
      desc: "عند إنشاء حساب جديد — يُرسل رمز تحقق صالح 10 دقائق",
      color: "bg-purple-50 border-purple-200",
      badge: "bg-purple-100 text-purple-700",
    },
    {
      icon: "🤲",
      title: "ترحيب بالمستخدم",
      desc: "بعد تأكيد البريد الإلكتروني — رسالة ترحيب مع خطوات البدء",
      color: "bg-pink-50 border-pink-200",
      badge: "bg-pink-100 text-pink-700",
    },
    {
      icon: "💳",
      title: "تأكيد الدفع",
      desc: "عند إتمام العميل للدفع بنجاح — إيصال الدفع مع رقم المعاملة",
      color: "bg-teal-50 border-teal-200",
      badge: "bg-teal-100 text-teal-700",
    },
    {
      icon: "🎉",
      title: "تأكيد الحجز",
      desc: "عند تأكيد الحجز من قِبل المكتب — تفاصيل الرحلة كاملة",
      color: "bg-emerald-50 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: "🎫",
      title: "التذكرة الكاملة",
      desc: "عند إصدار التذكرة — تذكرة رقمية كاملة بجميع التفاصيل",
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
    },
    {
      icon: "⏰",
      title: "تذكير قبل الرحلة",
      desc: "قبل 24 ساعة من موعد الانطلاق — تذكير مع قائمة التحضير",
      color: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
    {
      icon: "❌",
      title: "إلغاء الحجز",
      desc: "عند إلغاء الحجز من المكتب أو العميل — إشعار الإلغاء",
      color: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700",
    },
    {
      icon: "🔑",
      title: "إعادة تعيين كلمة المرور",
      desc: "عند طلب إعادة تعيين كلمة المرور — رمز صالح 15 دقيقة",
      color: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="space-y-4">
      {/* بطاقة Resend */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-blue-800">Resend API — مُفعّل ✅</h3>
            <p className="text-xs text-blue-600">جميع الإيميلات تُرسل عبر منصة Resend الاحترافية</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="text-gray-400 mb-0.5">المرسِل</div>
            <div className="font-mono font-bold text-gray-700">onboarding@resend.dev</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="text-gray-400 mb-0.5">متغير البيئة</div>
            <div className="font-mono font-bold text-gray-700">RESEND_API_KEY</div>
          </div>
        </div>
      </div>

      {/* قائمة المشغّلات */}
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-blue-600" />
          متى تُرسل الإيميلات تلقائياً؟
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {triggers.map((t, i) => (
            <div key={i} className={`border rounded-2xl p-4 ${t.color}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badge}`}>
                    {t.title}
                  </span>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ملاحظة */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700 leading-relaxed">
            <strong>ملاحظة:</strong> لتفعيل الإرسال الفعلي، تأكد من إضافة متغير البيئة{" "}
            <code className="bg-amber-100 px-1 rounded font-mono">RESEND_API_KEY</code>{" "}
            في إعدادات Convex. بدونه، سيُسجَّل الإيميل كـ "فاشل" في السجلات.
          </div>
        </div>
      </div>
    </div>
  );
}
