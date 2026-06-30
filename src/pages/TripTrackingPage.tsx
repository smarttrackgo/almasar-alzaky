import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Navigation, Clock, Users, Phone,
  RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff,
  ChevronRight, Gauge, Maximize2, Minimize2, Share2, Timer,
  Bell, BellOff, Volume2, VolumeX, Smartphone
} from "lucide-react";
import { usePushNotifications } from "../lib/usePushNotifications";
import PushNotificationPrompt from "../components/PushNotificationPrompt";
import { bearingBetweenPoints, createBusMarkerIcon } from "../lib/trackingMapIcons";

// ══════════════════════════════════════════════════════════════════
// 🔔 نظام الإشعارات الصوتية — Web Audio API (بدون ملفات خارجية)
// ══════════════════════════════════════════════════════════════════

type SoundType = "location_update" | "trip_started" | "driver_assigned" | "arrived" | "ping";

function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

// توليد نغمة بسيطة باستخدام Web Audio API
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  delay = 0
): void {
  const oscillator = ctx.createOscillator();
  const gainNode   = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type      = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration + 0.05);
}

// مكتبة الأصوات
function playSoundEffect(ctx: AudioContext, type: SoundType): void {
  switch (type) {
    // نبضة خفيفة عند تحديث الموقع (كل 30 ثانية)
    case "location_update":
      playTone(ctx, 880, 0.08, "sine", 0.15);
      break;

    // نغمة انطلاق الرحلة — صاعدة احتفالية
    case "trip_started":
      playTone(ctx, 523, 0.15, "sine", 0.4, 0.00);
      playTone(ctx, 659, 0.15, "sine", 0.4, 0.15);
      playTone(ctx, 784, 0.15, "sine", 0.4, 0.30);
      playTone(ctx, 1047, 0.30, "sine", 0.5, 0.45);
      break;

    // نغمة تعيين السائق — نبضتان
    case "driver_assigned":
      playTone(ctx, 660, 0.12, "sine", 0.35, 0.00);
      playTone(ctx, 880, 0.20, "sine", 0.35, 0.18);
      break;

    // نغمة الوصول — هادئة ومريحة
    case "arrived":
      playTone(ctx, 784, 0.20, "sine", 0.4, 0.00);
      playTone(ctx, 659, 0.20, "sine", 0.4, 0.22);
      playTone(ctx, 523, 0.35, "sine", 0.5, 0.44);
      break;

    // نبضة تنبيه عامة
    case "ping":
      playTone(ctx, 1000, 0.10, "sine", 0.25, 0.00);
      playTone(ctx, 1200, 0.10, "sine", 0.20, 0.12);
      break;
  }
}

// ── Hook مخصص لإدارة الصوت ──
function useSoundNotifications() {
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("sound_notifications") !== "false"; } catch { return true; }
  });

  const getCtx = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    // استئناف السياق إذا كان معلقاً (متطلب المتصفح)
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    try { playSoundEffect(ctx, type); } catch { /* نتجاهل أخطاء الصوت */ }
  }, [enabled, getCtx]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("sound_notifications", String(next)); } catch {}
      return next;
    });
  }, []);

  // تنظيف عند إغلاق المكوّن
  useEffect(() => {
    return () => { audioCtxRef.current?.close().catch(() => {}); };
  }, []);

  return { play, enabled, toggle };
}

// ── حساب المسافة بين نقطتين (Haversine) بالكيلومتر ──
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

// ── تحديد الوجهة التالية بناءً على حالة الرحلة ──
function getNextDestination(status: string): { name: string; coords: [number, number] } | null {
  if (status === "driver_assigned" || status === "driver_accepted" || status === "in_progress") {
    return { name: "مكة المكرمة", coords: MECCA_COORDS };
  }
  return null;
}

// ── حساب ETA ──
function calcETA(
  lat: number, lng: number,
  destLat: number, destLng: number,
  speedKmh: number
): { distanceKm: number; etaMinutes: number; etaTime: string } | null {
  if (speedKmh < 2) return null; // الحافلة واقفة
  const dist = haversineKm(lat, lng, destLat, destLng);
  const hours = dist / speedKmh;
  const minutes = Math.round(hours * 60);
  const arrival = new Date(Date.now() + hours * 3600 * 1000);
  const etaTime = arrival.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  return { distanceKm: Math.round(dist * 10) / 10, etaMinutes: minutes, etaTime };
}

// ── تنسيق الوقت المتبقي ──
function formatMinutes(min: number): string {
  if (min < 60) return `${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`;
}

