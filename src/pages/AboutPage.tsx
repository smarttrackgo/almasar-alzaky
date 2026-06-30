import { Page } from "../App";
import {
  Star, Shield, Clock, Users, CheckCircle, ArrowLeft,
  Smartphone, Globe, Award, TrendingUp, MapPin, Phone,
  ChevronDown, ChevronUp, Building2, UserCheck, Headphones,
  CreditCard, Bell, BookOpen, Navigation, Zap, Heart
} from "lucide-react";
import { useState } from "react";

const HERO_VIDEO = "https://videos.pexels.com/video-files/5798349/5798349-hd_1920_1080_30fps.mp4";
const KAABA_IMG = "https://polished-pony-114.convex.cloud/api/storage/09619cb8-b694-4791-af26-54b1467c57c4";
const QURAN_IMG = "https://polished-pony-114.convex.cloud/api/storage/f6793452-883f-4dc2-b2dd-61d5eee2f51f";
const APP_IMG   = "https://polished-pony-114.convex.cloud/api/storage/3f24753a-0ba4-4b39-b9d1-5c7749bc5c4f";
const LOGO      = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

interface Props {
  navigate: (p: Page) => void;
}

const stats = [
  { value: "٥٠٠+",  label: "مكتب سفر معتمد",   icon: Building2 },
  { value: "١٠٠٠٠+", label: "معتمر سعيد",        icon: Users },
  { value: "٩٨٪",   label: "نسبة رضا العملاء",  icon: Star },
  { value: "٢٤/٧",  label: "دعم فني متواصل",    icon: Headphones },
];

const features = [
  {
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    title: "مقارنة الأسعار الفورية",
    desc: "قارن بين عشرات البرامج من مكاتب مختلفة في ثوانٍ، واختر الأنسب لميزانيتك واحتياجاتك بكل شفافية.",
  },
  {
    icon: Shield,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    title: "حجز آمن ومضمون",
    desc: "جميع مكاتب السفر على المنصة معتمدة ومرخصة. ادفع بأمان تام وتلقَّ تذكرتك الرقمية فوراً.",
  },
  {
    icon: Bell,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    title: "إشعارات لحظية",
    desc: "تابع حالة حجزك لحظة بلحظة. إشعارات فورية عند تأكيد الحجز أو أي تحديث على رحلتك.",
  },
  {
    icon: Navigation,
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    title: "تتبع الرحلة المباشر",
    desc: "تابع موقع حافلتك وجدول رحلتك في الوقت الفعلي. لا مزيد من القلق أو الانتظار.",
  },
  {
    icon: BookOpen,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    title: "خدمات دينية متكاملة",
    desc: "مصحف شريف كامل، أذكار وأدعية، خريطة مناسك العمرة، ومواقيت الصلاة — كل ما تحتاجه في مكان واحد.",
  },
  {
    icon: Zap,
    color: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50",
    title: "مساعد ذكي بالذكاء الاصطناعي",
    desc: "مساعدك الشخصي يجيب على أسئلتك عن العمرة والمناسك والحجز على مدار الساعة.",
  },
];

const steps = [
  {
    num: "١",
    icon: Globe,
    title: "تصفّح البرامج",
    desc: "ادخل إلى المنصة وتصفح عشرات برامج العمرة من مكاتب سفر معتمدة في مختلف مدن المملكة.",
    color: "bg-emerald-600",
  },
  {
    num: "٢",
    icon: TrendingUp,
    title: "قارن واختر",
    desc: "قارن الأسعار والخدمات والفنادق بسهولة، واختر البرنامج الأنسب لك ولعائلتك.",
    color: "bg-teal-600",
  },
  {
    num: "٣",
    icon: CreditCard,
    title: "ادفع بأمان",
    desc: "أتمم الدفع الإلكتروني بأمان تام، وتلقَّ تذكرتك الرقمية مع باركود وQR code فوراً.",
    color: "bg-emerald-700",
  },
  {
    num: "٤",
    icon: Heart,
    title: "استمتع برحلتك",
    desc: "تابع رحلتك عبر التطبيق، واستخدم الخدمات الدينية المتكاملة طوال رحلتك المباركة.",
    color: "bg-teal-700",
  },
];

