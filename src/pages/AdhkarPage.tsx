import { useState } from "react";
import { Page } from "../App";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Category = "morning" | "evening" | "prayer" | "umrah" | "general";

const CATEGORIES: { key: Category; label: string; icon: string; color: string }[] = [
  { key: "umrah",   label: "أدعية العمرة",    icon: "🕋", color: "from-emerald-600 to-emerald-800" },
  { key: "morning", label: "أذكار الصباح",    icon: "🌅", color: "from-amber-500 to-orange-600" },
  { key: "evening", label: "أذكار المساء",    icon: "🌙", color: "from-indigo-600 to-purple-700" },
  { key: "prayer",  label: "أذكار الصلاة",    icon: "🤲", color: "from-teal-500 to-teal-700" },
  { key: "general", label: "أذكار عامة",      icon: "📿", color: "from-rose-500 to-rose-700" },
];

const ADHKAR: Record<Category, { title: string; text: string; count?: number; source?: string }[]> = {
  umrah: [
    {
      title: "دعاء الإحرام",
      text: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
      source: "التلبية المتواترة",
    },
    {
      title: "دعاء رؤية الكعبة",
      text: "اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَكْرِيمًا وَتَعْظِيمًا وَبِرًّا",
      source: "الشافعي",
    },
    {
      title: "دعاء الطواف",
      text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      source: "البقرة: 201",
    },
    {
      title: "دعاء الحجر الأسود",
      text: "بِسْمِ اللهِ وَاللهُ أَكْبَرُ، اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ ﷺ",
      source: "السنة النبوية",
    },
    {
      title: "دعاء المقام",
      text: "وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى",
      source: "البقرة: 125",
    },
    {
      title: "دعاء الصفا والمروة",
      text: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ",
      source: "السنة النبوية",
    },
    {
      title: "دعاء على الصفا",
      text: "اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      count: 3,
      source: "صحيح مسلم",
    },
    {
      title: "دعاء الحلق والتقصير",
      text: "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ",
      source: "متفق عليه",
    },
  ],
  morning: [
    {
      title: "سيد الاستغفار",
      text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      count: 1,
      source: "صحيح البخاري",
    },
    {
      title: "ذكر الصباح",
      text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      count: 1,
      source: "صحيح مسلم",
    },
    {
      title: "آية الكرسي",
      text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
      count: 1,
      source: "البقرة: 255",
    },
    {
      title: "التسبيح",
      text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
      count: 100,
      source: "صحيح مسلم",
    },
  ],
  evening: [
    {
      title: "ذكر المساء",
      text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      count: 1,
      source: "صحيح مسلم",
    },
    {
      title: "دعاء المساء",
      text: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
      count: 1,
      source: "سنن الترمذي",
    },
    {
      title: "الاستعاذة",
      text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      count: 3,
      source: "صحيح مسلم",
    },
  ],
  prayer: [
    {
      title: "بعد السلام",
      text: "أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ",
      count: 3,
      source: "صحيح مسلم",
    },
    {
      title: "التسبيح بعد الصلاة",
      text: "سُبْحَانَ اللهِ، الْحَمْدُ لِلَّهِ، اللهُ أَكْبَرُ",
      count: 33,
      source: "متفق عليه",
    },
    {
      title: "لا إله إلا الله",
      text: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      count: 1,
      source: "صحيح مسلم",
    },
  ],
  general: [
    {
      title: "الحوقلة",
      text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ",
      source: "متفق عليه",
    },
    {
      title: "الاستغفار",
      text: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
      count: 3,
      source: "سنن الترمذي",
    },
    {
      title: "الصلاة على النبي",
      text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
      count: 10,
      source: "صحيح البخاري",
    },
    {
      title: "دعاء الكرب",
      text: "لَا إِلَهَ إِلَّا اللهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
      source: "متفق عليه",
    },
  ],
};

export default function AdhkarPage({ navigate }: { navigate: (p: Page) => void }) {
  const [category, setCategory] = useState<Category>("umrah");
  const [copied, setCopied]     = useState<number | null>(null);

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      toast.success("تم نسخ الذكر");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const cat = CATEGORIES.find(c => c.key === category)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${cat.color} text-white py-12 px-4 transition-all duration-500`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-3">{cat.icon}</div>
          <h1 className="text-4xl font-black mb-2">{cat.label}</h1>
          <p className="text-white/70 text-sm">حصن المسلم وزاد المعتمر</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                category === c.key
                  ? "bg-emerald-700 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Adhkar cards */}
        <div className="space-y-4">
          {ADHKAR[category].map((dhikr, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-black text-gray-800 text-base">{dhikr.title}</h3>
                  {dhikr.source && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {dhikr.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {dhikr.count && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full">
                      × {dhikr.count}
                    </span>
                  )}
                  <button
                    onClick={() => copyText(dhikr.text, i)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                  >
                    {copied === i ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
              <p className="text-gray-800 text-xl leading-loose font-medium text-right" style={{ fontFamily: "'Tajawal', serif", lineHeight: "2.2" }}>
                {dhikr.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
