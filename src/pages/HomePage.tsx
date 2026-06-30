import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import PackageCard from "../components/PackageCard";
import { SAUDI_CITIES } from "../lib/saudiCities";
import {
  Search, MapPin, SlidersHorizontal, ShieldCheck, BadgeDollarSign,
  HeartHandshake, BookOpen, BookMarked, Map, ChevronLeft, Star, Award, Clock, Compass,
} from "lucide-react";

// ── فيديو الخلفية الافتراضي ──
const DEFAULT_BG_VIDEO = "https://videos.pexels.com/video-files/19820804/19820804-hd_1280_720_60fps.mp4";

const DEFAULT_KAABA_IMG   = "https://polished-pony-114.convex.cloud/api/storage/f8e21276-c3a4-4933-98bc-c719fc43ba8c";
const DEFAULT_MADINAH_IMG = "https://polished-pony-114.convex.cloud/api/storage/22aaba82-1d53-4f51-b06a-98593b6f4678";

const TYPES = [
  { value: "",         label: "الكل" },
  { value: "economy",  label: "اقتصادي" },
  { value: "luxury",   label: "فاخر" },
  { value: "ramadan",  label: "رمضان" },
  { value: "family",   label: "عائلي" },
];

const SPIRITUAL_SERVICES: Array<{
  icon: React.ElementType;
  title: string;
  desc: string;
  pageName: "quran" | "adhkar" | "umrah-map";
  gradient: string;
  badge: string;
  iconBg: string;
}> = [
  {
    icon: BookOpen,
    title: "المصحف الشريف",
    desc: "استمع للقرآن الكريم بصوت أشهر القراء من مصر والسعودية والكويت",
    pageName: "quran",
    gradient: "from-emerald-700 to-emerald-900",
    badge: "10 قراء",
    iconBg: "bg-emerald-600/30",
  },
  {
    icon: BookMarked,
    title: "الأذكار والأدعية",
    desc: "أذكار الصباح والمساء وأدعية العمرة والمناسك مرتبة بشكل جميل",
    pageName: "adhkar",
    gradient: "from-amber-700 to-amber-900",
    badge: "5 أقسام",
    iconBg: "bg-amber-600/30",
  },
  {
    icon: Map,
    title: "خريطة العمرة",
    desc: "تعرف على المشاعر المقدسة وخطوات أداء مناسك العمرة بشكل تفاعلي",
    pageName: "umrah-map",
    gradient: "from-blue-700 to-blue-900",
    badge: "تفاعلية",
    iconBg: "bg-blue-600/30",
  },
];

const TESTIMONIALS = [
  { name: "أحمد الغامدي",  city: "الرياض", rating: 5, text: "تجربة رائعة، حجزت عمرتي بكل سهولة وكان المكتب محترفاً جداً. أنصح الجميع بالمنصة." },
  { name: "فاطمة العتيبي", city: "جدة",    rating: 5, text: "المنصة سهلة الاستخدام والأسعار منافسة. سافرت مع عائلتي وكانت رحلة لا تُنسى." },
  { name: "محمد الزهراني", city: "الدمام",  rating: 5, text: "خدمة ممتازة ودعم سريع. المكاتب المعتمدة تعطيك ثقة كاملة في الحجز." },
];

