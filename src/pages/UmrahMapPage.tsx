import { useState } from "react";
import { Page } from "../App";
import { MapPin, Navigation, Info, ChevronLeft, ChevronRight, Star, ExternalLink } from "lucide-react";

type Site = {
  id: string;
  name: string;
  arabicName: string;
  category: "mecca" | "madinah" | "ritual";
  description: string;
  ritualStep?: number;
  ritualDesc?: string;
  x: number; // percentage position on map
  y: number;
  color: string;
};

const SITES: Site[] = [
  /* ── مكة المكرمة ── */
  {
    id: "kaaba",
    name: "الكعبة المشرفة",
    arabicName: "الكعبة المشرفة",
    category: "mecca",
    description: "قبلة المسلمين في العالم، وأشرف بقعة على وجه الأرض. يطوف المعتمر حولها سبعة أشواط.",
    ritualStep: 1,
    ritualDesc: "الطواف حول الكعبة سبعة أشواط ابتداءً من الحجر الأسود",
    x: 38, y: 42,
    color: "#d4af37",
  },
  {
    id: "hajar-aswad",
    name: "الحجر الأسود",
    arabicName: "الحجر الأسود",
    category: "mecca",
    description: "حجر من الجنة في الركن الجنوبي الشرقي للكعبة، يُستلم أو يُشار إليه في بداية كل شوط.",
    x: 39, y: 44,
    color: "#374151",
  },
  {
    id: "maqam-ibrahim",
    name: "مقام إبراهيم",
    arabicName: "مقام إبراهيم",
    category: "mecca",
    description: "الحجر الذي وقف عليه سيدنا إبراهيم عليه السلام أثناء بناء الكعبة. يُصلى خلفه ركعتان بعد الطواف.",
    ritualStep: 2,
    ritualDesc: "صلاة ركعتين خلف مقام إبراهيم بعد الطواف",
    x: 40, y: 40,
    color: "#059669",
  },
  {
    id: "zamzam",
    name: "بئر زمزم",
    arabicName: "بئر زمزم",
    category: "mecca",
    description: "أقدس بئر في الإسلام، نبعت بأمر الله لسيدنا إسماعيل. يُستحب الشرب منها بعد الطواف.",
    ritualStep: 3,
    ritualDesc: "الشرب من ماء زمزم والدعاء",
    x: 41, y: 43,
    color: "#0ea5e9",
  },
  {
    id: "safa",
    name: "الصفا",
    arabicName: "الصفا",
    category: "mecca",
    description: "جبل صغير يبدأ منه السعي بين الصفا والمروة. قال تعالى: إن الصفا والمروة من شعائر الله.",
    ritualStep: 4,
    ritualDesc: "بداية السعي بين الصفا والمروة سبعة أشواط",
    x: 37, y: 47,
    color: "#7c3aed",
  },
  {
    id: "marwa",
    name: "المروة",
    arabicName: "المروة",
    category: "mecca",
    description: "الجبل الذي ينتهي عنده السعي. المسافة بين الصفا والمروة حوالي 450 متراً.",
    x: 43, y: 47,
    color: "#7c3aed",
  },
  {
    id: "haram-mecca",
    name: "المسجد الحرام",
    arabicName: "المسجد الحرام",
    category: "mecca",
    description: "أعظم مساجد الإسلام وأكثرها ثواباً. الصلاة فيه تعادل مئة ألف صلاة في غيره.",
    x: 38, y: 43,
    color: "#1b4332",
  },
  /* ── المدينة المنورة ── */
  {
    id: "masjid-nabawi",
    name: "المسجد النبوي",
    arabicName: "المسجد النبوي الشريف",
    category: "madinah",
    description: "ثاني أشرف المساجد في الإسلام. الصلاة فيه تعادل ألف صلاة في غيره. يضم قبر النبي ﷺ.",
    x: 62, y: 30,
    color: "#1b4332",
  },
  {
    id: "rawda",
    name: "الروضة الشريفة",
    arabicName: "الروضة الشريفة",
    category: "madinah",
    description: "المنطقة بين منبر النبي ﷺ وحجرته الشريفة. قال ﷺ: ما بين بيتي ومنبري روضة من رياض الجنة.",
    x: 62, y: 32,
    color: "#d4af37",
  },
  {
    id: "quba",
    name: "مسجد قباء",
    arabicName: "مسجد قباء",
    category: "madinah",
    description: "أول مسجد بُني في الإسلام. الصلاة فيه تعادل عمرة. يُستحب زيارته كل سبت.",
    x: 60, y: 38,
    color: "#059669",
  },
  {
    id: "baqi",
    name: "البقيع",
    arabicName: "مقبرة البقيع",
    category: "madinah",
    description: "أشهر مقابر الإسلام، يرقد فيها كثير من صحابة النبي ﷺ وآل بيته الكرام.",
    x: 64, y: 31,
    color: "#6b7280",
  },
  /* ── مناسك العمرة ── */
  {
    id: "miqat",
    name: "الميقات",
    arabicName: "الميقات",
    category: "ritual",
    description: "المكان الذي يُحرم منه المعتمر. لكل جهة ميقاتها: ذو الحليفة للمدينة، الجحفة للشام، يلملم لليمن.",
    ritualStep: 0,
    ritualDesc: "الإحرام من الميقات ونية العمرة",
    x: 25, y: 35,
    color: "#dc2626",
  },
  {
    id: "halq",
    name: "الحلق أو التقصير",
    arabicName: "الحلق أو التقصير",
    category: "ritual",
    description: "آخر مناسك العمرة. يحلق الرجل رأسه أو يقصر، والمرأة تقص قدر أنملة من شعرها.",
    ritualStep: 5,
    ritualDesc: "الحلق أو التقصير وهو آخر مناسك العمرة",
    x: 36, y: 50,
    color: "#dc2626",
  },
];

