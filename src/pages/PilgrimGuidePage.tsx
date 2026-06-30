import { useEffect, useMemo, useState } from "react";
import { Page } from "../App";
import { useI18n } from "../lib/i18n";
import {
  BookOpen,
  BookMarked,
  ChevronLeft,
  Compass,
  Headphones,
  HeartHandshake,
  Map,
  RotateCcw,
  Sparkles,
  Timer,
  Video,
} from "lucide-react";

const UMRAH_STEPS = [1, 2, 3, 4, 5];

const QUICK_DUAS = [
  "لبيك اللهم لبيك، لبيك لا شريك لك لبيك.",
  "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار.",
  "اللهم تقبل عمرتنا واغفر ذنوبنا ويسر أمرنا.",
];

const GUIDE_CARDS: Array<{
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  page: Page;
  tone: string;
}> = [
  {
    titleKey: "guide.quran.title",
    descKey: "guide.quran.desc",
    icon: BookOpen,
    page: { name: "quran" },
    tone: "from-emerald-700 to-emerald-950",
  },
  {
    titleKey: "guide.adhkar.title",
    descKey: "guide.adhkar.desc",
    icon: BookMarked,
    page: { name: "adhkar" },
    tone: "from-amber-600 to-orange-800",
  },
  {
    titleKey: "guide.prayer.title",
    descKey: "guide.prayer.desc",
    icon: Compass,
    page: { name: "prayer-times" },
    tone: "from-sky-700 to-cyan-950",
  },
  {
    titleKey: "guide.map.title",
    descKey: "guide.map.desc",
    icon: Map,
    page: { name: "umrah-map" },
    tone: "from-blue-700 to-indigo-950",
  },
  {
    titleKey: "guide.live.title",
    descKey: "guide.live.desc",
    icon: Video,
    page: { name: "haramain-live" },
    tone: "from-stone-700 to-stone-950",
  },
  {
    titleKey: "guide.support.title",
    descKey: "guide.support.desc",
    icon: HeartHandshake,
    page: { name: "support" },
    tone: "from-rose-700 to-red-950",
  },
];

export default function PilgrimGuidePage({ navigate }: { navigate: (p: Page) => void }) {
  const { t, dir } = useI18n();
  const [tasbeeh, setTasbeeh] = useState(() => {
    const saved = Number(localStorage.getItem("pilgrimTasbeehCount") ?? "0");
    return Number.isFinite(saved) ? saved : 0;
  });
  const [goal, setGoal] = useState(() => {
    const saved = Number(localStorage.getItem("pilgrimTasbeehGoal") ?? "100");
    return Number.isFinite(saved) && saved > 0 ? saved : 100;
  });

  useEffect(() => {
    localStorage.setItem("pilgrimTasbeehCount", String(tasbeeh));
  }, [tasbeeh]);

  useEffect(() => {
    localStorage.setItem("pilgrimTasbeehGoal", String(goal));
  }, [goal]);

  const progress = useMemo(() => Math.min(100, Math.round((tasbeeh / goal) * 100)), [tasbeeh, goal]);

  return (
    <div className="min-h-screen bg-[#f7f4eb]" dir={dir}>
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#d7b56d,transparent_32%),radial-gradient(circle_at_80%_10%,#0ea5a4,transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/30 bg-white/10 text-amber-200 text-xs font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              {t("guide.badge")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              {t("guide.title")}
            </h1>
            <p className="text-emerald-100 leading-8 max-w-2xl">
              {t("guide.subtitle")}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {GUIDE_CARDS.map(({ titleKey, descKey, icon: Icon, page, tone }) => (
            <button
              key={titleKey}
              onClick={() => navigate(page)}
              className={`group text-right rounded-2xl p-5 bg-gradient-to-br ${tone} text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-amber-200" />
                </div>
                <ChevronLeft className="w-5 h-5 text-white/50 group-hover:-translate-x-1 transition-transform" />
              </div>
              <h3 className="mt-5 text-lg font-black">{t(titleKey)}</h3>
              <p className="mt-2 text-sm text-white/70 leading-6">{t(descKey)}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <section className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">{t("guide.steps.title")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("guide.steps.subtitle")}</p>
              </div>
              <Map className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="space-y-3">
              {UMRAH_STEPS.map((stepNo, index) => (
                <div key={stepNo} className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-gray-900">{t(`guide.step.${stepNo}.title`)}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">{t(`guide.step.${stepNo}.tag`)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-7 mt-1">{t(`guide.step.${stepNo}.text`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="bg-stone-950 rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black">{t("guide.tasbeeh")}</h2>
                  <p className="text-xs text-stone-400 mt-1">{t("guide.tasbeehSaved")}</p>
                </div>
                <Headphones className="w-6 h-6 text-amber-300" />
              </div>
              <button
                onClick={() => setTasbeeh((v) => v + 1)}
                className="w-full aspect-square rounded-full border-8 border-amber-300/30 bg-gradient-to-br from-amber-300 to-amber-600 text-stone-950 flex flex-col items-center justify-center shadow-2xl shadow-amber-950/30"
              >
                <span className="text-6xl font-black">{tasbeeh}</span>
                <span className="text-sm font-bold mt-1">{t("guide.tapTasbeeh")}</span>
              </button>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span>{t("guide.goal")}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-amber-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex gap-2">
                  {[33, 100, 1000].map((value) => (
                    <button
                      key={value}
                      onClick={() => setGoal(value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black ${goal === value ? "bg-amber-300 text-stone-950" : "bg-white/10 text-white"}`}
                    >
                      {value}
                    </button>
                  ))}
                  <button onClick={() => setTasbeeh(0)} className="px-3 rounded-xl bg-white/10 text-white">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-emerald-700" />
                <h2 className="font-black text-gray-900">{t("guide.quickDuas")}</h2>
              </div>
              <div className="space-y-3">
                {QUICK_DUAS.map((dua) => (
                  <p key={dua} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm leading-7 text-emerald-950">
                    {dua}
                  </p>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