// إصلاح أيقونات Leaflet الافتراضية
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// أيقونة الحافلة المخصصة
// أيقونة نقطة المسار
const waypointIcon = (done: boolean, active: boolean) => L.divIcon({
  className: "",
  html: `<div style="
    width:${active ? 36 : 28}px;height:${active ? 36 : 28}px;border-radius:50%;
    background:${done ? "#059669" : active ? "#f59e0b" : "#d1d5db"};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    border:2px solid white;
  ">
    <svg width="${active ? 18 : 14}" height="${active ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [active ? 36 : 28, active ? 36 : 28],
  iconAnchor: [active ? 18 : 14, active ? 18 : 14],
});

// نقاط المسار الثابتة (مكة والمدينة)
const MECCA_COORDS: [number, number] = [21.3891, 39.8579];
const MADINAH_COORDS: [number, number] = [24.5247, 39.5692];

// خريطة ألوان الحافلة
const BUS_COLOR_MAP: Record<string, string> = {
  white:   "#ffffff",
  silver:  "#c0c0c0",
  black:   "#1a1a1a",
  blue:    "#3b82f6",
  red:     "#ef4444",
  green:   "#22c55e",
  yellow:  "#eab308",
  orange:  "#f97316",
  gray:    "#6b7280",
  beige:   "#d4b896",
};
const BUS_COLOR_LABELS: Record<string, string> = {
  white:   "أبيض",
  silver:  "فضي",
  black:   "أسود",
  blue:    "أزرق",
  red:     "أحمر",
  green:   "أخضر",
  yellow:  "أصفر",
  orange:  "برتقالي",
  gray:    "رمادي",
  beige:   "بيج",
};

interface Props {
  navigate: (p: Page) => void;
  tripId?: string;
}

export default function TripTrackingPage({ navigate, tripId }: Props) {
  // للمعتمر: رحلته النشطة الكاملة (مع بيانات السائق)
  const myTrip = useQuery(api.trips.myActiveTripFull);
  // للمكتب: رحلة محددة بالـ ID
  const specificTrip = useQuery(
    api.trips.getById,
    tripId ? { tripId: tripId as Id<"trips"> } : "skip"
  );

  const trip = tripId ? specificTrip : myTrip;
  const isOfficeView = !!tripId;

  if (trip === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <MapPin className="w-12 h-12 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">لا توجد رحلة نشطة</h2>
          <p className="text-gray-400 text-sm mb-6">
            سيظهر هنا موقع رحلتك على الخريطة عند انطلاقها
          </p>
          <button
            onClick={() => navigate({ name: "bookings" })}
            className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg"
          >
            عرض حجوزاتي
          </button>
        </div>
      </div>
    );
  }

  return isOfficeView
    ? <OfficeTripView trip={trip} navigate={navigate} />
    : <PassengerTripView trip={trip} navigate={navigate} />;
}

// ─── مكوّن الخريطة المشترك ────────────────────────────────────────
function TripMap({
  lat, lng, speed, lastUpdate, isLive, expanded, onToggleExpand, showETA = false
}: {
  lat?: number; lng?: number; speed?: number;
  lastUpdate?: number | null; isLive: boolean;
  expanded: boolean; onToggleExpand: () => void;
  showETA?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const busMarker = useRef<L.Marker | null>(null);
  const meccaMarker = useRef<L.Marker | null>(null);
  const madinahMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const lastBusPosition = useRef<[number, number] | null>(null);
  const busHeading = useRef(0);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: lat && lng ? [lat, lng] : MECCA_COORDS,
      zoom: lat && lng ? 13 : 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // إضافة نقاط مكة والمدينة
    meccaMarker.current = L.marker(MECCA_COORDS, { icon: waypointIcon(true, false) })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="font-family:sans-serif;font-weight:bold;color:#059669">🕋 مكة المكرمة</div>`);

    madinahMarker.current = L.marker(MADINAH_COORDS, { icon: waypointIcon(false, false) })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="font-family:sans-serif;font-weight:bold;color:#7c3aed">🕌 المدينة المنورة</div>`);

    // خط المسار بين مكة والمدينة
    routeLine.current = L.polyline([MECCA_COORDS, MADINAH_COORDS], {
      color: "#059669",
      weight: 3,
      opacity: 0.4,
      dashArray: "8, 8",
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
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
        .addTo(leafletMap.current)
        .bindPopup(`<div dir="rtl" style="font-family:sans-serif">
          <strong style="color:#059669">🚌 الحافلة</strong><br/>
          ${speed ? `السرعة: ${Math.round(speed)} كم/س` : ""}
        </div>`);
    }

    // تحريك الخريطة لتتبع الحافلة
    leafletMap.current.panTo(pos, { animate: true, duration: 1 });
  }, [lat, lng, speed, isLive]);

  // إعادة ضبط حجم الخريطة عند التوسيع
  useEffect(() => {
    setTimeout(() => leafletMap.current?.invalidateSize(), 300);
  }, [expanded]);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 ${expanded ? "h-[70vh]" : "h-64"}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* شريط المعلومات العلوي */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-[1000] pointer-events-none">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg pointer-events-auto ${isLive ? "bg-green-500 text-white" : "bg-gray-700/80 text-gray-200"}`}>
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

      {/* ── ETA على الخريطة (للمكتب فقط) ── */}
      {showETA && lat && lng && speed && speed > 2 && (() => {
        const dest = getNextDestination("in_progress");
        if (!dest) return null;
        const eta = calcETA(lat, lng, dest.coords[0], dest.coords[1], speed);
        if (!eta) return null;
        return (
          <div className="absolute top-14 right-3 z-[1000] bg-blue-600/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg text-white">
            <p className="text-[10px] text-blue-200 font-medium">وقت الوصول لـ{dest.name}</p>
            <p className="text-sm font-black">{eta.etaTime} — {formatMinutes(eta.etaMinutes)}</p>
            <p className="text-[10px] text-blue-200">{eta.distanceKm} كم متبقية</p>
          </div>
        );
      })()}

      {/* معلومات السرعة */}
      {speed !== undefined && speed > 0 && (
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

      {/* رسالة عدم وجود موقع */}
      {(!lat || !lng) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[999]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">في انتظار بيانات الموقع...</p>
            <p className="text-xs text-gray-400 mt-1">ستظهر الحافلة على الخريطة عند انطلاق الرحلة</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── واجهة المعتمر — مثل أوبر وكريم ────────────────────────────
function PassengerTripView({ trip, navigate }: { trip: any; navigate: (p: Page) => void }) {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // ── نظام الإشعارات الصوتية ──
  const { play, enabled: soundEnabled, toggle: toggleSound } = useSoundNotifications();

  // ── نظام الإشعارات المنبثقة ──
  const {
    isGranted: pushGranted,
    isDefault: pushDefault,
    showPrompt: showPushPrompt,
    notify: pushNotify,
    requestPermission: requestPush,
    promptForPermission,
    dismissPrompt: dismissPushPrompt,
  } = usePushNotifications();

  // تتبع التغييرات لإطلاق الأصوات المناسبة
  const prevStatusRef      = useRef<string | null>(null);
  const prevLocationRef    = useRef<number | null>(null);
  const locationSoundTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInteracted      = useRef(false); // المتصفح يتطلب تفاعل المستخدم أولاً

  // ── تفعيل AudioContext + طلب إذن الإشعارات عند أول تفاعل ──
  useEffect(() => {
    const activate = () => {
      hasInteracted.current = true;
      // اقترح الإشعارات المنبثقة بعد 3 ثوانٍ من أول تفاعل
      setTimeout(() => promptForPermission(), 3000);
    };
    window.addEventListener("click",      activate, { once: true });
    window.addEventListener("touchstart", activate, { once: true });
    return () => {
      window.removeEventListener("click",      activate);
      window.removeEventListener("touchstart", activate);
    };
  }, [promptForPermission]);

  // ── مراقبة تغيير حالة الرحلة ──
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = trip.status;
    if (prev === null) { prevStatusRef.current = curr; return; }
    if (prev === curr)  return;

    prevStatusRef.current = curr;

    if (!hasInteracted.current) return;

    if (curr === "driver_assigned") {
      play("driver_assigned");
      toast.info("🚌 تم تعيين سائقك!", {
        description: "ستجد بيانات السائق والحافلة أدناه",
        duration: 5000,
      });
      pushNotify({
        type:               "driver_assigned",
        body:               "تم تعيين سائق لرحلتك — اضغط لعرض بيانات السائق",
        url:                "/?page=trip-tracking",
        requireInteraction: true,
      });
    } else if (curr === "driver_accepted") {
      play("driver_assigned");
      toast.success("✅ السائق قبل الرحلة!", {
        description: "السائق في الطريق إليك",
        duration: 5000,
      });
      pushNotify({
        type: "driver_accepted",
        body: "السائق قبل الرحلة وسينطلق في الموعد المحدد",
        url:  "/?page=trip-tracking",
      });
    } else if (curr === "in_progress") {
      play("trip_started");
      toast.success("🚀 انطلقت رحلتك!", {
        description: "يمكنك الآن متابعة موقع الحافلة مباشرة",
        duration: 6000,
      });
      pushNotify({
        type:               "trip_started",
        body:               "رحلتك انطلقت! اضغط لمتابعة موقع الحافلة مباشرة",
        url:                "/?page=trip-tracking",
        requireInteraction: true,
      });
    } else if (curr === "completed") {
      play("arrived");
      toast.success("🏁 وصلتم بسلامة!", {
        description: "تقبّل الله منكم صالح الأعمال 🤲",
        duration: 8000,
      });
      pushNotify({
        type:               "trip_completed",
        body:               "وصلتم بسلامة! تقبّل الله منكم صالح الأعمال",
        url:                "/?page=bookings",
        requireInteraction: true,
      });
    }
  }, [trip.status, play, pushNotify]);

  // ── مراقبة تحديثات الموقع (صوت خفيف كل 30 ثانية) ──
  useEffect(() => {
    const lastUpdate = trip.lastLocationUpdate;
    if (!lastUpdate) return;
    if (prevLocationRef.current === lastUpdate) return;

    const isFirstUpdate = prevLocationRef.current === null;
    prevLocationRef.current = lastUpdate;

    if (!hasInteracted.current || isFirstUpdate) return;

    // صوت خفيف عند تحديث الموقع
    if (trip.status === "in_progress") {
      play("location_update");
    }
  }, [trip.lastLocationUpdate, trip.status, play]);

  // ── نبضة دورية كل 30 ثانية عند الرحلة النشطة ──
  useEffect(() => {
    if (locationSoundTimer.current) clearInterval(locationSoundTimer.current);

    if (trip.status === "in_progress" && soundEnabled) {
      locationSoundTimer.current = setInterval(() => {
        if (hasInteracted.current && trip.lastLocationUpdate) {
          const age = Date.now() - trip.lastLocationUpdate;
          // فقط إذا كان الموقع محدثاً (أقل من دقيقة)
          if (age < 60_000) play("ping");
        }
      }, 30_000);
    }

    return () => {
      if (locationSoundTimer.current) clearInterval(locationSoundTimer.current);
    };
  }, [trip.status, soundEnabled, play, trip.lastLocationUpdate]);

  const lastUpdate = trip.lastLocationUpdate ?? null;
  const secondsAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : null;
  const isLive = secondsAgo !== null && secondsAgo < 60;

  // مؤقت حي
  useEffect(() => {
    const t = setInterval(() => setLiveSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const driver      = trip.driver; // بيانات السائق من جدول drivers
  const driverName  = driver?.name        ?? trip.bus?.driverName  ?? "—";
  const driverPhone = driver?.phone       ?? trip.bus?.driverPhone ?? "—";
  const driverImage = driver?.profileImageUrl ?? null;
  const plateNumber = driver?.plateNumber ?? trip.bus?.plateNumber ?? "—";
  const busType     = driver?.busType     ?? trip.bus?.busType     ?? "حافلة";

  const STATUS_INFO: Record<string, { label: string; color: string; icon: string; desc: string }> = {
    scheduled:       { label: "الرحلة مجدولة",       color: "bg-gray-500",   icon: "📅", desc: "سيتم تعيين السائق قريباً من قِبل المكتب" },
    driver_assigned: { label: "تم تعيين السائق",     color: "bg-amber-500",  icon: "🚌", desc: "السائق تلقّى طلب الرحلة وسيؤكد قريباً" },
    driver_accepted: { label: "السائق في الطريق",    color: "bg-blue-500",   icon: "🛣️", desc: "السائق قبل الرحلة وسينطلق في الموعد المحدد" },
    in_progress:     { label: "الرحلة جارية",         color: "bg-green-500",  icon: "🚀", desc: "رحلتك جارية — يمكنك متابعة الموقع مباشرة" },
    completed:       { label: "وصلتم بسلامة",         color: "bg-emerald-600", icon: "✅", desc: "تقبّل الله منكم صالح الأعمال 🤲" },
  };
  const statusInfo = STATUS_INFO[trip.status] ?? { label: trip.status, color: "bg-gray-500", icon: "📍", desc: "" };

  const WAYPOINTS = [
    { name: "نقطة الانطلاق", icon: "🏠", done: true },
    { name: "مكة المكرمة",   icon: "🕋", done: ["in_progress", "completed"].includes(trip.status) },
    { name: "المدينة المنورة", icon: "🕌", done: trip.status === "completed" },
    { name: "العودة",         icon: "🏡", done: trip.status === "completed" },
  ];

  const shareLocation = () => {
    if (trip.currentLat && trip.currentLng) {
      const url = `https://www.google.com/maps?q=${trip.currentLat},${trip.currentLng}`;
      if (navigator.share) {
        navigator.share({ title: "موقع الحافلة", url });
      } else {
        navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط الموقع");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── نافذة طلب إذن الإشعارات المنبثقة ── */}
      {showPushPrompt && (
        <PushNotificationPrompt
          onAllow={async () => {
            dismissPushPrompt();
            const granted = await requestPush();
            if (granted) {
              toast.success("✅ تم تفعيل الإشعارات!", {
                description: "ستصلك إشعارات فورية عند كل تحديث مهم",
                duration: 4000,
              });
              // إشعار ترحيبي تجريبي
              setTimeout(() => {
                pushNotify({
                  type:  "general",
                  title: "🔔 الإشعارات مفعّلة!",
                  body:  "ستصلك إشعارات فورية عند تعيين السائق وانطلاق الرحلة",
                  url:   "/?page=trip-tracking",
                });
              }, 1000);
            } else {
              toast.error("لم يتم منح الإذن — يمكنك تفعيله من إعدادات المتصفح");
            }
          }}
          onDismiss={dismissPushPrompt}
        />
      )}

      {/* ── Header ── */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate({ name: "bookings" })} className="flex items-center gap-1 text-emerald-200 text-sm mb-3 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" /> العودة للحجوزات
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">{trip.package?.title ?? "رحلتي"}</h1>
              <p className="text-emerald-200 text-sm mt-0.5">{trip.office?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* ── زر تفعيل/إيقاف الصوت ── */}
              <button
                onClick={() => {
                  hasInteracted.current = true;
                  toggleSound();
                  toast(soundEnabled ? "🔇 تم إيقاف الإشعارات الصوتية" : "🔔 تم تفعيل الإشعارات الصوتية", {
                    duration: 2000,
                  });
                }}
                title={soundEnabled ? "إيقاف الصوت" : "تفعيل الصوت"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  soundEnabled
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/50"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30"
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* ── مؤشر الاتصال المباشر ── */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isLive ? "bg-green-500/30 text-green-200 border border-green-400/30" : "bg-gray-500/20 text-gray-300"}`}>
                {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isLive ? "مباشر" : "غير متصل"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── شريط الحالة (مثل أوبر) ── */}
        <div className={`${statusInfo.color} rounded-2xl p-4 text-white shadow-lg`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{statusInfo.icon}</span>
            <div className="flex-1">
              <p className="font-black text-lg">{statusInfo.label}</p>
              <p className="text-white/80 text-sm">{statusInfo.desc}</p>
            </div>
          </div>
          {/* معلومات الرحلة الأساسية */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-4 text-xs text-white/70">
            <span>📦 {trip.package?.title ?? "رحلة العمرة"}</span>
            {trip.departureDate && <span>📅 {trip.departureDate}</span>}
          </div>
        </div>

        {/* ── بطاقة الإشعارات الصوتية ── */}
        <div className={`rounded-2xl p-4 border transition-all duration-300 ${
          soundEnabled
            ? "bg-emerald-50 border-emerald-200"
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                soundEnabled ? "bg-emerald-600 text-white shadow-md" : "bg-gray-200 text-gray-400"
              }`}>
                {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${soundEnabled ? "text-emerald-800" : "text-gray-500"}`}>
                  الإشعارات الصوتية
                </p>
                <p className={`text-xs mt-0.5 ${soundEnabled ? "text-emerald-600" : "text-gray-400"}`}>
                  {soundEnabled
                    ? "ستسمع صوتاً عند كل تحديث مهم للرحلة"
                    : "اضغط لتفعيل الإشعارات الصوتية"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* زر اختبار الصوت */}
              {soundEnabled && (
                <button
                  onClick={() => {
                    hasInteracted.current = true;
                    play("ping");
                    toast("🔔 اختبار الصوت", { duration: 1500 });
                  }}
                  className="text-xs text-emerald-600 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full font-semibold transition-colors"
                >
                  اختبار
                </button>
              )}
              {/* مفتاح التبديل */}
              <button
                onClick={() => {
                  hasInteracted.current = true;
                  toggleSound();
                }}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                  soundEnabled ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  soundEnabled ? "right-0.5" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>

          {/* أنواع الأصوات */}
          {soundEnabled && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "تعيين السائق",  sound: "driver_assigned" as SoundType, icon: "🚌" },
                { label: "انطلاق الرحلة", sound: "trip_started"    as SoundType, icon: "🚀" },
                { label: "تحديث الموقع",  sound: "location_update" as SoundType, icon: "📍" },
                { label: "الوصول",         sound: "arrived"         as SoundType, icon: "🏁" },
              ].map((item) => (
                <button
                  key={item.sound}
                  onClick={() => { hasInteracted.current = true; play(item.sound); }}
                  className="flex items-center gap-2 bg-white/70 hover:bg-white rounded-xl px-3 py-2 text-xs text-emerald-700 font-medium transition-colors border border-emerald-100 hover:border-emerald-300 hover:shadow-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <Volume2 className="w-3 h-3 ms-auto text-emerald-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── بطاقة الإشعارات المنبثقة ── */}
        <div className={`rounded-2xl p-4 border transition-all duration-300 ${
          pushGranted
            ? "bg-blue-50 border-blue-200"
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                pushGranted ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-400"
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-bold text-sm ${pushGranted ? "text-blue-800" : "text-gray-500"}`}>
                  إشعارات الجوال
                </p>
                <p className={`text-xs mt-0.5 ${pushGranted ? "text-blue-600" : "text-gray-400"}`}>
                  {pushGranted
                    ? "ستصلك إشعارات حتى لو أغلقت التطبيق"
                    : "اضغط لتفعيل الإشعارات على جوالك"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pushGranted ? (
                <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full font-bold border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  مفعّل
                </span>
              ) : (
                <button
                  onClick={async () => {
                    hasInteracted.current = true;
                    const granted = await requestPush();
                    if (granted) {
                      toast.success("✅ تم تفعيل الإشعارات!");
                      pushNotify({
                        type:  "general",
                        title: "🔔 الإشعارات مفعّلة!",
                        body:  "ستصلك إشعارات فورية عند كل تحديث مهم لرحلتك",
                        url:   "/?page=trip-tracking",
                      });
                    } else {
                      toast.error("لم يتم منح الإذن — فعّله من إعدادات المتصفح");
                    }
                  }}
                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  تفعيل
                </button>
              )}
            </div>
          </div>

          {/* معلومات إضافية عند التفعيل */}
          {pushGranted && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { icon: "🚌", text: "تعيين السائق" },
                { icon: "🚀", text: "انطلاق الرحلة" },
                { icon: "🏁", text: "الوصول" },
                { icon: "✅", text: "تأكيد الحجز" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-xs text-blue-700 font-medium border border-blue-100">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── بطاقة السائق الكاملة — تظهر دائماً ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* رأس البطاقة */}
          <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              بيانات السائق والحافلة
            </h3>
            {trip.currentLat && trip.currentLng && (
              <button
                onClick={shareLocation}
                className="flex items-center gap-1.5 text-xs text-emerald-100 hover:text-white transition-colors bg-white/10 px-2.5 py-1 rounded-full"
              >
                <Share2 className="w-3 h-3" />
                مشاركة الموقع
              </button>
            )}
          </div>

          <div className="p-4">
            {/* ── حالة: لا يوجد سائق بعد ── */}
            {!driver ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
                    <Users className="w-8 h-8 text-gray-300" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600 text-sm">في انتظار تعيين السائق</p>
                    <p className="text-xs text-gray-400 mt-0.5">سيظهر هنا اسم السائق وبيانات الحافلة فور تعيينه من المكتب</p>
                  </div>
                </div>
                {/* نبضة انتظار */}
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">ستصلك إشعار فور تعيين السائق — لا حاجة لتحديث الصفحة</p>
                </div>
              </div>
            ) : (
              <>
                {/* الصورة + الاسم + الاتصال */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    {driverImage ? (
                      <img src={driverImage} alt={driverName} className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow-md" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
                        <Users className="w-10 h-10 text-emerald-500" />
                      </div>
                    )}
                    {/* مؤشر الحالة المباشر */}
                    <div className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-2 border-white ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-lg leading-tight">{driverName}</p>
                    {driver.transportCompanyName && (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">🚌 {driver.transportCompanyName}</p>
                    )}
                    {driver.driverCode && (
                      <span className="inline-block mt-1 text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        #{driver.driverCode}
                      </span>
                    )}
                  </div>
                  {driverPhone && driverPhone !== "—" && (
                    <a href={`tel:${driverPhone}`} className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">اتصال</span>
                    </a>
                  )}
                </div>

                {/* تفاصيل السائق — شبكة */}
                <div className="grid grid-cols-2 gap-2">

                  {/* رقم الجوال */}
                  {driver.phone && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base mt-0.5">📱</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">رقم الجوال</p>
                        <p className="text-sm font-black text-gray-700 truncate" dir="ltr">{driver.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* الجنسية */}
                  {driver.nationality && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base mt-0.5">🌍</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">الجنسية</p>
                        <p className="text-sm font-black text-gray-700 truncate">{driver.nationality}</p>
                      </div>
                    </div>
                  )}

                  {/* رقم اللوحة */}
                  {driver.plateNumber && (
                    <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2 border border-amber-100">
                      <span className="text-base mt-0.5">🚗</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-amber-600 font-medium mb-0.5">رقم اللوحة</p>
                        <p className="text-sm font-black text-amber-800 font-mono truncate">{driver.plateNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* لون الباص */}
                  {driver.busColor && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base mt-0.5">🎨</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">لون الحافلة</p>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: BUS_COLOR_MAP[driver.busColor] ?? "#888" }}
                          />
                          <p className="text-sm font-black text-gray-700 truncate">
                            {BUS_COLOR_LABELS[driver.busColor] ?? driver.busColor}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* نوع الحافلة */}
                  {driver.busType && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base mt-0.5">🚌</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">نوع الحافلة</p>
                        <p className="text-sm font-black text-gray-700 truncate">{driver.busType}</p>
                      </div>
                    </div>
                  )}

                  {/* عدد المقاعد */}
                  {driver.busCapacity && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base mt-0.5">💺</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">عدد المقاعد</p>
                        <p className="text-sm font-black text-gray-700">{driver.busCapacity} مقعد</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── بطاقة ETA للمعتمر (وقت الوصول المتوقع فقط — بدون السرعة) ── */}
        {trip.currentLat && trip.currentLng && trip.currentSpeed && trip.status === "in_progress" && (() => {
          const dest = getNextDestination(trip.status);
          if (!dest) return null;
          const eta = calcETA(trip.currentLat, trip.currentLng, dest.coords[0], dest.coords[1], trip.currentSpeed);
          if (!eta) return null;
          return (
            <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-base">وقت الوصول المتوقع</p>
                  <p className="text-emerald-200 text-xs">إلى {dest.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{eta.etaTime}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">وقت الوصول</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{formatMinutes(eta.etaMinutes)}</p>
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
        <TripMap
          lat={trip.currentLat}
          lng={trip.currentLng}
          speed={trip.currentSpeed}
          lastUpdate={lastUpdate}
          isLive={isLive}
          expanded={mapExpanded}
          onToggleExpand={() => setMapExpanded(v => !v)}
          showETA={false}
        />

        {/* ── معلومات الرحلة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            تفاصيل الرحلة
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "تاريخ الانطلاق", value: trip.departureDate, icon: "📅" },
              { label: "المكتب",          value: trip.office?.name ?? "—", icon: "🏢" },
              { label: "آخر تحديث",       value: lastUpdate ? new Date(lastUpdate).toLocaleTimeString("ar-SA") : "—", icon: "🕐" },
              { label: "حالة الرحلة",     value: trip.status === "in_progress" ? "جارية الآن" : trip.status === "driver_accepted" ? "السائق في الطريق" : "—", icon: "📍" },
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
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base shadow-sm ${wp.done ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>
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

        {/* ── تواصل مع المكتب ── */}
        {trip.office?.phone && (
          <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="font-bold text-white text-sm">تواصل مع المكتب</p>
              <p className="text-emerald-200 text-xs mt-0.5">{trip.office.phone}</p>
            </div>
            <a
              href={`tel:${trip.office.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition-colors shadow"
            >
              <Phone className="w-4 h-4" />
              اتصال
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── واجهة المكتب / المشرف ───────────────────────────────────────
// ✅ تعرض موقع السائق من قاعدة البيانات مباشرة (Convex reactive)
// ❌ لا تستخدم navigator.geolocation — البث يكون فقط من السائق
function OfficeTripView({ trip, navigate }: { trip: any; navigate: (p: Page) => void }) {
  const updateStatus = useMutation(api.trips.updateStatus);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // ── موقع السائق يأتي من Convex مباشرة (reactive — يتحدث تلقائياً) ──
  const driverLat   = trip.currentLat   ?? undefined;
  const driverLng   = trip.currentLng   ?? undefined;
  const driverSpeed = trip.currentSpeed ?? undefined;
  const lastUpdate  = trip.lastLocationUpdate ?? null;

  const secondsAgo = lastUpdate
    ? Math.floor((Date.now() - lastUpdate) / 1000)
    : null;
  const isLive = secondsAgo !== null && secondsAgo < 60;

  // مؤقت لتحديث "منذ X ثانية" كل ثانية
  useEffect(() => {
    const t = setInterval(() => setLiveSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ tripId: trip._id, status });
      toast.success("تم تحديث حالة الرحلة");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    scheduled:   { label: "مجدولة",    cls: "bg-amber-100 text-amber-700" },
    in_progress: { label: "جارية",     cls: "bg-blue-100 text-blue-700" },
    completed:   { label: "مكتملة",    cls: "bg-emerald-100 text-emerald-700" },
    cancelled:   { label: "ملغاة",     cls: "bg-red-100 text-red-600" },
  };
  const st = STATUS_MAP[trip.status] ?? { label: trip.status, cls: "bg-gray-100 text-gray-600" };

  const driver = trip.driver;
  const driverName  = driver?.name  ?? "—";
  const driverPhone = driver?.phone ?? null;
  const driverImage = driver?.profileImageUrl ?? null;
  const plateNumber = driver?.plateNumber ?? trip.bus?.plateNumber ?? "—";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 to-blue-700 text-white px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate({ name: "office-dashboard" })} className="flex items-center gap-1 text-blue-200 text-sm mb-3 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" /> لوحة التحكم
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">{trip.package?.title ?? "رحلة"}</h1>
              <p className="text-blue-200 text-sm mt-0.5">متابعة الرحلة المباشرة</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isLive ? "bg-green-500/30 text-green-200 border border-green-400/30" : "bg-gray-500/20 text-gray-300"}`}>
                {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isLive ? "مباشر" : "غير متصل"}
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── بطاقة السائق ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            السائق المعيّن
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {driverImage ? (
                <img src={driverImage} alt={driverName} className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                  <Users className="w-7 h-7 text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-800">{driverName}</p>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                🚌 {plateNumber}
              </span>
            </div>
            {driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="flex-shrink-0 w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* ── بطاقة ETA + السرعة للمكتب (معلومات تشغيلية كاملة) ── */}
        {driverLat && driverLng && trip.status === "in_progress" && (() => {
          const dest = getNextDestination(trip.status);
          const eta = dest && driverSpeed
            ? calcETA(driverLat, driverLng, dest.coords[0], dest.coords[1], driverSpeed)
            : null;
          return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-l from-blue-700 to-blue-600 px-4 py-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  لوحة التتبع التشغيلي
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* السرعة الحالية */}
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-black text-blue-800">
                      {driverSpeed ? Math.round(driverSpeed) : "—"}
                    </p>
                    <p className="text-[10px] text-blue-500 font-medium">كم/ساعة</p>
                  </div>
                  {/* المسافة المتبقية */}
                  <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                    <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xl font-black text-emerald-800">
                      {eta ? eta.distanceKm : dest ? Math.round(haversineKm(driverLat, driverLng, dest.coords[0], dest.coords[1]) * 10) / 10 : "—"}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-medium">كيلومتر</p>
                  </div>
                  {/* وقت الوصول */}
                  <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                    <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg font-black text-amber-800">
                      {eta ? eta.etaTime : "—"}
                    </p>
                    <p className="text-[10px] text-amber-500 font-medium">وقت الوصول</p>
                  </div>
                </div>
                {eta && (
                  <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-xl p-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-blue-200" />
                      <span className="text-sm font-bold">الوقت المتبقي للوصول</span>
                    </div>
                    <span className="text-lg font-black">{formatMinutes(eta.etaMinutes)}</span>
                  </div>
                )}
                {!eta && driverSpeed !== undefined && driverSpeed < 2 && (
                  <div className="bg-amber-50 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2 border border-amber-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>الحافلة متوقفة حالياً — سيُحسب ETA عند الانطلاق</span>
                  </div>
                )}
                {dest && (
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    📍 الوجهة التالية: {dest.name} — يتحدث تلقائياً مع كل تحديث للموقع
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── الخريطة — تعرض موقع السائق من Convex مباشرة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              موقع السائق المباشر
            </h3>
            {/* مؤشر حالة الاتصال */}
            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
              isLive
                ? "bg-green-100 text-green-700"
                : driverLat
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : driverLat ? "bg-amber-400" : "bg-gray-300"}`} />
              {isLive
                ? `مباشر — منذ ${secondsAgo}ث`
                : driverLat
                  ? lastUpdate ? `آخر تحديث: ${new Date(lastUpdate).toLocaleTimeString("ar-SA")}` : "موقع محفوظ"
                  : "في انتظار السائق"
              }
            </div>
          </div>
          <div className="p-3">
            <TripMap
              lat={driverLat}
              lng={driverLng}
              speed={driverSpeed}
              lastUpdate={lastUpdate}
              isLive={isLive}
              expanded={mapExpanded}
              onToggleExpand={() => setMapExpanded(v => !v)}
              showETA={true}
            />
          </div>

          {/* إحداثيات السائق */}
          {driverLat && driverLng && (
            <div className="px-4 pb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2 border border-blue-100">
                <MapPin className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="font-mono text-xs">
                  {driverLat.toFixed(6)}°N &nbsp;|&nbsp; {driverLng.toFixed(6)}°E
                </span>
                {driverSpeed !== undefined && driverSpeed > 0 && (
                  <span className="mr-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    {Math.round(driverSpeed)} كم/س
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                📡 الموقع يُحدَّث تلقائياً من جهاز السائق — لا حاجة لتحديث الصفحة
              </p>
            </div>
          )}

          {/* رسالة عدم وجود موقع */}
          {!driverLat && (
            <div className="px-4 pb-4">
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>السائق لم يبدأ بث موقعه بعد — سيظهر الموقع تلقائياً عند انطلاق الرحلة</span>
              </div>
            </div>
          )}
        </div>

        {/* ── تحديث حالة الرحلة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            تحديث حالة الرحلة
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { status: "scheduled",   label: "مجدولة",  cls: "border-amber-300 text-amber-700 hover:bg-amber-50" },
              { status: "in_progress", label: "انطلقت",  cls: "border-blue-300 text-blue-700 hover:bg-blue-50" },
              { status: "completed",   label: "اكتملت",  cls: "border-emerald-300 text-emerald-700 hover:bg-emerald-50" },
              { status: "cancelled",   label: "ألغِيت",  cls: "border-red-300 text-red-600 hover:bg-red-50" },
            ].map(({ status, label, cls }) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={trip.status === status}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls} ${trip.status === status ? "ring-2 ring-offset-1 ring-current" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── قائمة المسافرين ── */}
        {trip.passengers && trip.passengers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              المسافرون ({trip.passengers.length})
            </h3>
            <div className="space-y-2">
              {trip.passengers.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {(p.leadPassengerName ?? "م").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.leadPassengerName}</p>
                      <p className="text-xs text-gray-400">{p.leadPassengerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{p.adultsCount} بالغ</span>
                    <a href={`tel:${p.leadPassengerPhone}`} className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