const RITUAL_STEPS = SITES.filter(s => s.ritualStep !== undefined).sort((a, b) => (a.ritualStep ?? 0) - (b.ritualStep ?? 0));

const CATEGORY_COLORS: Record<string, string> = {
  mecca: "bg-amber-100 text-amber-800 border-amber-300",
  madinah: "bg-emerald-100 text-emerald-800 border-emerald-300",
  ritual: "bg-red-100 text-red-800 border-red-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  mecca: "مكة المكرمة",
  madinah: "المدينة المنورة",
  ritual: "مناسك العمرة",
};

export default function UmrahMapPage({ navigate }: { navigate: (p: Page) => void }) {
  const [selected, setSelected] = useState<Site | null>(null);
  const [filter, setFilter] = useState<"all" | "mecca" | "madinah" | "ritual">("all");
  const [activeStep, setActiveStep] = useState(0);
  const [tab, setTab] = useState<"haram" | "map" | "steps">("haram");

  const visibleSites = SITES.filter(s => filter === "all" || s.category === filter);

  const prevStep = () => setActiveStep(p => Math.max(0, p - 1));
  const nextStep = () => setActiveStep(p => Math.min(RITUAL_STEPS.length - 1, p + 1));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/20 mb-4">
            <MapPin className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-4xl font-black mb-2">خريطة العمرة التفاعلية</h1>
          <p className="text-emerald-300 text-sm">تعرّف على المواقع المقدسة ومناسك العمرة خطوة بخطوة</p>

          {/* Tab toggle */}
          <div className="inline-flex bg-white/10 rounded-2xl p-1 mt-6 gap-1 flex-wrap justify-center">
            {([
              ["haram", "🕋 خريطة الحرم", MapPin],
              ["map",   "🗺️ المواقع المقدسة", Navigation],
              ["steps", "📋 خطوات العمرة", Star],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === t ? "bg-white text-emerald-800 shadow-md" : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── TAB: HARAM MAP ── */}
        {tab === "haram" && (
          <div className="space-y-4">
            {/* بطاقة المعلومات */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  🕋
                </div>
                <div>
                  <h2 className="text-xl font-black mb-1">خريطة الحرم المكي الشريف</h2>
                  <p className="text-emerald-200 text-sm">الخريطة الرسمية لوزارة الشؤون الإسلامية - تفاعلية وشاملة لجميع مرافق الحرم</p>
                </div>
              </div>
              <a
                href="https://maps.alharamain.gov.sa/navQ/default-kiosk/3?lang=ar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                فتح في نافذة جديدة
              </a>
            </div>

            {/* الخريطة المدمجة */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-800">خريطة الحرم التفاعلية - مباشر</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>المصدر: وزارة الشؤون الإسلامية</span>
                </div>
              </div>

              {/* iframe الخريطة الرسمية */}
              <div className="relative" style={{ paddingBottom: "65vh", minHeight: "500px" }}>
                <iframe
                  src="https://maps.alharamain.gov.sa/navQ/default-kiosk/3?lang=ar"
                  className="absolute inset-0 w-full h-full border-0"
                  title="خريطة الحرم المكي الشريف"
                  allow="geolocation"
                  loading="lazy"
                />
              </div>

              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>إذا لم تظهر الخريطة، اضغط على "فتح في نافذة جديدة" أعلاه لعرضها مباشرة</span>
              </div>
            </div>

            {/* بطاقات المرافق السريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🕋", label: "الكعبة المشرفة",    desc: "قبلة المسلمين" },
                { icon: "🚰", label: "بئر زمزم",          desc: "ماء مبارك" },
                { icon: "🏃", label: "المسعى",            desc: "الصفا والمروة" },
                { icon: "🅿️", label: "مواقف السيارات",   desc: "أقرب المداخل" },
                { icon: "🚻", label: "دورات المياه",      desc: "موزعة بالحرم" },
                { icon: "🏥", label: "العيادات الطبية",   desc: "خدمة 24 ساعة" },
                { icon: "🛗", label: "المصاعد والسلالم",  desc: "لذوي الاحتياجات" },
                { icon: "📍", label: "نقاط الإرشاد",     desc: "للمساعدة والتوجيه" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: MAP ── */}
        {tab === "map" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(["all", "mecca", "madinah", "ritual"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    filter === f
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  {f === "all" ? "الكل" : CATEGORY_LABELS[f]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map visual */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Map header */}
                  <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-emerald-800 text-sm">خريطة المواقع المقدسة</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />مكة</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />المدينة</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />مناسك</span>
                    </div>
                  </div>

                  {/* SVG Map */}
                  <div className="relative bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50" style={{ paddingBottom: "65%" }}>
                    <svg
                      viewBox="0 0 100 65"
                      className="absolute inset-0 w-full h-full"
                      style={{ fontFamily: "Tajawal, sans-serif" }}
                    >
                      {/* Background regions */}
                      {/* Saudi Arabia outline (simplified) */}
                      <ellipse cx="50" cy="35" rx="45" ry="28" fill="#f0fdf4" stroke="#d1fae5" strokeWidth="0.3" />

                      {/* Mecca region */}
                      <ellipse cx="39" cy="44" rx="10" ry="8" fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.3" opacity="0.6" />
                      <text x="39" y="56" textAnchor="middle" fontSize="2.2" fill="#92400e" fontWeight="bold">مكة المكرمة</text>

                      {/* Madinah region */}
                      <ellipse cx="62" cy="32" rx="9" ry="7" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.3" opacity="0.6" />
                      <text x="62" y="42" textAnchor="middle" fontSize="2.2" fill="#065f46" fontWeight="bold">المدينة المنورة</text>

                      {/* Road between Mecca and Madinah */}
                      <path d="M 48 43 Q 55 38 60 33" stroke="#d1d5db" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />

                      {/* Sites */}
                      {visibleSites.map((site) => {
                        const isSelected = selected?.id === site.id;
                        return (
                          <g
                            key={site.id}
                            onClick={() => setSelected(isSelected ? null : site)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle
                              cx={site.x}
                              cy={site.y}
                              r={isSelected ? 3.5 : 2.5}
                              fill={site.color}
                              stroke="white"
                              strokeWidth="0.8"
                              opacity={isSelected ? 1 : 0.85}
                            />
                            {isSelected && (
                              <circle cx={site.x} cy={site.y} r={5} fill={site.color} opacity="0.2" />
                            )}
                            <text
                              x={site.x}
                              y={site.y - 3.5}
                              textAnchor="middle"
                              fontSize="1.8"
                              fill="#1f2937"
                              fontWeight={isSelected ? "bold" : "normal"}
                            >
                              {site.arabicName.split(" ").slice(0, 2).join(" ")}
                            </text>
                          </g>
                        );
                      })}

                      {/* Compass */}
                      <g transform="translate(88, 8)">
                        <circle cx="0" cy="0" r="4" fill="white" stroke="#d1d5db" strokeWidth="0.3" />
                        <text x="0" y="-1.5" textAnchor="middle" fontSize="2" fill="#374151">ش</text>
                        <text x="0" y="3" textAnchor="middle" fontSize="2" fill="#374151">ج</text>
                        <text x="-3" y="1" textAnchor="middle" fontSize="2" fill="#374151">غ</text>
                        <text x="3" y="1" textAnchor="middle" fontSize="2" fill="#374151">ش</text>
                      </g>
                    </svg>
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
                    انقر على أي موقع لعرض تفاصيله
                  </div>
                </div>
              </div>

              {/* Info panel */}
              <div className="lg:col-span-1">
                {selected ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 anim-scale-in">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[selected.category]}`}>
                          {CATEGORY_LABELS[selected.category]}
                        </span>
                        <h3 className="text-xl font-black text-gray-800 mt-2">{selected.arabicName}</h3>
                      </div>
                      <button
                        onClick={() => setSelected(null)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{selected.description}</p>

                    {selected.ritualStep !== undefined && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                            {selected.ritualStep}
                          </div>
                          <span className="text-emerald-700 font-bold text-sm">خطوة المنسك</span>
                        </div>
                        <p className="text-emerald-700 text-sm">{selected.ritualDesc}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">انقر على أي موقع في الخريطة لعرض معلوماته</p>
                    </div>

                    {/* Sites list */}
                    <div className="space-y-2 mt-2">
                      <h4 className="font-bold text-gray-700 text-sm mb-3">المواقع ({visibleSites.length})</h4>
                      {visibleSites.map((site) => (
                        <button
                          key={site.id}
                          onClick={() => setSelected(site)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-right"
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: site.color }} />
                          <span className="text-sm text-gray-700 font-medium">{site.arabicName}</span>
                          {site.ritualStep !== undefined && (
                            <span className="ms-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              خطوة {site.ritualStep}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: STEPS ── */}
        {tab === "steps" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Step navigator */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={prevStep}
                  disabled={activeStep === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">الخطوة</div>
                  <div className="text-2xl font-black text-emerald-700">{activeStep + 1} / {RITUAL_STEPS.length}</div>
                </div>
                <button
                  onClick={nextStep}
                  disabled={activeStep === RITUAL_STEPS.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="seats-track mb-6">
                <div
                  className="seats-fill"
                  style={{ width: `${((activeStep + 1) / RITUAL_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Current step */}
              {(() => {
                const step = RITUAL_STEPS[activeStep];
                return (
                  <div className="text-center anim-scale-in" key={step.id}>
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black shadow-lg"
                      style={{ backgroundColor: step.color }}>
                      {step.ritualStep}
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">{step.arabicName}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.description}</p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold text-sm">ماذا تفعل؟</span>
                      </div>
                      <p className="text-emerald-700 text-sm">{step.ritualDesc}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* All steps overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                خطوات العمرة كاملة
              </h3>
              <div className="space-y-3">
                {RITUAL_STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-right ${
                      activeStep === i
                        ? "bg-emerald-50 border-2 border-emerald-400"
                        : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.ritualStep}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm">{step.arabicName}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{step.ritualDesc}</div>
                    </div>
                    {activeStep === i && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                نصائح مهمة للمعتمر
              </h3>
              <ul className="space-y-2 text-amber-700 text-sm">
                {[
                  "احرص على الإحرام من الميقات المحدد لبلدك",
                  "اقرأ التلبية بصوت مرتفع للرجال وخافت للنساء",
                  "ابدأ الطواف من الحجر الأسود واجعل الكعبة عن يسارك",
                  "اشرب من ماء زمزم وادعُ بما تشاء",
                  "ابدأ السعي من الصفا وانتهِ بالمروة",
                  "الحلق أفضل من التقصير للرجال",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
