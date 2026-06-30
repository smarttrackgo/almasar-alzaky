import { useState, useRef, useEffect } from "react";
import { Page } from "../App";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, BookOpen,
  Headphones, Search, ChevronRight, Repeat,
  VolumeX, Volume1, ListMusic
} from "lucide-react";

/* ══════════════════════════════════════════════
   القراء - مصريون وعرب مشهورون
══════════════════════════════════════════════ */
const RECITERS = [
  { id: "ar.abdulbasitmurattal",  name: "عبد الباسط عبد الصمد", country: "مصر",      flag: "🇪🇬", style: "مرتل",  color: "from-green-700 to-green-900" },
  { id: "ar.abdulbasitmujawwad",  name: "عبد الباسط (مجوّد)",   country: "مصر",      flag: "🇪🇬", style: "مجوّد", color: "from-green-600 to-green-800" },
  { id: "ar.husary",              name: "محمود خليل الحصري",    country: "مصر",      flag: "🇪🇬", style: "مرتل",  color: "from-teal-700 to-teal-900" },
  { id: "ar.husarymujawwad",      name: "الحصري (مجوّد)",       country: "مصر",      flag: "🇪🇬", style: "مجوّد", color: "from-teal-600 to-teal-800" },
  { id: "ar.minshawi",            name: "محمد صديق المنشاوي",   country: "مصر",      flag: "🇪🇬", style: "مجوّد", color: "from-emerald-700 to-emerald-900" },
  { id: "ar.minshawimujawwad",    name: "المنشاوي (مجوّد)",     country: "مصر",      flag: "🇪🇬", style: "مجوّد", color: "from-emerald-600 to-emerald-800" },
  { id: "ar.muhammadayyoub",      name: "محمد أيوب",            country: "السعودية", flag: "🇸🇦", style: "مرتل",  color: "from-amber-700 to-amber-900" },
  { id: "ar.alafasy",             name: "مشاري العفاسي",        country: "الكويت",   flag: "🇰🇼", style: "مرتل",  color: "from-blue-700 to-blue-900" },
  { id: "ar.mahermuaiqly",        name: "ماهر المعيقلي",        country: "السعودية", flag: "🇸🇦", style: "مرتل",  color: "from-indigo-700 to-indigo-900" },
  { id: "ar.sudais",              name: "عبد الرحمن السديس",    country: "السعودية", flag: "🇸🇦", style: "مرتل",  color: "from-purple-700 to-purple-900" },
  { id: "ar.saoodshuraym",        name: "سعود الشريم",          country: "السعودية", flag: "🇸🇦", style: "مرتل",  color: "from-rose-700 to-rose-900" },
  { id: "ar.shaatree",            name: "أبو بكر الشاطري",      country: "السعودية", flag: "🇸🇦", style: "مرتل",  color: "from-cyan-700 to-cyan-900" },
];

