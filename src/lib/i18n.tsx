import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";

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
    "home.hero.title": "رحلتك إلى بيت الله الحرام",
    "home.hero.subtitle": "اختر من أفضل برامج العمرة المعتمدة بكل سهولة وأمان",
    "home.hero.tagline": "منصة حجز العمرة الأولى في المملكة",
    "home.search.departureCity": "مدينة الانطلاق",
    "home.search.placeholder": "ابحث عن برنامج...",
    "home.type.all": "الكل",
    "home.type.economy": "اقتصادي",
    "home.type.luxury": "فاخر",
    "home.type.ramadan": "رمضان",
    "home.type.family": "عائلي",
    "home.stats.packages": "برنامج عمرة",
    "home.stats.offices": "مكتب معتمد",
    "home.stats.pilgrims": "معتمر سعيد",
    "home.stats.rating": "متوسط التقييم",
    "home.packages.title": "البرامج المتاحة",
    "home.packages.subtitle": "اختر البرنامج المناسب من بين أفضل العروض",
    "home.packages.emptyTitle": "لا توجد برامج مطابقة",
    "home.packages.emptyText": "جرّب تغيير معايير البحث",
    "home.why.title": "لماذا المسار الذكي؟",
    "home.why.subtitle": "نقدم لك تجربة حجز آمنة وموثوقة",
    "home.why.certified.title": "مكاتب معتمدة",
    "home.why.certified.desc": "جميع المكاتب المعروضة معتمدة ومرخصة من وزارة الحج والعمرة",
    "home.why.price.title": "أفضل الأسعار",
    "home.why.price.desc": "نضمن لك أفضل الأسعار مع إمكانية المقارنة بين البرامج المختلفة",
    "home.why.support.title": "دعم متواصل",
    "home.why.support.desc": "فريق دعم متخصص على مدار الساعة لمساعدتك في رحلتك الروحانية",
    "home.destinations.title": "الوجهات المقدسة",
    "home.destinations.subtitle": "رحلة روحانية إلى أقدس البقاع",
    "home.kaaba.title": "مكة المكرمة",
    "home.kaaba.subtitle": "قبلة المسلمين وأشرف البقاع",
    "home.madinah.title": "المدينة المنورة",
    "home.madinah.subtitle": "مدينة النبي ﷺ",
    "home.spiritual.badge": "الخدمات الروحانية",
    "home.spiritual.title": "رفيقك الروحاني في كل وقت",
    "home.spiritual.subtitle": "استعد لرحلتك الروحانية مع مجموعة من الأدوات الإسلامية المتكاملة",
    "home.spiritual.start": "ابدأ الآن",
    "home.spiritual.guide.badge": "مركز الرحلة",
    "home.spiritual.guide.desc": "مناسك العمرة، الأذكار، مواقيت الصلاة، القبلة، بث الحرمين، وسبحة محفوظة في مكان واحد",
    "home.spiritual.quran.badge": "10 قراء",
    "home.spiritual.quran.desc": "استمع للقرآن الكريم بصوت أشهر القراء من مصر والسعودية والكويت",
    "home.spiritual.adhkar.badge": "5 أقسام",
    "home.spiritual.adhkar.desc": "أذكار الصباح والمساء وأدعية العمرة والمناسك مرتبة بشكل جميل",
    "home.spiritual.map.badge": "تفاعلية",
    "home.spiritual.map.desc": "تعرف على المشاعر المقدسة وخطوات أداء مناسك العمرة بشكل تفاعلي",
    "home.prayer.badge": "مكة والرياض",
    "home.prayer.title": "مواقيت الصلاة",
    "home.prayer.desc": "مواقيت دقيقة مع عداد تنازلي وإشعار الأذان التلقائي",
    "home.prayer.cta": "عرض المواقيت",
    "home.qibla.badge": "GPS دقيق",
    "home.qibla.title": "اتجاه القبلة",
    "home.qibla.desc": "بوصلة تفاعلية تحدد اتجاه الكعبة المشرفة بدقة من موقعك",
    "home.qibla.note": "الكعبة المشرفة • مكة المكرمة",
    "home.qibla.cta": "تحديد القبلة",
    "home.testimonials.badge": "آراء المعتمرين",
    "home.testimonials.title": "ماذا يقول معتمرونا؟",
    "home.testimonials.subtitle": "تجارب حقيقية من معتمرين سعداء",
    "home.cta.title": "ابدأ رحلتك الروحانية اليوم",
    "home.cta.subtitle": "انضم إلى آلاف المعتمرين الذين وثقوا بالمسار الذكي لتنظيم رحلتهم المباركة",
    "home.cta.programs": "استعرض البرامج",
    "home.cta.quran": "افتح المصحف",
    "home.vision.badge": "شريك استراتيجي لرؤية 2030",
    "home.vision.title": "نسير نحو رؤية المملكة",
    "home.vision.text": "منصة المسار الذكي تساهم في تحقيق أهداف رؤية 2030 من خلال رقمنة قطاع العمرة وتطوير تجربة المعتمر وتمكين مكاتب السفر المعتمدة.",
    "home.vision.digital": "رقمنة الخدمات",
    "home.vision.offices": "تمكين المكاتب",
    "home.vision.experience": "تحسين تجربة المعتمر",
    "home.vision.economy": "الاقتصاد الرقمي",
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
    "home.hero.title": "Your Journey to the House of Allah",
    "home.hero.subtitle": "Choose trusted Umrah programs easily and securely",
    "home.hero.tagline": "Saudi Arabia's smart Umrah booking platform",
    "home.search.departureCity": "Departure city",
    "home.search.placeholder": "Search programs...",
    "home.type.all": "All",
    "home.type.economy": "Economy",
    "home.type.luxury": "Luxury",
    "home.type.ramadan": "Ramadan",
    "home.type.family": "Family",
    "home.stats.packages": "Umrah programs",
    "home.stats.offices": "Approved offices",
    "home.stats.pilgrims": "Happy pilgrims",
    "home.stats.rating": "Average rating",
    "home.packages.title": "Available Programs",
    "home.packages.subtitle": "Choose the right program from the best offers",
    "home.packages.emptyTitle": "No matching programs",
    "home.packages.emptyText": "Try changing your search filters",
    "home.why.title": "Why Smart Path?",
    "home.why.subtitle": "A secure and trusted booking experience",
    "home.why.certified.title": "Approved Offices",
    "home.why.certified.desc": "All listed offices are approved and licensed by the relevant authorities",
    "home.why.price.title": "Best Prices",
    "home.why.price.desc": "Compare programs and choose the offer that fits you",
    "home.why.support.title": "Continuous Support",
    "home.why.support.desc": "A dedicated support team to assist you throughout your spiritual journey",
    "home.destinations.title": "Holy Destinations",
    "home.destinations.subtitle": "A spiritual journey to the holiest places",
    "home.kaaba.title": "Makkah",
    "home.kaaba.subtitle": "The Qibla of Muslims and the noblest sanctuary",
    "home.madinah.title": "Madinah",
    "home.madinah.subtitle": "The city of the Prophet ﷺ",
    "home.spiritual.badge": "Spiritual Services",
    "home.spiritual.title": "Your spiritual companion at every step",
    "home.spiritual.subtitle": "Prepare for your journey with integrated Islamic tools",
    "home.spiritual.start": "Start now",
    "home.spiritual.guide.badge": "Journey Hub",
    "home.spiritual.guide.desc": "Umrah rituals, adhkar, prayer times, qibla, Haramain live streams, and saved tasbeeh in one place",
    "home.spiritual.quran.badge": "10 reciters",
    "home.spiritual.quran.desc": "Listen to the Holy Quran by renowned reciters",
    "home.spiritual.adhkar.badge": "5 sections",
    "home.spiritual.adhkar.desc": "Morning, evening, Umrah, and ritual supplications in a clear layout",
    "home.spiritual.map.badge": "Interactive",
    "home.spiritual.map.desc": "Explore holy sites and Umrah steps interactively",
    "home.prayer.badge": "Makkah and Riyadh",
    "home.prayer.title": "Prayer Times",
    "home.prayer.desc": "Accurate prayer times with countdown and adhan notifications",
    "home.prayer.cta": "View times",
    "home.qibla.badge": "Accurate GPS",
    "home.qibla.title": "Qibla Direction",
    "home.qibla.desc": "An interactive compass points to the Holy Kaaba from your location",
    "home.qibla.note": "Holy Kaaba • Makkah",
    "home.qibla.cta": "Find Qibla",
    "home.testimonials.badge": "Pilgrim Reviews",
    "home.testimonials.title": "What do pilgrims say?",
    "home.testimonials.subtitle": "Real experiences from happy pilgrims",
    "home.cta.title": "Start your spiritual journey today",
    "home.cta.subtitle": "Join pilgrims who trusted Smart Path to organize their blessed journey",
    "home.cta.programs": "Browse programs",
    "home.cta.quran": "Open Quran",
    "home.vision.badge": "Strategic partner for Vision 2030",
    "home.vision.title": "Moving toward Saudi Vision 2030",
    "home.vision.text": "Smart Path contributes to Vision 2030 by digitizing Umrah services, improving the pilgrim experience, and enabling approved travel offices.",
    "home.vision.digital": "Digital services",
    "home.vision.offices": "Office enablement",
    "home.vision.experience": "Pilgrim experience",
    "home.vision.economy": "Digital economy",
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
    "home.hero.title": "بیت اللہ کی طرف آپ کا سفر",
    "home.hero.subtitle": "اعتماد کے ساتھ بہترین عمرہ پروگرام آسانی سے منتخب کریں",
    "home.hero.tagline": "عمرہ بکنگ کے لیے اسمارٹ پلیٹ فارم",
    "home.search.departureCity": "روانگی کا شہر",
    "home.search.placeholder": "پروگرام تلاش کریں...",
    "home.type.all": "سب",
    "home.type.economy": "اقتصادی",
    "home.type.luxury": "لگژری",
    "home.type.ramadan": "رمضان",
    "home.type.family": "خاندانی",
    "home.stats.packages": "عمرہ پروگرام",
    "home.stats.offices": "منظور شدہ دفاتر",
    "home.stats.pilgrims": "خوش معتمرین",
    "home.stats.rating": "اوسط ریٹنگ",
    "home.packages.title": "دستیاب پروگرام",
    "home.packages.subtitle": "بہترین آفرز میں سے مناسب پروگرام منتخب کریں",
    "home.packages.emptyTitle": "کوئی پروگرام نہیں ملا",
    "home.packages.emptyText": "تلاش کے فلٹر تبدیل کریں",
    "home.why.title": "اسمارٹ پاتھ کیوں؟",
    "home.why.subtitle": "محفوظ اور قابل اعتماد بکنگ تجربہ",
    "home.why.certified.title": "منظور شدہ دفاتر",
    "home.why.certified.desc": "تمام درج دفاتر منظور شدہ اور لائسنس یافتہ ہیں",
    "home.why.price.title": "بہترین قیمتیں",
    "home.why.price.desc": "پروگرامز کا موازنہ کریں اور مناسب آفر منتخب کریں",
    "home.why.support.title": "مسلسل مدد",
    "home.why.support.desc": "آپ کے روحانی سفر میں مدد کے لیے خصوصی سپورٹ ٹیم",
    "home.destinations.title": "مقدس مقامات",
    "home.destinations.subtitle": "مقدس ترین مقامات کا روحانی سفر",
    "home.kaaba.title": "مکہ مکرمہ",
    "home.kaaba.subtitle": "مسلمانوں کا قبلہ اور مقدس ترین مقام",
    "home.madinah.title": "مدینہ منورہ",
    "home.madinah.subtitle": "نبی ﷺ کا شہر",
    "home.spiritual.badge": "روحانی خدمات",
    "home.spiritual.title": "ہر قدم پر آپ کا روحانی ساتھی",
    "home.spiritual.subtitle": "اسلامی ٹولز کے ساتھ اپنے سفر کی تیاری کریں",
    "home.spiritual.start": "شروع کریں",
    "home.spiritual.guide.badge": "سفر مرکز",
    "home.spiritual.guide.desc": "عمرہ مناسک، اذکار، نماز اوقات، قبلہ، حرمین لائیو اور محفوظ تسبیح ایک جگہ",
    "home.spiritual.quran.badge": "10 قراء",
    "home.spiritual.quran.desc": "مشہور قراء کی آواز میں قرآن کریم سنیں",
    "home.spiritual.adhkar.badge": "5 حصے",
    "home.spiritual.adhkar.desc": "صبح، شام، عمرہ اور مناسک کی دعائیں خوبصورت ترتیب میں",
    "home.spiritual.map.badge": "تفاعلی",
    "home.spiritual.map.desc": "مقدس مقامات اور عمرہ مراحل تفاعلی انداز میں دیکھیں",
    "home.prayer.badge": "مکہ اور ریاض",
    "home.prayer.title": "نماز اوقات",
    "home.prayer.desc": "درست اوقات، کاؤنٹ ڈاؤن اور اذان نوٹیفیکیشن",
    "home.prayer.cta": "اوقات دیکھیں",
    "home.qibla.badge": "درست GPS",
    "home.qibla.title": "قبلہ سمت",
    "home.qibla.desc": "آپ کے مقام سے کعبہ کی سمت دکھانے والا تفاعلی کمپاس",
    "home.qibla.note": "کعبہ مشرفہ • مکہ",
    "home.qibla.cta": "قبلہ تلاش کریں",
    "home.testimonials.badge": "معتمرین کی رائے",
    "home.testimonials.title": "معتمرین کیا کہتے ہیں؟",
    "home.testimonials.subtitle": "خوش معتمرین کے حقیقی تجربات",
    "home.cta.title": "آج اپنا روحانی سفر شروع کریں",
    "home.cta.subtitle": "ان معتمرین میں شامل ہوں جنہوں نے اپنے مبارک سفر کے لیے اسمارٹ پاتھ پر اعتماد کیا",
    "home.cta.programs": "پروگرامز دیکھیں",
    "home.cta.quran": "قرآن کھولیں",
    "home.vision.badge": "ویژن 2030 کا اسٹریٹجک پارٹنر",
    "home.vision.title": "سعودی ویژن 2030 کی طرف پیش قدمی",
    "home.vision.text": "اسمارٹ پاتھ عمرہ خدمات کو ڈیجیٹل بنا کر، معتمر کے تجربے کو بہتر بنا کر اور منظور شدہ دفاتر کو مضبوط بنا کر ویژن 2030 میں کردار ادا کرتا ہے۔",
    "home.vision.digital": "ڈیجیٹل خدمات",
    "home.vision.offices": "دفاتر کی مضبوطی",
    "home.vision.experience": "معتمر تجربہ",
    "home.vision.economy": "ڈیجیٹل معیشت",
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
  const [open, setOpen] = useState(false);
  const current = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div className={`relative ${compact ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-white shadow-lg shadow-emerald-950/10 transition-all hover:bg-white/15 ${
          compact ? "w-full px-4 py-3" : "h-10 w-10"
        }`}
        aria-label="تغيير اللغة"
        title={current.nativeName}
      >
        <Globe2 className="h-4 w-4" />
        {compact && <span className="text-xs font-black">{current.shortName}</span>}
      </button>

      {open && (
        <div className={`absolute top-full z-50 mt-2 min-w-36 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-1.5 text-gray-800 shadow-2xl shadow-emerald-950/20 ${compact ? "inset-x-0" : "end-0"}`}>
          {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
              type="button"
              onClick={() => {
                setLanguage(option.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                language === option.code ? "bg-emerald-50 text-emerald-800" : "hover:bg-gray-50"
              }`}
        >
              <span>{option.nativeName}</span>
              <span className="text-[11px] text-gray-400">{option.shortName}</span>
        </button>
          ))}
        </div>
      )}
    </div>
  );
}
