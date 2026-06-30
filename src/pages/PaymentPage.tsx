import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import { toast } from "sonner";
import {
  CreditCard, CheckCircle2, ArrowRight,
  Shield, Lock, ChevronLeft, Loader2, AlertCircle, Ticket,
  Mail, RefreshCw, Wallet,
} from "lucide-react";

// الإعدادات الثابتة لكل طريقة دفع (بدون الصور — تُجلب ديناميكياً)
const METHOD_META = [
  {
    id: "mada",
    settingKey: "payment_img_mada",
    label: "مدى",
    desc: "بطاقة مدى المصرفية",
    fallbackImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Mada_Logo.svg/320px-Mada_Logo.svg.png",
    cardBg: "bg-[#0a2240]",
    cardBorder: "border-[#00b4d8]",
    walletBg: "bg-[#0a2240]",
    walletText: "text-[#00b4d8]",
    imgClass: "h-8 w-auto object-contain",
    imgBigClass: "h-12 w-auto object-contain",
  },
  {
    id: "stc_pay",
    settingKey: "payment_img_stc",
    label: "STC Pay",
    desc: "محفظة STC Pay",
    fallbackImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/STC_Pay_Logo.svg/320px-STC_Pay_Logo.svg.png",
    cardBg: "bg-[#7b2d8b]",
    cardBorder: "border-purple-400",
    walletBg: "bg-gradient-to-br from-[#7b2d8b] to-[#4a1060]",
    walletText: "text-purple-200",
    imgClass: "h-8 w-auto object-contain",
    imgBigClass: "h-12 w-auto object-contain",
  },
  {
    id: "apple_pay",
    settingKey: "payment_img_apple",
    label: "Apple Pay",
    desc: "Apple Pay",
    fallbackImg: "https://polished-pony-114.convex.cloud/api/storage/0c781a71-e621-42ff-941b-9aeca76e4559",
    cardBg: "bg-black",
    cardBorder: "border-gray-600",
    walletBg: "bg-black",
    walletText: "text-gray-300",
    imgClass: "h-7 w-auto object-contain",
    imgBigClass: "h-10 w-auto object-contain",
  },
  {
    id: "google_pay",
    settingKey: "payment_img_google",
    label: "Google Pay",
    desc: "Google Pay",
    fallbackImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/320px-Google_Pay_Logo.svg.png",
    cardBg: "bg-white",
    cardBorder: "border-gray-300",
    walletBg: "bg-white",
    walletText: "text-gray-600",
    imgClass: "h-7 w-auto object-contain",
    imgBigClass: "h-10 w-auto object-contain",
  },
];