export default function HomePage({ navigate }: { navigate: (p: Page) => void }) {
  const [type, setType]   = useState("");
  const [city, setCity]   = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  const packages = useQuery(api.packages.list, {
    packageType:   type || undefined,
    departureCity: city || undefined,
  });

  // ── إعدادات الموقع الديناميكية ──
  const siteSettings = useQuery(api.appSettings.getMap);

  const filtered = packages?.filter((p) =>
    !search || p.title.includes(search) || p.description.includes(search)
  );

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  // تنسيق الوقت والتاريخ بالعربية
  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // ── قيم ديناميكية مع fallback ──
  const heroTitle       = siteSettings?.hero_title      || "رحلتك إلى بيت الله الحرام";
  const heroSubtitle    = siteSettings?.hero_subtitle   || "اختر من أفضل برامج العمرة المعتمدة بكل سهولة وأمان";
  const appTagline      = siteSettings?.app_tagline     || "منصة حجز العمرة الأولى في المملكة";
  const heroVideoUrl    = siteSettings?.hero_video_url  || DEFAULT_BG_VIDEO;
  const videoBrightness = siteSettings?.hero_video_brightness
    ? parseFloat(siteSettings.hero_video_brightness)
    : 0.72;

  // ── صور الوجهات المقدسة ──
  const kaabaImg      = siteSettings?.kaaba_image_url   || DEFAULT_KAABA_IMG;
  const kaabaTitle    = siteSettings?.kaaba_title       || "مكة المكرمة";
  const kaabaSubtitle = siteSettings?.kaaba_subtitle    || "قبلة المسلمين وأشرف البقاع";
  const madinahImg    = siteSettings?.madinah_image_url || DEFAULT_MADINAH_IMG;
  const madinahTitle  = siteSettings?.madinah_title     || "المدينة المنورة";
  const madinahSub    = siteSettings?.madinah_subtitle  || "مدينة النبي ﷺ";

  // ── إحصائيات ──
  const statsPackages = siteSettings?.stats_packages || "+500";
  const statsOffices  = siteSettings?.stats_offices  || "+50";
  const statsPilgrims = siteSettings?.stats_pilgrims || "+10,000";
  const statsRating   = siteSettings?.stats_rating   || "4.8";

  // ── قسم لماذا نحن ──
  const whyTitle    = siteSettings?.why_title    || "لماذا المسار الذكي؟";
  const whySubtitle = siteSettings?.why_subtitle || "نقدم لك تجربة حجز آمنة وموثوقة";

  // ── قسم CTA ──
  const ctaTitle    = siteSettings?.cta_title    || "ابدأ رحلتك الروحانية اليوم";
  const ctaSubtitle = siteSettings?.cta_subtitle || "انضم إلى آلاف المعتمرين الذين وثقوا بالمسار الذكي لتنظيم رحلتهم المباركة";
  const ctaImageUrl = siteSettings?.cta_image_url || "";

  return (
    <div className="bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative h-[88vh] min-h-[580px] flex items-center justify-center overflow-hidden">

        {/* ── فيديو الخلفية الديناميكي ── */}
        <video
          key={heroVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: `brightness(${videoBrightness})` }}
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video>

        {/* ── طبقة التدرج ── */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,20,10,0.45) 0%, rgba(0,30,15,0.25) 40%, rgba(0,20,10,0.65) 100%)",
          }}
        />

        {/* ── شارة الوقت والتاريخ ── */}
        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold shadow-lg border border-white/20 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse opacity-70" />
            <span dir="ltr" className="font-mono tracking-wider">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium shadow-md border border-white/20 text-white/90">
            <span>{dateStr}</span>
          </div>
        </div>

        {/* ── محتوى الـ Hero ── */}
        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto pointer-events-none" style={{ marginTop: "-80px" }}>
          <div className="anim-fade-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-7">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-200">{appTagline}</span>
          </div>

          <h1 className="anim-fade-up d-100 text-5xl md:text-7xl font-black leading-tight mb-4">
            {heroTitle}
          </h1>
          <p className="anim-fade-up d-200 text-lg md:text-xl text-white/80 mb-10 font-light">
            {heroSubtitle}
          </p>
        </div>

        {/* ── صندوق البحث ── */}
        <div className="absolute bottom-14 left-0 right-0 z-30 px-4">
          <div className="anim-fade-up d-300 bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-4 md:p-5 max-w-3xl mx-auto shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-gray-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pr-9 pl-3 py-3 rounded-xl bg-white text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none"
                >
                  <option value="">مدينة الانطلاق</option>
                  {SAUDI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-gray-400" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pr-9 pl-3 py-3 rounded-xl bg-white text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن برنامج..."
                  className="w-full pr-9 pl-3 py-3 rounded-xl bg-white text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 animate-bounce z-20 pointer-events-none">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-emerald-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { num: statsPackages, label: "برنامج عمرة" },
            { num: statsOffices,  label: "مكتب معتمد" },
            { num: statsPilgrims, label: "معتمر سعيد" },
            { num: statsRating,   label: "متوسط التقييم" },
          ].map((s, i) => (
            <div key={i} className={`anim-fade-up d-${(i + 1) * 100}`}>
              <div className="text-3xl font-black gold-light">{s.num}</div>
              <div className="text-emerald-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── رؤية 2030 ── */}
      <Vision2030Banner />

      {/* ── Packages ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-emerald-900">البرامج المتاحة</h2>
            <p className="text-gray-500 mt-1">اختر البرنامج المناسب من بين أفضل العروض</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  type === t.value
                    ? "bg-emerald-700 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد برامج مطابقة</h3>
            <p className="text-gray-400 text-sm">جرّب تغيير معايير البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pkg, i) => (
              <div key={pkg._id} className={`anim-fade-up d-${Math.min(i * 100 + 100, 500)}`}>
                <PackageCard pkg={pkg} navigate={navigate} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Why us ── */}
      <section className="bg-gradient-to-br from-emerald-950 to-emerald-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">{whyTitle}</h2>
            <p className="text-emerald-300 text-sm">{whySubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: ShieldCheck,
                title: "مكاتب معتمدة",
                desc: "جميع المكاتب المعروضة معتمدة ومرخصة من وزارة الحج والعمرة",
              },
              {
                Icon: BadgeDollarSign,
                title: "أفضل الأسعار",
                desc: "نضمن لك أفضل الأسعار مع إمكانية المقارنة بين البرامج المختلفة",
              },
              {
                Icon: HeartHandshake,
                title: "دعم متواصل",
                desc: "فريق دعم متخصص على مدار الساعة لمساعدتك في رحلتك الروحانية",
              },
            ].map(({ Icon, title, desc }, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-7 text-center card-lift">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/15 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-amber-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-emerald-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-emerald-900 mb-2">الوجهات المقدسة</h2>
          <p className="text-gray-500 text-sm">رحلة روحانية إلى أقدس البقاع</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { img: kaabaImg,   title: kaabaTitle,   sub: kaabaSubtitle },
            { img: madinahImg, title: madinahTitle,  sub: madinahSub },
          ].map((d, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden h-64 group card-lift cursor-pointer">
              <img
                src={d.img}
                alt={d.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-black">{d.title}</h3>
                <p className="text-white/75 text-sm mt-0.5">{d.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Spiritual Services ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-5 py-2 mb-5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">الخدمات الروحانية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              رفيقك الروحاني في كل وقت
            </h2>
            <p className="text-emerald-300 text-sm max-w-xl mx-auto leading-relaxed">
              استعد لرحلتك الروحانية مع مجموعة من الأدوات الإسلامية المتكاملة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPIRITUAL_SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate({ name: svc.pageName })}
                  className={`group relative bg-gradient-to-br ${svc.gradient} rounded-2xl p-7 text-right overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/40 border border-white/10`}
                >
                  <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-500" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />

                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${svc.iconBg} flex items-center justify-center mb-5 border border-white/10`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                    </div>

                    <div className="flex items-start justify-between mb-3">
                      <span className="bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                        {svc.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">{svc.title}</h3>
                    <p className="text-white/65 text-sm leading-relaxed mb-5">{svc.desc}</p>

                    <div className="flex items-center gap-2 text-white/80 text-sm font-semibold group-hover:text-white transition-colors">
                      <span>ابدأ الآن</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Prayer Times + Qibla Cards ── */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate({ name: "prayer-times" })}
              className="group relative bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl p-6 text-right overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 border border-white/10"
            >
              <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5 group-hover:bg-white/8 transition-all duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 flex items-center justify-center border border-white/10 mb-4">
                  <Clock className="w-7 h-7 text-indigo-200" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-400/20">
                    مكة والرياض
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">مواقيت الصلاة</h3>
                <p className="text-indigo-300 text-sm mb-4 leading-relaxed">
                  مواقيت دقيقة مع عداد تنازلي وإشعار الأذان التلقائي
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {["🕋 مكة", "🏙️ الرياض"].map((c) => (
                    <span key={c} className="bg-white/10 text-white/70 text-xs px-2.5 py-1 rounded-full border border-white/10">{c}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-indigo-200 text-sm font-semibold group-hover:text-white transition-colors">
                  <span>عرض المواقيت</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate({ name: "prayer-times" })}
              className="group relative bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-950 rounded-2xl p-6 text-right overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 border border-white/10"
            >
              <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5 group-hover:bg-white/8 transition-all duration-500" />
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-amber-400/5" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/30 flex items-center justify-center border border-white/10 mb-4">
                  <Compass className="w-7 h-7 text-amber-300" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-400/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/20">
                    GPS دقيق
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">اتجاه القبلة</h3>
                <p className="text-amber-200/70 text-sm mb-4 leading-relaxed">
                  بوصلة تفاعلية تحدد اتجاه الكعبة المشرفة بدقة من موقعك
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🕋</span>
                  <span className="text-amber-200/60 text-xs">الكعبة المشرفة • مكة المكرمة</span>
                </div>
                <div className="flex items-center gap-2 text-amber-200 text-sm font-semibold group-hover:text-white transition-colors">
                  <span>تحديد القبلة</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2 mb-5">
              <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span className="text-emerald-700 text-sm font-semibold">آراء المعتمرين</span>
            </div>
            <h2 className="text-3xl font-black text-emerald-900 mb-2">ماذا يقول معتمرونا؟</h2>
            <p className="text-gray-500 text-sm">تجارب حقيقية من معتمرين سعداء</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-gray-100 rounded-2xl p-7 card-lift">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.city}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-16 px-4 relative overflow-hidden"
        style={{
          background: ctaImageUrl
            ? undefined
            : "linear-gradient(to right, #065f46, #064e3b, #022c22)",
        }}
      >
        {/* صورة خلفية CTA ديناميكية */}
        {ctaImageUrl && (
          <>
            <img
              src={ctaImageUrl}
              alt="CTA background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/75 to-emerald-900/85" />
          </>
        )}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Award className="w-14 h-14 text-amber-400 mx-auto mb-5" strokeWidth={1.5} />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {ctaTitle}
          </h2>
          <p className="text-emerald-200 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            {ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate({ name: "home" })}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-900 font-black px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-400/30 text-base"
            >
              استعرض البرامج
            </button>
            <button
              onClick={() => navigate({ name: "quran" })}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/20 transition-all hover:scale-105 text-base flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              افتح المصحف
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── مكوّن شعار رؤية 2030 المستقل ──
function Vision2030Banner() {
  return (
    <section className="py-12 px-4 bg-gradient-to-l from-[#0a2240] via-[#0d2d52] to-[#0a2240] relative overflow-hidden">
      {/* زخارف خلفية */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#c8a951]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#c8a951]/8 blur-3xl pointer-events-none" />
      {/* خطوط ذهبية */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">

          {/* الشعار SVG المدمج */}
          <div className="order-1 flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#c8a951]/15 blur-xl scale-125" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-[#c8a951]/30 rounded-2xl p-6 shadow-2xl">
                {/* شعار رؤية 2030 SVG */}
                <Vision2030Logo />
              </div>
            </div>
            <span className="text-[#c8a951]/60 text-[10px] font-medium tracking-[0.2em] uppercase">
              Saudi Vision 2030
            </span>
          </div>

          {/* الفاصل */}
          <div className="hidden md:block w-px h-28 bg-gradient-to-b from-transparent via-[#c8a951]/40 to-transparent" />

          {/* النص */}
          <div className="order-2 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-[#c8a951]/15 border border-[#c8a951]/30 rounded-full px-4 py-1.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8a951] animate-pulse" />
              <span className="text-[#c8a951] text-xs font-bold tracking-wide">شريك استراتيجي لرؤية 2030</span>
            </div>
            <h3 className="text-white font-black text-2xl md:text-3xl leading-tight mb-3">
              نسير نحو رؤية المملكة
            </h3>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm mb-5">
              منصة المسار الذكي تساهم في تحقيق أهداف رؤية 2030 من خلال رقمنة قطاع العمرة
              وتطوير تجربة المعتمر وتمكين مكاتب السفر المعتمدة.
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {[
                { label: "رقمنة الخدمات",         icon: "💻" },
                { label: "تمكين المكاتب",          icon: "🏢" },
                { label: "تحسين تجربة المعتمر",   icon: "🕋" },
                { label: "الاقتصاد الرقمي",        icon: "📈" },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="flex items-center gap-1.5 text-xs bg-white/8 border border-[#c8a951]/20 text-white/70 px-3 py-1.5 rounded-full hover:bg-white/12 transition-colors"
                >
                  <span>{tag.icon}</span>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── شعار رؤية 2030 SVG مدمج ──
function Vision2030Logo() {
  return (
    <svg
      width="160"
      height="72"
      viewBox="0 0 320 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="رؤية المملكة العربية السعودية 2030"
    >
      {/* النخلة والسيفان — رمز المملكة */}
      <g transform="translate(20, 8)">
        {/* جذع النخلة */}
        <rect x="38" y="40" width="4" height="50" rx="2" fill="#c8a951" />
        {/* سعف النخلة */}
        <path d="M40 40 C30 30 15 28 10 20" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M40 40 C35 28 28 22 22 14" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M40 40 C40 26 40 18 40 10" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M40 40 C45 28 52 22 58 14" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M40 40 C50 30 65 28 70 20" stroke="#c8a951" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* السيف الأيمن */}
        <path d="M40 88 L10 60 L8 56 L14 58 L42 86" stroke="#c8a951" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M8 56 L6 52 L10 54 L8 56Z" fill="#c8a951"/>
        {/* السيف الأيسر */}
        <path d="M40 88 L70 60 L72 56 L66 58 L38 86" stroke="#c8a951" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M72 56 L74 52 L70 54 L72 56Z" fill="#c8a951"/>
      </g>

      {/* النص العربي: رؤية */}
      <text x="110" y="42" fontFamily="'Tajawal', 'Arial', sans-serif" fontSize="18" fontWeight="900" fill="#c8a951" textAnchor="middle">
        رؤية
      </text>
      {/* النص العربي: المملكة العربية السعودية */}
      <text x="110" y="64" fontFamily="'Tajawal', 'Arial', sans-serif" fontSize="11" fontWeight="700" fill="white" textAnchor="middle" opacity="0.85">
        المملكة العربية السعودية
      </text>
      {/* الرقم 2030 */}
      <text x="110" y="100" fontFamily="'Arial', sans-serif" fontSize="32" fontWeight="900" fill="#c8a951" textAnchor="middle" letterSpacing="2">
        2030
      </text>

      {/* خط فاصل ذهبي */}
      <line x1="80" y1="108" x2="140" y2="108" stroke="#c8a951" strokeWidth="1" opacity="0.4"/>

      {/* النص الإنجليزي */}
      <text x="110" y="122" fontFamily="'Arial', sans-serif" fontSize="9" fontWeight="600" fill="#c8a951" textAnchor="middle" opacity="0.6" letterSpacing="1.5">
        VISION
      </text>
    </svg>
  );
}
