"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * PROTECTED TEMPLATE COMPONENT
 *
 * This authentication form uses locked template styling:
 * - Blue gradient (#3B82F6 to #2563EB) for buttons and accents
 * - Centered compact layout (max-width: 28rem)
 * - White card with subtle shadow
 *
 * Design analysis from uploaded images does NOT apply to this component.
 * DO NOT modify styling to match user designs - auth must remain consistent.
 */

type AccountType = "pilgrim" | "office" | "driver" | "user";

const ACCOUNT_TYPES: { type: AccountType; label: string; desc: string; color: string; border: string; bg: string }[] = [
  {
    type: "pilgrim",
    label: "معتمر",
    desc: "أريد حجز برنامج عمرة",
    color: "text-emerald-700",
    border: "border-emerald-400",
    bg: "bg-emerald-50",
  },
  {
    type: "office",
    label: "مكتب سفر",
    desc: "أدير مكتب عمرة وأقدم برامج",
    color: "text-blue-700",
    border: "border-blue-400",
    bg: "bg-blue-50",
  },
  {
    type: "driver",
    label: "سائق",
    desc: "أعمل سائقاً لنقل المعتمرين",
    color: "text-amber-700",
    border: "border-amber-400",
    bg: "bg-amber-50",
  },
  {
    type: "user",
    label: "مستخدم عادي",
    desc: "أتصفح المنصة فقط",
    color: "text-gray-700",
    border: "border-gray-400",
    bg: "bg-gray-50",
  },
];

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  // خطوة اختيار نوع الحساب — تظهر فقط عند signUp بعد إدخال البيانات
  const [step, setStep] = useState<"form" | "accountType">("form");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const inputStyle = {
    background: '#FFFFFF',
    border: '1px solid rgba(229, 231, 235, 0.7)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.7)';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);

    if (flow === "signUp") {
      // عند التسجيل: احفظ البيانات وانتقل لاختيار نوع الحساب
      setPendingFormData(formData);
      setStep("accountType");
    } else {
      // عند تسجيل الدخول: أكمل مباشرة
      setSubmitting(true);
      void signIn("password", formData).catch((error) => {
        let toastTitle = "";
        if (error.message.includes("InvalidAccountId")) {
          toastTitle = "البريد الإلكتروني غير مسجل. أنشئ حساباً أولاً.";
        } else if (error.message.includes("Invalid password")) {
          toastTitle = "كلمة المرور غير صحيحة. حاول مرة أخرى.";
        } else {
          toastTitle = "تعذّر تسجيل الدخول. تحقق من بياناتك.";
        }
        toast.error(toastTitle);
        setSubmitting(false);
      });
    }
  };

  const handleCompleteSignUp = () => {
    if (!selectedType) { toast.error("يرجى اختيار نوع الحساب"); return; }
    if (!pendingFormData) return;
    // أضف نوع الحساب إلى البيانات
    pendingFormData.set("accountType", selectedType);
    setSubmitting(true);
    void signIn("password", pendingFormData).catch((error) => {
      let toastTitle = "";
      if (error.message.includes("already exists") || error.message.includes("AccountAlreadyExists")) {
        toastTitle = "البريد الإلكتروني مسجل مسبقاً. سجّل دخولك.";
      } else {
        toastTitle = "تعذّر إنشاء الحساب. حاول مرة أخرى.";
      }
      toast.error(toastTitle);
      setSubmitting(false);
      setStep("form");
    });
  };

  return (
    <div
      className="flex items-center justify-center relative"
      style={{ maxWidth: '100vw', overflow: 'hidden', minHeight: 'auto', padding: '2rem' }}
    >
      {/* Decorative gradient circles */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translate(30%, -30%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translate(-30%, 30%)', filter: 'blur(30px)' }} />

      {/* Auth card */}
      <div className="w-full rounded-2xl shadow-2xl overflow-hidden relative z-10"
        style={{ maxWidth: '28rem', margin: '0 auto', background: 'linear-gradient(to bottom, #FFFFFF, #FAFAFA)' }}
      >
        <div className="p-8" dir="rtl">

          {/* ── خطوة اختيار نوع الحساب ── */}
          {step === "accountType" ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#111827' }}>ما نوع حسابك؟</h2>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>اختر نوع حسابك — لا يمكن تغييره لاحقاً</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {ACCOUNT_TYPES.map((at) => (
                  <button
                    key={at.type}
                    type="button"
                    onClick={() => setSelectedType(at.type)}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      selectedType === at.type
                        ? `${at.border} ${at.bg} shadow-md`
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className={`font-bold text-sm ${selectedType === at.type ? at.color : "text-gray-800"}`}>
                      {at.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{at.desc}</div>
                    {selectedType === at.type && (
                      <div className={`mt-2 w-4 h-4 rounded-full ${at.bg} border-2 ${at.border} flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full ${at.border.replace("border-", "bg-")}`} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCompleteSignUp}
                disabled={!selectedType || submitting}
                className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                style={{
                  background: selectedType ? 'linear-gradient(to right, #3B82F6, #2563EB)' : '#9CA3AF',
                  color: '#FFFFFF',
                  boxShadow: selectedType ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                {submitting ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("form"); setSelectedType(null); }}
                className="w-full text-center text-sm"
                style={{ color: '#6B7280' }}
              >
                ← العودة
              </button>
            </div>
          ) : (
            /* ── خطوة إدخال البيانات ── */
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#111827' }}>
                {flow === "signIn" ? "مرحبًا بعودتك" : "إنشاء حساب"}
              </h2>
              <p className="text-sm mb-6 text-center" style={{ color: '#6B7280' }}>
                {flow === "signIn" ? "سجّل دخولك للمتابعة إلى حسابك" : "أنشئ حسابًا للبدء"}
              </p>

              <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#374151' }}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email" name="email" placeholder="you@example.com" required
                    className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none text-right"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#374151' }}>
                    كلمة المرور
                  </label>
                  <input
                    type="password" name="password" placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none text-right"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>

                {flow === "signUp" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 text-right">
                    ستختار نوع حسابك في الخطوة التالية
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(to right, #3B82F6, #2563EB)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {submitting ? "جارٍ التحميل..." : (flow === "signIn" ? "تسجيل الدخول" : "التالي — اختيار نوع الحساب")}
                </button>

                <div className="text-center text-sm" style={{ color: '#6B7280' }}>
                  <span>{flow === "signIn" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}</span>
                  <button
                    type="button"
                    className="font-medium cursor-pointer transition-colors duration-200"
                    style={{ color: '#3B82F6' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.textDecoration = 'none'; }}
                    onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setStep("form"); }}
                  >
                    {flow === "signIn" ? "أنشئ حسابًا" : "سجّل دخولك"}
                  </button>
                </div>
              </form>

              {/* ── فاصل "أو" ── */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.8)' }} />
                <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>أو تابع بـ</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.8)' }} />
              </div>

              {/* ── أزرار Google و Apple ── */}
              <div className="flex flex-col gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => toast.info("تسجيل الدخول عبر Google سيكون متاحاً قريباً")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 border"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(229,231,235,0.9)',
                    color: '#374151',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(209,213,219,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(229,231,235,0.9)';
                  }}
                >
                  {/* Google SVG Logo */}
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M47.532 24.552c0-1.636-.132-3.2-.388-4.704H24.48v8.898h12.984c-.56 3.02-2.26 5.576-4.816 7.292v6.064h7.796c4.56-4.2 7.088-10.388 7.088-17.55z" fill="#4285F4"/>
                    <path d="M24.48 48c6.516 0 11.984-2.16 15.98-5.896l-7.796-6.064c-2.16 1.448-4.924 2.304-8.184 2.304-6.296 0-11.628-4.252-13.536-9.968H2.9v6.256C6.876 42.892 15.108 48 24.48 48z" fill="#34A853"/>
                    <path d="M10.944 28.376A14.46 14.46 0 0 1 10.2 24c0-1.516.26-2.988.744-4.376V13.368H2.9A23.96 23.96 0 0 0 .48 24c0 3.868.928 7.528 2.42 10.632l8.044-6.256z" fill="#FBBC05"/>
                    <path d="M24.48 9.556c3.548 0 6.732 1.22 9.236 3.62l6.924-6.924C36.456 2.392 30.988 0 24.48 0 15.108 0 6.876 5.108 2.9 13.368l8.044 6.256c1.908-5.716 7.24-10.068 13.536-10.068z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm">المتابعة عبر Google</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px' }}>قريباً</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => toast.info("تسجيل الدخول عبر Apple سيكون متاحاً قريباً")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200"
                  style={{
                    background: '#111827',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1F2937';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#111827';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';
                  }}
                >
                  {/* Apple SVG Logo */}
                  <svg width="16" height="18" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 71.9zm-174.5-89.3c-27.5-30.8-68.7-53.4-110.5-53.4-5.8 0-11.6.6-17.4 1.3 1.3-6.5 1.9-13 1.9-19.5 0-57.8-30.8-115.6-78.1-152.4C368.4 3.2 320.4 0 280.3 0c-5.8 0-11.6.6-17.4 1.3 1.3 6.5 1.9 13 1.9 19.5 0 57.8 30.8 115.6 78.1 152.4 44.1 34.5 92.1 53.4 140.1 53.4 5.8 0 11.6-.6 17.4-1.3z"/>
                  </svg>
                  <span className="text-sm">المتابعة عبر Apple</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#D1D5DB', fontSize: '10px' }}>قريباً</span>
                </button>
              </div>

              {/* ملاحظة صغيرة */}
              <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
                سيتم إضافة تسجيل الدخول الاجتماعي قريباً
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
