import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import {
  Mail, KeyRound, Lock, ArrowRight, CheckCircle2,
  RefreshCw, Eye, EyeOff, ShieldCheck, Loader2,
} from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

type Step = "email" | "code" | "password" | "success";

export default function ForgotPasswordPage({ navigate }: { navigate: (p: Page) => void }) {
  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [code, setCode]           = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shownCode, setShownCode] = useState<string | null>(null); // للعرض التجريبي فقط

  const requestReset  = useMutation(api.passwordReset.requestReset);
  const resetPassword = useAction(api.passwordReset.resetPassword);
  const codeExpiry    = useQuery(
    api.passwordReset.getCodeExpiry,
    email ? { email } : "skip"
  );

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // عداد تنازلي
  useEffect(() => {
    if (!codeExpiry?.expiresAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((codeExpiry.expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── الخطوة 1: إرسال الإيميل ──
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("أدخل بريدك الإلكتروني"); return; }
    setLoading(true);
    try {
      const result = await requestReset({ email: email.trim() });
      // نعرض الرمز مؤقتاً في الواجهة (بدلاً من إرسال إيميل حقيقي)
      if (result?.code) {
        setShownCode(result.code);
      }
      toast.success("✅ تم إرسال رمز التحقق");
      setStep("code");
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  // ── إدخال الرمز (6 خانات) ──
  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  // ── الخطوة 2: التحقق من الرمز ──
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) { toast.error("أدخل الرمز المكوّن من 6 أرقام"); return; }
    setLoading(true);
    try {
      // نتحقق من الرمز مباشرة بالانتقال للخطوة التالية
      // (التحقق الفعلي يحدث عند إعادة التعيين)
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  // ── الخطوة 3: تعيين كلمة المرور الجديدة ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    if (newPassword !== confirmPassword) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        code: code.join(""),
        newPassword,
      });
      setStep("success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ، تأكد من صحة الرمز");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 px-4 py-16" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={LOGO} alt="المسار الذكي" className="h-20 w-auto mx-auto mb-4" style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 16px rgba(240,208,128,0.4))" }} />
          <p className="text-emerald-300 text-sm">استرداد كلمة المرور</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { key: "email",    label: "البريد",   icon: Mail },
            { key: "code",     label: "الرمز",    icon: KeyRound },
            { key: "password", label: "كلمة المرور", icon: Lock },
          ].map(({ key, label, icon: Icon }, i) => {
            const steps: Step[] = ["email", "code", "password", "success"];
            const currentIdx = steps.indexOf(step);
            const stepIdx = steps.indexOf(key as Step);
            const isDone = currentIdx > stepIdx;
            const isActive = currentIdx === stepIdx;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isDone ? "bg-emerald-500 text-white" :
                    isActive ? "bg-white text-emerald-700 shadow-lg" :
                    "bg-white/10 text-white/40"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? "text-white" : isDone ? "text-emerald-400" : "text-white/30"}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-8 h-0.5 mb-4 rounded-full transition-all ${isDone ? "bg-emerald-500" : "bg-white/20"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* ── الخطوة 1: إدخال الإيميل ── */}
          {step === "email" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-gray-800">نسيت كلمة المرور؟</h2>
                <p className="text-gray-500 text-sm mt-1">أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق</p>
              </div>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      className={`${inp} pr-10 text-left`}
                      dir="ltr"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                </button>
              </form>
            </div>
          )}

          {/* ── الخطوة 2: إدخال الرمز ── */}
          {step === "code" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-gray-800">أدخل رمز التحقق</h2>
                <p className="text-gray-500 text-sm mt-1">
                  تم إرسال رمز مكوّن من 6 أرقام إلى
                </p>
                <p className="text-emerald-700 font-bold text-sm mt-0.5" dir="ltr">{email}</p>
              </div>

              {/* عرض الرمز التجريبي */}
              {shownCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-amber-600 font-semibold mb-1">🔔 رمز التحقق (للتجربة فقط)</p>
                  <p className="text-2xl font-black text-amber-800 tracking-widest">{shownCode}</p>
                  <p className="text-xs text-amber-500 mt-1">في التطبيق الحقيقي سيُرسل للبريد الإلكتروني</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-5">
                {/* خانات الرمز */}
                <div className="flex justify-center gap-2" dir="ltr" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${
                        digit
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-white text-gray-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      }`}
                    />
                  ))}
                </div>

                {/* عداد تنازلي */}
                {countdown > 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    ينتهي الرمز خلال{" "}
                    <span className={`font-bold ${countdown < 60 ? "text-red-500" : "text-emerald-600"}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </p>
                ) : (
                  <p className="text-center text-sm text-red-500 font-semibold">⚠️ انتهت صلاحية الرمز</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.join("").length < 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? "جاري التحقق..." : "التحقق من الرمز"}
                </button>

                {/* إعادة الإرسال */}
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(["","","","","",""]); setShownCode(null); }}
                  className="w-full py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة إرسال الرمز
                </button>
              </form>
            </div>
          )}

          {/* ── الخطوة 3: كلمة المرور الجديدة ── */}
          {step === "password" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-black text-gray-800">كلمة المرور الجديدة</h2>
                <p className="text-gray-500 text-sm mt-1">اختر كلمة مرور قوية لحسابك</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      required
                      minLength={8}
                      className={`${inp} pl-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* مؤشر قوة كلمة المرور */}
                  {newPassword && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map((level) => {
                        const strength = newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4
                          : newPassword.length >= 10 ? 3
                          : newPassword.length >= 8 ? 2 : 1;
                        return (
                          <div key={level} className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= strength
                              ? strength === 1 ? "bg-red-400"
                              : strength === 2 ? "bg-amber-400"
                              : strength === 3 ? "bg-blue-400"
                              : "bg-emerald-500"
                              : "bg-gray-200"
                          }`} />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور"
                      required
                      className={`${inp} pl-10 ${
                        confirmPassword && confirmPassword !== newPassword ? "border-red-300 focus:border-red-400" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {loading ? "جاري الحفظ..." : "تعيين كلمة المرور"}
                </button>
              </form>
            </div>
          )}

          {/* ── الخطوة 4: نجاح ── */}
          {step === "success" && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">تم بنجاح! 🎉</h2>
              <p className="text-gray-500 text-sm mb-6">
                تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </p>
              <button
                onClick={() => navigate({ name: "signin" })}
                className="w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
              >
                <ArrowRight className="w-5 h-5" />
                تسجيل الدخول الآن
              </button>
            </div>
          )}
        </div>

        {/* رابط العودة */}
        {step !== "success" && (
          <button
            onClick={() => navigate({ name: "signin" })}
            className="mt-5 w-full text-center text-emerald-300 hover:text-white text-sm transition-colors"
          >
            ← العودة لتسجيل الدخول
          </button>
        )}
      </div>
    </div>
  );
}
