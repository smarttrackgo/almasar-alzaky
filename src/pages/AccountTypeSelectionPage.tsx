import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { User, Building2, ShieldCheck, CheckCircle2, ArrowLeft, Truck } from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

type AccountType = "pilgrim" | "office" | "driver";

interface AccountTypeOption {
  type: AccountType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  bgColor: string;
  accentColor: string;
}

const options: AccountTypeOption[] = [
  {
    type: "pilgrim",
    icon: <User className="w-9 h-9" />,
    title: "معتمر / راكب",
    subtitle: "أريد حجز برنامج عمرة",
    description: "للأفراد الراغبين في أداء العمرة وحجز البرامج المناسبة",
    features: [
      "تصفح وحجز برامج العمرة",
      "متابعة حالة الحجوزات",
      "إدارة المرافقين",
      "الدفع الإلكتروني الآمن",
      "تتبع الرحلة مباشرة",
    ],
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    accentColor: "from-emerald-600 to-emerald-700",
  },
  {
    type: "office",
    icon: <Building2 className="w-9 h-9" />,
    title: "مكتب / شركة",
    subtitle: "أريد إدارة برامج العمرة",
    description: "لمكاتب السفر والشركات المرخصة التي تقدم برامج العمرة",
    features: [
      "إضافة وإدارة البرامج",
      "استقبال ومتابعة الحجوزات",
      "إدارة الرحلات والحافلات",
      "لوحة تحكم متكاملة",
      "تقارير وإحصائيات",
    ],
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    accentColor: "from-blue-600 to-blue-700",
  },
  {
    type: "driver",
    icon: <Truck className="w-9 h-9" />,
    title: "سائق",
    subtitle: "أريد إدارة رحلاتي",
    description: "للسائقين المرتبطين بمكاتب السفر لإدارة الرحلات والتتبع",
    features: [
      "تتبع GPS مباشر للرحلات",
      "إدارة بيانات الحافلة",
      "بدء وإنهاء الرحلات",
      "الارتباط بمكتب السفر",
      "رفع الوثائق الرسمية",
    ],
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    accentColor: "from-amber-600 to-amber-700",
  },
];

export default function AccountTypeSelectionPage({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [loading, setLoading]   = useState(false);
  const setAccountType = useMutation(api.bookings.setAccountType);
  const sendWelcome    = useAction(api.emailActions.sendWelcomeEmailPublic);
  const currentUser    = useQuery(api.auth.loggedInUser);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setAccountType({ accountType: selected });

      // إرسال إيميل ترحيب (للمعتمرين والمكاتب فقط)
      if (currentUser?.email && selected !== "driver") {
        sendWelcome({
          email:       currentUser.email,
          name:        currentUser.name ?? undefined,
          accountType: selected,
        }).catch(() => {});
      }

      const msgs: Record<AccountType, string> = {
        pilgrim: "مرحباً بك! يمكنك الآن تصفح برامج العمرة وحجزها",
        office:  "مرحباً بك! يمكنك الآن إدارة برامجك وحجوزاتك",
        driver:  "مرحباً بك! أكمل بيانات ملفك الشخصي وحافلتك",
      };
      toast.success(msgs[selected]);

      // تأخير بسيط لإظهار الرسالة ثم الانتقال
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (err) {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
      setLoading(false);
    }
  };

  const confirmLabels: Record<AccountType, string> = {
    pilgrim: "ابدأ رحلتك الروحية",
    office:  "انطلق مع لوحة التحكم",
    driver:  "ادخل لوحة السائق",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #0d9488 100%)" }}
    >
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* الشعار والعنوان */}
        <div className="text-center mb-10">
          <img
            src={LOGO}
            alt="المسار الذكي"
            className="h-20 w-auto mx-auto mb-5"
            style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 16px rgba(240,208,128,0.4))" }}
          />
          <h1 className="text-3xl font-black text-white mb-2">مرحباً بك في المسار الذكي!</h1>
          <p className="text-emerald-200 text-base">اختر نوع حسابك لنقدم لك التجربة المناسبة</p>
        </div>

        {/* بطاقات الاختيار — 3 أعمدة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {options.map((opt) => {
            const isSelected = selected === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => setSelected(opt.type)}
                className={`relative text-right rounded-2xl p-5 border-2 transition-all duration-300 ${
                  isSelected
                    ? "border-white bg-white shadow-2xl scale-[1.03]"
                    : "border-white/20 bg-white/10 hover:bg-white/18 hover:border-white/35 backdrop-blur-sm"
                }`}
              >
                {/* علامة الاختيار */}
                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                )}

                {/* الأيقونة */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-all ${
                  isSelected ? opt.bgColor + " " + opt.color : "bg-white/20 text-white"
                }`}>
                  {opt.icon}
                </div>

                <h3 className={`text-lg font-black mb-0.5 ${isSelected ? "text-gray-900" : "text-white"}`}>
                  {opt.title}
                </h3>
                <p className={`text-xs font-semibold mb-2 ${isSelected ? opt.color : "text-emerald-200"}`}>
                  {opt.subtitle}
                </p>
                <p className={`text-xs mb-3 leading-relaxed ${isSelected ? "text-gray-500" : "text-white/65"}`}>
                  {opt.description}
                </p>

                <ul className="space-y-1.5">
                  {opt.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-xs ${isSelected ? "text-gray-600" : "text-white/75"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isSelected
                          ? opt.type === "pilgrim" ? "bg-emerald-500"
                          : opt.type === "office"  ? "bg-blue-500"
                          : "bg-amber-500"
                          : "bg-white/50"
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* ملاحظات خاصة */}
        {selected === "office" && (
          <div className="mb-5 bg-amber-500/20 border border-amber-400/40 rounded-xl p-4 flex gap-3 items-start backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-amber-100 text-sm leading-relaxed">
              سيتم مراجعة حسابك من قِبل الإدارة قبل تفعيل لوحة التحكم الكاملة. يمكنك البدء بإضافة بيانات مكتبك فور التسجيل.
            </p>
          </div>
        )}
        {selected === "driver" && (
          <div className="mb-5 bg-blue-500/20 border border-blue-400/40 rounded-xl p-4 flex gap-3 items-start backdrop-blur-sm">
            <Truck className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-blue-100 text-sm leading-relaxed">
              بعد التسجيل، أكمل بيانات ملفك الشخصي واختر المكتب التابع له. ستظهر رحلاتك تلقائياً عند تعيينها من المكتب.
            </p>
          </div>
        )}

        {/* زر التأكيد */}
        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
            selected && !loading
              ? "bg-white text-emerald-800 hover:bg-emerald-50 shadow-xl hover:shadow-2xl hover:scale-[1.01]"
              : "bg-white/20 text-white/50 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <ArrowLeft className="w-5 h-5" />
              {selected ? confirmLabels[selected] : "اختر نوع حسابك أولاً"}
            </>
          )}
        </button>

        <p className="text-center text-emerald-300/60 text-xs mt-4">
          يمكنك تغيير نوع حسابك لاحقاً من إعدادات الملف الشخصي
        </p>
      </div>
    </div>
  );
}