/* ══════════════════════════════════════════════
   جميع سور القرآن الكريم الـ 114
══════════════════════════════════════════════ */
const SURAHS = [
  { num: 1,   name: "الفاتحة",        verses: 7,   type: "مكية",  juz: 1  },
  { num: 2,   name: "البقرة",         verses: 286, type: "مدنية", juz: 1  },
  { num: 3,   name: "آل عمران",       verses: 200, type: "مدنية", juz: 3  },
  { num: 4,   name: "النساء",         verses: 176, type: "مدنية", juz: 4  },
  { num: 5,   name: "المائدة",        verses: 120, type: "مدنية", juz: 6  },
  { num: 6,   name: "الأنعام",        verses: 165, type: "مكية",  juz: 7  },
  { num: 7,   name: "الأعراف",        verses: 206, type: "مكية",  juz: 8  },
  { num: 8,   name: "الأنفال",        verses: 75,  type: "مدنية", juz: 9  },
  { num: 9,   name: "التوبة",         verses: 129, type: "مدنية", juz: 10 },
  { num: 10,  name: "يونس",           verses: 109, type: "مكية",  juz: 11 },
  { num: 11,  name: "هود",            verses: 123, type: "مكية",  juz: 11 },
  { num: 12,  name: "يوسف",           verses: 111, type: "مكية",  juz: 12 },
  { num: 13,  name: "الرعد",          verses: 43,  type: "مدنية", juz: 13 },
  { num: 14,  name: "إبراهيم",        verses: 52,  type: "مكية",  juz: 13 },
  { num: 15,  name: "الحجر",          verses: 99,  type: "مكية",  juz: 14 },
  { num: 16,  name: "النحل",          verses: 128, type: "مكية",  juz: 14 },
  { num: 17,  name: "الإسراء",        verses: 111, type: "مكية",  juz: 15 },
  { num: 18,  name: "الكهف",          verses: 110, type: "مكية",  juz: 15 },
  { num: 19,  name: "مريم",           verses: 98,  type: "مكية",  juz: 16 },
  { num: 20,  name: "طه",             verses: 135, type: "مكية",  juz: 16 },
  { num: 21,  name: "الأنبياء",       verses: 112, type: "مكية",  juz: 17 },
  { num: 22,  name: "الحج",           verses: 78,  type: "مدنية", juz: 17 },
  { num: 23,  name: "المؤمنون",       verses: 118, type: "مكية",  juz: 18 },
  { num: 24,  name: "النور",          verses: 64,  type: "مدنية", juz: 18 },
  { num: 25,  name: "الفرقان",        verses: 77,  type: "مكية",  juz: 18 },
  { num: 26,  name: "الشعراء",        verses: 227, type: "مكية",  juz: 19 },
  { num: 27,  name: "النمل",          verses: 93,  type: "مكية",  juz: 19 },
  { num: 28,  name: "القصص",          verses: 88,  type: "مكية",  juz: 20 },
  { num: 29,  name: "العنكبوت",       verses: 69,  type: "مكية",  juz: 20 },
  { num: 30,  name: "الروم",          verses: 60,  type: "مكية",  juz: 21 },
  { num: 31,  name: "لقمان",          verses: 34,  type: "مكية",  juz: 21 },
  { num: 32,  name: "السجدة",         verses: 30,  type: "مكية",  juz: 21 },
  { num: 33,  name: "الأحزاب",        verses: 73,  type: "مدنية", juz: 21 },
  { num: 34,  name: "سبأ",            verses: 54,  type: "مكية",  juz: 22 },
  { num: 35,  name: "فاطر",           verses: 45,  type: "مكية",  juz: 22 },
  { num: 36,  name: "يس",             verses: 83,  type: "مكية",  juz: 22 },
  { num: 37,  name: "الصافات",        verses: 182, type: "مكية",  juz: 23 },
  { num: 38,  name: "ص",              verses: 88,  type: "مكية",  juz: 23 },
  { num: 39,  name: "الزمر",          verses: 75,  type: "مكية",  juz: 23 },
  { num: 40,  name: "غافر",           verses: 85,  type: "مكية",  juz: 24 },
  { num: 41,  name: "فصلت",           verses: 54,  type: "مكية",  juz: 24 },
  { num: 42,  name: "الشورى",         verses: 53,  type: "مكية",  juz: 25 },
  { num: 43,  name: "الزخرف",         verses: 89,  type: "مكية",  juz: 25 },
  { num: 44,  name: "الدخان",         verses: 59,  type: "مكية",  juz: 25 },
  { num: 45,  name: "الجاثية",        verses: 37,  type: "مكية",  juz: 25 },
  { num: 46,  name: "الأحقاف",        verses: 35,  type: "مكية",  juz: 26 },
  { num: 47,  name: "محمد",           verses: 38,  type: "مدنية", juz: 26 },
  { num: 48,  name: "الفتح",          verses: 29,  type: "مدنية", juz: 26 },
  { num: 49,  name: "الحجرات",        verses: 18,  type: "مدنية", juz: 26 },
  { num: 50,  name: "ق",              verses: 45,  type: "مكية",  juz: 26 },
  { num: 51,  name: "الذاريات",       verses: 60,  type: "مكية",  juz: 26 },
  { num: 52,  name: "الطور",          verses: 49,  type: "مكية",  juz: 27 },
  { num: 53,  name: "النجم",          verses: 62,  type: "مكية",  juz: 27 },
  { num: 54,  name: "القمر",          verses: 55,  type: "مكية",  juz: 27 },
  { num: 55,  name: "الرحمن",         verses: 78,  type: "مدنية", juz: 27 },
  { num: 56,  name: "الواقعة",        verses: 96,  type: "مكية",  juz: 27 },
  { num: 57,  name: "الحديد",         verses: 29,  type: "مدنية", juz: 27 },
  { num: 58,  name: "المجادلة",       verses: 22,  type: "مدنية", juz: 28 },
  { num: 59,  name: "الحشر",          verses: 24,  type: "مدنية", juz: 28 },
  { num: 60,  name: "الممتحنة",       verses: 13,  type: "مدنية", juz: 28 },
  { num: 61,  name: "الصف",           verses: 14,  type: "مدنية", juz: 28 },
  { num: 62,  name: "الجمعة",         verses: 11,  type: "مدنية", juz: 28 },
  { num: 63,  name: "المنافقون",      verses: 11,  type: "مدنية", juz: 28 },
  { num: 64,  name: "التغابن",        verses: 18,  type: "مدنية", juz: 28 },
  { num: 65,  name: "الطلاق",         verses: 12,  type: "مدنية", juz: 28 },
  { num: 66,  name: "التحريم",        verses: 12,  type: "مدنية", juz: 28 },
  { num: 67,  name: "الملك",          verses: 30,  type: "مكية",  juz: 29 },
  { num: 68,  name: "القلم",          verses: 52,  type: "مكية",  juz: 29 },
  { num: 69,  name: "الحاقة",         verses: 52,  type: "مكية",  juz: 29 },
  { num: 70,  name: "المعارج",        verses: 44,  type: "مكية",  juz: 29 },
  { num: 71,  name: "نوح",            verses: 28,  type: "مكية",  juz: 29 },
  { num: 72,  name: "الجن",           verses: 28,  type: "مكية",  juz: 29 },
  { num: 73,  name: "المزمل",         verses: 20,  type: "مكية",  juz: 29 },
  { num: 74,  name: "المدثر",         verses: 56,  type: "مكية",  juz: 29 },
  { num: 75,  name: "القيامة",        verses: 40,  type: "مكية",  juz: 29 },
  { num: 76,  name: "الإنسان",        verses: 31,  type: "مدنية", juz: 29 },
  { num: 77,  name: "المرسلات",       verses: 50,  type: "مكية",  juz: 29 },
  { num: 78,  name: "النبأ",          verses: 40,  type: "مكية",  juz: 30 },
  { num: 79,  name: "النازعات",       verses: 46,  type: "مكية",  juz: 30 },
  { num: 80,  name: "عبس",            verses: 42,  type: "مكية",  juz: 30 },
  { num: 81,  name: "التكوير",        verses: 29,  type: "مكية",  juz: 30 },
  { num: 82,  name: "الانفطار",       verses: 19,  type: "مكية",  juz: 30 },
  { num: 83,  name: "المطففين",       verses: 36,  type: "مكية",  juz: 30 },
  { num: 84,  name: "الانشقاق",       verses: 25,  type: "مكية",  juz: 30 },
  { num: 85,  name: "البروج",         verses: 22,  type: "مكية",  juz: 30 },
  { num: 86,  name: "الطارق",         verses: 17,  type: "مكية",  juz: 30 },
  { num: 87,  name: "الأعلى",         verses: 19,  type: "مكية",  juz: 30 },
  { num: 88,  name: "الغاشية",        verses: 26,  type: "مكية",  juz: 30 },
  { num: 89,  name: "الفجر",          verses: 30,  type: "مكية",  juz: 30 },
  { num: 90,  name: "البلد",          verses: 20,  type: "مكية",  juz: 30 },
  { num: 91,  name: "الشمس",          verses: 15,  type: "مكية",  juz: 30 },
  { num: 92,  name: "الليل",          verses: 21,  type: "مكية",  juz: 30 },
  { num: 93,  name: "الضحى",          verses: 11,  type: "مكية",  juz: 30 },
  { num: 94,  name: "الشرح",          verses: 8,   type: "مكية",  juz: 30 },
  { num: 95,  name: "التين",          verses: 8,   type: "مكية",  juz: 30 },
  { num: 96,  name: "العلق",          verses: 19,  type: "مكية",  juz: 30 },
  { num: 97,  name: "القدر",          verses: 5,   type: "مكية",  juz: 30 },
  { num: 98,  name: "البينة",         verses: 8,   type: "مدنية", juz: 30 },
  { num: 99,  name: "الزلزلة",        verses: 8,   type: "مدنية", juz: 30 },
  { num: 100, name: "العاديات",       verses: 11,  type: "مكية",  juz: 30 },
  { num: 101, name: "القارعة",        verses: 11,  type: "مكية",  juz: 30 },
  { num: 102, name: "التكاثر",        verses: 8,   type: "مكية",  juz: 30 },
  { num: 103, name: "العصر",          verses: 3,   type: "مكية",  juz: 30 },
  { num: 104, name: "الهمزة",         verses: 9,   type: "مكية",  juz: 30 },
  { num: 105, name: "الفيل",          verses: 5,   type: "مكية",  juz: 30 },
  { num: 106, name: "قريش",           verses: 4,   type: "مكية",  juz: 30 },
  { num: 107, name: "الماعون",        verses: 7,   type: "مكية",  juz: 30 },
  { num: 108, name: "الكوثر",         verses: 3,   type: "مكية",  juz: 30 },
  { num: 109, name: "الكافرون",       verses: 6,   type: "مكية",  juz: 30 },
  { num: 110, name: "النصر",          verses: 3,   type: "مدنية", juz: 30 },
  { num: 111, name: "المسد",          verses: 5,   type: "مكية",  juz: 30 },
  { num: 112, name: "الإخلاص",        verses: 4,   type: "مكية",  juz: 30 },
  { num: 113, name: "الفلق",          verses: 5,   type: "مكية",  juz: 30 },
  { num: 114, name: "الناس",          verses: 6,   type: "مكية",  juz: 30 },
];

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1);
type FilterMode = "all" | "makki" | "madani" | "juz";

function formatTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuranPage({ navigate: _navigate }: { navigate: (p: Page) => void }) {
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [selectedSurah,   setSelectedSurah]   = useState(SURAHS[0]);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<FilterMode>("all");
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(1);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isRepeat,    setIsRepeat]    = useState(false);
  const [autoPlay,    setAutoPlay]    = useState(false);
  const [reciterSearch, setReciterSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${selectedReciter.id}/${selectedSurah.num}.mp3`;

  const filteredSurahs = SURAHS.filter(s => {
    const matchSearch = s.name.includes(search) || String(s.num).includes(search);
    if (!matchSearch) return false;
    if (filter === "makki")  return s.type === "مكية";
    if (filter === "madani") return s.type === "مدنية";
    if (filter === "juz")    return s.juz === selectedJuz;
    return true;
  });

  const filteredReciters = RECITERS.filter(r =>
    r.name.includes(reciterSearch) || r.country.includes(reciterSearch)
  );

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = audioUrl;
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      setIsLoading(true);
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setIsLoading(false))
        .catch(() => { setIsPlaying(false); setIsLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReciter.id, selectedSurah.num]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        audioRef.current.src = audioUrl;
      }
      setIsLoading(true);
      audioRef.current.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsPlaying(false); setIsLoading(false); });
    }
  };

  const changeSurah = (surah: typeof SURAHS[0], playNow = false) => {
    setSelectedSurah(surah);
    if (!playNow) setIsPlaying(false);
  };

  const prevSurah = () => {
    const idx = SURAHS.findIndex(s => s.num === selectedSurah.num);
    if (idx > 0) changeSurah(SURAHS[idx - 1], isPlaying);
  };

  const nextSurah = () => {
    const idx = SURAHS.findIndex(s => s.num === selectedSurah.num);
    if (idx < SURAHS.length - 1) changeSurah(SURAHS[idx + 1], isPlaying || autoPlay);
  };

  const handleEnded = () => {
    if (isRepeat && audioRef.current) {
      audioRef.current.play();
    } else if (autoPlay) {
      nextSurah();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.volume = next ? 0 : volume;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ══ Hero ══ */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-4xl font-black mb-1">المصحف الشريف</h1>
          <p className="text-emerald-300 text-sm">جميع سور القرآن الكريم الـ 114 مع {RECITERS.length} قارئاً</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-emerald-400 flex-wrap">
            <span>114 سورة</span>
            <span>•</span>
            <span>6236 آية</span>
            <span>•</span>
            <span>30 جزءاً</span>
            <span>•</span>
            <span>{RECITERS.length} قارئاً</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══ عمود القراء ══ */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-l from-emerald-800 to-emerald-900 px-4 py-3 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-amber-300" />
                <span className="text-white font-bold text-sm">القراء ({RECITERS.length})</span>
              </div>
              <div className="p-3">
                <input
                  value={reciterSearch}
                  onChange={e => setReciterSearch(e.target.value)}
                  placeholder="ابحث عن قارئ..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 mb-3"
                />
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {filteredReciters.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReciter(r);
                        setIsPlaying(false);
                        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
                      }}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all text-right ${
                        selectedReciter.id === r.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-transparent hover:border-emerald-100 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{r.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-xs leading-tight">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.country} • {r.style}</div>
                      </div>
                      {selectedReciter.id === r.id && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ العمود الأوسط: المشغل + قائمة السور ══ */}
          <div className="lg:col-span-9 space-y-5">

            {/* ── المشغل الرئيسي ── */}
            <div className={`bg-gradient-to-br ${selectedReciter.color} rounded-2xl p-6 text-white shadow-xl`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-white/60 mb-0.5">{selectedReciter.name} • {selectedReciter.style}</div>
                  <div className="text-3xl font-black">سورة {selectedSurah.name}</div>
                  <div className="text-white/70 text-sm mt-1">
                    {selectedSurah.verses} آية • {selectedSurah.type} • الجزء {selectedSurah.juz}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-lg font-black">
                  {selectedSurah.num}
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="mb-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to left, rgba(255,255,255,0.25) ${100 - progress}%, rgba(251,191,36,0.9) ${100 - progress}%)`
                  }}
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* تحكم إضافي */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    title="تكرار السورة"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRepeat ? "bg-amber-400 text-emerald-900" : "bg-white/10 hover:bg-white/20"}`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    title="تشغيل تلقائي للسورة التالية"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${autoPlay ? "bg-amber-400 text-emerald-900" : "bg-white/10 hover:bg-white/20"}`}
                  >
                    <ListMusic className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* أزرار التنقل والتشغيل */}
                <div className="flex items-center gap-4">
                  <button onClick={prevSurah} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-7 h-7 text-emerald-900" />
                    ) : (
                      <Play className="w-7 h-7 text-emerald-900" style={{ marginRight: "-2px" }} />
                    )}
                  </button>
                  <button onClick={nextSurah} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <SkipBack className="w-5 h-5" />
                  </button>
                </div>

                {/* التحكم في الصوت */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                    {isMuted || volume === 0
                      ? <VolumeX className="w-4 h-4" />
                      : volume < 0.5
                        ? <Volume1 className="w-4 h-4" />
                        : <Volume2 className="w-4 h-4" />
                    }
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    className="w-20 h-1 rounded-full appearance-none cursor-pointer bg-white/20"
                  />
                </div>
              </div>

              {/* موجة الصوت */}
              {isPlaying && (
                <div className="flex items-end justify-center gap-0.5 mt-4 h-6">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-amber-300/70 rounded-full animate-pulse"
                      style={{
                        height: `${6 + Math.abs(Math.sin(i * 0.7)) * 12}px`,
                        animationDelay: `${i * 0.06}s`,
                        animationDuration: `${0.7 + (i % 3) * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── قائمة السور ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* رأس القائمة */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="ابحث عن سورة بالاسم أو الرقم..."
                      className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["all", "makki", "madani", "juz"] as FilterMode[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filter === f ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-emerald-50"
                        }`}
                      >
                        {f === "all" ? "الكل" : f === "makki" ? "مكية" : f === "madani" ? "مدنية" : "جزء"}
                      </button>
                    ))}
                    {filter === "juz" && (
                      <select
                        value={selectedJuz}
                        onChange={e => setSelectedJuz(Number(e.target.value))}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-emerald-400"
                      >
                        {JUZS.map(j => (
                          <option key={j} value={j}>الجزء {j}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">{filteredSurahs.length} سورة</div>
              </div>

              {/* شبكة السور */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto">
                  {filteredSurahs.map((s) => {
                    const isSelected = selectedSurah.num === s.num;
                    return (
                      <button
                        key={s.num}
                        onClick={() => changeSurah(s)}
                        onDoubleClick={() => changeSurah(s, true)}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all group ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 shadow-md"
                            : "border-transparent hover:border-emerald-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black mb-1.5 transition-all ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
                        }`}>
                          {s.num}
                        </div>
                        <div className={`text-xs font-bold text-center leading-tight ${isSelected ? "text-emerald-800" : "text-gray-800"}`}>
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.verses} آية</div>
                        <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                          s.type === "مكية" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {s.type}
                        </div>
                        {isSelected && isPlaying && (
                          <div className="absolute top-1.5 left-1.5 flex gap-0.5 items-end h-3">
                            {[1,2,3].map(i => (
                              <div key={i} className="w-0.5 bg-emerald-500 rounded-full animate-pulse" style={{ height: `${4 + i * 3}px`, animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        )}
                        {isSelected && !isPlaying && (
                          <ChevronRight className="absolute top-1.5 left-1.5 w-3 h-3 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {filteredSurahs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد سور تطابق البحث</p>
                  </div>
                )}
              </div>

              <div className="px-4 pb-3 text-xs text-gray-400 text-center border-t border-gray-50 pt-2">
                انقر مرة للتحديد • انقر مرتين للتشغيل الفوري
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />
    </div>
  );
}
