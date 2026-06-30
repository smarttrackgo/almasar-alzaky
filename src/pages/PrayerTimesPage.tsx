import { useState, useEffect, useCallback, useRef } from "react";
import { Page } from "../App";
import { ArrowRight, MapPin, Clock, Volume2, VolumeX, Bell, RefreshCw, Compass, Navigation } from "lucide-react";

interface Props {
  navigate: (page: Page) => void;
}

interface PrayerData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// مكة والرياض فقط
const CITIES = [
  { id: "mecca",  nameAr: "مكة المكرمة", emoji: "🕋", country: "SA", lat: 21.3891, lng: 39.8579, timezone: "Asia/Riyadh" },
  { id: "riyadh", nameAr: "الرياض",       emoji: "🏙️", country: "SA", lat: 24.6877, lng: 46.7219, timezone: "Asia/Riyadh" },
];

// إحداثيات الكعبة المشرفة
const KAABA = { lat: 21.4225, lng: 39.8262 };
type CompassMode = "idle" | "requesting" | "live" | "unavailable";

// المؤذنون المشهورون مع روابط الأذان
const MUEZZINS = [
  { id: "makki",    name: "الشيخ علي أحمد ملا",    city: "مكة المكرمة",    url: "https://www.islamcan.com/audio/adhan/azan1.mp3" },
  { id: "sudais",   name: "الشيخ عبدالرحمن السديس", city: "مكة المكرمة",    url: "https://www.islamcan.com/audio/adhan/azan2.mp3" },
  { id: "ghamdi",   name: "الشيخ سعد الغامدي",      city: "الرياض",         url: "https://www.islamcan.com/audio/adhan/azan3.mp3" },
  { id: "madinah",  name: "أذان المدينة المنورة",    city: "المدينة المنورة", url: "https://www.islamcan.com/audio/adhan/azan4.mp3" },
  { id: "fajr",     name: "أذان الفجر الخاشع",       city: "مكة المكرمة",    url: "https://www.islamcan.com/audio/adhan/azan5.mp3" },
];

