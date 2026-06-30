import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Mail, Shield, RefreshCw, CheckCircle, Loader2, Home } from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

export default function EmailVerificationPage({ onVerified, onBack }: { onVerified: () => void; onBack?: () => void }) {
  const user      = useQuery(api.auth.loggedInUser);
  const sendOtp   = useAction(api.otp.sendOtp);
  const verifyOtp = useAction(api.otp.verifyOtp);

  // الرمز كنص واحد مخزّن في input مخفي
  const [code, setCode]           = useState("");
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent]           = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess]     = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // إرسال OTP تلقائياً عند فتح الصفحة
  useEffect(() => {
    if (user?.email) handleSendOtp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // عداد تنازلي
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (sending || countdown > 0) return;
    setSending(true);
    try {
      const result = await sendOtp({});
      if (result.success) {
        setSent(true);
        setCountdown(120);
        toast.success("✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني!");
      } else {
        toast.error(result.error ?? "فشل إرسال الرمز");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  // عند تغيير قيمة الـ input المخفي
  const handleHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      handleVerify(digits);
    }
  };

  // لصق الرمز
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setCode(pasted);
    if (pasted.length === 6) handleVerify(pasted);
  };

  const handleVerify = async (codeStr?: string) => {
    const finalCode = codeStr ?? code;
    if (finalCode.length !== 6) {
      toast.error("أدخل الرمز المكوّن من 6 أرقام");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyOtp({ code: finalCode });
      if (result.success) {
        setSuccess(true);
        toast.success("🎉 تم تأكيد بريدك الإلكتروني بنجاح!");
        setTimeout(() => onVerified(), 1800);
      } else {
        toast.error(result.error ?? "الرمز غير صحيح");
        setCode("");
        hiddenRef.current?.focus();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ أثناء التحقق");
    } finally {
      setVerifying(false);
    }
  };

  // الخانات المعروضة (6 مربعات ثابتة)
  const digits = code.split("").concat(Array(6).fill("")).slice(0, 6);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">تم التحقق بنجاح! 🎉</h2>
          <p className="text-emerald-300">جارٍ تحويلك للتطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">

        {/* زر الرجوع */}
        {onBack && (
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-emerald-300 hover:text-white transition-colors text-sm font-semibold group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <Home className="w-4 h-4" />
              </div>
              العودة للصفحة الرئيسية
            </button>
          </div>
        )}

        {/* الشعار */}
        <div className="text-center mb-8">
          <img src={LOGO} alt="المسار الذكي" className="h-16 w-auto mx-auto mb-4" style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 16px rgba(240,208,128,0.4))" }} />
          <h1 className="text-2xl font-black text-white">تأكيد البريد الإلكتروني</h1>
          <p className="text-emerald-300 text-sm mt-1">خطوة أخيرة لتفعيل حسابك</p>
        </div>

        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* رأس البطاقة */}
          <div className="bg-gradient-to-l from-emerald-700 to-teal-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">أدخل رمز التحقق</h2>
            {user?.email && (
              <p className="text-emerald-100 text-sm mt-1">
                أرسلنا رمزاً إلى <span className="font-bold">{user.email}</span>
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">

            {/* حالة الإرسال */}
            {sending && !sent && (
              <div className="flex items-center justify-center gap-3 bg-blue-50 rounded-2xl p-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-blue-700 text-sm font-semibold">جارٍ إرسال رمز التحقق...</p>
              </div>
            )}

            {sent && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-800 text-sm font-bold">تم إرسال الرمز!</p>
                  <p className="text-emerald-600 text-xs">تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها</p>
                </div>
              </div>
            )}

            {/* ═══ خانات OTP الثابتة ═══
                input مخفي يستقبل الكتابة الفعلية،
                والمربعات الست مجرد عرض بصري ثابت */}
            <div>
              <p className="text-center text-sm text-gray-500 mb-4 font-medium">
                اضغط على الخانات ثم اكتب الرمز المكوّن من 6 أرقام
              </p>

              {/* الحاوية القابلة للضغط تفتح الكيبورد */}
              <div
                className="relative flex gap-2 justify-center cursor-text"
                onClick={() => hiddenRef.current?.focus()}
              >
                {/* input مخفي تماماً — يستقبل الكتابة */}
                <input
                  ref={hiddenRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleHiddenChange}
                  onPaste={handlePaste}
                  disabled={verifying || success}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  aria-label="أدخل رمز التحقق"
                />

                {/* المربعات الست — عرض بصري فقط */}
                {digits.map((d, i) => {
                  const isCurrent = i === code.length && !verifying;
                  return (
                    <div
                      key={i}
                      className={`
                        w-12 h-14 flex items-center justify-center
                        text-2xl font-black rounded-xl border-2
                        select-none transition-all duration-150
                        ${d
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : isCurrent
                            ? "border-emerald-400 bg-white shadow-md shadow-emerald-100"
                            : "border-gray-200 bg-gray-50 text-gray-300"
                        }
                        ${verifying ? "opacity-60" : ""}
                      `}
                    >
                      {/* نقطة وامضة في الخانة الحالية الفارغة */}
                      {d ? (
                        <span>{d}</span>
                      ) : isCurrent ? (
                        <span className="w-0.5 h-6 bg-emerald-500 rounded-full animate-pulse" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* تلميح */}
              <p className="text-center text-xs text-gray-400 mt-3">
                اضغط على الخانات لفتح لوحة المفاتيح
              </p>
            </div>

            {/* زر التحقق */}
            <button
              onClick={() => handleVerify()}
              disabled={verifying || code.length < 6 || success}
              className="w-full py-4 rounded-2xl bg-gradient-to-l from-emerald-700 to-teal-600 text-white font-black text-lg shadow-lg hover:shadow-xl hover:from-emerald-800 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ التحقق...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  تأكيد الرمز
                </>
              )}
            </button>

            {/* إعادة الإرسال — عداد تنازلي دائري */}
            <div className="flex flex-col items-center gap-3">
              {countdown > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#d1fae5" strokeWidth="5" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / 120)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-emerald-700 font-black text-lg leading-none">
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs text-center">
                    يمكنك إعادة الإرسال بعد انتهاء العداد
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={sending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 font-bold text-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${sending ? "animate-spin" : ""}`} />
                  {sending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
                </button>
              )}
            </div>

            {/* تعليمات */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-amber-800 text-xs font-bold mb-2">💡 لم يصلك الرمز؟</p>
              <ul className="text-amber-700 text-xs space-y-1 leading-relaxed">
                <li>• تحقق من مجلد <strong>البريد غير المرغوب فيه (Spam)</strong></li>
                <li>• تأكد من صحة البريد الإلكتروني المسجّل</li>
                <li>• انتظر دقيقة ثم اضغط "إعادة إرسال الرمز"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* معلومات الأمان */}
        <div className="mt-4 text-center">
          <p className="text-emerald-400 text-xs flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            رمز التحقق صالح لمدة 10 دقائق فقط
          </p>
        </div>
      </div>
    </div>
  );
}