const userTypes = [
  {
    icon: UserCheck,
    title: "للمعتمرين",
    color: "from-emerald-600 to-teal-700",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    items: [
      "تصفح وحجز برامج العمرة",
      "مقارنة الأسعار والخدمات",
      "دفع إلكتروني آمن",
      "تذكرة رقمية بباركود",
      "تتبع الرحلة المباشر",
      "مصحف وأذكار ومواقيت صلاة",
      "مساعد ذكي بالذكاء الاصطناعي",
      "دعم فني متواصل",
    ],
  },
  {
    icon: Building2,
    title: "لمكاتب السفر",
    color: "from-blue-600 to-indigo-700",
    border: "border-blue-200",
    bg: "bg-blue-50",
    items: [
      "لوحة تحكم احترافية",
      "إدارة البرامج والأسعار",
      "متابعة الحجوزات لحظياً",
      "إدارة الرحلات والحافلات",
      "نظام عمولات شفاف",
      "تواصل مباشر مع المعتمرين",
      "تقارير وإحصائيات مفصلة",
      "دعم فني متخصص",
    ],
  },
];

const faqs = [
  {
    q: "هل المنصة مرخصة ومعتمدة؟",
    a: "نعم، المسار الذكي منصة معتمدة تعمل وفق أنظمة وزارة الحج والعمرة في المملكة العربية السعودية. جميع مكاتب السفر المسجلة لدينا مرخصة ومعتمدة رسمياً.",
  },
  {
    q: "كيف أضمن أمان دفعي الإلكتروني؟",
    a: "نستخدم أحدث تقنيات التشفير وبوابات الدفع الآمنة المعتمدة. جميع المعاملات المالية محمية بالكامل، وتصلك تذكرتك الرقمية فور إتمام الدفع.",
  },
  {
    q: "ماذا يحدث إذا أردت إلغاء حجزي؟",
    a: "يمكنك إلغاء حجزك من خلال صفحة حجوزاتي وفق سياسة الإلغاء المحددة لكل برنامج. سيتم إشعارك بتفاصيل الاسترداد فوراً.",
  },
  {
    q: "هل يمكنني تحميل التطبيق على جوالي؟",
    a: "نعم! المنصة تدعم تقنية PWA، يمكنك إضافتها لشاشة جوالك مباشرة من المتصفح دون الحاجة لتحميل من متجر التطبيقات.",
  },
  {
    q: "كيف أسجل مكتب سفري في المنصة؟",
    a: "أنشئ حساباً واختر نوع الحساب 'مكتب سفر' عند التسجيل. سيتواصل معك فريقنا لإتمام التحقق والاعتماد خلال 24-48 ساعة.",
  },
  {
    q: "هل الخدمات الدينية متاحة بدون تسجيل؟",
    a: "نعم! المصحف الشريف، الأذكار، خريطة العمرة، ومواقيت الصلاة متاحة للجميع بدون الحاجة لإنشاء حساب.",
  },
];

