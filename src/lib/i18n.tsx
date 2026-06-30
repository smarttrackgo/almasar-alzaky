import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "ar" | "en" | "ur";

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; nativeName: string; shortName: string; dir: "rtl" | "ltr" }> = [
  { code: "ar", nativeName: "العربية", shortName: "AR", dir: "rtl" },
  { code: "en", nativeName: "English", shortName: "EN", dir: "ltr" },
  { code: "ur", nativeName: "اردو", shortName: "UR", dir: "rtl" },
];

const DICT = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "عن المنصة",
    "nav.quran": "المصحف",
    "nav.guide": "دليل المعتمر",
    "nav.adhkar": "الأذكار",
    "nav.umrahMap": "خريطة العمرة",
    "nav.prayerTimes": "مواقيت الصلاة",
    "nav.haramainLive": "بث الحرمين",
    "nav.bookings": "حجوزاتي",
    "nav.support": "الدعم",
    "nav.profile": "ملفي",
    "nav.office": "لوحة المكتب",
    "nav.driver": "لوحة السائق",
    "nav.admin": "الإدارة",
    "nav.signin": "تسجيل الدخول",
    "nav.back": "رجوع",
    "footer.booking": "الحجز",
    "footer.services": "الخدمات الدينية",
    "footer.contact": "تواصل معنا",
    "footer.availablePrograms": "البرامج المتاحة",
    "footer.terms": "الشروط والأحكام",
    "footer.privacy": "سياسة الخصوصية",
    "footer.rights": "© 2025 المسار الذكي لحجز العمرة. جميع الحقوق محفوظة.",
    "guide.badge": "دليل المعتمر",
    "guide.title": "كل ما يحتاجه المعتمر في الرحلة في مكان واحد",
    "guide.subtitle": "مصحف، أذكار، مواقيت الصلاة، القبلة، المناسك، بث الحرمين، وسبحة محفوظة تلقائيًا داخل المنصة.",
    "guide.quran.title": "المصحف الشريف",
    "guide.quran.desc": "قراءة ككتاب، صوتيات، مرئيات، ومعاني القرآن.",
    "guide.adhkar.title": "الأذكار والأدعية",
    "guide.adhkar.desc": "أذكار السفر والعمرة والصباح والمساء.",
    "guide.prayer.title": "مواقيت الصلاة والقبلة",
    "guide.prayer.desc": "الصلاة القادمة، المؤذن، واتجاه القبلة الحي.",
    "guide.map.title": "خريطة العمرة",
    "guide.map.desc": "مراحل المناسك والأماكن المهمة في الرحلة.",
    "guide.live.title": "بث ودروس الحرمين",
    "guide.live.desc": "روابط البث والخطب والدروس من الحرمين.",
    "guide.support.title": "الدعم والبلاغات",
    "guide.support.desc": "تواصل سريع لو احتجت مساعدة أثناء الرحلة.",
    "guide.steps.title": "مراحل العمرة",
    "guide.steps.subtitle": "عرض مختصر وعملي للخطوة التالية.",
    "guide.tasbeeh": "السبحة",
    "guide.tasbeehSaved": "محفوظة تلقائيًا على جهازك.",
    "guide.tapTasbeeh": "اضغط للتسبيح",
    "guide.goal": "الهدف",
    "guide.quickDuas": "أدعية سريعة",
    "guide.step.1.title": "الإحرام",
    "guide.step.1.text": "النية والتلبية والاستعداد قبل دخول مكة.",
    "guide.step.1.tag": "قبل الوصول",
    "guide.step.2.title": "الطواف",
    "guide.step.2.text": "سبعة أشواط حول الكعبة، مع الدعاء والسكينة.",
    "guide.step.2.tag": "الحرم",
    "guide.step.3.title": "ركعتا الطواف",
    "guide.step.3.text": "تصلى خلف مقام إبراهيم إن تيسر أو في أي موضع من المسجد.",
    "guide.step.3.tag": "بعد الطواف",
    "guide.step.4.title": "السعي",
    "guide.step.4.text": "سبعة أشواط بين الصفا والمروة.",
    "guide.step.4.tag": "المسعى",
    "guide.step.5.title": "الحلق أو التقصير",
    "guide.step.5.text": "به تتم العمرة ويتحلل المعتمر من إحرامه.",
    "guide.step.5.tag": "الختام",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.quran": "Quran",
    "nav.guide": "Pilgrim Guide",
    "nav.adhkar": "Adhkar",
    "nav.umrahMap": "Umrah Map",
    "nav.prayerTimes": "Prayer Times",
    "nav.haramainLive": "Haramain Live",
    "nav.bookings": "My Bookings",
    "nav.support": "Support",
    "nav.profile": "Profile",
    "nav.office": "Office Panel",
    "nav.driver": "Driver Panel",
    "nav.admin": "Admin",
    "nav.signin": "Sign in",
    "nav.back": "Back",
    "footer.booking": "Booking",
    "footer.services": "Spiritual Services",
    "footer.contact": "Contact us",
    "footer.availablePrograms": "Available programs",
    "footer.terms": "Terms and Conditions",
    "footer.privacy": "Privacy Policy",
    "footer.rights": "© 2025 Smart Path for Umrah Booking. All rights reserved.",
    "guide.badge": "Pilgrim Guide",
    "guide.title": "Everything a pilgrim needs in one place",
    "guide.subtitle": "Quran, adhkar, prayer times, qibla, rituals, Haramain live streams, and a saved digital tasbeeh.",
    "guide.quran.title": "Holy Quran",
    "guide.quran.desc": "Book-style reading, audio, video, and Quran meanings.",
    "guide.adhkar.title": "Adhkar and Duas",
    "guide.adhkar.desc": "Travel, Umrah, morning, and evening supplications.",
    "guide.prayer.title": "Prayer Times and Qibla",
    "guide.prayer.desc": "Next prayer, adhan, and live qibla direction.",
    "guide.map.title": "Umrah Map",
    "guide.map.desc": "Ritual steps and important journey locations.",
    "guide.live.title": "Haramain Streams",
    "guide.live.desc": "Live streams, sermons, and lessons from the Haramain.",
    "guide.support.title": "Support and Reports",
    "guide.support.desc": "Quick help during the journey.",
    "guide.steps.title": "Umrah Steps",
    "guide.steps.subtitle": "A practical summary of the next step.",
    "guide.tasbeeh": "Tasbeeh",
    "guide.tasbeehSaved": "Saved automatically on your device.",
    "guide.tapTasbeeh": "Tap to count",
    "guide.goal": "Goal",
    "guide.quickDuas": "Quick Duas",
    "guide.step.1.title": "Ihram",
    "guide.step.1.text": "Intention, talbiyah, and preparation before entering Makkah.",
    "guide.step.1.tag": "Before arrival",
    "guide.step.2.title": "Tawaf",
    "guide.step.2.text": "Seven rounds around the Kaaba with dua and calm.",
    "guide.step.2.tag": "Haram",
    "guide.step.3.title": "Two rakahs",
    "guide.step.3.text": "Pray behind Maqam Ibrahim if possible, or anywhere in the mosque.",
    "guide.step.3.tag": "After tawaf",
    "guide.step.4.title": "Sa'i",
    "guide.step.4.text": "Seven walks between Safa and Marwah.",
    "guide.step.4.tag": "Mas'a",
    "guide.step.5.title": "Shaving or trimming",
    "guide.step.5.text": "This completes Umrah and ends the state of ihram.",
    "guide.step.5.tag": "Completion",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.about": "پلیٹ فارم کے بارے میں",
    "nav.quran": "قرآن",
    "nav.guide": "معتمر گائیڈ",
    "nav.adhkar": "اذکار",
    "nav.umrahMap": "عمرہ نقشہ",
    "nav.prayerTimes": "نماز اوقات",
    "nav.haramainLive": "حرمین لائیو",
    "nav.bookings": "میری بکنگز",
    "nav.support": "مدد",
    "nav.profile": "پروفائل",
    "nav.office": "آفس پینل",
    "nav.driver": "ڈرائیور پینل",
    "nav.admin": "ایڈمن",
    "nav.signin": "لاگ ان",
    "nav.back": "واپس",
    "footer.booking": "بکنگ",
    "footer.services": "دینی خدمات",
    "footer.contact": "رابطہ",
    "footer.availablePrograms": "دستیاب پروگرام",
    "footer.terms": "شرائط و ضوابط",
    "footer.privacy": "پرائیویسی پالیسی",
    "footer.rights": "© 2025 اسمارٹ پاتھ عمرہ بکنگ۔ جملہ حقوق محفوظ ہیں۔",
    "guide.badge": "معتمر گائیڈ",
    "guide.title": "معتمر کی ضرورت کی ہر چیز ایک جگہ",
    "guide.subtitle": "قرآن، اذکار، نماز اوقات، قبلہ، مناسک، حرمین لائیو اور محفوظ تسبیح۔",
    "guide.quran.title": "قرآن کریم",
    "guide.quran.desc": "کتاب جیسی پڑھائی، آڈیو، ویڈیو اور معانی۔",
    "guide.adhkar.title": "اذکار اور دعائیں",
    "guide.adhkar.desc": "سفر، عمرہ، صبح اور شام کی دعائیں۔",
    "guide.prayer.title": "نماز اوقات اور قبلہ",
    "guide.prayer.desc": "اگلی نماز، اذان اور قبلہ کی سمت۔",
    "guide.map.title": "عمرہ نقشہ",
    "guide.map.desc": "مناسک کے مراحل اور اہم مقامات۔",
    "guide.live.title": "حرمین لائیو",
    "guide.live.desc": "حرمین کی لائیو نشریات، خطبات اور دروس۔",
    "guide.support.title": "مدد اور رپورٹس",
    "guide.support.desc": "سفر کے دوران فوری مدد۔",
    "guide.steps.title": "عمرہ کے مراحل",
    "guide.steps.subtitle": "اگلے مرحلے کا مختصر عملی خلاصہ۔",
    "guide.tasbeeh": "تسبیح",
    "guide.tasbeehSaved": "آپ کے آلے پر خودکار محفوظ۔",
    "guide.tapTasbeeh": "شمار کے لیے دبائیں",
    "guide.goal": "ہدف",
    "guide.quickDuas": "مختصر دعائیں",
    "guide.step.1.title": "احرام",
    "guide.step.1.text": "مکہ میں داخل ہونے سے پہلے نیت، تلبیہ اور تیاری۔",
    "guide.step.1.tag": "آمد سے پہلے",
    "guide.step.2.title": "طواف",
    "guide.step.2.text": "کعبہ کے گرد سات چکر، دعا اور سکون کے ساتھ۔",
    "guide.step.2.tag": "حرم",
    "guide.step.3.title": "دو رکعت",
    "guide.step.3.text": "ممکن ہو تو مقام ابراہیم کے پیچھے، ورنہ مسجد میں کہیں بھی۔",
    "guide.step.3.tag": "طواف کے بعد",
    "guide.step.4.title": "سعی",
    "guide.step.4.text": "صفا اور مروہ کے درمیان سات چکر۔",
    "guide.step.4.tag": "مسعی",
    "guide.step.5.title": "حلق یا تقصیر",
    "guide.step.5.text": "اس سے عمرہ مکمل ہوتا ہے اور احرام ختم ہوتا ہے۔",
    "guide.step.5.tag": "اختتام",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem("app-language") as AppLanguage | null;
    if (saved === "ar" || saved === "en" || saved === "ur") return saved;
  } catch {}
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("ur")) return "ur";
  if (browser.startsWith("en")) return "en";
  return "ar";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);
  const option = LANGUAGE_OPTIONS.find((item) => item.code === language) ?? LANGUAGE_OPTIONS[0];

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try { localStorage.setItem("app-language", lang); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = option.dir;
  }, [language, option.dir]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    dir: option.dir,
    t: (key: string) => DICT[language][key] ?? DICT.ar[key] ?? key,
  }), [language, option.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();
  return (
    <div className={`flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 p-1 ${compact ? "w-full" : ""}`}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          onClick={() => setLanguage(option.code)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all ${
            language === option.code ? "bg-amber-300 text-emerald-950" : "text-white/75 hover:bg-white/10 hover:text-white"
          } ${compact ? "flex-1" : ""}`}
          title={option.nativeName}
        >
          {option.shortName}
        </button>
      ))}
    </div>
  );
}
