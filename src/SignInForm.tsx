"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../convex/_generated/api";
import {
  ArrowRight,
  Building2,
  Bus,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
} from "lucide-react";

type AccountType = "pilgrim" | "office" | "driver" | "user";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

const ACCOUNT_TYPES: {
  type: AccountType;
  label: string;
  desc: string;
  Icon: typeof UserRound;
  accent: string;
  active: string;
}[] = [
  {
    type: "pilgrim",
    label: "معتمر",
    desc: "حجز البرامج وتتبع الرحلة",
    Icon: UserRound,
    accent: "text-emerald-200",
    active: "border-emerald-300 bg-emerald-400/15 shadow-emerald-950/20",
  },
  {
    type: "office",
    label: "مكتب سفر",
    desc: "إدارة البرامج والحجوزات",
    Icon: Building2,
    accent: "text-sky-200",
    active: "border-sky-300 bg-sky-400/15 shadow-sky-950/20",
  },
  {
    type: "driver",
    label: "سائق",
    desc: "إدارة الرحلات والتتبع",
    Icon: Bus,
    accent: "text-amber-200",
    active: "border-amber-300 bg-amber-400/15 shadow-amber-950/20",
  },
  {
    type: "user",
    label: "مستخدم",
    desc: "تصفح المنصة والخدمات",
    Icon: User,
    accent: "text-slate-200",
    active: "border-slate-200 bg-white/15 shadow-slate-950/20",
  },
];

