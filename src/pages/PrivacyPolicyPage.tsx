import { Shield, Lock, Eye, Trash2, Mail, MapPin, Bell, Server, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Page } from "../App";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";
const LAST_UPDATED = "١ يناير ٢٠٢٥";
const CONTACT_EMAIL = "privacy@almasaraldaki.sa";

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-right hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-black text-gray-800 text-base">{title}</h2>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed space-y-3 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function Item({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 pt-3">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
      <div>
        {title && <span className="font-bold text-gray-700">{title}: </span>}
        <span>{children}</span>
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-bl from-emerald-950 via-emerald-900 to-teal-900 text-white pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src={LOGO} alt="المسار الذكي" className="h-16 w-auto mx-auto mb-6" style={{ mixBlendMode: "screen", filter: "drop-shadow(0 4px 16px rgba(240,208,128,0.4))" }} />
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-9 h-9 text-emerald-300" />
          </div>
          <h1 className="text-3xl font-black mb-3">سياسة الخصوصية</h1>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto leading-relaxed">
            نحن في منصة <strong className="text-white">المسار الذكي</strong> نُولي خصوصيتك أهمية قصوى.
            هذه السياسة تشرح بوضوح كيف نجمع بياناتك ونستخدمها ونحميها.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs text-emerald-200">
            <span>📅</span> آخر تحديث: {LAST_UPDATED}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 pb-20 space-y-4">
        <div className="bg-emerald-700 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="font-black text-lg mb-3 flex items-center gap-2"><span>⚡</span> الملخص السريع</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: "🔒", text: "بياناتك مشفّرة ومحمية بالكامل" },
              { icon: "🚫", text: "لا نبيع بياناتك لأي طرف ثالث" },
              { icon: "📍", text: "الموقع الجغرافي بموافقتك فقط" },
              { icon: "🗑️", text: "يمكنك حذف حسابك في أي وقت" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5">
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-semibold leading-tight">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Section icon={Shield} title="١. من نحن وما هي منصة المسار الذكي؟" color="bg-emerald-600">
          <p className="pt-3">منصة <strong>المسار الذكي</strong> هي منصة إلكترونية سعودية متخصصة في تسهيل حجز برامج العمرة داخل المملكة العربية السعودية، تربط بين المعتمرين ومكاتب السفر والسياحة المعتمدة. تتيح المنصة مقارنة الأسعار والبرامج، وإتمام الحجز والدفع الإلكتروني، وتتبع رحلات النقل بشكل مباشر.</p>
          <p>تسري هذه السياسة على جميع مستخدمي المنصة سواء كانوا معتمرين أو أصحاب مكاتب سفر أو سائقين.</p>
        </Section>

        <Section icon={Eye} title="٢. ما البيانات التي نجمعها؟" color="bg-blue-600">
          <p className="pt-3 font-semibold text-gray-700">أ) البيانات التي تقدّمها أنت مباشرة:</p>
          <Item title="بيانات الحساب">الاسم الكامل، البريد الإلكتروني، كلمة المرور المشفّرة، رقم الجوال.</Item>
          <Item title="بيانات الهوية (للسائقين)">رقم الهوية الوطنية أو الإقامة، الجنسية، نوع الإقامة.</Item>
          <Item title="بيانات الحجز">تفاصيل البرامج المحجوزة، تواريخ السفر، عدد المرافقين، بيانات المرافقين.</Item>
          <Item title="بيانات الدفع">معلومات طريقة الدفع (مدى، STC Pay، Apple Pay، Google Pay، تحويل بنكي). لا نخزّن أرقام البطاقات البنكية مباشرة.</Item>
          <Item title="بيانات المكتب">اسم المكتب، رقم الترخيص، العنوان، بيانات التواصل.</Item>
          <Item title="بيانات الحافلة (للسائقين)">رقم اللوحة، نوع الحافلة، عدد المقاعد، لون الحافلة.</Item>
          <p className="font-semibold text-gray-700 pt-2">ب) البيانات التي نجمعها تلقائياً:</p>
          <Item title="الموقع الجغرافي">يُجمع فقط أثناء الرحلات النشطة وبموافقة صريحة من السائق لأغراض التتبع المباشر.</Item>
          <Item title="بيانات الجهاز">نوع الجهاز، نظام التشغيل، المتصفح، عنوان IP.</Item>
          <Item title="بيانات الاستخدام">الصفحات التي تزورها، الوقت الذي تقضيه، الإجراءات التي تتخذها داخل التطبيق.</Item>
        </Section>

        <Section icon={Server} title="٣. لماذا نجمع هذه البيانات؟" color="bg-purple-600">
          <p className="pt-3">نستخدم بياناتك حصراً للأغراض التالية:</p>
          <Item title="إنشاء وإدارة حسابك">التحقق من هويتك وتأمين دخولك للمنصة.</Item>
          <Item title="إتمام الحجوزات">معالجة طلبات الحجز وإرسال تأكيدات الحجز والتذاكر عبر البريد الإلكتروني.</Item>
          <Item title="معالجة المدفوعات">إتمام عمليات الدفع الإلكتروني بأمان وإدارة المحفظة الرقمية.</Item>
          <Item title="تتبع الرحلات">عرض موقع الحافلة للمعتمرين أثناء الرحلات النشطة فقط.</Item>
          <Item title="التواصل معك">إرسال إشعارات تأكيد الحجز، تغييرات الحالة، رموز التحقق (OTP)، والتنبيهات المهمة.</Item>
          <Item title="تحسين الخدمة">تحليل أنماط الاستخدام لتطوير تجربة المستخدم وتحسين الأداء.</Item>
          <Item title="الامتثال القانوني">الوفاء بالمتطلبات التنظيمية والقانونية في المملكة العربية السعودية.</Item>
        </Section>

        <Section icon={Lock} title="٤. كيف نحمي بياناتك؟" color="bg-emerald-700">
          <p className="pt-3">نطبّق معايير أمان عالية لحماية بياناتك:</p>
          <Item title="تشفير الاتصالات">جميع البيانات المنقولة بين جهازك وخوادمنا مشفّرة باستخدام بروتوكول HTTPS/TLS.</Item>
          <Item title="تشفير كلمات المرور">لا نخزّن كلمات المرور بصيغتها الأصلية، بل نستخدم خوارزميات تشفير قوية.</Item>
          <Item title="التحقق بخطوتين">نرسل رمز OTP للتحقق من البريد الإلكتروني عند إنشاء الحساب.</Item>
          <Item title="عزل البيانات">بيانات كل مستخدم معزولة تماماً عن بيانات المستخدمين الآخرين.</Item>
          <Item title="خوادم آمنة">نستخدم خدمات سحابية موثوقة مع نسخ احتياطية منتظمة وحماية من الاختراق.</Item>
          <Item title="الوصول المحدود">لا يصل إلى بياناتك إلا الموظفون المخوّلون وفق مبدأ الحاجة للمعرفة.</Item>
        </Section>

        <Section icon={MapPin} title="٥. الموقع الجغرافي والإشعارات" color="bg-amber-600">
          <p className="pt-3 font-semibold text-gray-700">📍 الموقع الجغرافي:</p>
          <Item>نطلب إذن الوصول للموقع الجغرافي <strong>فقط من السائقين</strong> وأثناء الرحلات النشطة.</Item>
          <Item>يُستخدم الموقع حصراً لتمكين المعتمرين من تتبع موقع الحافلة في الوقت الفعلي.</Item>
          <Item>لا نجمع بيانات الموقع في الخلفية أو خارج أوقات الرحلات النشطة.</Item>
          <Item>يمكن للسائق إيقاف مشاركة الموقع في أي وقت من داخل التطبيق.</Item>
          <p className="font-semibold text-gray-700 pt-2">🔔 الإشعارات:</p>
          <Item>نرسل إشعارات فقط بعد الحصول على موافقتك الصريحة.</Item>
          <Item>تشمل الإشعارات: تأكيدات الحجز، تغييرات الحالة، تنبيهات الرحلة، والرسائل المهمة.</Item>
          <Item>يمكنك إلغاء الإشعارات في أي وقت من إعدادات جهازك أو من داخل التطبيق.</Item>
        </Section>

        <Section icon={Bell} title="٦. هل نشارك بياناتك مع أطراف أخرى؟" color="bg-red-600">
          <div className="pt-3 bg-red-50 border border-red-100 rounded-xl p-4 mb-3">
            <p className="font-black text-red-700 text-base">🚫 لا نبيع بياناتك أبداً</p>
            <p className="text-red-600 text-xs mt-1">لا نقوم ببيع أو تأجير أو مقايضة بياناتك الشخصية مع أي طرف ثالث لأغراض تجارية.</p>
          </div>
          <p>نشارك بياناتك في الحالات المحدودة التالية فقط:</p>
          <Item title="مكاتب السفر المعتمدة">نشارك بيانات الحجز الضرورية مع المكتب الذي حجزت معه لإتمام الخدمة.</Item>
          <Item title="مزودو خدمات الدفع">نشارك البيانات اللازمة لمعالجة المدفوعات مع بوابات الدفع المعتمدة.</Item>
          <Item title="خدمات البريد الإلكتروني">نستخدم خدمة بريد إلكتروني موثوقة لإرسال التأكيدات والإشعارات.</Item>
          <Item title="الجهات القانونية">قد نُفصح عن البيانات إذا طُلب منا ذلك بموجب أمر قضائي أو قانوني نافذ.</Item>
        </Section>

        <Section icon={Trash2} title="٧. حقوقك وكيفية طلب حذف بياناتك" color="bg-gray-700">
          <p className="pt-3">لديك الحقوق الكاملة التالية فيما يخص بياناتك:</p>
          <Item title="الاطلاع">طلب نسخة من جميع بياناتك الشخصية المخزّنة لدينا.</Item>
          <Item title="التصحيح">تعديل أي بيانات غير دقيقة أو ناقصة من خلال ملفك الشخصي.</Item>
          <Item title="الحذف">طلب حذف حسابك وجميع بياناتك الشخصية نهائياً.</Item>
          <Item title="الاعتراض">الاعتراض على معالجة بياناتك لأغراض معينة.</Item>
          <Item title="سحب الموافقة">سحب موافقتك على الموقع الجغرافي أو الإشعارات في أي وقت.</Item>
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="font-bold text-emerald-800 mb-2">🗑️ كيفية طلب حذف الحساب والبيانات:</p>
            <ol className="space-y-1.5 text-emerald-700 text-xs">
              <li><strong>١.</strong> أرسل بريداً إلكترونياً إلى: <span className="font-mono font-bold">{CONTACT_EMAIL}</span></li>
              <li><strong>٢.</strong> اكتب في الموضوع: "طلب حذف الحساب والبيانات"</li>
              <li><strong>٣.</strong> أذكر البريد الإلكتروني المرتبط بحسابك</li>
              <li><strong>٤.</strong> سنعالج طلبك خلال <strong>7 أيام عمل</strong> ونرسل لك تأكيداً بالحذف</li>
            </ol>
          </div>
        </Section>

        <Section icon={Server} title="٨. مدة الاحتفاظ بالبيانات" color="bg-teal-600">
          <p className="pt-3">نحتفظ ببياناتك للمدد التالية:</p>
          <Item title="بيانات الحساب">طوال فترة نشاط حسابك، وتُحذف خلال 30 يوماً من طلب الحذف.</Item>
          <Item title="سجلات الحجز">نحتفظ بها لمدة 5 سنوات لأغراض قانونية ومحاسبية وفق الأنظمة السعودية.</Item>
          <Item title="بيانات الموقع الجغرافي">تُحذف تلقائياً بعد انتهاء الرحلة مباشرة.</Item>
          <Item title="سجلات الاستخدام">تُحتفظ بها لمدة 12 شهراً لأغراض تحسين الخدمة.</Item>
        </Section>

        <Section icon={Shield} title="٩. خصوصية الأطفال" color="bg-pink-600">
          <p className="pt-3">منصة المسار الذكي موجّهة للمستخدمين الذين تجاوزوا سن <strong>18 عاماً</strong>. لا نجمع بيانات شخصية من الأطفال دون سن 18 عن قصد. إذا اكتشفنا أن طفلاً دون هذا السن قدّم بياناته، سنحذفها فوراً. إذا كنت ولياً للأمر وتعتقد أن طفلك قدّم بياناته، يرجى التواصل معنا فوراً.</p>
        </Section>

        <Section icon={Mail} title="١٠. التواصل معنا بخصوص الخصوصية" color="bg-emerald-600">
          <p className="pt-3">إذا كان لديك أي استفسار أو طلب يتعلق بخصوصيتك أو بياناتك الشخصية، يمكنك التواصل معنا عبر:</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">البريد الإلكتروني للخصوصية</p>
                <p className="font-bold text-gray-800 text-sm font-mono">{CONTACT_EMAIL}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">العنوان</p>
                <p className="font-bold text-gray-800 text-sm">المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">سنردّ على استفساراتك خلال <strong>3 أيام عمل</strong> على أقصى تقدير.</p>
        </Section>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-black text-amber-800 mb-2 flex items-center gap-2"><span>📋</span> تحديثات سياسة الخصوصية</h3>
          <p className="text-amber-700 text-sm leading-relaxed">قد نُحدّث هذه السياسة من وقت لآخر لتعكس التغييرات في خدماتنا أو المتطلبات القانونية. سنُخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق قبل 30 يوماً من تطبيقها. استمرارك في استخدام المنصة بعد التحديث يُعدّ موافقة على السياسة الجديدة.</p>
          <p className="text-amber-600 text-xs mt-2 font-semibold">آخر تحديث: {LAST_UPDATED}</p>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => navigate({ name: "home" })}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold shadow-lg hover:from-emerald-800 hover:to-emerald-700 transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