export default function PaymentPage({
  bookingId,
  navigate,
}: {
  bookingId: Id<"bookings">;
  navigate: (p: Page) => void;
}) {
  const user         = useQuery(api.auth.loggedInUser);
  const booking      = useQuery(api.bookings.getBookingById, { bookingId });
  const walletData   = useQuery(api.wallet.getMyWallet);
  const settingsMap  = useQuery(api.appSettings.getMap);
  const createPayment  = useMutation(api.payments.create);
  const confirmPayment = useMutation(api.payments.confirm);
  const resendTicket   = useAction(api.emailActions.resendTicket);

  // دمج الصور الديناميكية مع البيانات الثابتة
  const METHODS = METHOD_META.map((m) => ({
    ...m,
    imgUrl: (settingsMap?.[m.settingKey] && settingsMap[m.settingKey] !== "")
      ? settingsMap[m.settingKey]
      : m.fallbackImg,
  }));

  const [method, setMethod]         = useState("mada");
  const [useWallet, setUseWallet]   = useState(false);
  const [step, setStep]             = useState<"select" | "processing" | "done">("select");
  const [txnId, setTxnId]           = useState("");
  const [cardNum, setCardNum]       = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");
  const [loading, setLoading]       = useState(false);
  const [resending, setResending]   = useState(false);

  if (booking === undefined || user === undefined || walletData === undefined || settingsMap === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">الحجز غير موجود</p>
          <button onClick={() => navigate({ name: "bookings" })} className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold">
            حجوزاتي
          </button>
        </div>
      </div>
    );
  }

  const walletBalance    = walletData?.balance ?? 0;
  const hasEnoughWallet  = walletBalance >= booking.totalPrice;
  const selectedMethod   = METHODS.find((m) => m.id === method)!;
  const activeMethod     = useWallet ? "wallet" : method;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!useWallet && method === "mada" && (!cardNum || !expiry || !cvv)) {
      toast.error("يرجى إدخال بيانات البطاقة كاملة");
      return;
    }

    if (useWallet && !hasEnoughWallet) {
      toast.error("رصيد المحفظة غير كافٍ لإتمام الدفع");
      return;
    }

    setLoading(true);
    setStep("processing");
    try {
      const result = await createPayment({
        bookingId,
        amount: booking.totalPrice,
        method: activeMethod,
        cardLast4: !useWallet && cardNum ? cardNum.slice(-4) : undefined,
        cardBrand: !useWallet && method === "mada" ? "mada" : activeMethod,
      });
      setTxnId(result.transactionId);
      await new Promise((r) => setTimeout(r, 2000));
      await confirmPayment({ paymentId: result.paymentId });
      setStep("done");
      toast.success("تم الدفع بنجاح! 🎉 تم إرسال التذكرة على بريدك الإلكتروني");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الدفع");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const handleResendTicket = async () => {
    setResending(true);
    try {
      const result = await resendTicket({ bookingId });
      if (result.success) {
        toast.success("✅ تم إعادة إرسال التذكرة على بريدك الإلكتروني");
      } else {
        toast.error(result.error ?? "فشل إعادة الإرسال");
      }
    } catch {
      toast.error("فشل إعادة إرسال التذكرة");
    } finally {
      setResending(false);
    }
  };

  // ── Done ──
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">✓</span>
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-2">تم الدفع بنجاح!</h2>
            <p className="text-emerald-200 text-sm mb-6">
              تم تأكيد حجزك وإرسال التذكرة على بريدك الإلكتروني 🎉
            </p>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-right space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-200">رقم المعاملة</span>
                <span className="font-mono font-bold text-white text-xs bg-white/10 px-2 py-1 rounded-lg">{txnId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-200">رقم الحجز</span>
                <span className="font-mono font-bold text-emerald-300">{booking.bookingReference}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-200">المبلغ المدفوع</span>
                <span className="font-black text-white text-lg">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-200">طريقة الدفع</span>
                {useWallet ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-700">
                    <Wallet className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-200 text-xs font-bold">المحفظة الرقمية</span>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${selectedMethod.cardBg}`}>
                    <img src={selectedMethod.imgUrl} alt={selectedMethod.label} className="h-5 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-4 mb-6 flex items-start gap-3 text-right">
              <div className="w-9 h-9 bg-blue-400/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5 text-blue-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-100 font-bold text-sm">تم إرسال التذكرة على بريدك</p>
                <p className="text-blue-200/70 text-xs mt-0.5 truncate">
                  {user?.email ?? "بريدك الإلكتروني المسجّل"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate({ name: "booking-detail", bookingId })}
                className="w-full py-3.5 rounded-2xl bg-white text-emerald-800 font-black shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                عرض التذكرة الرقمية
              </button>

              <button
                onClick={handleResendTicket}
                disabled={resending}
                className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {resending ? "جاري الإرسال..." : "إعادة إرسال التذكرة بالإيميل"}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate({ name: "bookings" })}
                  className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                >
                  حجوزاتي
                </button>
                <button
                  onClick={() => navigate({ name: "home" })}
                  className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                >
                  الرئيسية
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-3 text-white/60 text-xs">
            <Shield className="w-4 h-4" />
            <span>جميع المعاملات مشفرة وآمنة بتقنية SSL 256-bit</span>
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // ── Processing ──
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">جاري معالجة الدفع...</h2>
          <p className="text-gray-400 text-sm">يرجى الانتظار، لا تغلق الصفحة</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 text-sm">
            <Shield className="w-4 h-4" />
            <span>دفع آمن ومشفر</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Select ──
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate({ name: "bookings" })}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 mb-6 font-medium text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> العودة للحجوزات
        </button>

        <h1 className="text-2xl font-black text-gray-800 mb-6">إتمام الدفع</h1>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">ملخص الطلب</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">البرنامج</span>
              <span className="font-semibold text-gray-800">{(booking as any).package?.title ?? "برنامج عمرة"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الحجز</span>
              <span className="font-bold text-emerald-700">{booking.bookingReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">عدد المسافرين</span>
              <span className="font-semibold">{booking.adultsCount} بالغ</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
              <span className="font-bold text-gray-700">الإجمالي</span>
              <span className="font-black text-xl text-emerald-700">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</span>
            </div>
          </div>
        </div>

        {/* ── خيار الدفع من المحفظة ── */}
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs font-bold text-amber-700 mb-4">
          الإجمالي شامل مصاريف تشغيل وخدمات المنصة.
        </div>

        {walletBalance > 0 && (
          <div
            onClick={() => setUseWallet(!useWallet)}
            className={`cursor-pointer rounded-2xl border-2 p-5 mb-6 transition-all ${
              useWallet
                ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  useWallet ? "bg-emerald-600" : "bg-emerald-100"
                }`}>
                  <Wallet className={`w-6 h-6 ${useWallet ? "text-white" : "text-emerald-600"}`} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">ادفع من المحفظة الرقمية</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    رصيدك الحالي:{" "}
                    <span className={`font-black ${hasEnoughWallet ? "text-emerald-600" : "text-red-500"}`}>
                      {walletBalance.toLocaleString("ar-SA")} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* مؤشر التحديد */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                useWallet ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
              }`}>
                {useWallet && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>

            {/* تحذير رصيد غير كافٍ */}
            {useWallet && !hasEnoughWallet && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs font-semibold">
                  رصيد المحفظة غير كافٍ. تحتاج {(booking.totalPrice - walletBalance).toLocaleString("ar-SA")} ر.س إضافية.
                </p>
              </div>
            )}

            {/* تأكيد الكفاية */}
            {useWallet && hasEnoughWallet && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-700 text-xs font-semibold">
                  رصيدك كافٍ! سيتم خصم {booking.totalPrice.toLocaleString("ar-SA")} ر.س من محفظتك.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── طرق الدفع الأخرى (تُخفى عند اختيار المحفظة) ── */}
        {!useWallet && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                طريقة الدفع
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`relative p-4 rounded-2xl border-2 text-right transition-all ${
                      method === m.id
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                    }`}
                  >
                    {method === m.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`mb-2.5 flex items-center justify-center h-10 rounded-xl px-2 ${m.cardBg}`}>
                      <img src={m.imgUrl} alt={m.label} className={m.imgClass} />
                    </div>
                    <div className="font-bold text-gray-800 text-sm">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details (for mada) */}
            {method === "mada" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> بيانات البطاقة
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">رقم البطاقة</label>
                    <input
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">تاريخ الانتهاء</label>
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CVV</label>
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="000"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Digital Wallet Info */}
            {method !== "mada" && (
              <div className={`rounded-2xl border-2 p-5 mb-6 ${selectedMethod.walletBg} ${selectedMethod.cardBorder}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center px-2 ${selectedMethod.cardBg}`}>
                    <img src={selectedMethod.imgUrl} alt={selectedMethod.label} className={selectedMethod.imgBigClass} />
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${selectedMethod.walletText}`}>الدفع عبر {selectedMethod.label}</div>
                    <div className={`text-xs mt-0.5 ${selectedMethod.id === "google_pay" ? "text-gray-400" : "text-white/60"}`}>
                      سيتم تحويلك لإتمام الدفع بأمان عبر {selectedMethod.label}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-3 text-gray-400 text-xs mb-6">
          <Lock className="w-4 h-4" />
          <span>جميع المعاملات مشفرة وآمنة بتقنية SSL 256-bit</span>
          <Shield className="w-4 h-4" />
        </div>

        {/* Pay Button */}
        <form onSubmit={handlePay}>
          <button
            type="submit"
            disabled={loading || (useWallet && !hasEnoughWallet)}
            className="w-full py-4 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black text-lg shadow-xl hover:shadow-2xl hover:from-emerald-800 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {useWallet ? <Wallet className="w-5 h-5" /> : null}
                <span>{useWallet ? "ادفع من المحفظة" : "ادفع الآن"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-lg text-base">
                  {booking.totalPrice.toLocaleString("ar-SA")} ر.س
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