export function SignInForm() {
  const { signIn } = useAuthActions();
  const cleanupDeletedAccountAuthByEmail = useMutation(api.auth.cleanupDeletedAccountAuthByEmail);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "accountType">("form");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isSignIn = flow === "signIn";

  const resetToForm = (nextFlow = flow) => {
    setFlow(nextFlow);
    setStep("form");
    setSelectedType(null);
    setPendingFormData(null);
  };

  const cleanupDeletedAccount = async (formData: FormData) => {
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    try {
      await cleanupDeletedAccountAuthByEmail({ email });
    } catch (error) {
      console.warn("Skipped deleted-account auth cleanup before sign-in.", error);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);

    if (flow === "signUp") {
      setPendingFormData(formData);
      setStep("accountType");
      return;
    }

    setSubmitting(true);
    void cleanupDeletedAccount(formData).then(() => signIn("password", formData)).catch((error) => {
      let toastTitle = "";
      if (error.message.includes("InvalidAccountId")) {
        toastTitle = "البريد الإلكتروني غير مسجل. أنشئ حساباً أولاً.";
      } else if (error.message.includes("Invalid password")) {
        toastTitle = "كلمة المرور غير صحيحة. حاول مرة أخرى.";
      } else {
        toastTitle = "تعذر تسجيل الدخول. تحقق من بياناتك.";
      }
      toast.error(toastTitle);
      setSubmitting(false);
    });
  };

  const handleCompleteSignUp = () => {
    if (!selectedType) {
      toast.error("يرجى اختيار نوع الحساب");
      return;
    }
    if (!pendingFormData) return;

    pendingFormData.set("accountType", selectedType);
    setSubmitting(true);
    void cleanupDeletedAccount(pendingFormData).then(() => signIn("password", pendingFormData)).catch((error) => {
      let toastTitle = "";
      if (error.message.includes("already exists") || error.message.includes("AccountAlreadyExists")) {
        toastTitle = "البريد الإلكتروني مسجل مسبقاً. سجل دخولك.";
      } else {
        toastTitle = "تعذر إنشاء الحساب. حاول مرة أخرى.";
      }
      toast.error(toastTitle);
      setSubmitting(false);
      setStep("form");
    });
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-emerald-950/30 backdrop-blur-2xl" dir="rtl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-amber-200/80 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.045)_48%,rgba(16,185,129,0.11))]" />

      <div className="relative p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/12 p-2 shadow-lg">
              <img src={LOGO} alt="المسار الذكي" className="h-full w-full object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <div>
              <div className="text-base font-black text-white">المسار الذكي</div>
              <div className="text-xs font-semibold text-emerald-100/70">دخول آمن للمنصة</div>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            موثق
          </div>
        </div>

        {step === "accountType" ? (
          <div>
            <button
              type="button"
              onClick={() => resetToForm()}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100/80 hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للبيانات
            </button>

            <div className="mb-5">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                خطوة أخيرة
              </div>
              <h2 className="text-2xl font-black text-white">اختر نوع حسابك</h2>
              <p className="mt-1 text-sm leading-6 text-emerald-50/70">سيتم تخصيص لوحة التحكم والصلاحيات بناءً على هذا الاختيار.</p>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACCOUNT_TYPES.map(({ type, label, desc, Icon, accent, active }) => {
                const selected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`group relative min-h-[116px] rounded-2xl border p-4 text-right shadow-lg transition-all ${
                      selected ? active : "border-white/12 bg-white/8 hover:border-white/25 hover:bg-white/12"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-2xl border border-white/15 bg-white/10 p-2.5 ${selected ? accent : "text-white/75"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {selected && <CheckCircle2 className="h-5 w-5 text-emerald-100" />}
                    </div>
                    <div className="mt-4 text-sm font-black text-white">{label}</div>
                    <div className="mt-1 text-xs leading-5 text-white/58">{desc}</div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCompleteSignUp}
              disabled={!selectedType || submitting}
              className="w-full rounded-2xl bg-gradient-to-l from-emerald-500 via-emerald-600 to-emerald-800 px-5 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-950/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="mb-3 inline-flex rounded-2xl border border-white/14 bg-black/12 p-1">
                <button
                  type="button"
                  onClick={() => resetToForm("signIn")}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    isSignIn ? "bg-white text-emerald-950 shadow" : "text-white/65 hover:text-white"
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => resetToForm("signUp")}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    !isSignIn ? "bg-white text-emerald-950 shadow" : "text-white/65 hover:text-white"
                  }`}
                >
                  حساب جديد
                </button>
              </div>
              <h2 className="text-2xl font-black text-white">{isSignIn ? "مرحباً بعودتك" : "ابدأ حسابك في المسار الذكي"}</h2>
              <p className="mt-1 text-sm leading-6 text-emerald-50/70">
                {isSignIn ? "ادخل بياناتك للوصول إلى لوحة حسابك." : "أنشئ حسابك ثم اختر نوع المستخدم المناسب لك."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-black text-emerald-50/80">البريد الإلكتروني</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/16 bg-white/10 px-4 py-3 text-white shadow-inner shadow-black/10 transition focus-within:border-amber-200/70 focus-within:bg-white/14">
                  <Mail className="h-5 w-5 text-emerald-100/75" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-white outline-none placeholder:text-white/35"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black text-emerald-50/80">كلمة المرور</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/16 bg-white/10 px-4 py-3 text-white shadow-inner shadow-black/10 transition focus-within:border-amber-200/70 focus-within:bg-white/14">
                  <LockKeyhole className="h-5 w-5 text-emerald-100/75" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    required
                    className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-white outline-none placeholder:text-white/35"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-lg p-1 text-white/55 hover:bg-white/10 hover:text-white"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {!isSignIn && (
                <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-xs font-semibold leading-6 text-amber-50/85">
                  بعد هذه الخطوة ستختار نوع الحساب: معتمر، مكتب، سائق، أو مستخدم.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-l from-amber-300 via-emerald-400 to-emerald-600 px-5 py-3.5 text-sm font-black text-emerald-950 shadow-xl shadow-emerald-950/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جارٍ المعالجة..." : isSignIn ? "دخول إلى المنصة" : "التالي"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/12" />
              <span className="text-xs font-bold text-white/45">خيارات إضافية</span>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.info("تسجيل الدخول عبر Google سيكون متاحاً قريباً")}
                className="rounded-2xl border border-white/14 bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
              >
                Google
                <span className="mt-1 block text-[10px] font-bold text-white/45">قريباً</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info("تسجيل الدخول عبر Apple سيكون متاحاً قريباً")}
                className="rounded-2xl border border-white/14 bg-black/20 px-3 py-3 text-xs font-black text-white transition hover:bg-black/30"
              >
                Apple
                <span className="mt-1 block text-[10px] font-bold text-white/45">قريباً</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