export default function AboutPage({ navigate }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* فيديو الخلفية */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* طبقة التعتيم */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/70 to-emerald-950/90" />

        {/* المحتوى */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <img src={LOGO} alt="المسار الذكي" className="h-20 w-auto mx-auto mb-6" style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 20px rgba(255,255,255,0.25))" }} />

          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-5 py-2 mb-6">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-300 text-sm font-semibold">المنصة الأولى لحجز العمرة في المملكة</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            رحلتك المباركة تبدأ
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500 mt-1">
              من هنا
            </span>
          </h1>

          <p className="text-emerald-200 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            منصة المسار الذكي تربط المعتمرين بأفضل مكاتب السفر المعتمدة في المملكة العربية السعودية،
            مع مقارنة الأسعار والحجز الآمن والخدمات الدينية المتكاملة.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate({ name: "home" })}
              className="px-8 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-400 text-emerald-950 font-black text-lg hover:from-amber-400 hover:to-amber-300 transition-all shadow-2xl hover:scale-105 flex items-center gap-2 justify-center"
            >
              <span>ابدأ رحلتك الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate({ name: "signin" })}
              className="px-8 py-4 rounded-2xl bg-white/10 border border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              إنشاء حساب مجاني
            </button>
          </div>
        </div>

        {/* سهم التمرير */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-8 border-2 border-white/40 rounded-full flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-l from-emerald-800 to-emerald-900 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-7 h-7 text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-emerald-300 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ما هي المنصة؟
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-emerald-700 text-sm font-bold">من نحن</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                منصة وسيط ذكية
                <span className="block text-emerald-700">لحجز العمرة</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                المسار الذكي هي منصة رقمية متخصصة تعمل كوسيط موثوق بين المعتمرين ومكاتب السفر المعتمدة
                داخل المملكة العربية السعودية. نوفر بيئة شفافة وآمنة لمقارنة البرامج والحجز والدفع الإلكتروني.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                نؤمن بأن كل معتمر يستحق رحلة مريحة ومنظمة، لذلك جمعنا كل ما يحتاجه في مكان واحد:
                من اختيار البرنامج حتى العودة سالماً.
              </p>
              <div className="flex flex-wrap gap-3">
                {["معتمدة رسمياً", "آمنة ومضمونة", "سهلة الاستخدام", "دعم ٢٤/٧"].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl -z-10" />
              <img
                src={KAABA_IMG}
                alt="الكعبة المشرفة"
                className="w-full h-80 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="font-black text-gray-900 text-sm">منصة موثوقة</div>
                  <div className="text-gray-500 text-xs">معتمدة من وزارة الحج</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          كيف تعمل المنصة؟
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-teal-100 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span className="text-teal-700 text-sm font-bold">كيف تعمل</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              ٤ خطوات بسيطة لرحلة مباركة
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              من التصفح حتى السفر، كل شيء مبسّط وسهل
            </p>
          </div>

          <div className="relative">
            {/* خط الربط */}
            <div className="hidden md:block absolute top-16 right-[12.5%] left-[12.5%] h-0.5 bg-gradient-to-l from-emerald-200 via-teal-300 to-emerald-200" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className={`relative w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-emerald-950 text-xs font-black flex items-center justify-center shadow">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate({ name: "home" })}
              className="px-10 py-4 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black text-lg hover:from-emerald-800 hover:to-emerald-700 transition-all shadow-xl hover:scale-105"
            >
              ابدأ الآن مجاناً
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          المميزات
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-amber-700 text-sm font-bold">مميزاتنا</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              منصة متكاملة تجمع الحجز والخدمات الدينية والدعم الفني
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-7 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          للمعتمرين ولمكاتب السفر
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-emerald-950 to-emerald-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              منصة لكل الأطراف
            </h2>
            <p className="text-emerald-300 text-lg">
              سواء كنت معتمراً أو تدير مكتب سفر، المسار الذكي يخدمك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {userTypes.map((type, i) => (
              <div key={i} className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-6">{type.title}</h3>
                <ul className="space-y-3">
                  {type.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-emerald-200">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate({ name: "signin" })}
                  className={`mt-8 w-full py-3 rounded-xl bg-gradient-to-l ${type.color} text-white font-bold hover:opacity-90 transition-opacity shadow-lg`}
                >
                  سجّل الآن مجاناً
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          الخدمات الدينية
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl -z-10" />
              <img
                src={QURAN_IMG}
                alt="المصحف الشريف"
                className="w-full h-80 object-cover rounded-2xl shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span className="text-amber-700 text-sm font-bold">الخدمات الدينية</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                رفيقك الروحي
                <span className="block text-amber-600">في كل لحظة</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                لأن العمرة رحلة روحية قبل أن تكون رحلة جسدية، وفّرنا لك مجموعة متكاملة من الخدمات الدينية
                تُرافقك من لحظة التحضير حتى العودة.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: "المصحف الشريف", page: "quran" as const },
                  { icon: Heart, label: "الأذكار والأدعية", page: "adhkar" as const },
                  { icon: MapPin, label: "خريطة العمرة", page: "umrah-map" as const },
                  { icon: Clock, label: "مواقيت الصلاة", page: "prayer-times" as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate({ name: item.page })}
                    className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all group"
                  >
                    <item.icon className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-800 font-semibold text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PWA - تحميل التطبيق
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-700 text-sm font-bold">تطبيق الجوال</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                أضف التطبيق
                <span className="block text-emerald-700">على شاشتك</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                لا تحتاج لتحميل من متجر التطبيقات! المسار الذكي يدعم تقنية PWA،
                أضفه مباشرة على شاشة جوالك وتمتع بتجربة تطبيق كاملة.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: "يعمل بسرعة حتى مع الإنترنت البطيء" },
                  { icon: Bell, text: "إشعارات فورية على جوالك" },
                  { icon: Shield, text: "آمن ومحمي بالكامل" },
                  { icon: Smartphone, text: "تجربة تطبيق أصلي بدون تحميل" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm">
                <p className="text-gray-700 font-bold mb-3 flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  كيف تضيف التطبيق؟
                </p>
                <ol className="space-y-2 text-gray-600 text-sm">
                  <li className="flex gap-2"><span className="font-bold text-emerald-700">١.</span> افتح المنصة في متصفح Safari (iOS) أو Chrome (Android)</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-700">٢.</span> اضغط على زر المشاركة أو القائمة</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-700">٣.</span> اختر "إضافة إلى الشاشة الرئيسية"</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-700">٤.</span> استمتع بالتطبيق! 🎉</li>
                </ol>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-3xl blur-3xl" />
              <img
                src={APP_IMG}
                alt="تطبيق الجوال"
                className="relative w-64 h-auto object-contain drop-shadow-2xl rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          الأسئلة الشائعة
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-blue-700 text-sm font-bold">الأسئلة الشائعة</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              أسئلة يسألها الجميع
            </h2>
            <p className="text-gray-500 text-lg">إجابات واضحة على أكثر الأسئلة شيوعاً</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  openFaq === i ? "border-emerald-300 shadow-md" : "border-gray-200 hover:border-emerald-200"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <span className="font-bold text-gray-900 text-base">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ms-3 transition-colors ${
                    openFaq === i ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {openFaq === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          رؤية 2030
      ═══════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gradient-to-l from-[#071a30] via-[#0d2d52] to-[#071a30] relative overflow-hidden">
        {/* زخارف */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#c8a951]/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#c8a951]/6 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* العنوان */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#c8a951]/15 border border-[#c8a951]/30 rounded-full px-5 py-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-[#c8a951] animate-pulse" />
              <span className="text-[#c8a951] text-sm font-bold">شريك استراتيجي</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              نسير نحو رؤية المملكة
            </h2>
            <p className="text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
              المسار الذكي منصة رقمية تساهم في تحقيق أهداف رؤية 2030 من خلال تطوير قطاع العمرة
              وتمكين مكاتب السفر المعتمدة وتحسين تجربة المعتمر.
            </p>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* الشعار الكبير */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-[#c8a951]/15 blur-2xl scale-125" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-[#c8a951]/30 rounded-3xl p-8 shadow-2xl">
                  <Vision2030LogoLarge />
                </div>
              </div>
              <span className="text-[#c8a951]/60 text-xs font-medium tracking-[0.25em] uppercase">
                Saudi Vision 2030
              </span>
            </div>

            {/* الأهداف */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "💻",
                  title: "رقمنة الخدمات",
                  desc: "تحويل خدمات العمرة إلى منصة رقمية متكاملة تُسهّل الحجز والدفع والمتابعة",
                  color: "border-blue-500/30 bg-blue-500/5",
                },
                {
                  icon: "🏢",
                  title: "تمكين المكاتب",
                  desc: "دعم مكاتب السفر المعتمدة بأدوات إدارة احترافية لتطوير أعمالها",
                  color: "border-emerald-500/30 bg-emerald-500/5",
                },
                {
                  icon: "🕋",
                  title: "تحسين تجربة المعتمر",
                  desc: "توفير تجربة حجز سلسة وآمنة مع خدمات دينية متكاملة طوال الرحلة",
                  color: "border-amber-500/30 bg-amber-500/5",
                },
                {
                  icon: "📈",
                  title: "الاقتصاد الرقمي",
                  desc: "المساهمة في نمو الاقتصاد الرقمي السعودي وتطوير قطاع السياحة الدينية",
                  color: "border-purple-500/30 bg-purple-500/5",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 ${item.color} hover:scale-[1.02] transition-transform`}
                >
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h4 className="text-white font-black text-base mb-2">{item.title}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* شريط الأرقام */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#c8a951]/20 pt-10">
            {[
              { num: "٢٠٣٠", label: "هدف المملكة" },
              { num: "١٠٠٪", label: "رقمنة الخدمات" },
              { num: "٣٠+", label: "مليون معتمر مستهدف" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-[#c8a951] mb-1">{s.num}</div>
                <div className="text-white/50 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA النهائي
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden">
        {/* زخارف خلفية */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🕌</div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
            ابدأ رحلتك المباركة
            <span className="block text-amber-400">اليوم</span>
          </h2>
          <p className="text-emerald-200 text-xl leading-relaxed mb-10">
            انضم لآلاف المعتمرين الذين وثقوا بالمسار الذكي لتنظيم رحلتهم.
            التسجيل مجاني والحجز آمن.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate({ name: "signin" })}
              className="px-10 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-400 text-emerald-950 font-black text-lg hover:from-amber-400 hover:to-amber-300 transition-all shadow-2xl hover:scale-105"
            >
              سجّل مجاناً الآن
            </button>
            <button
              onClick={() => navigate({ name: "home" })}
              className="px-10 py-4 rounded-2xl bg-white/10 border border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all"
            >
              تصفّح البرامج
            </button>
          </div>
          <p className="text-emerald-400 text-sm mt-6 flex items-center gap-2 justify-center">
            <Shield className="w-4 h-4" />
            التسجيل مجاني تماماً · لا بطاقة ائتمانية مطلوبة
          </p>
        </div>
      </section>

    </div>
  );
}

// ── شعار رؤية 2030 SVG كبير ──
function Vision2030LogoLarge() {
  return (
    <svg
      width="200"
      height="100"
      viewBox="0 0 280 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="رؤية المملكة العربية السعودية 2030"
    >
      {/* النخلة */}
      <g transform="translate(16, 6)">
        {/* جذع النخلة */}
        <rect x="34" y="38" width="4" height="48" rx="2" fill="#c8a951" />
        {/* سعف النخلة */}
        <path d="M36 38 C26 28 12 26 7 18" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M36 38 C31 26 24 20 18 12" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M36 38 C36 24 36 16 36 8" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M36 38 C41 26 48 20 54 12" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M36 38 C46 28 60 26 65 18" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* السيف الأيمن */}
        <path d="M36 84 L6 56 L4 52 L10 54 L38 82" stroke="#c8a951" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M4 52 L2 48 L6 50 L4 52Z" fill="#c8a951"/>
        {/* السيف الأيسر */}
        <path d="M36 84 L66 56 L68 52 L62 54 L34 82" stroke="#c8a951" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M68 52 L70 48 L66 50 L68 52Z" fill="#c8a951"/>
      </g>

      {/* النص العربي: رؤية */}
      <text x="178" y="36" fontFamily="'Tajawal','Arial',sans-serif" fontSize="20" fontWeight="900" fill="#c8a951" textAnchor="middle">
        رؤية
      </text>
      {/* المملكة العربية السعودية */}
      <text x="178" y="56" fontFamily="'Tajawal','Arial',sans-serif" fontSize="11" fontWeight="700" fill="white" textAnchor="middle" opacity="0.8">
        المملكة العربية السعودية
      </text>
      {/* 2030 */}
      <text x="178" y="96" fontFamily="'Arial',sans-serif" fontSize="38" fontWeight="900" fill="#c8a951" textAnchor="middle" letterSpacing="3">
        2030
      </text>
      {/* خط فاصل */}
      <line x1="140" y1="104" x2="216" y2="104" stroke="#c8a951" strokeWidth="1" opacity="0.35"/>
      {/* VISION */}
      <text x="178" y="118" fontFamily="'Arial',sans-serif" fontSize="9" fontWeight="700" fill="#c8a951" textAnchor="middle" opacity="0.55" letterSpacing="2">
        VISION
      </text>
    </svg>
  );
}