const PRAYER_NAMES: { key: keyof PrayerData; nameAr: string; icon: string }[] = [
  { key: "fajr",    nameAr: "الفجر",  icon: "🌙" },
  { key: "sunrise", nameAr: "الشروق", icon: "🌅" },
  { key: "dhuhr",   nameAr: "الظهر",  icon: "☀️" },
  { key: "asr",     nameAr: "العصر",  icon: "🌤️" },
  { key: "maghrib", nameAr: "المغرب", icon: "🌇" },
  { key: "isha",    nameAr: "العشاء", icon: "🌃" },
];

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "الآن";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}س ${m}د ${s}ث`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

/** احسب اتجاه القبلة بالدرجات من موقع المستخدم */
function calcQiblaAngle(userLat: number, userLng: number): number {
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (KAABA.lat * Math.PI) / 180;
  const Δλ = ((KAABA.lng - userLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function shortestAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function smoothHeading(previous: number, next: number): number {
  return normalizeAngle(previous + shortestAngleDelta(previous, next) * 0.22);
}

export default function PrayerTimesPage({ navigate }: Props) {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; secondsLeft: number } | null>(null);
  const [hijriDate, setHijriDate] = useState<string>("");

  // الأذان
  const [selectedMuezzin, setSelectedMuezzin] = useState(MUEZZINS[0]);
  const [adhanPlaying, setAdhanPlaying] = useState(false);
  const [adhanNotify, setAdhanNotify] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // اتجاه القبلة
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [compassMode, setCompassMode] = useState<CompassMode>("idle");
  const [lastCompassAt, setLastCompassAt] = useState<number | null>(null);
  const [qiblaStatus, setQiblaStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"prayer" | "qibla">("prayer");
  const compassHeadingRef = useRef(0);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch prayer times
  const fetchPrayerTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      const dateStr = `${dd}-${mm}-${yyyy}`;
      const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&method=4`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل");
      const json = await res.json();
      const t = json.data.timings;
      const hijri = json.data.date.hijri;
      setPrayerData({ fajr: t.Fajr, sunrise: t.Sunrise, dhuhr: t.Dhuhr, asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha });
      setHijriDate(`${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`);
      notifiedRef.current.clear();
    } catch {
      setError("تعذّر الاتصال بخادم المواقيت. تحقق من الإنترنت وأعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => { fetchPrayerTimes(); }, [fetchPrayerTimes]);

  // Compute next prayer & countdown + إشعار الأذان
  useEffect(() => {
    if (!prayerData) return;
    const cityNow = new Date(now.toLocaleString("en-US", { timeZone: selectedCity.timezone }));
    const currentMinutes = cityNow.getHours() * 60 + cityNow.getMinutes();
    const currentSeconds = cityNow.getHours() * 3600 + cityNow.getMinutes() * 60 + cityNow.getSeconds();

    const prayers = PRAYER_NAMES.map(p => ({ nameAr: p.nameAr, key: p.key, minutes: timeToMinutes(prayerData[p.key]) }));
    let found = prayers.find(p => p.minutes > currentMinutes);
    if (!found) found = prayers[0];

    const targetSeconds = found.minutes * 60;
    let diff = targetSeconds - currentSeconds;
    if (diff < 0) diff += 24 * 3600;
    setNextPrayer({ name: found.nameAr, secondsLeft: diff });

    // إشعار الأذان عند دخول وقت الصلاة
    if (adhanNotify) {
      for (const p of prayers) {
        const pSec = p.minutes * 60;
        const diffSec = Math.abs(currentSeconds - pSec);
        if (diffSec <= 1 && !notifiedRef.current.has(p.key)) {
          notifiedRef.current.add(p.key);
          playAdhan();
          if (Notification.permission === "granted") {
            new Notification(`حان وقت ${p.nameAr} 🕌`, { body: `في ${selectedCity.nameAr}`, icon: "/manifest.json" });
          }
        }
      }
    }
  }, [now, prayerData, selectedCity, adhanNotify]);

  // تشغيل الأذان
  const playAdhan = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(selectedMuezzin.url);
    audio.onended = () => { setAdhanPlaying(false); audioRef.current = null; };
    audio.play().catch(() => {});
    audioRef.current = audio;
    setAdhanPlaying(true);
  };

  const toggleAdhan = () => {
    if (adhanPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setAdhanPlaying(false);
    } else {
      playAdhan();
    }
  };

  // عند تغيير المؤذن أثناء التشغيل
  useEffect(() => {
    if (adhanPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setAdhanPlaying(false);
    }
  }, [selectedMuezzin]);

  // طلب إذن الإشعارات
  const requestNotifyPermission = async () => {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setAdhanNotify(v => !v);
  };

  const requestCompassPermission = async (): Promise<boolean> => {
    const OrientationEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof OrientationEvent?.requestPermission !== "function") return true;
    setCompassMode("requesting");
    try {
      const permission = await OrientationEvent.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  };

  const getQibla = async () => {
    setQiblaStatus("loading");
    setCompassMode("requesting");

    const compassAllowed = await requestCompassPermission();
    if (!compassAllowed) setCompassMode("unavailable");

    if (!navigator.geolocation) {
      setQiblaStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const angle = calcQiblaAngle(pos.coords.latitude, pos.coords.longitude);
        setQiblaAngle(angle);
        setQiblaStatus("ok");
        if (compassAllowed) setCompassMode((mode) => mode === "live" ? "live" : "idle");
      },
      () => setQiblaStatus("error"),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 12000 }
    );
  };

  useEffect(() => {
    const readHeading = (e: DeviceOrientationEvent) => {
      const evt = e as DeviceOrientationEvent & { webkitCompassHeading?: number; absolute?: boolean };
      let heading: number | null = null;

      if (typeof evt.webkitCompassHeading === "number") {
        heading = evt.webkitCompassHeading;
      } else if (typeof evt.alpha === "number") {
        heading = evt.absolute ? evt.alpha : 360 - evt.alpha;
      }

      if (heading === null || Number.isNaN(heading)) return;
      const nextHeading = normalizeAngle(heading);
      compassHeadingRef.current = smoothHeading(compassHeadingRef.current, nextHeading);
      setCompassHeading(compassHeadingRef.current);
      setCompassMode("live");
      setLastCompassAt(Date.now());
    };

    window.addEventListener("deviceorientation", readHeading, true);
    window.addEventListener("deviceorientationabsolute", readHeading, true);
    return () => {
      window.removeEventListener("deviceorientation", readHeading, true);
      window.removeEventListener("deviceorientationabsolute", readHeading, true);
    };
  }, []);

  useEffect(() => {
    if (qiblaStatus !== "ok") return;
    const timer = window.setInterval(() => {
      if (!lastCompassAt) return;
      if (Date.now() - lastCompassAt > 3500) setCompassMode("unavailable");
    }, 1500);
    return () => window.clearInterval(timer);
  }, [qiblaStatus, lastCompassAt]);

  // الزاوية الفعلية للإبرة نحو القبلة
  const needleAngle = qiblaAngle !== null ? normalizeAngle(qiblaAngle - compassHeading) : 0;
  const qiblaDelta = Math.abs(shortestAngleDelta(0, needleAngle));
  const isAligned = qiblaStatus === "ok" && compassMode === "live" && qiblaDelta <= 6;

  // وقت المدينة
  const cityTimeStr = now.toLocaleTimeString("ar-SA", { timeZone: selectedCity.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const cityDateStr = now.toLocaleDateString("ar-SA", { timeZone: selectedCity.timezone, weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const getCurrentPrayerIndex = (): number => {
    if (!prayerData) return -1;
    const cityNow = new Date(now.toLocaleString("en-US", { timeZone: selectedCity.timezone }));
    const currentMinutes = cityNow.getHours() * 60 + cityNow.getMinutes();
    const minutes = PRAYER_NAMES.map(p => timeToMinutes(prayerData[p.key]));
    let idx = -1;
    for (let i = 0; i < minutes.length; i++) { if (currentMinutes >= minutes[i]) idx = i; }
    return idx;
  };
  const currentPrayerIdx = getCurrentPrayerIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" dir="rtl">

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate({ name: "home" })} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">مواقيت الصلاة والقبلة</h1>
            <p className="text-emerald-300 text-xs">أوقات دقيقة • اتجاه القبلة • أذان المؤذنين</p>
          </div>
          <button onClick={fetchPrayerTimes} disabled={loading} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab("prayer")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "prayer" ? "bg-emerald-500 text-white shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            <Clock className="w-4 h-4" /> مواقيت الصلاة
          </button>
          <button
            onClick={() => setActiveTab("qibla")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "qibla" ? "bg-amber-500 text-white shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            <Compass className="w-4 h-4" /> اتجاه القبلة
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ══════════════ تبويب مواقيت الصلاة ══════════════ */}
        {activeTab === "prayer" && (
          <>
            {/* City Selector */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-sm font-medium">اختر المدينة</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CITIES.map(city => (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedCity.id === city.id
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <span className="text-lg">{city.emoji}</span>
                    {city.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Card */}
            <div className="bg-gradient-to-br from-emerald-600/40 to-teal-700/40 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/30 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl">{selectedCity.emoji}</span>
                <span className="text-emerald-300 text-sm font-medium">{selectedCity.nameAr}</span>
              </div>
              <div className="text-white text-4xl font-bold tracking-wider mb-1 font-mono" dir="ltr">{cityTimeStr}</div>
              <div className="text-white/70 text-sm mb-1">{cityDateStr}</div>
              {hijriDate && <div className="text-emerald-300 text-sm font-semibold">{hijriDate}</div>}
            </div>

            {/* Next Prayer Countdown */}
            {nextPrayer && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500/30 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">الصلاة القادمة</div>
                      <div className="text-white font-bold text-xl">{nextPrayer.name}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-white/60 text-xs mb-0.5">الوقت المتبقي</div>
                    <div className="text-amber-400 font-bold text-2xl font-mono" dir="ltr">{formatCountdown(nextPrayer.secondsLeft)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Prayer Times List */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium text-sm">أوقات الصلاة</span>
                </div>
                {/* زر إشعار الأذان */}
                <button
                  onClick={requestNotifyPermission}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    adhanNotify
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white/50 border border-white/10"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {adhanNotify ? "إشعار الأذان مفعّل" : "تفعيل الإشعار"}
                </button>
              </div>

              {loading && (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/60 text-sm">جاري تحميل المواقيت...</p>
                </div>
              )}
              {error && (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button onClick={fetchPrayerTimes} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">إعادة المحاولة</button>
                </div>
              )}
              {!loading && !error && prayerData && (
                <div className="divide-y divide-white/5">
                  {PRAYER_NAMES.map((prayer, idx) => {
                    const isCurrentPrayer = idx === currentPrayerIdx;
                    const isNext = nextPrayer?.name === prayer.nameAr;
                    return (
                      <div
                        key={prayer.key}
                        className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                          isCurrentPrayer ? "bg-emerald-500/20 border-r-4 border-emerald-400" : isNext ? "bg-amber-500/10" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{prayer.icon}</span>
                          <div>
                            <div className="text-white font-semibold">{prayer.nameAr}</div>
                            {isCurrentPrayer && <div className="text-emerald-400 text-xs">الوقت الحالي ✓</div>}
                            {isNext && !isCurrentPrayer && <div className="text-amber-400 text-xs">الصلاة القادمة</div>}
                          </div>
                        </div>
                        <div dir="ltr" className={`font-bold text-lg font-mono ${isCurrentPrayer ? "text-emerald-400" : isNext ? "text-amber-400" : "text-white"}`}>
                          {prayerData[prayer.key]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══ اختيار المؤذن ══ */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium text-sm">اختر المؤذن</span>
                </div>
                <button
                  onClick={toggleAdhan}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adhanPlaying
                      ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                  }`}
                >
                  {adhanPlaying ? <><VolumeX className="w-3.5 h-3.5" /> إيقاف</> : <><Volume2 className="w-3.5 h-3.5" /> تشغيل</>}
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {MUEZZINS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMuezzin(m)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all text-right ${
                      selectedMuezzin.id === m.id ? "bg-amber-500/15 border-r-4 border-amber-400" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${selectedMuezzin.id === m.id ? "bg-amber-500/30" : "bg-white/10"}`}>
                        🎙️
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{m.name}</div>
                        <div className="text-white/50 text-xs">{m.city}</div>
                      </div>
                    </div>
                    {selectedMuezzin.id === m.id && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                        {adhanPlaying ? <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" /> يُشغَّل</> : "✓ محدد"}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Islamic Quote */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <div className="text-3xl mb-3">🕌</div>
              <p className="text-white/85 text-sm leading-loose font-medium">
                «حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ»
              </p>
              <p className="text-white/40 text-xs mt-2">سورة البقرة - آية 238</p>
            </div>

            <p className="text-center text-white/30 text-xs pb-4">المواقيت مقدمة من Aladhan API • طريقة الحساب: أم القرى</p>
          </>
        )}

        {/* ══════════════ تبويب اتجاه القبلة ══════════════ */}
        {activeTab === "qibla" && (
          <>
            {/* بطاقة الشرح */}
            <div className="bg-gradient-to-br from-amber-600/20 to-yellow-700/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/30 text-center">
              <div className="text-4xl mb-2">🕋</div>
              <h2 className="text-white font-black text-xl mb-1">اتجاه القبلة</h2>
              <p className="text-amber-200/80 text-sm leading-relaxed">
                اضغط على الزر أدناه للحصول على اتجاه القبلة الدقيق بناءً على موقعك الحالي
              </p>
            </div>

            {/* زر الحصول على الموقع */}
            {qiblaStatus !== "ok" && (
              <button
                onClick={getQibla}
                disabled={qiblaStatus === "loading"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-emerald-900 font-black text-base transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/30 flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {qiblaStatus === "loading" ? (
                  <><div className="w-5 h-5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" /> جاري تحديد موقعك...</>
                ) : (
                  <><Navigation className="w-5 h-5" /> تحديد اتجاه القبلة</>
                )}
              </button>
            )}

            {qiblaStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">📍</div>
                <p className="text-red-400 text-sm mb-3">تعذّر الوصول إلى موقعك. يرجى السماح بالوصول إلى الموقع في إعدادات المتصفح.</p>
                <button onClick={getQibla} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* البوصلة */}
            {qiblaStatus === "ok" && qiblaAngle !== null && (
              <>
                {/* إعادة التحديد */}
                <button
                  onClick={getQibla}
                  className="w-full py-3 rounded-xl bg-white/10 text-white/70 text-sm font-medium border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> إعادة تحديد الموقع
                </button>

                {/* البوصلة التفاعلية */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 flex flex-col items-center overflow-hidden">
                  <div className="w-full flex items-center justify-between gap-3 mb-5">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black border ${compassMode === "live" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" : "bg-amber-500/15 text-amber-300 border-amber-400/30"}`}>
                      {compassMode === "live" ? "البوصلة حية" : compassMode === "requesting" ? "جاري تشغيل الحساس" : "حساس البوصلة غير نشط"}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black border ${isAligned ? "bg-amber-400 text-emerald-950 border-amber-200 shadow-lg shadow-amber-400/30" : "bg-white/10 text-white/70 border-white/10"}`}>
                      {isAligned ? "الاتجاه مضبوط" : "حرّك الهاتف ببطء"}
                    </div>
                  </div>

                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-6">
                    <div className={`absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.12),rgba(6,78,59,0.12)_45%,rgba(15,23,42,0.6)_100%)] border ${isAligned ? "border-amber-300 shadow-[0_0_36px_rgba(251,191,36,0.35)]" : "border-white/20"}`} />
                    <div className="absolute inset-5 rounded-full border border-white/10" />
                    <div className="absolute inset-10 rounded-full border border-dashed border-amber-300/20" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-black border-2 border-amber-300 shadow-xl shadow-amber-400/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-3 bg-amber-400" />
                        <div className="absolute inset-x-4 top-3 bottom-0 bg-neutral-950 border-x border-amber-500/50" />
                        <span className="relative text-2xl">🕋</span>
                      </div>
                      <div className="mt-2 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black shadow-lg">
                        الكعبة المشرفة
                      </div>
                    </div>
                    {[
                      { label: "ش", cls: "top-24 left-1/2 -translate-x-1/2" },
                      { label: "ج", cls: "bottom-3 left-1/2 -translate-x-1/2" },
                      { label: "غ", cls: "right-4 top-1/2 -translate-y-1/2" },
                      { label: "ق", cls: "left-4 top-1/2 -translate-y-1/2" },
                    ].map(d => (
                      <span key={d.label} className={`absolute text-white/45 text-xs font-black ${d.cls}`}>{d.label}</span>
                    ))}
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle = i * 5;
                      const isMajor = angle % 30 === 0;
                      return (
                        <div
                          key={i}
                          className={`absolute left-1/2 top-1/2 origin-center ${isMajor ? "h-3 w-0.5 bg-white/35" : "h-2 w-px bg-white/15"}`}
                          style={{ transform: `rotate(${angle}deg) translateY(-136px)` }}
                        />
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out" style={{ transform: `rotate(${needleAngle}deg)` }}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute top-[78px] left-1/2 -translate-x-1/2 w-4 h-28 rounded-full bg-gradient-to-t from-amber-500 to-yellow-200 shadow-[0_0_18px_rgba(251,191,36,0.8)]" />
                        <div className="absolute top-[64px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[28px] border-l-transparent border-r-transparent border-b-yellow-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                        <div className="absolute bottom-[78px] left-1/2 -translate-x-1/2 w-3 h-20 rounded-full bg-white/15" />
                        <div className="absolute w-8 h-8 rounded-full bg-amber-400 border-4 border-emerald-950 shadow-lg shadow-amber-400/50 z-10" />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-emerald-950/90 border border-white/10 flex flex-col items-center justify-center z-20 shadow-xl">
                        <div className="text-amber-300 text-lg font-black" dir="ltr">{Math.round(needleAngle)}°</div>
                        <div className="text-white/40 text-[10px]">فرق الاتجاه</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-amber-400 text-5xl font-black mb-1" dir="ltr">{Math.round(qiblaAngle)}°</div>
                    <div className="text-white/70 text-sm mb-4">اتجاه الكعبة من موقعك، والسهم يتحرك حسب دوران الهاتف</div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2 text-center">
                        <div className="text-amber-400 font-bold text-lg" dir="ltr">{Math.round(qiblaAngle)}°</div>
                        <div className="text-white/50 text-xs">زاوية القبلة</div>
                      </div>
                      <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                        <div className="text-white font-bold text-lg" dir="ltr">{Math.round(compassHeading)}°</div>
                        <div className="text-white/50 text-xs">اتجاه الهاتف</div>
                      </div>
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 text-center">
                        <div className="text-emerald-400 font-bold text-lg" dir="ltr">{Math.round(qiblaDelta)}°</div>
                        <div className="text-white/50 text-xs">المتبقي للمطابقة</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden">
                  {/* دائرة البوصلة */}
                  <div className="relative w-64 h-64 mb-6">
                    {/* الحلقة الخارجية */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                    <div className="absolute inset-2 rounded-full border border-white/10" />

                    {/* نقاط الاتجاهات */}
                    {[
                      { label: "ش", angle: 0,   cls: "top-1 left-1/2 -translate-x-1/2" },
                      { label: "ج", angle: 180, cls: "bottom-1 left-1/2 -translate-x-1/2" },
                      { label: "غ", angle: 270, cls: "right-1 top-1/2 -translate-y-1/2" },
                      { label: "ق", angle: 90,  cls: "left-1 top-1/2 -translate-y-1/2" },
                    ].map(d => (
                      <span key={d.label} className={`absolute text-white/40 text-xs font-bold ${d.cls}`}>{d.label}</span>
                    ))}

                    {/* الدرجات الصغيرة */}
                    {Array.from({ length: 36 }).map((_, i) => {
                      const angle = i * 10;
                      const isMajor = angle % 90 === 0;
                      const rad = (angle - 90) * (Math.PI / 180);
                      const r = 118;
                      const x = 128 + r * Math.cos(rad);
                      const y = 128 + r * Math.sin(rad);
                      return (
                        <div
                          key={i}
                          className={`absolute rounded-full ${isMajor ? "w-1.5 h-1.5 bg-white/40" : "w-1 h-1 bg-white/15"}`}
                          style={{ left: x - (isMajor ? 3 : 2), top: y - (isMajor ? 3 : 2) }}
                        />
                      );
                    })}

                    {/* إبرة القبلة */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
                      style={{ transform: `rotate(${needleAngle}deg)` }}
                    >
                      {/* الإبرة */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* الجزء العلوي (نحو القبلة) */}
                        <div
                          className="absolute"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "8px solid transparent",
                            borderRight: "8px solid transparent",
                            borderBottom: "90px solid #F59E0B",
                            top: "32px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            filter: "drop-shadow(0 0 8px rgba(245,158,11,0.8))",
                          }}
                        />
                        {/* الجزء السفلي */}
                        <div
                          className="absolute"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "8px solid transparent",
                            borderRight: "8px solid transparent",
                            borderTop: "90px solid rgba(255,255,255,0.2)",
                            bottom: "32px",
                            left: "50%",
                            transform: "translateX(-50%)",
                          }}
                        />
                        {/* المركز */}
                        <div className="absolute w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/50 z-10" />
                      </div>
                    </div>

                    {/* أيقونة الكعبة في المركز */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-emerald-900/80 border border-amber-400/30 flex items-center justify-center text-xl z-20">
                        🕋
                      </div>
                    </div>
                  </div>

                  {/* معلومات الزاوية */}
                  <div className="text-center">
                    <div className="text-amber-400 text-5xl font-black mb-1" dir="ltr">
                      {Math.round(qiblaAngle)}°
                    </div>
                    <div className="text-white/70 text-sm mb-4">من الشمال باتجاه عقارب الساعة</div>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2 text-center">
                        <div className="text-amber-400 font-bold text-lg">{Math.round(qiblaAngle)}°</div>
                        <div className="text-white/50 text-xs">اتجاه القبلة</div>
                      </div>
                      <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                        <div className="text-white font-bold text-lg">{Math.round(compassHeading)}°</div>
                        <div className="text-white/50 text-xs">اتجاه الجهاز</div>
                      </div>
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 text-center">
                        <div className="text-emerald-400 font-bold text-lg">{Math.round(needleAngle + 360) % 360}°</div>
                        <div className="text-white/50 text-xs">الإبرة</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* تعليمات الاستخدام */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" /> كيفية الاستخدام
                  </h3>
                  <ul className="space-y-2 text-white/60 text-xs leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">①</span> أمسك هاتفك بشكل أفقي موازياً للأرض</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">②</span> دوّر نفسك حتى تشير الإبرة الذهبية للأعلى</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">③</span> الاتجاه الذي تشير إليه الإبرة هو اتجاه القبلة</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">④</span> ابتعد عن المعادن والأجهزة الكهربائية لدقة أعلى</li>
                  </ul>
                </div>

                {/* آية كريمة */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
                  <div className="text-3xl mb-3">🕌</div>
                  <p className="text-white/85 text-sm leading-loose font-medium">
                    «فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ»
                  </p>
                  <p className="text-white/40 text-xs mt-2">سورة البقرة - آية 144</p>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
