import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Clock, Bus, Navigation, Gauge,
  Maximize2, Minimize2, Wifi, WifiOff, Users,
  CheckCircle, ChevronRight, Timer,
} from "lucide-react";
import { bearingBetweenPoints, createBusMarkerIcon } from "../lib/trackingMapIcons";

// ── حساب المسافة (Haversine) ──
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcETA(lat: number, lng: number, destLat: number, destLng: number, speedKmh: number) {
  if (speedKmh < 2) return null;
  const dist = haversineKm(lat, lng, destLat, destLng);
  const hours = dist / speedKmh;
  const minutes = Math.round(hours * 60);
  const arrival = new Date(Date.now() + hours * 3600 * 1000);
  const etaTime = arrival.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  return { distanceKm: Math.round(dist * 10) / 10, etaMinutes: minutes, etaTime };
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`;
}

const MECCA_COORDS_PUB: [number, number] = [21.3891, 39.8579];

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

// ── إصلاح أيقونات Leaflet ──
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── أيقونة الحافلة ──
const waypointIcon = (done: boolean) => L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:${done ? "#059669" : "#d1d5db"};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const MECCA_COORDS:   [number, number] = [21.3891, 39.8579];
const MADINAH_COORDS: [number, number] = [24.5247, 39.5692];

const BUS_COLOR_MAP: Record<string, string> = {
  white: "#ffffff", silver: "#c0c0c0", black: "#1a1a1a",
  blue: "#3b82f6", red: "#ef4444", green: "#22c55e",
  yellow: "#eab308", orange: "#f97316", gray: "#6b7280", beige: "#d4b896",
};
const BUS_COLOR_LABELS: Record<string, string> = {
  white: "أبيض", silver: "فضي", black: "أسود",
  blue: "أزرق", red: "أحمر", green: "أخضر",
  yellow: "أصفر", orange: "برتقالي", gray: "رمادي", beige: "بيج",
};

interface Props {
  shareToken: string;
  navigate: (p: Page) => void;
}

export default function PublicTripTrackingPage({ shareToken, navigate }: Props) {
  const trip = useQuery(api.trips.getByShareToken, { shareToken });

  if (trip === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-emerald-300 text-sm">جارٍ تحميل بيانات الرحلة...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <MapPin className="w-12 h-12 text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">رابط التتبع غير صالح</h2>
          <p className="text-gray-400 text-sm mb-6">
            هذا الرابط منتهي الصلاحية أو غير صحيح. تواصل مع المكتب للحصول على رابط جديد.
          </p>
          <button
            onClick={() => navigate({ name: "home" })}
            className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg"
          >
            الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <TripView trip={trip} navigate={navigate} />;
}

// ── واجهة التتبع الكاملة ──
function TripView({ trip, navigate }: { trip: any; navigate: (p: Page) => void }) {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [, setTick] = useState(0);

  // تحديث كل ثانية لعرض "منذ X ثانية"
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const lastUpdate  = trip.lastLocationUpdate ?? null;
  const secondsAgo  = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : null;
  const isLive      = secondsAgo !== null && secondsAgo < 60;

  const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
    driver_assigned: {
      label: "تم تعيين السائق",
      color: "text-amber-700", bg: "bg-amber-50 border-amber-200",
      icon: "🚌", desc: "السائق تلقّى طلب الرحلة وسيؤكد قريباً",
    },
    driver_accepted: {
      label: "السائق في الطريق",
      color: "text-blue-700", bg: "bg-blue-50 border-blue-200",
      icon: "🛣️", desc: "السائق قبل الرحلة وسينطلق في الموعد المحدد",
    },
    in_progress: {
      label: "الرحلة جارية الآن",
      color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",
      icon: "🚀", desc: "يمكنك متابعة موقع الحافلة على الخريطة مباشرة",
    },
    completed: {
      label: "وصلوا بسلامة",
      color: "text-gray-700", bg: "bg-gray-50 border-gray-200",
      icon: "✅", desc: "تقبّل الله منهم صالح الأعمال 🤲",
    },
  };
  const statusInfo = STATUS_INFO[trip.status] ?? {
    label: trip.status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200",
    icon: "📍", desc: "",
  };

  const WAYPOINTS = [
    { name: "نقطة الانطلاق",   icon: "🏠", done: true },
    { name: "مكة المكرمة",     icon: "🕋", done: ["in_progress", "completed"].includes(trip.status) },
    { name: "المدينة المنورة", icon: "🕌", done: trip.status === "completed" },
    { name: "العودة",           icon: "🏡", done: trip.status === "completed" },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 text-white px-4 pt-6 pb-5">
        <div className="max-w-2xl mx-auto">
          {/* شعار + زر الرئيسية */}
          <div className="flex items-center justify-between mb-4">
            <img
              src={LOGO}
              alt="المسار الذكي"
              className="h-9 w-auto object-contain"
              style={{ mixBlendMode: "screen" }}
            />
            <button
              onClick={() => navigate({ name: "home" })}
              className="flex items-center gap-1 text-emerald-200 text-xs hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              الرئيسية
            </button>
          </div>

          {/* عنوان الرحلة */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black leading-tight">
                {trip.package?.title ?? "رحلة عمرة"}
              </h1>
              <p className="text-emerald-200 text-sm mt-0.5">
                {trip.office?.name ?? ""}
                {trip.office?.city ? ` — ${trip.office.city}` : ""}
              </p>
            </div>
            {/* مؤشر البث المباشر */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
              isLive
                ? "bg-green-500/30 text-green-200 border border-green-400/30"
                : "bg-gray-500/20 text-gray-300"
            }`}>
              {isLive
                ? <><Wifi className="w-3.5 h-3.5" />مباشر</>
                : <><WifiOff className="w-3.5 h-3.5" />غير متصل</>
              }
            </div>
          </div>

          {/* شريط الحالة */}
          <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl border ${statusInfo.bg}`}>
            <span className="text-2xl">{statusInfo.icon}</span>
            <div>
              <p className={`font-black text-base ${statusInfo.color}`}>{statusInfo.label}</p>
              {statusInfo.desc && (
                <p className="text-xs text-gray-500 mt-0.5">{statusInfo.desc}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── بطاقة ETA للعائلة (وقت الوصول فقط — بدون السرعة) ── */}
        {trip.currentLat && trip.currentLng && trip.currentSpeed && trip.status === "in_progress" && (() => {
          const eta = calcETA(trip.currentLat, trip.currentLng, MECCA_COORDS_PUB[0], MECCA_COORDS_PUB[1], trip.currentSpeed);
          if (!eta) return null;
          return (
            <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-base">وقت الوصول المتوقع</p>
                  <p className="text-emerald-200 text-xs">إلى مكة المكرمة 🕋</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{eta.etaTime}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">وقت الوصول</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{formatMinutes(eta.etaMinutes)}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">الوقت المتبقي</p>
                </div>
              </div>
              <p className="text-[10px] text-emerald-300 mt-2 text-center">
                📍 المسافة المتبقية: {eta.distanceKm} كم — يتحدث تلقائياً
              </p>
            </div>
          );
        })()}

        {/* ── الخريطة التفاعلية ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              موقع الحافلة المباشر
            </h3>
            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
              isLive
                ? "bg-green-100 text-green-700"
                : trip.currentLat
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isLive ? "bg-green-500 animate-pulse" : trip.currentLat ? "bg-amber-400" : "bg-gray-300"
              }`} />
              {isLive
                ? `مباشر — منذ ${secondsAgo}ث`
                : trip.currentLat
                  ? lastUpdate
                    ? `آخر تحديث: ${new Date(lastUpdate).toLocaleTimeString("ar-SA")}`
                    : "موقع محفوظ"
                  : "في انتظار الانطلاق"
              }
            </div>
          </div>
          <div className="p-3">
            <PublicMap
              lat={trip.currentLat}
              lng={trip.currentLng}
              speed={trip.currentSpeed}
              lastUpdate={lastUpdate}
              isLive={isLive}
              expanded={mapExpanded}
              onToggleExpand={() => setMapExpanded(v => !v)}
            />
          </div>
          {trip.currentLat && trip.currentLng && (
            <div className="px-4 pb-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2 border border-emerald-100">
                <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span className="font-mono text-xs">
                  {trip.currentLat.toFixed(6)}°N &nbsp;|&nbsp; {trip.currentLng.toFixed(6)}°E
                </span>
                {trip.currentSpeed !== undefined && trip.currentSpeed > 0 && (
                  <span className="mr-auto text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                    {Math.round(trip.currentSpeed)} كم/س
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                📡 الموقع يُحدَّث تلقائياً من جهاز السائق — لا حاجة لتحديث الصفحة
              </p>
            </div>
          )}
          {!trip.currentLat && (
            <div className="px-4 pb-4">
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2 border border-amber-100">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>سيظهر موقع الحافلة تلقائياً عند انطلاق الرحلة</span>
              </div>
            </div>
          )}
        </div>

        {/* ── بطاقة السائق والحافلة ── */}
        {trip.driver && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 px-4 py-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Bus className="w-4 h-4" />
                بيانات السائق والحافلة
              </h3>
            </div>
            <div className="p-4">
              {/* الصورة + الاسم */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  {trip.driver.profileImageUrl ? (
                    <img
                      src={trip.driver.profileImageUrl}
                      alt={trip.driver.name}
                      className="w-18 h-18 w-[72px] h-[72px] rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
                    />
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
                      <Users className="w-9 h-9 text-emerald-500" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-2 border-white ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-lg leading-tight">{trip.driver.name}</p>
                  {trip.driver.transportCompanyName && (
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      🚌 {trip.driver.transportCompanyName}
                    </p>
                  )}
                  {trip.driver.driverCode && (
                    <span className="inline-block mt-1 text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      #{trip.driver.driverCode}
                    </span>
                  )}
                </div>
              </div>

              {/* تفاصيل الحافلة */}
              <div className="grid grid-cols-2 gap-2">
                {trip.driver.nationality && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-base mt-0.5">🌍</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">الجنسية</p>
                      <p className="text-sm font-black text-gray-700 truncate">{trip.driver.nationality}</p>
                    </div>
                  </div>
                )}
                {trip.driver.plateNumber && (
                  <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2 border border-amber-100">
                    <span className="text-base mt-0.5">🚗</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-600 font-medium mb-0.5">رقم اللوحة</p>
                      <p className="text-sm font-black text-amber-800 font-mono truncate">{trip.driver.plateNumber}</p>
                    </div>
                  </div>
                )}
                {trip.driver.busColor && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-base mt-0.5">🎨</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">لون الحافلة</p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: BUS_COLOR_MAP[trip.driver.busColor] ?? "#888" }}
                        />
                        <p className="text-sm font-black text-gray-700 truncate">
                          {BUS_COLOR_LABELS[trip.driver.busColor] ?? trip.driver.busColor}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {trip.driver.busType && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-base mt-0.5">🚌</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">نوع الحافلة</p>
                      <p className="text-sm font-black text-gray-700 truncate">{trip.driver.busType}</p>
                    </div>
                  </div>
                )}
                {trip.driver.busCapacity && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-base mt-0.5">💺</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">عدد المقاعد</p>
                      <p className="text-sm font-black text-gray-700">{trip.driver.busCapacity} مقعد</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── تفاصيل الرحلة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            تفاصيل الرحلة
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "تاريخ الانطلاق", value: trip.departureDate ?? trip.package?.departureDate ?? "—", icon: "📅" },
              { label: "المكتب",          value: trip.office?.name ?? "—",                                  icon: "🏢" },
              { label: "المدة",           value: trip.package?.duration ? `${trip.package.duration} يوم` : "—", icon: "⏱️" },
              { label: "آخر تحديث",       value: lastUpdate ? new Date(lastUpdate).toLocaleTimeString("ar-SA") : "—", icon: "🕐" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{item.icon} {item.label}</p>
                <p className="text-sm font-black text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── مسار الرحلة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-600" />
            مسار الرحلة
          </h3>
          <div className="space-y-0">
            {WAYPOINTS.map((wp, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base shadow-sm ${
                    wp.done ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {wp.done ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm">{wp.icon}</span>}
                  </div>
                  {i < WAYPOINTS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${wp.done ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pt-2 pb-4">
                  <p className={`text-sm font-semibold ${wp.done ? "text-emerald-700" : "text-gray-400"}`}>
                    {wp.icon} {wp.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── تذييل المنصة ── */}
        <div className="text-center py-4 pb-8">
          <button onClick={() => navigate({ name: "home" })} className="inline-flex flex-col items-center gap-2">
            <img
              src={LOGO}
              alt="المسار الذكي"
              className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
              style={{ mixBlendMode: "multiply" }}
            />
            <p className="text-xs text-gray-400">منصة المسار الذكي للعمرة</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── مكوّن الخريطة ──
function PublicMap({
  lat, lng, speed, lastUpdate, isLive, expanded, onToggleExpand,
}: {
  lat?: number | null; lng?: number | null; speed?: number | null;
  lastUpdate?: number | null; isLive: boolean;
  expanded: boolean; onToggleExpand: () => void;
}) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<L.Map | null>(null);
  const busMarker   = useRef<L.Marker | null>(null);
  const lastBusPosition = useRef<[number, number] | null>(null);
  const busHeading = useRef(0);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: lat && lng ? [lat, lng] : MECCA_COORDS,
      zoom:   lat && lng ? 13 : 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    // نقاط مكة والمدينة
    L.marker(MECCA_COORDS, { icon: waypointIcon(true) })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="font-family:sans-serif;font-weight:bold;color:#059669">🕋 مكة المكرمة</div>`);

    L.marker(MADINAH_COORDS, { icon: waypointIcon(false) })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="font-family:sans-serif;font-weight:bold;color:#7c3aed">🕌 المدينة المنورة</div>`);

    // خط المسار
    L.polyline([MECCA_COORDS, MADINAH_COORDS], {
      color: "#059669", weight: 3, opacity: 0.4, dashArray: "8, 8",
    }).addTo(map);

    leafletMap.current = map;
    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  // تحديث موقع الحافلة
  useEffect(() => {
    if (!leafletMap.current || !lat || !lng) return;
    const pos: [number, number] = [lat, lng];
    const previous = lastBusPosition.current;
    if (previous && haversineKm(previous[0], previous[1], lat, lng) > 0.015) {
      busHeading.current = bearingBetweenPoints(previous[0], previous[1], lat, lng);
    }
    lastBusPosition.current = pos;
    const markerIcon = createBusMarkerIcon({ isLive, speed, heading: busHeading.current });
    if (busMarker.current) {
      busMarker.current.setLatLng(pos);
      busMarker.current.setIcon(markerIcon);
    } else {
      busMarker.current = L.marker(pos, { icon: markerIcon, zIndexOffset: 1000 })
        .addTo(leafletMap.current!)
        .bindPopup(`<div dir="rtl" style="font-family:sans-serif">
          <strong style="color:#059669">🚌 الحافلة</strong>
          ${speed ? `<br/>السرعة: ${Math.round(speed)} كم/س` : ""}
        </div>`);
    }
    leafletMap.current.panTo(pos, { animate: true, duration: 1 });
  }, [lat, lng, speed, isLive]);

  // إعادة ضبط الحجم عند التوسيع
  useEffect(() => {
    setTimeout(() => leafletMap.current?.invalidateSize(), 300);
  }, [expanded]);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 ${expanded ? "h-[70vh]" : "h-64"}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* شريط المعلومات */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-[1000] pointer-events-none">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg pointer-events-auto ${
          isLive ? "bg-green-500 text-white" : "bg-gray-700/80 text-gray-200"
        }`}>
          <div className={`w-2 h-2 rounded-full ${isLive ? "bg-white animate-pulse" : "bg-gray-400"}`} />
          {isLive ? "مباشر" : "غير متصل"}
        </div>
        <button
          onClick={onToggleExpand}
          className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors pointer-events-auto"
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* السرعة */}
      {speed !== undefined && speed !== null && speed > 0 && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-gray-800">{Math.round(speed)} كم/س</span>
        </div>
      )}

      {/* آخر تحديث */}
      {lastUpdate && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{new Date(lastUpdate).toLocaleTimeString("ar-SA")}</span>
        </div>
      )}

      {/* لا يوجد موقع */}
      {(!lat || !lng) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[999]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">في انتظار انطلاق الرحلة...</p>
            <p className="text-xs text-gray-400 mt-1">ستظهر الحافلة على الخريطة تلقائياً</p>
          </div>
        </div>
      )}
    </div>
  );
}
