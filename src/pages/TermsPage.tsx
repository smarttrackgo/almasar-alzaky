import { useState } from "react";
import { Page } from "../App";
import {
  Shield, FileText, AlertTriangle, CheckCircle, XCircle,
  Building2, UserCheck, CreditCard, Lock, Eye, ChevronDown,
  ChevronUp, Scale, Clock, Phone, Mail
} from "lucide-react";

interface Props {
  navigate: (p: Page) => void;
}

type Tab = "terms" | "privacy" | "cancellation";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

export default function TermsPage({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("terms");
  const [openSection, setOpenSection] = useState<number | null>(0);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "terms",        label: "شروط الاستخدام",    icon: FileText },
    { id: "privacy",      label: "سياسة الخصوصية",    icon: Shield },
    { id: "cancellation", label: "سياسة الإلغاء",     icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img src={LOGO} alt="المسار الذكي" className="h-14 w-auto mx-auto mb-6" style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 12px rgba(255,255,255,0.2))" }} />
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-5 py-2 mb-5">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-semibold">الوثائق القانونية</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
            الشروط والأحكام وسياسة الخصوصية
          </h1>
          <p className="text-emerald-300 text-base max-w-2xl mx-auto leading-relaxed">
            يُرجى قراءة هذه الوثائق بعناية قبل استخدام منصة المسار الذكي.
            باستخدامك للمنصة فأنت توافق على جميع الشروط والأحكام الواردة أدناه.
          </p>
          <p className="text-emerald-500 text-sm mt-4">آخر تحديث: يناير ٢٠٢٥</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setOpenSection(0); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ════════════════════════════════════════
            شروط الاستخدام
        ════════════════════════════════════════ */}
        {activeTab === "terms" && (
          <div className="space-y-4">

            {/* مقدمة */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-emerald-900 text-lg mb-2">مقدمة</h2>
                  <p className="text-emerald-800 text-sm leading-relaxed">
                    منصة <strong>المسار الذكي</strong> هي منصة وسيط إلكترونية تعمل كحلقة وصل بين المعتمرين ومكاتب السفر المعتمدة
                    داخل المملكة العربية السعودية. تعمل المنصة وفق أنظمة وزارة الحج والعمرة والأنظمة التجارية المعمول بها في المملكة.
                    باستخدامك للمنصة فأنت تقر بأنك قرأت وفهمت ووافقت على جميع الشروط والأحكام الواردة في هذه الوثيقة.
                  </p>
                </div>
              </div>
            </div>

            {[
              {
                icon: UserCheck,
                color: "bg-blue-600",
                title: "١. شروط التسجيل والأهلية",
                content: [
                  "يجب أن يكون المستخدم بالغاً (١٨ سنة فأكثر) أو تحت إشراف ولي أمر.",
                  "يجب تقديم بيانات صحيحة ودقيقة عند التسجيل، وتحديثها عند أي تغيير.",
                  "يُحظر إنشاء أكثر من حساب واحد لنفس الشخص.",
                  "يحق للمنصة تعليق أو إلغاء أي حساب يُشتبه في انتهاكه للشروط.",
                  "المستخدم مسؤول عن الحفاظ على سرية بيانات دخوله وكلمة مروره.",
                  "يجب اختيار نوع الحساب الصحيح (معتمر / مكتب سفر) عند التسجيل.",
                ],
              },
              {
                icon: Building2,
                color: "bg-red-600",
                title: "٢. مسؤوليات مكاتب السفر",
                highlight: true,
                highlightColor: "border-red-300 bg-red-50",
                content: [
                  "يتحمل مكتب السفر المسؤولية الكاملة عن أي إخلال بالالتزامات المتفق عليها مع المعتمر.",
                  "يلتزم المكتب بتوفير الخدمات المُعلنة في البرنامج (الفندق، النقل، الإرشاد) بالمواصفات المحددة.",
                  "في حال عدم توفر الفندق المحدد، يلتزم المكتب بتوفير بديل مماثل أو أفضل دون تكلفة إضافية.",
                  "يلتزم المكتب بالإفصاح الكامل عن جميع التكاليف والرسوم قبل إتمام الحجز.",
                  "يتحمل المكتب تعويض المعتمر في حال إلغاء البرنامج من طرفه وفق سياسة الإلغاء.",
                  "يلتزم المكتب بتوفير وسائل نقل آمنة ومرخصة وفق اشتراطات الجهات المختصة.",
                  "يجب على المكتب الرد على استفسارات المعتمرين خلال ٢٤ ساعة من وقت الاستفسار.",
                  "يتحمل المكتب مسؤولية دقة المعلومات المُدخلة في المنصة عن برامجه وخدماته.",
                  "أي تقصير أو إهمال من المكتب يُعرّضه للمساءلة القانونية وفق الأنظمة السعودية.",
                ],
              },
              {
                icon: UserCheck,
                color: "bg-amber-600",
                title: "٣. مسؤوليات المعتمر",
                highlight: true,
                highlightColor: "border-amber-300 bg-amber-50",
                content: [
                  "يتحمل المعتمر المسؤولية الكاملة عن التأخير عن الحضور في المواعيد المحددة للرحلة.",
                  "في حال تأخر المعتمر عن موعد الانطلاق المحدد، لا يحق له المطالبة بأي تعويض عن الخدمات الفائتة.",
                  "يلتزم المعتمر بالحضور في نقطة التجمع المحددة قبل موعد الانطلاق بـ ٣٠ دقيقة على الأقل.",
                  "يتحمل المعتمر تكاليف أي ترتيبات بديلة ناتجة عن تأخره أو غيابه.",
                  "يلتزم المعتمر بتقديم وثائق السفر والهوية الصحيحة والسارية المفعول.",
                  "يلتزم المعتمر باحترام تعليمات المرشد والمكتب طوال فترة الرحلة.",
                  "يتحمل المعتمر مسؤولية أي أضرار تنتج عن سلوكه أو تصرفاته خلال الرحلة.",
                  "يلتزم المعتمر بإبلاغ المكتب فوراً عن أي ظروف طارئة قد تؤثر على مشاركته.",
                ],
              },
              {
                icon: Scale,
                color: "bg-purple-600",
                title: "٤. دور المنصة كوسيط",
                content: [
                  "تعمل منصة المسار الذكي كوسيط إلكتروني بين المعتمرين ومكاتب السفر فقط.",
                  "المنصة غير مسؤولة عن جودة الخدمات المقدمة من مكاتب السفر بشكل مباشر.",
                  "تلتزم المنصة بالتحقق من اعتماد وترخيص مكاتب السفر المسجلة لديها.",
                  "تعمل المنصة على تسهيل حل النزاعات بين الأطراف دون أن تكون طرفاً في العقد.",
                  "تحتفظ المنصة بحق تعليق أو إزالة أي مكتب سفر يُخل بالتزاماته تجاه المعتمرين.",
                  "المنصة غير مسؤولة عن أي ظروف قاهرة (كوارث طبيعية، قرارات حكومية) تؤثر على الرحلات.",
                ],
              },
              {
                icon: CreditCard,
                color: "bg-green-600",
                title: "٥. الدفع والمعاملات المالية",
                content: [
                  "جميع المدفوعات تتم عبر بوابات دفع آمنة ومعتمدة.",
                  "تُحتسب عمولة المنصة من إجمالي قيمة الحجز وفق الاتفاقية مع المكتب.",
                  "يتلقى المعتمر تأكيداً فورياً بالبريد الإلكتروني عند إتمام الدفع.",
                  "لا تُخزّن بيانات البطاقات الائتمانية على خوادم المنصة.",
                  "في حال فشل الدفع، لا يُعتبر الحجز مؤكداً حتى إتمام العملية بنجاح.",
                  "أسعار البرامج بالريال السعودي وتشمل ضريبة القيمة المضافة ما لم يُذكر خلاف ذلك.",
                ],
              },
              {
                icon: AlertTriangle,
                color: "bg-orange-600",
                title: "٦. الاستخدام المحظور",
                content: [
                  "يُحظر استخدام المنصة لأي غرض غير مشروع أو مخالف للأنظمة السعودية.",
                  "يُحظر نشر معلومات مضللة أو كاذبة عن البرامج أو الخدمات.",
                  "يُحظر محاولة اختراق أو التلاعب بأنظمة المنصة.",
                  "يُحظر إساءة استخدام نظام التقييمات أو نشر تقييمات وهمية.",
                  "يُحظر التواصل مع المعتمرين خارج المنصة بهدف تجاوز نظام العمولات.",
                ],
              },
              {
                icon: FileText,
                color: "bg-gray-600",
                title: "٧. تعديل الشروط وإنهاء الخدمة",
                content: [
                  "تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت مع إشعار المستخدمين.",
                  "استمرار استخدام المنصة بعد التعديل يُعدّ موافقة ضمنية على الشروط الجديدة.",
                  "يحق للمستخدم إنهاء حسابه في أي وقت عبر إعدادات الحساب.",
                  "تحتفظ المنصة بسجلات المعاملات المكتملة لمدة ٥ سنوات وفق الأنظمة المحاسبية.",
                  "تخضع أي نزاعات للقضاء السعودي وفق الأنظمة المعمول بها في المملكة.",
                ],
              },
            ].map((section, i) => (
              <div
                key={i}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  section.highlight ? section.highlightColor : "border-gray-200 bg-white"
                }`}
              >
                <button
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${section.color} flex items-center justify-center flex-shrink-0`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-gray-900 text-base">{section.title}</span>
                    {section.highlight && (
                      <span className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        مهم
                      </span>
                    )}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ms-3 transition-colors ${
                    openSection === i ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {openSection === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {openSection === i && (
                  <div className="px-5 pb-5">
                    <ul className="space-y-2.5">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* بطاقة المسؤوليات الموجزة */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-red-900">مسؤولية المكتب</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    "الإخلال بأي التزام متفق عليه",
                    "عدم توفير الفندق أو النقل المحدد",
                    "إلغاء البرنامج دون إشعار كافٍ",
                    "تقديم معلومات مضللة عن البرنامج",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-red-800 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-amber-900">مسؤولية المعتمر</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    "التأخر عن موعد الانطلاق المحدد",
                    "عدم الحضور في نقطة التجمع",
                    "تقديم وثائق غير صحيحة أو منتهية",
                    "الإخلال بتعليمات المرشد والمكتب",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-amber-800 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            سياسة الخصوصية
        ════════════════════════════════════════ */}
        {activeTab === "privacy" && (
          <div className="space-y-4">

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-blue-900 text-lg mb-2">التزامنا بخصوصيتك</h2>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    نحن في منصة المسار الذكي نُولي خصوصية بياناتك أهمية قصوى. نلتزم بحماية معلوماتك الشخصية
                    وعدم مشاركتها مع أطراف ثالثة إلا في الحالات المنصوص عليها في هذه السياسة.
                    تتوافق سياستنا مع نظام حماية البيانات الشخصية في المملكة العربية السعودية.
                  </p>
                </div>
              </div>
            </div>

            {[
              {
                icon: Eye,
                color: "bg-blue-600",
                title: "١. البيانات التي نجمعها",
                content: [
                  "البيانات الشخصية: الاسم، البريد الإلكتروني، رقم الجوال، رقم الهوية الوطنية.",
                  "بيانات الحجز: تفاصيل البرامج المحجوزة، تواريخ السفر، عدد المسافرين.",
                  "بيانات الدفع: نجمع فقط تأكيد الدفع ولا نخزّن بيانات البطاقات الائتمانية.",
                  "بيانات الاستخدام: الصفحات المزارة، مدة الجلسة، نوع الجهاز والمتصفح.",
                  "بيانات التواصل: رسائل الدعم الفني والشكاوى والاستفسارات.",
                ],
              },
              {
                icon: Lock,
                color: "bg-green-600",
                title: "٢. كيف نستخدم بياناتك",
                content: [
                  "إتمام عمليات الحجز وإرسال تأكيدات الحجز والتذاكر الرقمية.",
                  "التواصل معك بشأن حجوزاتك وأي تحديثات تخصها.",
                  "تحسين خدمات المنصة وتطوير تجربة المستخدم.",
                  "إرسال إشعارات مهمة تتعلق بحجوزاتك ورحلاتك.",
                  "الامتثال للمتطلبات القانونية والتنظيمية.",
                  "منع الاحتيال وضمان أمان المعاملات.",
                ],
              },
              {
                icon: Shield,
                color: "bg-purple-600",
                title: "٣. حماية بياناتك",
                content: [
                  "نستخدم تشفير SSL/TLS لحماية جميع البيانات المنقولة.",
                  "يتم تخزين البيانات على خوادم آمنة مع نسخ احتياطية منتظمة.",
                  "يقتصر الوصول إلى البيانات الشخصية على الموظفين المخوّلين فقط.",
                  "نُجري مراجعات أمنية دورية لضمان سلامة البيانات.",
                  "نلتزم بإشعارك فوراً في حال حدوث أي اختراق أمني يؤثر على بياناتك.",
                ],
              },
              {
                icon: FileText,
                color: "bg-orange-600",
                title: "٤. مشاركة البيانات مع الأطراف الثالثة",
                content: [
                  "نشارك بيانات الحجز الضرورية مع مكتب السفر المعني لإتمام الخدمة.",
                  "نشارك بيانات الدفع مع بوابات الدفع المعتمدة لإتمام المعاملات.",
                  "لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث.",
                  "قد نُفصح عن البيانات للجهات الحكومية عند الطلب القانوني.",
                  "نستخدم خدمات تحليل البيانات (مجهولة الهوية) لتحسين المنصة.",
                ],
              },
              {
                icon: UserCheck,
                color: "bg-teal-600",
                title: "٥. حقوقك في بياناتك",
                content: [
                  "حق الوصول: يمكنك طلب نسخة من بياناتك الشخصية المخزنة لدينا.",
                  "حق التصحيح: يمكنك تصحيح أي بيانات غير دقيقة من خلال إعدادات حسابك.",
                  "حق الحذف: يمكنك طلب حذف بياناتك مع مراعاة المتطلبات القانونية.",
                  "حق الاعتراض: يمكنك الاعتراض على معالجة بياناتك لأغراض التسويق.",
                  "حق نقل البيانات: يمكنك طلب نقل بياناتك بصيغة قابلة للقراءة.",
                  "لممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني.",
                ],
              },
              {
                icon: Clock,
                color: "bg-gray-600",
                title: "٦. الاحتفاظ بالبيانات وملفات الارتباط",
                content: [
                  "نحتفظ ببيانات الحجوزات المكتملة لمدة ٥ سنوات وفق الأنظمة المحاسبية.",
                  "يتم حذف بيانات الحسابات غير النشطة بعد ٣ سنوات من آخر تسجيل دخول.",
                  "نستخدم ملفات الارتباط (Cookies) لتحسين تجربة الاستخدام.",
                  "يمكنك التحكم في ملفات الارتباط من خلال إعدادات متصفحك.",
                  "بعض ملفات الارتباط ضرورية لعمل المنصة ولا يمكن تعطيلها.",
                ],
              },
            ].map((section, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${section.color} flex items-center justify-center flex-shrink-0`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-gray-900 text-base">{section.title}</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ms-3 transition-colors ${
                    openSection === i ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {openSection === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {openSection === i && (
                  <div className="px-5 pb-5">
                    <ul className="space-y-2.5">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════
            سياسة الإلغاء والاسترداد
        ════════════════════════════════════════ */}
        {activeTab === "cancellation" && (
          <div className="space-y-6">

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-amber-900 text-lg mb-2">سياسة الإلغاء والاسترداد</h2>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    تُطبّق سياسة الإلغاء بناءً على المدة الزمنية المتبقية قبل موعد انطلاق الرحلة.
                    يُرجى مراجعة شروط الإلغاء الخاصة بكل برنامج قبل الحجز، إذ قد تختلف من مكتب لآخر.
                  </p>
                </div>
              </div>
            </div>

            {/* جدول الإلغاء */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-l from-emerald-700 to-emerald-800 px-6 py-4">
                <h3 className="font-black text-white text-lg">جدول رسوم الإلغاء</h3>
                <p className="text-emerald-200 text-sm mt-1">بناءً على المدة المتبقية قبل موعد الرحلة</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">المدة قبل الرحلة</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">رسوم الإلغاء</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">المبلغ المُسترد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { period: "أكثر من ٣٠ يوماً",    fee: "٠٪",   refund: "١٠٠٪ كامل المبلغ",  color: "text-green-700 bg-green-50" },
                      { period: "١٥ - ٣٠ يوماً",       fee: "٢٥٪",  refund: "٧٥٪ من المبلغ",     color: "text-blue-700 bg-blue-50" },
                      { period: "٧ - ١٤ يوماً",        fee: "٥٠٪",  refund: "٥٠٪ من المبلغ",     color: "text-amber-700 bg-amber-50" },
                      { period: "٣ - ٦ أيام",          fee: "٧٥٪",  refund: "٢٥٪ من المبلغ",     color: "text-orange-700 bg-orange-50" },
                      { period: "أقل من ٣ أيام",       fee: "١٠٠٪", refund: "لا يوجد استرداد",   color: "text-red-700 bg-red-50" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-800 font-semibold text-sm">{row.period}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.color}`}>
                            {row.fee}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm font-medium">{row.refund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* إلغاء من طرف المكتب */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-red-900 text-lg">إلغاء من طرف المكتب</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "في حال إلغاء المكتب للبرنامج، يحق للمعتمر استرداد كامل المبلغ المدفوع.",
                  "يلتزم المكتب بإشعار المعتمر بالإلغاء قبل ٧٢ ساعة على الأقل من موعد الانطلاق.",
                  "في حال الإلغاء المفاجئ دون إشعار كافٍ، يحق للمعتمر المطالبة بتعويض إضافي.",
                  "تتولى المنصة متابعة عملية الاسترداد وضمان حصول المعتمر على حقوقه كاملة.",
                  "يُعدّ المكتب مخلاً بالتزاماته ويُعرّض نفسه للمساءلة القانونية في حال الإلغاء التعسفي.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* إلغاء من طرف المعتمر */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-amber-900 text-lg">إلغاء من طرف المعتمر</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "يمكن للمعتمر إلغاء حجزه من خلال صفحة 'حجوزاتي' في المنصة.",
                  "تُطبّق رسوم الإلغاء وفق الجدول أعلاه بناءً على المدة المتبقية.",
                  "يُعالَج طلب الاسترداد خلال ٥-٧ أيام عمل من تاريخ الإلغاء.",
                  "في حال التأخر عن موعد الانطلاق دون إلغاء مسبق، لا يحق للمعتمر أي استرداد.",
                  "الظروف الطارئة الموثقة (مرض، وفاة) قد تُعفي من رسوم الإلغاء بقرار من المنصة.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-800 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ملاحظة مهمة */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 mb-2">ملاحظة مهمة</h4>
                  <p className="text-emerald-800 text-sm leading-relaxed">
                    قد تختلف سياسة الإلغاء من برنامج لآخر حسب شروط مكتب السفر. يُرجى مراجعة شروط الإلغاء
                    الخاصة بكل برنامج قبل إتمام الحجز. في حال وجود أي تعارض بين شروط المكتب وهذه السياسة،
                    تُطبّق الشروط الأكثر حمايةً للمعتمر.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── تواصل معنا ── */}
        <div className="mt-10 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black text-white mb-3">هل لديك استفسار قانوني؟</h3>
          <p className="text-emerald-300 text-sm mb-6">
            فريقنا القانوني جاهز للإجابة على جميع استفساراتك
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:legal@almasaraldaki.sa"
              className="flex items-center gap-2 justify-center px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all"
            >
              <Mail className="w-4 h-4" />
              legal@almasaraldaki.sa
            </a>
            <button
              onClick={() => navigate({ name: "support" })}
              className="flex items-center gap-2 justify-center px-6 py-3 rounded-xl bg-amber-400 text-emerald-950 font-bold text-sm hover:bg-amber-300 transition-all"
            >
              <Phone className="w-4 h-4" />
              تواصل مع الدعم
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
