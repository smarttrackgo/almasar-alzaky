import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import { toast } from "sonner";
import {
  CalendarDays, Users, Hash, Building2, Star,
  MapPin, Navigation, X, Send, CheckCircle,
  MessageCircle, Phone, Copy, XCircle, AlertTriangle,
  Clock, Loader2, FileText, CreditCard, User, Ticket,
} from "lucide-react";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "مؤكد",         cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغي",         cls: "bg-red-100 text-red-600" },
  completed: { label: "مكتمل",        cls: "bg-blue-100 text-blue-700" },
};

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";
// خلفية فاتحة → لا حاجة لـ mix-blend-mode هنا (الشعار يظهر بشكل طبيعي)

export default function BookingsPage({ navigate }: { navigate: (p: Page) => void }) {
  const bookings = useQuery(api.bookings.myBookings);
  const [reviewModal,  setReviewModal]  = useState<{ bookingId: Id<"bookings">; packageTitle: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<any | null>(null); // بيانات الحجز الجديد
  const [cancelModal,  setCancelModal]  = useState<any | null>(null); // بيانات الحجز للإلغاء

  if (bookings === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-emerald-900">حجوزاتي</h1>
          <p className="text-gray-500 mt-1 text-sm">تتبع جميع حجوزاتك في مكان واحد</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CalendarDays className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد حجوزات بعد</h3>
            <p className="text-gray-400 text-sm mb-6">ابدأ رحلتك الروحانية الآن</p>
            <button
              onClick={() => navigate({ name: "home" })}
              className="px-6 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
            >
              استعرض البرامج
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b, i) => {
              const st = STATUS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
              const isCompleted = b.status === "completed";
              const isCancelled = b.status === "cancelled";

              // حساب ما إذا كان الإلغاء مسموحاً (أكثر من 24 ساعة)
              const departureMs = b.package ? new Date(b.package.departureDate).getTime() : 0;
              const hoursLeft   = (departureMs - Date.now()) / (1000 * 60 * 60);
              const canCancel   = !isCancelled && !isCompleted && hoursLeft > 24;
              const tooLateToCancel = !isCancelled && !isCompleted && hoursLeft <= 24 && hoursLeft > 0;

              return (
                <div
                  key={b._id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden anim-fade-up d-${Math.min(i * 100 + 100, 500)}`}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-emerald-800 to-emerald-900 px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{b.package?.title ?? "برنامج محذوف"}</div>
                      <div className="text-emerald-200 text-sm flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {b.office?.name}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { Icon: Hash,         label: "رقم الحجز",      value: b.bookingReference, cls: "text-emerald-700 font-bold" },
                        { Icon: Users,        label: "المسافرون",       value: `${b.adultsCount} بالغ${b.childrenCount ? ` + ${b.childrenCount} طفل` : ""}` },
                        { Icon: CalendarDays, label: "تاريخ الانطلاق", value: b.package ? new Date(b.package.departureDate).toLocaleDateString("ar-SA") : "-" },
                        { Icon: null,         label: "الإجمالي",        value: `${b.totalPrice.toLocaleString("ar-SA")} ر.س`, cls: "font-black text-emerald-800" },
                      ].map((row, j) => (
                        <div key={j}>
                          <div className="text-xs text-gray-400 mb-0.5">{row.label}</div>
                          <div className={`text-sm ${row.cls ?? "font-semibold text-gray-800"}`}>{row.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* تنبيه قرب موعد الانطلاق */}
                    {tooLateToCancel && (
                      <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700 text-xs font-semibold">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        الانطلاق خلال أقل من 24 ساعة — لا يمكن الإلغاء ذاتياً، تواصل مع المكتب
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">
                        المسافر الرئيسي: <span className="font-semibold text-gray-700">{b.leadPassengerName}</span>
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* زر عرض التذكرة الرقمية */}
                        <button
                          onClick={() => navigate({ name: "booking-detail", bookingId: b._id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          عرض التذكرة
                        </button>

                        {/* زر رسالة الحجز */}
                        {!isCancelled && (
                          <button
                            onClick={() => setConfirmModal(b)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            رسالة الحجز
                          </button>
                        )}

                        {/* زر تتبع الرحلة — يظهر عند وجود رحلة نشطة */}
                        {b.trip && ["driver_assigned","driver_accepted","in_progress","completed"].includes(b.trip.status) && (
                          <button
                            onClick={() => navigate({ name: "trip-tracking" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors animate-pulse-once"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            {b.trip.status === "in_progress" ? "🔴 تتبع مباشر" : "تتبع الرحلة"}
                          </button>
                        )}

                        {/* زر التقييم للرحلات المكتملة */}
                        {isCompleted && (
                          <ReviewButton
                            bookingId={b._id}
                            packageTitle={b.package?.title ?? ""}
                            onOpen={() => setReviewModal({ bookingId: b._id, packageTitle: b.package?.title ?? "" })}
                          />
                        )}

                        {/* زر الإلغاء */}
                        {canCancel && (
                          <button
                            onClick={() => setCancelModal(b)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            إلغاء الحجز
                          </button>
                        )}

                        <button
                          onClick={() => b.packageId && navigate({ name: "package", id: b.packageId })}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold transition-colors"
                        >
                          عرض البرنامج ←
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مودال رسالة الحجز */}
      {confirmModal && (
        <BookingMessageModal
          booking={confirmModal}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {/* مودال تأكيد الإلغاء */}
      {cancelModal && (
        <CancelConfirmModal
          booking={cancelModal}
          onClose={() => setCancelModal(null)}
          onCancelled={() => { setCancelModal(null); toast.success("تم إلغاء الحجز بنجاح"); }}
        />
      )}

      {/* مودال التقييم */}
      {reviewModal && (
        <ReviewModal
          bookingId={reviewModal.bookingId}
          packageTitle={reviewModal.packageTitle}
          onClose={() => setReviewModal(null)}
        />
      )}
    </div>
  );
}

// ─── مودال رسالة الحجز (واتساب / جوال) ──────────────────────────
function BookingMessageModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const departureDate = booking.package
    ? new Date(booking.package.departureDate).toLocaleDateString("ar-SA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const returnDate = booking.package?.returnDate
    ? new Date(booking.package.returnDate).toLocaleDateString("ar-SA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const message = `
🕌 *تأكيد حجز عمرة — المسار الذكي*
━━━━━━━━━━━━━━━━━━━━
📋 *رقم الحجز:* ${booking.bookingReference}
📦 *البرنامج:* ${booking.package?.title ?? "—"}
🏢 *مكتب السفر:* ${booking.office?.name ?? "—"}
━━━━━━━━━━━━━━━━━━━━
👤 *المسافر الرئيسي:* ${booking.leadPassengerName}
📞 *الجوال:* ${booking.leadPassengerPhone}
🪪 *رقم الهوية:* ${booking.leadPassengerIdNumber}
👥 *عدد المسافرين:* ${booking.adultsCount} بالغ${booking.childrenCount ? ` + ${booking.childrenCount} طفل` : ""}
━━━━━━━━━━━━━━━━━━━━
✈️ *تاريخ الانطلاق:* ${departureDate}
🔙 *تاريخ العودة:* ${returnDate}
💰 *إجمالي المبلغ:* ${booking.totalPrice.toLocaleString("ar-SA")} ريال سعودي
📊 *حالة الحجز:* ${booking.status === "confirmed" ? "✅ مؤكد" : booking.status === "pending" ? "⏳ قيد المراجعة" : booking.status}
━━━━━━━━━━━━━━━━━━━━
${booking.notes ? `📝 *ملاحظات:* ${booking.notes}\n━━━━━━━━━━━━━━━━━━━━\n` : ""}
🌐 منصة المسار الذكي للعمرة
  `.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("تم نسخ الرسالة! الصقها في واتساب أو الرسائل 📋");
    } catch {
      toast.error("تعذّر النسخ، حاول مرة أخرى");
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleSMS = () => {
    const encoded = encodeURIComponent(message);
    window.open(`sms:?body=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="logo" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-white font-black text-lg">رسالة تأكيد الحجز</h2>
              <p className="text-emerald-200 text-xs mt-0.5">أرسلها عبر واتساب أو الجوال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* بطاقة ملخص الحجز */}
        <div className="px-6 pt-5 flex-shrink-0">
          <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Hash className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-xs text-gray-400">رقم الحجز</div>
                <div className="font-black text-emerald-700 text-sm">{booking.bookingReference}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <div className="text-xs text-gray-400">المسافر</div>
                <div className="font-bold text-gray-800 text-sm truncate max-w-[100px]">{booking.leadPassengerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="text-xs text-gray-400">الانطلاق</div>
                <div className="font-bold text-gray-800 text-sm">
                  {booking.package ? new Date(booking.package.departureDate).toLocaleDateString("ar-SA") : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <div className="text-xs text-gray-400">الإجمالي</div>
                <div className="font-black text-purple-700 text-sm">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</div>
              </div>
            </div>
          </div>
        </div>

        {/* نص الرسالة */}
        <div className="px-6 pt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              نص الرسالة الجاهزة
            </label>
            <span className="text-xs text-gray-400">انسخها وأرسلها مباشرة</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line font-mono text-xs max-h-48 overflow-y-auto">
            {message}
          </div>
        </div>

        {/* أزرار الإرسال */}
        <div className="px-6 py-5 flex-shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* واتساب */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 shadow-md"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              إرسال واتساب
            </button>

            {/* رسالة نصية */}
            <button
              onClick={handleSMS}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-blue-600 to-blue-500 transition-all hover:opacity-90 shadow-md"
            >
              <Phone className="w-4 h-4" />
              رسالة نصية
            </button>
          </div>

          {/* نسخ */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
              copied
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            {copied ? (
              <><CheckCircle className="w-4 h-4" />تم النسخ!</>
            ) : (
              <><Copy className="w-4 h-4" />نسخ الرسالة</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── مودال تأكيد الإلغاء ─────────────────────────────────────────
function CancelConfirmModal({
  booking,
  onClose,
  onCancelled,
}: {
  booking: any;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const cancelBooking = useMutation(api.bookings.cancelByUser);

  const departureDate = booking.package
    ? new Date(booking.package.departureDate).toLocaleDateString("ar-SA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const hoursLeft = booking.package
    ? Math.floor((new Date(booking.package.departureDate).getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelBooking({ bookingId: booking._id });
      onCancelled();
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ أثناء الإلغاء");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-l from-red-600 to-red-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">إلغاء الحجز</h2>
              <p className="text-red-100 text-xs mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* تفاصيل الحجز */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">رقم الحجز</span>
              <span className="font-black text-emerald-700 text-sm">{booking.bookingReference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">البرنامج</span>
              <span className="font-semibold text-gray-800 text-sm text-left max-w-[200px] truncate">{booking.package?.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">تاريخ الانطلاق</span>
              <span className="font-semibold text-gray-800 text-sm">{departureDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">الوقت المتبقي</span>
              <span className="font-bold text-amber-600 text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {hoursLeft} ساعة
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-xs text-gray-400">المبلغ المدفوع</span>
              <span className="font-black text-gray-800">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</span>
            </div>
          </div>

          {/* تحذير */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-bold text-sm">تنبيه مهم</p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                بعد الإلغاء سيتم إعادة المقاعد للبرنامج. تواصل مع المكتب لمعرفة سياسة استرداد المبلغ.
              </p>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              تراجع
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-l from-red-600 to-red-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />جاري الإلغاء...</>
              ) : (
                <><XCircle className="w-4 h-4" />تأكيد الإلغاء</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── زر التقييم (يتحقق إذا قيّم مسبقاً) ─────────────────────────
function ReviewButton({
  bookingId,
  packageTitle,
  onOpen,
}: {
  bookingId: Id<"bookings">;
  packageTitle: string;
  onOpen: () => void;
}) {
  const existing = useQuery(api.reviews.myReviewForBooking, { bookingId });

  if (existing === undefined) return null;

  if (existing) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold">
        <CheckCircle className="w-3.5 h-3.5" />
        قيّمت ({existing.rating}★)
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
    >
      <Star className="w-3.5 h-3.5" />
      قيّم الرحلة
    </button>
  );
}

// ─── مودال التقييم ────────────────────────────────────────────────
function ReviewModal({
  bookingId,
  packageTitle,
  onClose,
}: {
  bookingId: Id<"bookings">;
  packageTitle: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const createReview = useMutation(api.reviews.create);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("يرجى اختيار تقييم"); return; }
    if (comment.trim().length < 10) { toast.error("يرجى كتابة تعليق لا يقل عن 10 أحرف"); return; }
    setLoading(true);
    try {
      await createReview({ bookingId, rating, comment: comment.trim() });
      toast.success("شكراً! تم إرسال تقييمك بنجاح 🌟");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const LABELS = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-lg">قيّم رحلتك</h2>
            <p className="text-amber-100 text-sm mt-0.5 truncate max-w-xs">{packageTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* النجوم */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-3">كيف كانت تجربتك؟</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      s <= (hovered || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-amber-600 font-bold text-sm">{LABELS[hovered || rating]}</p>
            )}
          </div>

          {/* التعليق */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              شاركنا تجربتك
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="اكتب تعليقك هنا... (10 أحرف على الأقل)"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none text-sm text-right"
            />
            <p className="text-xs text-gray-400 mt-1 text-left">{comment.length} حرف</p>
          </div>

          {/* أزرار */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال التقييم
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
