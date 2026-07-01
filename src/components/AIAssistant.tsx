import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Bot, X, Send, Sparkles, ChevronDown,
  Loader2, TrendingDown, Lightbulb, Star,
} from "lucide-react";
import assistantAvatar from "../assets/smart-ai-assistant.webp";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type AssistantFaq = {
  question: string;
  keywords: string[];
  answer: string;
};

const normalizeArabic = (value: string) =>
  value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\u0600-\u06ff\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SMART_ASSISTANT_FAQS: AssistantFaq[] = [
  {
    question: "ما هو المسار الذكي؟",
    keywords: ["ما هو المسار", "ايه المسار", "من انتم", "عن المنصه", "تعريف المنصه"],
    answer:
      "المسار الذكي منصة لحجز برامج العمرة والنقل داخل المملكة، تربط المعتمر بالمكاتب المعتمدة وتساعده في اختيار البرنامج، الحجز، الدفع، إصدار التذكرة، متابعة الرحلة، واستخدام خدمات مثل المصحف، مواقيت الصلاة، الدعم، والتتبع.",
  },
  {
    question: "كيف أسجل حساب جديد؟",
    keywords: ["اسجل", "انشاء حساب", "اعمل حساب", "حساب جديد", "تسجيل جديد"],
    answer:
      "اضغط تسجيل الدخول ثم اختر إنشاء حساب. أدخل بياناتك الأساسية واختر نوع الحساب المناسب. للمعتمر: بياناتك الشخصية المحفوظة ستكون الأساس عند الحجز حتى لا تحتاج لإدخالها كل مرة.",
  },
  {
    question: "لماذا يجب تسجيل الدخول قبل الحجز؟",
    keywords: ["ليه اسجل", "قبل الحجز", "بدون تسجيل", "لازم تسجيل", "تسجيل الدخول للحجز"],
    answer:
      "تسجيل الدخول مطلوب حتى تحفظ المنصة بيانات المعتمر، تربط الحجز بحسابه، تصدر رقم الحجز والتذكرة الإلكترونية، وتتيح التتبع والإشعارات والفواتير والدعم بعد الحجز.",
  },
  {
    question: "كيف أحجز برنامج عمرة؟",
    keywords: ["كيف احجز", "ازاي احجز", "طريقة الحجز", "احجز عمره", "حجز برنامج", "احجز برنامج"],
    answer:
      "خطوات الحجز: 1. سجل الدخول. 2. اختر مدينة الانطلاق والتاريخ المناسب. 3. قارن البرامج المتاحة. 4. افتح تفاصيل البرنامج. 5. راجع بيانات المعتمرين والسعر شامل ضريبة القيمة المضافة ومصاريف خدمة المنصة. 6. أكمل الدفع. بعد ذلك يظهر رقم الحجز والتذكرة الإلكترونية.",
  },
  {
    question: "ما الفرق بين رقم البرنامج ورقم الحجز؟",
    keywords: ["رقم البرنامج", "رقم الحجز", "الفرق بين رقم البرنامج", "برنامج وحجز"],
    answer:
      "رقم البرنامج هو الرقم الثابت للرحلة أو الباقة التي ينشئها المكتب أو المنصة. رقم الحجز هو الرقم الخاص بالمعتمر أو المجموعة بعد إتمام الحجز. كل معتمر يحجز على نفس البرنامج يحصل على رقم حجز مرتبط برقم البرنامج.",
  },
  {
    question: "أين أجد تذكرتي الإلكترونية؟",
    keywords: ["التذكره", "تذكرة", "التذكره الالكترونيه", "فين التذكره", "عرض التذكره"],
    answer:
      "بعد إتمام الحجز ادخل إلى حجوزاتي، افتح رقم الحجز، ثم اختر التذكرة الإلكترونية. ستجد بيانات الرحلة والباركود/QR المستخدم في تسجيل الحضور عند السائق.",
  },
  {
    question: "كيف يعمل باركود الحجز؟",
    keywords: ["باركود", "qr", "كيو ار", "مسح التذكره", "السائق يمسح"],
    answer:
      "باركود الحجز يربط التذكرة برقم الحجز وبيانات المعتمر. عند وصول المعتمر، يفتح السائق تطبيقه ويمسح الباركود بالكاميرا. إذا كانت البيانات صحيحة يتم تسجيل حضور المعتمر تلقائياً داخل الرحلة.",
  },
  {
    question: "ماذا أفعل إذا لم يقرأ السائق الباركود؟",
    keywords: ["لا يقرأ الباركود", "مش بيقرا", "لا توجد بيانات", "الباركود مش شغال"],
    answer:
      "تأكد أن التذكرة تخص نفس الحجز والرحلة، وأن الإنترنت يعمل لدى السائق، وأن الكاميرا واضحة والإضاءة جيدة. إذا ظهرت رسالة لا توجد بيانات، افتح التذكرة من حجوزاتي مرة أخرى أو تواصل مع الدعم لإعادة التحقق من رقم الحجز.",
  },
  {
    question: "كيف أتتبع الباص أو الرحلة؟",
    keywords: ["تتبع", "تتبع الباص", "مكان الباص", "gps", "الخريطه", "الخريطة"],
    answer:
      "بعد تأكيد الحجز وبدء الرحلة، افتح حجوزاتي ثم اختر تتبع الرحلة. ستظهر لك الخريطة وموقع الباص عند توفر مشاركة الموقع من السائق. التتبع يعتمد على اتصال السائق بالإنترنت وتفعيل صلاحيات الموقع.",
  },
  {
    question: "هل التتبع يعمل في الخلفية؟",
    keywords: ["الخلفيه", "خلفيه", "background", "التتبع في الخلفيه", "الموقع في الخلفيه"],
    answer:
      "التتبع في الخلفية يحتاج تطبيق السائق وصلاحيات الموقع دائماً. عند استخدام التطبيق يجب السماح بالموقع أثناء الاستخدام أو دائماً حسب نظام الجوال، وعدم إغلاق التطبيق إجبارياً حتى يستمر التحديث.",
  },
  {
    question: "ما الذي يشمله السعر؟",
    keywords: ["السعر يشمل", "شامل", "ضريبه", "ضريبة", "مصاريف خدمة", "مصاريف تشغيل"],
    answer:
      "السعر المعروض للمعتمر يكون شامل ضريبة القيمة المضافة ومصاريف خدمة المنصة عند ظهورها في تفاصيل الحجز. قبل الدفع راجع ملخص السعر، عدد المعتمرين، رسوم المكتب، ومصاريف التشغيل والخدمات.",
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    keywords: ["الدفع", "طرق الدفع", "مدى", "ابل باي", "apple pay", "تابي", "تمارا", "stc"],
    answer:
      "طرق الدفع تظهر في صفحة الدفع حسب ما هو مفعل في المنصة، مثل مدى، STC Pay، Apple Pay، Google Pay، Tabby، Tamara أو التحويل حسب إعدادات الإدارة. اختر الطريقة المتاحة وأكمل الخطوات حتى تظهر حالة الدفع ناجحة.",
  },
  {
    question: "هل أستطيع الدفع بتابي أو تمارا؟",
    keywords: ["تابي", "تمارا", "تقسيط", "ادفع لاحقا"],
    answer:
      "يمكن استخدام Tabby أو Tamara إذا كانت مفعلة من الإدارة ومقبولة على الحجز الحالي. في صفحة الدفع ستظهر لك المنصات المتاحة، ثم يتم استكمال التحقق والدفع من خلال مزود الخدمة نفسه.",
  },
  {
    question: "أين أجد الفاتورة؟",
    keywords: ["فاتوره", "فاتورة", "الفاتوره الضريبيه", "الفاتورة الضريبية", "ايصال", "إيصال"],
    answer:
      "الفاتورة تظهر داخل تفاصيل الحجز بعد تأكيد العملية. يمكن أن توجد فاتورة مجمعة على رقم الحجز، وتفاصيل منفصلة لكل معتمر عند الحاجة. المبالغ تظهر شامل ضريبة القيمة المضافة ومصاريف خدمة المنصة حسب إعدادات الحجز.",
  },
  {
    question: "هل يمكن تعديل بيانات المعتمر؟",
    keywords: ["تعديل بيانات", "بياناتي", "تغيير الاسم", "تغيير الجوال", "تعديل الهوية"],
    answer:
      "يمكنك تعديل بياناتك من صفحة بياناتي أو ملفي قبل إتمام الحجز. بعد إصدار الحجز قد تكون بعض البيانات مرتبطة بالتذكرة، وفي هذه الحالة تواصل مع الدعم أو المكتب لتعديلها حسب سياسة البرنامج.",
  },
  {
    question: "كيف أضيف مرافقين؟",
    keywords: ["مرافق", "مرافقين", "اضيف معتمر", "اضافة معتمر", "عدد المعتمرين"],
    answer:
      "عند الحجز اختر عدد المعتمرين أو المرافقين وأدخل بياناتهم المطلوبة. سيتم ربط الجميع بنفس رقم الحجز، مع إمكانية عرض تفاصيل كل معتمر داخل الحجز.",
  },
  {
    question: "هل يمكن إلغاء الحجز؟",
    keywords: ["الغاء", "إلغاء", "الغاء الحجز", "استرجاع", "استرداد", "refund"],
    answer:
      "إلغاء الحجز أو الاسترداد يعتمد على سياسة المكتب والبرنامج وموعد الرحلة. افتح تفاصيل الحجز وراجع الحالة، ثم تواصل مع الدعم أو المكتب لمعرفة المبلغ المسترد والمدة المتوقعة.",
  },
  {
    question: "هل يمكن تغيير موعد الرحلة؟",
    keywords: ["تغيير الموعد", "تعديل الموعد", "اقدم الرحله", "اخر الرحله", "تغيير التاريخ"],
    answer:
      "تغيير موعد الرحلة يعتمد على توفر مقاعد وبرامج بديلة وسياسة المكتب. تواصل مع الدعم من داخل الحجز واذكر رقم الحجز والموعد المطلوب ليتم التحقق من الإمكانية.",
  },
  {
    question: "ماذا أفعل إذا لم تظهر حجوزاتي؟",
    keywords: ["حجوزاتي لا تظهر", "مش ظاهر الحجز", "الحجز اختفى", "لا توجد حجوزات"],
    answer:
      "تأكد أنك سجلت الدخول بنفس الحساب المستخدم في الحجز. جرّب تحديث الصفحة، ثم افتح حجوزاتي مرة أخرى. إذا لم يظهر الحجز، أرسل رقم الجوال أو رقم الحجز للدعم للتحقق.",
  },
  {
    question: "ماذا أفعل إذا فشل الدفع؟",
    keywords: ["فشل الدفع", "الدفع فشل", "لم يتم الدفع", "خصم ولم يظهر", "المبلغ اتخصم"],
    answer:
      "إذا فشل الدفع ولم يتم الخصم، حاول مرة أخرى أو استخدم طريقة دفع أخرى. إذا تم الخصم ولم يتأكد الحجز، لا تكرر الدفع فوراً، افتح الدعم وأرسل رقم العملية أو صورة الإشعار ليتحقق الفريق.",
  },
  {
    question: "كيف أتواصل مع المكتب؟",
    keywords: ["التواصل مع المكتب", "رقم المكتب", "المكتب", "مكتب السفر"],
    answer:
      "افتح تفاصيل البرنامج أو الحجز وستظهر بيانات المكتب المتاحة إذا كانت مفعلة. يمكنك أيضاً التواصل مع الدعم وإرسال رقم الحجز ليتم توجيهك للمكتب المسؤول.",
  },
  {
    question: "أين نقطة الانطلاق؟",
    keywords: ["نقطة الانطلاق", "مكان الانطلاق", "فين التجمع", "موعد الانطلاق", "مكان الباص"],
    answer:
      "نقطة الانطلاق ووقت التجمع تظهر داخل تفاصيل البرنامج والحجز. قبل الرحلة راجع التذكرة الإلكترونية والإشعارات، لأن المكتب قد يرسل تحديثاً بوقت أو موقع التجمع.",
  },
  {
    question: "ما تعليمات الحضور قبل الرحلة؟",
    keywords: ["الحضور", "قبل الرحله", "قبل الرحلة", "وقت التجمع", "احضر قبل"],
    answer:
      "يفضل الحضور قبل موعد الانطلاق بوقت كافٍ، وتجهيز الهوية أو الإقامة، التذكرة الإلكترونية، ورقم الحجز. عند الوصول اعرض الباركود للسائق ليتم تسجيل حضورك.",
  },
  {
    question: "ما المستندات المطلوبة؟",
    keywords: ["المستندات", "الوثائق", "الهوية", "الجواز", "الاقامة", "الإقامة", "تصريح"],
    answer:
      "عادة تحتاج هوية أو إقامة سارية وبيانات الحجز. متطلبات التصاريح أو الأنظمة الرسمية قد تتغير، لذلك يجب مراجعة الجهات الرسمية أو المكتب قبل السفر، خصوصاً للتأشيرات والتصاريح.",
  },
  {
    question: "ما الفرق بين البرامج الاقتصادية والفاخرة؟",
    keywords: ["اقتصادي", "فاخر", "vip", "فرق البرامج", "الفرق بين البرامج"],
    answer:
      "البرنامج الاقتصادي يركز على السعر الأقل والخدمات الأساسية. البرنامج الفاخر أو VIP يقدم فنادق أعلى، قرب أكبر من الحرم، راحة أكثر، وخدمات إضافية حسب وصف المكتب. قارن تفاصيل البرنامج قبل الحجز.",
  },
  {
    question: "ما أفضل برنامج للعائلات؟",
    keywords: ["عائله", "عائلة", "اطفال", "أطفال", "اسره", "أسرة"],
    answer:
      "للعائلات يفضل اختيار برنامج بمدة مريحة، فندق قريب من الحرم، غرف مناسبة، ونقل واضح. راجع عدد المعتمرين والأطفال في تفاصيل الحجز وتأكد من سياسة المكتب بخصوص الأطفال والمرافقين.",
  },
  {
    question: "ما أفضل وقت للعمرة؟",
    keywords: ["افضل وقت", "ارخص وقت", "اقل زحمه", "أقل زحمة", "متى اعتمر"],
    answer:
      "الأوقات الأقل ازدحاماً غالباً تكون خارج رمضان والمواسم والإجازات. الأسعار تختلف حسب العرض والطلب، لذلك قارن البرامج حسب التاريخ ومدينة الانطلاق، واحجز مبكراً عند توفر عرض مناسب.",
  },
  {
    question: "كيف أؤدي العمرة؟",
    keywords: ["مناسك", "كيف اعتمر", "اداء العمرة", "خطوات العمرة", "طواف", "سعي", "احرام"],
    answer:
      "خطوات العمرة باختصار: الإحرام من الميقات، ثم الطواف حول الكعبة سبعة أشواط، ثم السعي بين الصفا والمروة سبعة أشواط، ثم الحلق أو التقصير. عند الحاجة افتح قسم المناسك أو اسألني عن أي خطوة بالتفصيل.",
  },
  {
    question: "هل يوجد مصحف داخل المنصة؟",
    keywords: ["المصحف", "القران", "القرآن", "قراءه القران", "تلاوه"],
    answer:
      "نعم، يوجد قسم للمصحف والقراءة والتلاوة حسب الخدمات المفعلة. يمكنك فتح أيقونة المصحف من المنصة، والعودة للمنصة من زر الرجوع أو العودة الموجود داخل صفحة المصحف.",
  },
  {
    question: "هل يوجد بث مباشر للحرمين؟",
    keywords: ["بث مباشر", "قناة المدينة", "الحرم", "الحرمين", "مكة مباشر", "المدينة مباشر"],
    answer:
      "إذا كان البث مفعلاً داخل المنصة ستجده في قسم المرئيات أو خدمات الحرمين. إذا لم يعمل البث، جرّب تحديث الصفحة أو تواصل مع الدعم لأن بعض روابط البث قد تتغير من المصدر.",
  },
  {
    question: "كيف أستخدم القبلة والبوصلة؟",
    keywords: ["قبله", "قبلة", "بوصله", "البوصله", "اتجاه الكعبه"],
    answer:
      "افتح أداة القبلة أو البوصلة من المنصة، واسمح للمتصفح أو التطبيق باستخدام الحساسات والموقع إذا طلب ذلك. دقة البوصلة تختلف حسب الجهاز، ويفضل تحريك الجوال بشكل رقم 8 لمعايرة الاتجاه.",
  },
  {
    question: "كيف أفعل الإشعارات؟",
    keywords: ["اشعارات", "إشعارات", "تنبيهات", "push", "بوش"],
    answer:
      "لتفعيل الإشعارات وافق على طلب الإذن من المتصفح أو التطبيق. الإشعارات تساعدك في متابعة الحجز، التذكير بموعد الرحلة، وتنبيهات التتبع أو الرسائل المهمة.",
  },
  {
    question: "كيف أتواصل مع الدعم؟",
    keywords: ["الدعم", "اتصل بنا", "تواصل معنا", "مشكله", "مشكلة", "شكوى"],
    answer:
      "افتح صفحة الدعم أو اتصل بنا من المنصة، واكتب رسالتك مع رقم الحجز إن وجد. كلما أرسلت رقم الحجز وصورة المشكلة أو تفاصيلها، كان الحل أسرع.",
  },
  {
    question: "كيف أحذف حسابي؟",
    keywords: ["حذف حسابي", "احذف الحساب", "حذف الحساب", "الغاء الحساب", "delete account"],
    answer:
      "يمكن طلب حذف الحساب من صفحة بياناتي أو ملفي إذا كانت الخاصية مفعلة. حذف الحساب قد يحذف البيانات المرتبطة به نهائياً، لذلك تأكد من عدم وجود حجوزات أو مطالبات قائمة قبل التنفيذ.",
  },
  {
    question: "هل توجد لغات أخرى؟",
    keywords: ["اللغه", "اللغة", "انجليزي", "اردو", "english", "urdu"],
    answer:
      "المنصة تدعم تعدد اللغات حسب الإعدادات المتاحة. من أيقونة الكرة الأرضية في الصفحة الرئيسية قبل تسجيل الدخول يمكنك تغيير اللغة، وبعد الدخول تظهر الواجهة حسب اللغة المختارة إن كانت مفعلة.",
  },
  {
    question: "هل يوجد دارك مود؟",
    keywords: ["دارك مود", "الوضع الليلي", "dark mode", "ثيم"],
    answer:
      "إذا كان الوضع الليلي مفعلاً ستجد زر التبديل في الواجهة. الوضع الليلي يساعد على استخدام المنصة في الإضاءة المنخفضة مع الحفاظ على وضوح النصوص والأزرار.",
  },
  {
    question: "هل المنصة آمنة؟",
    keywords: ["امان", "آمن", "خصوصيه", "الخصوصيه", "بياناتي", "حماية البيانات"],
    answer:
      "المنصة مصممة لحفظ بيانات الحجز وربطها بحسابك. لا تشارك كلمة المرور أو رموز التحقق مع أي شخص، واستخدم الدعم الرسمي داخل المنصة عند وجود مشكلة.",
  },
];

const DEFAULT_QUICK_QUESTIONS = SMART_ASSISTANT_FAQS.slice(3, 15).map((item) => item.question);

function findFaqReply(message: string): string | undefined {
  const normalized = normalizeArabic(message);
  if (!normalized) return undefined;

  return SMART_ASSISTANT_FAQS.find((item) =>
    item.keywords.some((keyword) => normalized.includes(normalizeArabic(keyword)))
  )?.answer;
}

function buildFaqKnowledgeBase() {
  return SMART_ASSISTANT_FAQS.map((item, index) => `${index + 1}. سؤال: ${item.question}\nالإجابة: ${item.answer}`).join("\n\n");
}

export default function AIAssistant({
  navigate,
  visitorMode = false,
  pageName,
}: {
  navigate: (p: any) => void;
  visitorMode?: boolean;
  pageName?: string;
}) {
  const shouldShowIntro = visitorMode && pageName === "home";
  const [introVisible, setIntroVisible] = useState(() => {
    if (!shouldShowIntro) return false;
    return sessionStorage.getItem("smartAssistantIntroSeen") !== "1";
  });
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tips">("chat");

  // جلب الإعدادات الديناميكية من قاعدة البيانات
  const quickQuestions  = useQuery(api.aiSettings.getQuickQuestions);
  const recommendations = useQuery(api.aiSettings.getRecommendations);
  const aiConfig        = useQuery(api.aiSettings.getAll);
  const packages        = useQuery(api.packages.list, {});
  const announcements   = useQuery(api.announcements.getActive);
  const chatAction      = useAction(api.aiAssistant.chat);
  const bottomRef       = useRef<HTMLDivElement>(null);

  const welcomeMsg = aiConfig?.welcome_message
    ?? "مرحباً! أنا مساعدك الذكي في المسار الذكي 🕌\n\nيمكنني مساعدتك في:\n• اختيار أفضل برنامج عمرة\n• معرفة أرخص أوقات السفر\n• الإجابة على أسئلتك عن المناسك\n\nكيف يمكنني مساعدتك؟";

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!shouldShowIntro) {
      setIntroVisible(false);
      return;
    }
    if (sessionStorage.getItem("smartAssistantIntroSeen") === "1") return;
    setIntroVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("smartAssistantIntroSeen", "1");
      setIntroVisible(false);
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [shouldShowIntro]);

  // تحديث رسالة الترحيب عند تغيير الإعدادات
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: welcomeMsg, timestamp: Date.now() }]);
    }
  }, [welcomeMsg]);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  const buildPackagesContext = () => {
    if (!packages?.length) return undefined;
    return packages
      .slice(0, 12)
      .map((p) =>
        `- ${p.title}: ${p.price.toLocaleString("ar-SA")} ر.س، ${p.duration} أيام، من ${p.departureCity}، نوع: ${p.packageType}، فنادق: ${p.hotelStars} نجوم`
      )
      .join("\n");
  };

  const buildAppContext = () => {
    const parts: string[] = [];
    if (announcements?.length) {
      parts.push(`الإعلانات الحالية:\n${announcements.slice(0, 3).map((a: any) => `- ${a.title}: ${a.content}`).join("\n")}`);
    }
    parts.push(`ميزات التطبيق المتاحة:
- حجز برامج العمرة مباشرة
- تتبع الرحلة المباشر (GPS)
- مصحف شريف كامل
- أذكار وأدعية
- مواقيت الصلاة
- الدعم والتواصل المباشر مع الإدارة
- إدارة الحجوزات والمرافقين`);
    parts.push(`قاعدة أسئلة وأجوبة المعتمر داخل المنصة:\n${buildFaqKnowledgeBase()}`);
    return parts.join("\n\n");
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    const loginIntent = /حجز|احجز|حجوز|برامج|برنامج|باقة|عروض|book|booking|package|program/i.test(content);
    if (visitorMode && loginIntent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "أهلاً بك. أقدر أساعدك في اختيار البرنامج المناسب، لكن عرض البرامج والحجز يحتاج تسجيل الدخول أولاً حتى نحفظ بياناتك وتظهر لك الأسعار والحجوزات بشكل صحيح.\n\nاضغط تسجيل الدخول ثم ارجع لي، وسأكمل معك خطوة بخطوة.",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const faqReply = findFaqReply(content);
    if (faqReply) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: faqReply, timestamp: Date.now() },
      ]);
      return;
    }

    setLoading(true);

    try {
      const result = await chatAction({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        packagesContext: buildPackagesContext(),
        appContext: buildAppContext(),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى.", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const defaultQuestions = [
    "ما أرخص وقت للعمرة؟",
    "ما الفرق بين البرامج الاقتصادية والفاخرة؟",
    "كم يستغرق أداء مناسك العمرة؟",
    "ما أفضل برنامج للعائلات؟",
  ];
  const displayQuestions    = Array.from(new Set([...(quickQuestions ?? []), ...DEFAULT_QUICK_QUESTIONS]));
  const displayRecommendations = recommendations ?? [];

  return (
    <>
      {/* ── Floating Button ── */}
      {!open && (
        introVisible ? (
          <div className="smart-ai-intro fixed left-4 bottom-24 z-40 w-[360px] max-w-[calc(100vw-32px)]" dir="rtl">
            <div className="relative rounded-[28px] border border-white/25 bg-emerald-950/72 p-4 text-white shadow-2xl shadow-emerald-950/30 backdrop-blur-xl">
              <button
                onClick={() => {
                  sessionStorage.setItem("smartAssistantIntroSeen", "1");
                  setIntroVisible(false);
                }}
                className="absolute left-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                aria-label="إخفاء المساعد"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-end gap-4">
                <button
                  onClick={() => {
                    sessionStorage.setItem("smartAssistantIntroSeen", "1");
                    setIntroVisible(false);
                    setOpen(true);
                  }}
                  className="smart-ai-avatar relative h-28 w-24 flex-shrink-0"
                  aria-label="فتح المساعد الذكي"
                >
                  <span className="smart-ai-halo" />
                  <span className="smart-ai-body smart-ai-portrait">
                    <img src={assistantAvatar} alt="" aria-hidden="true" />
                  </span>
                  <span className="smart-ai-hand" style={{ backgroundImage: `url(${assistantAvatar})` }} />
                </button>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black text-emerald-950">
                    <Sparkles className="h-3.5 w-3.5" />
                    مساعد المسار الذكي
                  </div>
                  <h3 className="text-lg font-black leading-7">أهلاً، أنا هنا لمساعدتك</h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-50/85">
                    اسألني عن العمرة، أو اضغط هنا وابدأ المحادثة. للحجز أو عرض البرامج سأطلب منك تسجيل الدخول أولاً.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        sessionStorage.setItem("smartAssistantIntroSeen", "1");
                        setIntroVisible(false);
                        setOpen(true);
                      }}
                      className="rounded-xl bg-white px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-50"
                    >
                      ابدأ المحادثة
                    </button>
                    <button
                      onClick={() => navigate({ name: "signin" })}
                      className="rounded-xl border border-white/25 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-700 text-white shadow-2xl shadow-emerald-900/35 flex items-center justify-center hover:scale-110 transition-all duration-300 group overflow-hidden border-2 border-amber-300/80"
            aria-label="فتح مساعد AI"
          >
            <img src={assistantAvatar} alt="" aria-hidden="true" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border border-emerald-950/10">
              <Sparkles className="w-2.5 h-2.5 text-amber-900" />
            </span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              مساعد AI
            </span>
          </button>
        )
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div
          className={`fixed bottom-6 left-6 z-50 w-[370px] max-w-[calc(100vw-20px)] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-gray-100 flex flex-col transition-all duration-300 ${
            minimized ? "h-16" : "h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-violet-700 to-purple-600 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                <img src={assistantAvatar} alt="" aria-hidden="true" className="h-full w-full rounded-full object-cover object-center ring-1 ring-white/25" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">مساعد العمرة الذكي</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-purple-200 text-xs">متاح الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${minimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "chat"
                      ? "text-purple-700 border-b-2 border-purple-600 bg-purple-50/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  المحادثة
                </button>
                <button
                  onClick={() => setActiveTab("tips")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "tips"
                      ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  توصيات ذكية
                </button>
              </div>

              {/* ── تبويب المحادثة ── */}
              {activeTab === "chat" && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 ml-2 mt-1">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "bg-gray-100 text-gray-800 rounded-tr-sm"
                              : "bg-gradient-to-br from-violet-50 to-purple-50 text-gray-800 border border-purple-100 rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-end">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ml-2">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Quick Questions - ديناميكية */}
                  {messages.length <= 1 && displayQuestions.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                      {displayQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors font-medium"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Best Time Banner */}
                  {messages.length <= 1 && (
                    <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-800">أرخص وقت للعمرة</div>
                        <div className="text-xs text-amber-600">شهر محرم وصفر — أسعار أقل بـ 40%</div>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <div className="flex gap-2 items-end">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="اسألني عن العمرة..."
                        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                        disabled={loading}
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-purple-300 transition-all flex-shrink-0"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── تبويب التوصيات الذكية ── */}
              {activeTab === "tips" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-amber-800 text-sm">توصيات مخصصة</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      اختر ما يناسبك وسيساعدك المساعد في إيجاد أفضل برنامج
                    </p>
                  </div>

                  {displayRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">لا توجد توصيات حالياً</p>
                    </div>
                  ) : (
                    displayRecommendations.map((rec: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveTab("chat");
                          sendMessage(`أريد ${rec.title}: ${rec.text}`);
                        }}
                        className="w-full text-right bg-white border border-gray-100 rounded-2xl p-4 hover:border-purple-200 hover:bg-purple-50/30 transition-all shadow-sm group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center flex-shrink-0 group-hover:from-purple-200 group-hover:to-violet-200 transition-colors">
                            <Star className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm mb-1">{rec.title}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{rec.text}</div>
                          </div>
                          <Send className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))
                  )}

                  {/* زر للانتقال للمحادثة */}
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="w-full py-3 rounded-2xl bg-gradient-to-l from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    ابدأ محادثة مع المساعد
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
