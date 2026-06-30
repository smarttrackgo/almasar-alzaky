import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import {
  MapPin, Bus, Users, Phone,
  CheckCircle, Play, Square, Upload, User, Building2,
  RefreshCw, Wifi, WifiOff, AlertCircle,
  FileText, Camera, CreditCard, Shield, Globe,
  Package, Calendar, QrCode, Printer, X, LogOut, Truck,
  ScanLine, UserCheck,
} from "lucide-react";
import QRCode from "qrcode";
import AttendanceScanner from "../components/AttendanceScanner";
import { printHtml } from "../lib/printDocument";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

const BUS_COLORS = [
  { value: "white",  label: "أبيض",    hex: "#ffffff" },
  { value: "silver", label: "فضي",     hex: "#c0c0c0" },
  { value: "gray",   label: "رمادي",   hex: "#6b7280" },
  { value: "black",  label: "أسود",    hex: "#1f2937" },
  { value: "blue",   label: "أزرق",    hex: "#3b82f6" },
  { value: "red",    label: "أحمر",    hex: "#ef4444" },
  { value: "green",  label: "أخضر",    hex: "#22c55e" },
  { value: "yellow", label: "أصفر",    hex: "#eab308" },
  { value: "orange", label: "برتقالي", hex: "#f97316" },
];

const BUS_TYPES = ["ميني باص", "باص متوسط", "باص كبير", "حافلة VIP", "سيارة خاصة"];

const NATIONALITIES = [
  "سعودي", "مصري", "يمني", "سوداني", "باكستاني", "هندي", "بنغلاديشي",
  "إندونيسي", "فلبيني", "سوري", "أردني", "فلسطيني", "عراقي", "مغربي", "تونسي",
];

type Tab = "home" | "trips" | "profile" | "bus";

export default function DriverDashboard({ navigate }: { navigate: (p: Page) => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const driver = useQuery(api.drivers.getMyDriver);
  const trips  = useQuery(api.drivers.getAllMyTrips);
  const { signOut } = useAuthActions();
  const [signingOut, setSigningOut] = useState(false);
  // ── حالة لوحة الحضور — مرفوعة للمستوى الأعلى لتكون متاحة من أي تبويب ──
  const [attendanceTrip, setAttendanceTrip] = useState<any | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
      setSigningOut(false);
    }
  };

  if (driver === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-emerald-300 text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  const allTrips       = (trips ?? []);
  const activeTrips    = allTrips.filter((t: any) => t.status === "in_progress");
  const pendingTrips   = allTrips.filter((t: any) => t.status === "driver_assigned");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* ── Header ── */}
      <header className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <img src={LOGO} alt="المسار الذكي" className="h-9 w-auto" style={{ mixBlendMode: "screen" }} />
            <div className="flex items-center gap-3">
              {/* حالة الرحلة */}
              <div className="flex items-center gap-1.5">
                {pendingTrips.length > 0 ? (
                  <div className="flex items-center gap-1.5 bg-amber-500/30 border border-amber-400/40 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs text-amber-200 font-bold">{pendingTrips.length} طلب جديد</span>
                  </div>
                ) : (
                  <>
                    <div className={`w-2 h-2 rounded-full ${activeTrips.length > 0 ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-xs text-emerald-200">
                      {activeTrips.length > 0 ? "في رحلة" : "متاح"}
                    </span>
                  </>
                )}
              </div>
              {/* زر تسجيل الخروج */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/80 border border-white/20 hover:border-red-400 text-white text-xs font-bold transition-all duration-200 disabled:opacity-50"
                title="تسجيل الخروج"
              >
                {signingOut
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">
                  {signingOut ? "جارٍ الخروج..." : "خروج"}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(driver as any)?.profileImageUrl ? (
              <img
                src={(driver as any).profileImageUrl}
                alt={(driver as any).name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{(driver as any)?.name ?? "السائق"}</h1>
              <p className="text-emerald-200 text-xs">
                {(driver as any)?.office ? `مكتب ${(driver as any).office.name}` : "لم يتم ربط مكتب بعد"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {tab === "home"    && <HomeTab driver={driver} onOpenAttendance={setAttendanceTrip} />}
        {tab === "trips"   && <TripsTab trips={trips ?? []} onOpenAttendance={setAttendanceTrip} />}
        {tab === "profile" && <ProfileTab driver={driver} />}
        {tab === "bus"     && <BusTab driver={driver} />}
      </main>

      {/* ── لوحة تسجيل الحضور — مستوى عالٍ فوق كل شيء ── */}
      {attendanceTrip && (
        <AttendanceScanner
          trip={attendanceTrip}
          onClose={() => setAttendanceTrip(null)}
        />
      )}

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-2 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {([
            { id: "home"    as Tab, icon: MapPin,  label: "الرئيسية" },
            { id: "trips"   as Tab, icon: Bus,     label: "رحلاتي" },
            { id: "bus"     as Tab, icon: Package, label: "حافلتي" },
            { id: "profile" as Tab, icon: User,    label: "ملفي" },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-all relative ${
                tab === item.id ? "text-emerald-700" : "text-gray-400"
              }`}
            >
              <item.icon className={`w-5 h-5 ${tab === item.id ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-semibold">{item.label}</span>
              {tab === item.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// تبويب الرئيسية — نظام كامل مثل أوبر
// ══════════════════════════════════════════════════════
function HomeTab({ driver, onOpenAttendance }: { driver: any; onOpenAttendance: (trip: any) => void }) {
  const trips = useQuery(api.drivers.getAllMyTrips) ?? [];
  const respondToTrip = useMutation(api.trips.driverRespondToTrip);
  const startTrip     = useMutation(api.trips.driverStartTrip);
  const updateLoc     = useMutation(api.trips.driverUpdateLocation);
  const endTrip       = useMutation(api.trips.driverEndTrip);

  const [activeTracking, setActiveTracking] = useState<string | null>(null);
  const [respondingId,   setRespondingId]   = useState<string | null>(null);
  const watchRef    = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── تتبع مستمر في الخلفية ──
  const startTracking = useCallback((tripId: Id<"trips">) => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setActiveTracking(tripId);

    // طلب إذن الموقع أولاً
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateLoc({
            tripId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ?? undefined,
            heading: pos.coords.heading ?? undefined,
          });
        } catch {}

        // تتبع مستمر كل 5 ثوانٍ
        watchRef.current = navigator.geolocation.watchPosition(
          async (p) => {
            try {
              await updateLoc({
                tripId,
                lat: p.coords.latitude,
                lng: p.coords.longitude,
                speed: p.coords.speed ?? undefined,
                heading: p.coords.heading ?? undefined,
              });
            } catch {}
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      },
      (err) => {
        toast.error("تعذّر الحصول على الموقع: " + err.message);
        setActiveTracking(null);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [updateLoc]);

  const stopTracking = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveTracking(null);
  }, []);

  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  // ── قبول الرحلة ──
  const handleAccept = async (tripId: Id<"trips">) => {
    setRespondingId(tripId);
    try {
      await respondToTrip({ tripId, accept: true });
      toast.success("✅ تم قبول الرحلة! ستُبلَّغ عند موعد الانطلاق.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setRespondingId(null);
    }
  };

  // ── رفض الرحلة ──
  const handleReject = async (tripId: Id<"trips">) => {
    setRespondingId(tripId);
    try {
      await respondToTrip({ tripId, accept: false });
      toast.success("تم رفض الرحلة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setRespondingId(null);
    }
  };

  // ── بدء الرحلة مع تفعيل التتبع ──
  const handleStartTrip = async (tripId: Id<"trips">) => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await startTrip({
            tripId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          toast.success("🚌 انطلقت الرحلة! التتبع نشط الآن.");
          startTracking(tripId);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "حدث خطأ");
        }
      },
      () => toast.error("تعذّر الحصول على موقعك"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── إنهاء الرحلة ──
  const handleEndTrip = async (tripId: Id<"trips">) => {
    try {
      await endTrip({ tripId });
      stopTracking();
      toast.success("🏁 تم إنهاء الرحلة بنجاح! تقبّل الله منكم.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const pendingTrips   = trips.filter((t: any) => t.status === "driver_assigned");
  const acceptedTrips  = trips.filter((t: any) => t.status === "driver_accepted");
  const activeTrips    = trips.filter((t: any) => t.status === "in_progress");
  const scheduledTrips = trips.filter((t: any) => t.status === "scheduled");

  const profileComplete = driver?.name && driver?.phone && driver?.officeId;

  return (
    <div className="space-y-4">
      {/* تنبيه إكمال الملف */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">أكمل ملفك الشخصي</p>
            <p className="text-amber-700 text-xs mt-0.5">أضف بيانات ملفك الشخصي واختر المكتب التابع له لتظهر لك الرحلات.</p>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "طلبات",    value: pendingTrips.length,   color: "text-amber-600",   bg: "bg-amber-50" },
          { label: "مقبولة",   value: acceptedTrips.length,  color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "جارية",    value: activeTrips.length,    color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "مجدولة",   value: scheduledTrips.length, color: "text-gray-600",    bg: "bg-gray-50" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── طلبات الرحلات الجديدة (تحتاج قبول/رفض) ── */}
      {pendingTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            طلبات رحلات جديدة
          </h2>
          {pendingTrips.map((trip: any) => (
            <PendingTripCard
              key={trip._id}
              trip={trip}
              loading={respondingId === trip._id}
              onAccept={() => handleAccept(trip._id)}
              onReject={() => handleReject(trip._id)}
            />
          ))}
        </div>
      )}

      {/* ── الرحلة الجارية (تتبع نشط) ── */}
      {activeTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            الرحلة الجارية
          </h2>
          {activeTrips.map((trip: any) => (
            <ActiveTripCard
              key={trip._id}
              trip={trip}
              isTracking={activeTracking === trip._id}
              onStartTracking={() => startTracking(trip._id)}
              onStopTracking={stopTracking}
              onEnd={() => handleEndTrip(trip._id)}
              onAttendance={() => onOpenAttendance(trip)}
            />
          ))}
        </div>
      )}

      {/* ── الرحلات المقبولة (في انتظار الانطلاق) ── */}
      {acceptedTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            رحلات مقبولة — في انتظار الانطلاق
          </h2>
          {acceptedTrips.map((trip: any) => (
            <AcceptedTripCard
              key={trip._id}
              trip={trip}
              onStart={() => handleStartTrip(trip._id)}
              onAttendance={() => onOpenAttendance(trip)}
            />
          ))}
        </div>
      )}

      {/* ── الرحلات المجدولة ── */}
      {scheduledTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            رحلات مجدولة
          </h2>
          {scheduledTrips.map((trip: any) => (
            <ScheduledTripCard key={trip._id} trip={trip} />
          ))}
        </div>
      )}

      {/* لا توجد رحلات */}
      {trips.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bus className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-400 mb-1">لا توجد رحلات حالياً</h3>
          <p className="text-sm text-gray-300">ستظهر هنا رحلاتك عند تعيينها من المكتب</p>
        </div>
      )}

    </div>
  );
}

// ── بطاقة طلب رحلة جديد (قبول/رفض) ──
function PendingTripCard({ trip, loading, onAccept, onReject }: {
  trip: any; loading: boolean;
  onAccept: () => void; onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 mb-3 shadow-sm">
      {/* شارة جديد */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">🔔 طلب جديد</span>
          </div>
          <h3 className="font-black text-gray-800">{trip.package?.title ?? "رحلة عمرة"}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{trip.office?.name}</p>
        </div>
        <div className="text-3xl">🚌</div>
      </div>

      {/* تفاصيل الرحلة */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: "📅", label: "تاريخ الانطلاق", value: trip.departureDate },
          { icon: "👥", label: "عدد الركاب",     value: `${trip.passengerCount ?? 0} راكب` },
          { icon: "🏢", label: "المكتب",          value: trip.office?.name ?? "—" },
          { icon: "📍", label: "المدينة",         value: trip.office?.city ?? "—" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">{item.icon} {item.label}</p>
            <p className="text-xs font-black text-gray-700">{item.value}</p>
          </div>
        ))}
      </div>

      {/* قائمة الركاب */}
      {trip.passengers && trip.passengers.length > 0 && (
        <div className="bg-white rounded-xl p-3 mb-4">
          <p className="text-xs font-black text-gray-600 mb-2">👥 الركاب:</p>
          <div className="space-y-1.5">
            {trip.passengers.slice(0, 3).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-semibold">{p.leadPassengerName}</span>
                <a href={`tel:${p.leadPassengerPhone}`} className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />{p.leadPassengerPhone}
                </a>
              </div>
            ))}
            {trip.passengers.length > 3 && (
              <p className="text-xs text-gray-400">+{trip.passengers.length - 3} آخرين</p>
            )}
          </div>
        </div>
      )}

      {/* أزرار القبول/الرفض */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onReject}
          disabled={loading}
          className="py-3 rounded-xl border-2 border-red-300 text-red-600 font-black text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Square className="w-4 h-4" />
          رفض
        </button>
        <button
          onClick={onAccept}
          disabled={loading}
          className="py-3 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          قبول الرحلة
        </button>
      </div>
    </div>
  );
}

// ── بطاقة رحلة مقبولة (في انتظار الانطلاق) ──
function AcceptedTripCard({ trip, onStart, onAttendance }: {
  trip: any; onStart: () => void; onAttendance: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white mb-1 inline-block">✅ مقبولة</span>
          <h3 className="font-black text-gray-800">{trip.package?.title ?? "رحلة"}</h3>
          <p className="text-xs text-gray-500">{trip.office?.name} • {trip.passengerCount} راكب</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">تاريخ الانطلاق</p>
          <p className="text-sm font-black text-blue-700">{trip.departureDate}</p>
        </div>
      </div>

      {/* قائمة الركاب */}
      {trip.passengers && trip.passengers.length > 0 && (
        <div className="bg-white rounded-xl p-3 mb-3">
          <p className="text-xs font-black text-gray-600 mb-2">👥 الركاب ({trip.passengers.length}):</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {trip.passengers.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-semibold">{p.leadPassengerName}</span>
                <a href={`tel:${p.leadPassengerPhone}`} className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />{p.leadPassengerPhone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* زر مسح الحضور */}
      <button
        onClick={onAttendance}
        className="w-full py-3 rounded-xl bg-gradient-to-l from-blue-700 to-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:from-blue-800 hover:to-blue-700 transition-all mb-2"
      >
        <ScanLine className="w-5 h-5" />
        مسح تذاكر الركاب — تسجيل الحضور
      </button>

      <button
        onClick={onStart}
        className="w-full py-3.5 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:from-emerald-800 hover:to-emerald-700 transition-all"
      >
        <Play className="w-4 h-4" />
        انطلق الآن — تفعيل التتبع
      </button>
    </div>
  );
}

// ── بطاقة الرحلة الجارية (تتبع نشط) ──
function ActiveTripCard({ trip, isTracking, onStartTracking, onStopTracking, onEnd, onAttendance }: {
  trip: any; isTracking: boolean;
  onStartTracking: () => void; onStopTracking: () => void; onEnd: () => void;
  onAttendance: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = trip.trackingStartedAt ?? Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [trip.trackingStartedAt]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 mb-3 shadow-md">
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black text-green-700">رحلة جارية</span>
          </div>
          <h3 className="font-black text-gray-800">{trip.package?.title ?? "رحلة"}</h3>
          <p className="text-xs text-gray-500">{trip.office?.name}</p>
        </div>
        {/* مؤقت الرحلة */}
        <div className="bg-emerald-700 text-white rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] opacity-75">مدة الرحلة</p>
          <p className="text-sm font-black font-mono">{formatTime(elapsed)}</p>
        </div>
      </div>

      {/* حالة التتبع */}
      <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 border-2 transition-all ${
        isTracking ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
      }`}>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        <div className="flex-1">
          <p className={`text-sm font-black ${isTracking ? "text-green-700" : "text-gray-500"}`}>
            {isTracking ? "📡 التتبع نشط — يُرسَل موقعك للركاب" : "التتبع متوقف"}
          </p>
          {trip.lastLocationUpdate && (
            <p className="text-xs text-gray-400 mt-0.5">
              آخر تحديث: {new Date(trip.lastLocationUpdate).toLocaleTimeString("ar-SA")}
            </p>
          )}
        </div>
        <button
          onClick={isTracking ? onStopTracking : onStartTracking}
          className={`px-3 py-2 rounded-xl font-bold text-xs transition-colors ${
            isTracking ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isTracking ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        </button>
      </div>

      {/* قائمة الركاب */}
      {trip.passengers && trip.passengers.length > 0 && (
        <div className="bg-white rounded-xl p-3 mb-4">
          <p className="text-xs font-black text-gray-600 mb-2">👥 الركاب ({trip.passengers.length}):</p>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {trip.passengers.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-semibold">{p.leadPassengerName}</span>
                <a href={`tel:${p.leadPassengerPhone}`} className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />{p.leadPassengerPhone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── زر تسجيل الحضور ── */}
      <button
        onClick={onAttendance}
        className="w-full py-3.5 rounded-xl bg-gradient-to-l from-blue-700 to-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all mb-3"
      >
        <ScanLine className="w-5 h-5" />
        مسح تذاكر الركاب — تسجيل الحضور
      </button>

      {/* زر إنهاء الرحلة */}
      <button
        onClick={onEnd}
        className="w-full py-3.5 rounded-xl bg-gradient-to-l from-red-600 to-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:from-red-700 hover:to-red-600 transition-all"
      >
        <Square className="w-4 h-4" />
        إنهاء الرحلة
      </button>
    </div>
  );
}

// ── بطاقة رحلة مجدولة ──
function ScheduledTripCard({ trip }: { trip: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">{trip.package?.title ?? "رحلة"}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{trip.office?.name} • {trip.passengerCount ?? 0} راكب</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">مجدولة</span>
          <p className="text-xs text-gray-400 mt-1">{trip.departureDate}</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// تبويب الرحلات
// ══════════════════════════════════════════════════════
function TripsTab({ trips, onOpenAttendance }: { trips: any[]; onOpenAttendance: (trip: any) => void }) {
  const STATUS: Record<string, { label: string; cls: string }> = {
    scheduled:       { label: "مجدولة",   cls: "bg-blue-100 text-blue-700" },
    driver_assigned: { label: "بانتظار قبولك", cls: "bg-amber-100 text-amber-700" },
    driver_accepted: { label: "مقبولة",   cls: "bg-indigo-100 text-indigo-700" },
    in_progress:     { label: "جارية",    cls: "bg-emerald-100 text-emerald-700" },
    completed:       { label: "مكتملة",   cls: "bg-gray-100 text-gray-600" },
    cancelled:       { label: "ملغاة",    cls: "bg-red-100 text-red-600" },
  };

  const canScanAttendance = (status: string) =>
    ["driver_accepted", "in_progress"].includes(status);

  return (
    <div className="space-y-3">
      <h2 className="font-black text-gray-800 text-lg">جميع رحلاتي</h2>
      {trips.length === 0 ? (
        <div className="text-center py-16">
          <Bus className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">لا توجد رحلات</p>
        </div>
      ) : (
        trips.map((trip: any) => {
          const st = STATUS[trip.status] ?? { label: trip.status, cls: "bg-gray-100 text-gray-600" };
          return (
            <div key={trip._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{trip.package?.title ?? "رحلة"}</h3>
                  <p className="text-xs text-gray-500">{trip.office?.name}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.departureDate}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{trip.passengerCount} راكب</span>
              </div>
              {/* زر مسح الحضور للرحلات النشطة */}
              {canScanAttendance(trip.status) && (
                <button
                  onClick={() => onOpenAttendance(trip)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-l from-blue-700 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:from-blue-800 hover:to-blue-700 transition-all"
                >
                  <ScanLine className="w-4 h-4" />
                  مسح تذاكر الركاب — تسجيل الحضور
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// تبويب الملف الشخصي
// ══════════════════════════════════════════════════════
function ProfileTab({ driver }: { driver: any }) {
  const updateProfile = useMutation(api.drivers.updateProfile);
  const genUploadUrl  = useMutation(api.drivers.generateProfileImageUploadUrl);
  const saveImage     = useMutation(api.drivers.saveProfileImage);
  const offices       = useQuery(api.drivers.listOffices);

  const [editing, setEditing]   = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [form, setForm] = useState({
    name:             driver?.name             ?? "",
    phone:            driver?.phone            ?? "",
    nationality:      driver?.nationality      ?? "",
    residenceType:    driver?.residenceType    ?? "citizen",
    idNumber:         driver?.idNumber         ?? "",
    officeId:         driver?.officeId         ?? "",
    licenseExpiry:    driver?.licenseExpiry    ?? "",
    licenseStatus:    driver?.licenseStatus    ?? "valid",
    driverStatus:     driver?.driverStatus     ?? "active",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name:          form.name          || undefined,
        phone:         form.phone         || undefined,
        nationality:   form.nationality   || undefined,
        residenceType: form.residenceType || undefined,
        idNumber:      form.idNumber      || undefined,
        officeId:      form.officeId      ? (form.officeId as Id<"offices">) : undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        licenseStatus: form.licenseStatus || undefined,
        driverStatus:  form.driverStatus  || undefined,
      });
      toast.success("✅ تم حفظ البيانات");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await genUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      await saveImage({ storageId });
      toast.success("✅ تم رفع الصورة");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* نافذة QR */}
      {showQR && <DriverQRModal driver={driver} onClose={() => setShowQR(false)} />}

      {/* صورة الملف الشخصي */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3">
        <div className="relative">
          {driver?.profileImageUrl ? (
            <img
              src={driver.profileImageUrl}
              alt={driver.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-12 h-12 text-emerald-400" />
            </div>
          )}
          {/* زر الكاميرا */}
          <button
            onClick={() => imgRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors"
          >
            {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          {/* زر QR Code */}
          <button
            onClick={() => setShowQR(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg hover:bg-emerald-900 transition-colors"
            title="عرض بطاقة QR"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
        </div>
        <div className="text-center">
          <h2 className="font-black text-gray-800">{driver?.name ?? "السائق"}</h2>
          <p className="text-sm text-gray-500">{driver?.phone ?? "—"}</p>
          <span className={`mt-1 inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
            driver?.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>
            {driver?.isApproved ? "✓ معتمد" : "قيد المراجعة"}
          </span>
        </div>
        {/* زر عرض البطاقة */}
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          عرض بطاقة QR وطباعتها
        </button>
      </div>

      {/* بيانات الملف */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-800">البيانات الشخصية</h3>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              editing
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "تعديل"}
          </button>
        </div>

        <div className="space-y-3">
          <Field label="الاسم الكامل" icon={User}>
            {editing
              ? <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none" />
              : <span className="text-sm text-gray-700">{driver?.name ?? "—"}</span>
            }
          </Field>

          <Field label="رقم الجوال" icon={Phone}>
            {editing
              ? <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none" dir="ltr" />
              : <span className="text-sm text-gray-700">{driver?.phone ?? "—"}</span>
            }
          </Field>

          <Field label="الجنسية" icon={Globe}>
            {editing
              ? (
                <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="">اختر الجنسية</option>
                  {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              )
              : <span className="text-sm text-gray-700">{driver?.nationality ?? "—"}</span>
            }
          </Field>

          <Field label="نوع الإقامة" icon={Shield}>
            {editing
              ? (
                <div className="flex gap-2">
                  {[{ v: "citizen", l: "مواطن" }, { v: "resident", l: "مقيم" }].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setForm({ ...form, residenceType: opt.v })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                        form.residenceType === opt.v
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              )
              : <span className="text-sm text-gray-700">{driver?.residenceType === "citizen" ? "مواطن" : driver?.residenceType === "resident" ? "مقيم" : "—"}</span>
            }
          </Field>

          <Field label="رقم الهوية / الإقامة" icon={CreditCard}>
            {editing
              ? <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none" dir="ltr" />
              : <span className="text-sm text-gray-700">{driver?.idNumber ?? "—"}</span>
            }
          </Field>

          <Field label="المكتب التابع له" icon={Building2}>
            {editing
              ? (
                <select value={form.officeId} onChange={(e) => setForm({ ...form, officeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="">اختر المكتب</option>
                  {(offices ?? []).map((o: any) => (
                    <option key={o._id} value={o._id}>{o.name} — {o.city}</option>
                  ))}
                </select>
              )
              : <span className="text-sm text-gray-700">{driver?.office ? `${driver.office.name} — ${driver.office.city}` : "لم يتم الاختيار"}</span>
            }
          </Field>

          {/* ── تاريخ انتهاء رخصة القيادة ── */}
          <Field label="تاريخ انتهاء رخصة القيادة" icon={Calendar}>
            {editing
              ? <input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none"
                />
              : <span className={`text-sm font-semibold ${
                  driver?.licenseExpiry && new Date(driver.licenseExpiry) < new Date()
                    ? "text-red-600" : "text-gray-700"
                }`}>
                  {driver?.licenseExpiry
                    ? new Date(driver.licenseExpiry).toLocaleDateString("ar-SA")
                    : "—"}
                  {driver?.licenseExpiry && new Date(driver.licenseExpiry) < new Date() && (
                    <span className="mr-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">منتهية!</span>
                  )}
                </span>
            }
          </Field>

          {/* ── حالة الرخصة ── */}
          <Field label="حالة رخصة القيادة" icon={Shield}>
            {editing
              ? (
                <div className="flex gap-2">
                  {[
                    { v: "valid",     l: "سارية",   cls: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                    { v: "expired",   l: "منتهية",  cls: "border-red-500 bg-red-50 text-red-700" },
                    { v: "suspended", l: "موقوفة",  cls: "border-amber-500 bg-amber-50 text-amber-700" },
                  ].map((opt) => (
                    <button key={opt.v} type="button"
                      onClick={() => setForm({ ...form, licenseStatus: opt.v })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                        form.licenseStatus === opt.v ? opt.cls : "border-gray-200 text-gray-500"
                      }`}
                    >{opt.l}</button>
                  ))}
                </div>
              )
              : (
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                  driver?.licenseStatus === "valid"     ? "bg-emerald-100 text-emerald-700" :
                  driver?.licenseStatus === "expired"   ? "bg-red-100 text-red-700" :
                  driver?.licenseStatus === "suspended" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {driver?.licenseStatus === "valid"     ? "✓ سارية" :
                   driver?.licenseStatus === "expired"   ? "✗ منتهية" :
                   driver?.licenseStatus === "suspended" ? "⚠ موقوفة" : "غير محدد"}
                </span>
              )
            }
          </Field>

          {/* ── حالة السائق ── */}
          <Field label="حالة السائق" icon={CheckCircle}>
            {editing
              ? (
                <div className="flex gap-2">
                  {[
                    { v: "active",    l: "نشط",     cls: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                    { v: "inactive",  l: "غير نشط", cls: "border-gray-400 bg-gray-50 text-gray-600" },
                    { v: "suspended", l: "موقوف",   cls: "border-red-500 bg-red-50 text-red-700" },
                  ].map((opt) => (
                    <button key={opt.v} type="button"
                      onClick={() => setForm({ ...form, driverStatus: opt.v })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                        form.driverStatus === opt.v ? opt.cls : "border-gray-200 text-gray-500"
                      }`}
                    >{opt.l}</button>
                  ))}
                </div>
              )
              : (
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                  driver?.driverStatus === "active"    ? "bg-emerald-100 text-emerald-700" :
                  driver?.driverStatus === "suspended" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {driver?.driverStatus === "active"    ? "✓ نشط" :
                   driver?.driverStatus === "suspended" ? "✗ موقوف" :
                   driver?.driverStatus === "inactive"  ? "غير نشط" : "غير محدد"}
                </span>
              )
            }
          </Field>
        </div>
      </div>

      {/* رفع الملفات */}
      <FileUploadSection driver={driver} />
    </div>
  );
}

// ── رفع الملفات ──
function FileUploadSection({ driver }: { driver: any }) {
  const genUrl        = useMutation(api.drivers.generateFileUploadUrl);
  const saveLic       = useMutation(api.drivers.saveLicenseFile);
  const saveOpCard    = useMutation(api.drivers.saveOperatingCardFile);
  const genImgUrl     = useMutation(api.drivers.generateProfileImageUploadUrl);
  // ── صورة رخصة القيادة — حقل منفصل تماماً عن الصورة الشخصية ──
  const saveLicImg    = useMutation(api.drivers.saveLicenseImage);
  const [uploading, setUploading] = useState<"license" | "opcard" | "licenseImg" | null>(null);
  const [licImgPreview, setLicImgPreview] = useState<string | null>(null);

  const handleUpload = async (file: File, type: "license" | "opcard") => {
    setUploading(type);
    try {
      const url = await genUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      if (type === "license") await saveLic({ storageId });
      else await saveOpCard({ storageId });
      toast.success("✅ تم رفع الملف بنجاح");
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      setUploading(null);
    }
  };

  const handleLicenseImageUpload = async (file: File) => {
    setUploading("licenseImg");
    // معاينة فورية
    const reader = new FileReader();
    reader.onload = (e) => setLicImgPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    try {
      // يستخدم نفس URL توليد الرفع لكن يحفظ في licenseImageId (منفصل عن profileImageId)
      const url = await genImgUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      await saveLicImg({ storageId }); // يحفظ في licenseImageId وليس profileImageId
      toast.success("✅ تم رفع صورة رخصة القيادة بنجاح");
    } catch {
      toast.error("فشل رفع صورة الرخصة");
      setLicImgPreview(null);
    } finally {
      setUploading(null);
    }
  };

  // ── صورة الرخصة من licenseImageUrl (منفصلة عن profileImageUrl) ──
  const licenseImgSrc = licImgPreview ?? driver?.licenseImageUrl ?? null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h3 className="font-black text-gray-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        الوثائق الرسمية
      </h3>

      {/* ── صورة رخصة القيادة (منفصلة عن الصورة الشخصية) ── */}
      <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50">
        <p className="text-xs font-black text-blue-700 mb-1 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> صورة رخصة القيادة
        </p>
        <p className="text-[10px] text-blue-500 mb-3">⚠️ هذه منفصلة عن صورتك الشخصية — خاصة بوثيقة الرخصة فقط</p>
        <div className="flex items-center gap-4">
          {/* معاينة صورة الرخصة */}
          <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-blue-200 bg-white flex-shrink-0 flex items-center justify-center">
            {licenseImgSrc ? (
              <img src={licenseImgSrc} alt="صورة رخصة القيادة" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🪪</span>
            )}
          </div>
          {/* زر الرفع */}
          <label className="flex-1 cursor-pointer">
            <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-colors text-sm font-bold ${
              uploading === "licenseImg"
                ? "border-blue-300 bg-blue-100 text-blue-600"
                : "border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
            }`}>
              {uploading === "licenseImg"
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> جارٍ الرفع...</>
                : <><Camera className="w-4 h-4" /> {licenseImgSrc ? "تغيير صورة الرخصة" : "رفع صورة الرخصة"}</>
              }
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading === "licenseImg"}
              onChange={(e) => e.target.files?.[0] && handleLicenseImageUpload(e.target.files[0])}
            />
          </label>
        </div>
        {licenseImgSrc && (
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> تم رفع صورة رخصة القيادة — ستظهر في بطاقة التحقق
          </p>
        )}
      </div>

      {/* ── ملفات PDF ── */}
      <div className="space-y-3">
        {[
          { type: "license" as const, label: "ملف بطاقة السائق (PDF / صورة)", icon: "📄", uploaded: !!driver?.licenseFileId },
          { type: "opcard" as const,  label: "بطاقة تشغيل الحافلة (PDF / صورة)", icon: "📋", uploaded: !!driver?.operatingCardFileId },
        ].map((item) => (
          <label key={item.type} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
            item.uploaded ? "border-emerald-200 bg-emerald-50" : "border-dashed border-gray-200 hover:border-emerald-300"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.uploaded ? "✓ تم الرفع" : "اضغط لرفع الملف"}</p>
              </div>
            </div>
            {uploading === item.type
              ? <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              : item.uploaded
                ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                : <Upload className="w-4 h-4 text-gray-400" />
            }
            <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], item.type)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// تبويب الحافلة
// ══════════════════════════════════════════════════════
function BusTab({ driver }: { driver: any }) {
  const updateProfile = useMutation(api.drivers.updateProfile);
  const [showQR, setShowQR]   = useState(false);
  const [editing, setEditing] = useState(!driver?.plateNumber);
  const [form, setForm] = useState({
    plateNumber:          driver?.plateNumber          ?? "",
    busCapacity:          driver?.busCapacity?.toString() ?? "",
    busType:              driver?.busType              ?? "",
    busColor:             driver?.busColor             ?? "white",
    transportCompanyName: driver?.transportCompanyName ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.plateNumber || !form.busCapacity) {
      toast.error("أدخل رقم اللوحة وعدد المقاعد");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        plateNumber:          form.plateNumber,
        busCapacity:          parseInt(form.busCapacity),
        busType:              form.busType              || undefined,
        busColor:             form.busColor             || undefined,
        transportCompanyName: form.transportCompanyName || undefined,
      });
      toast.success("✅ تم حفظ بيانات الحافلة");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const selectedColor = BUS_COLORS.find((c) => c.value === (editing ? form.busColor : driver?.busColor));

  return (
    <div className="space-y-4">
      {showQR && <DriverQRModal driver={driver} onClose={() => setShowQR(false)} />}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-800 flex items-center gap-2">
            <Bus className="w-5 h-5 text-emerald-600" />
            بيانات الحافلة
          </h3>
          <div className="flex items-center gap-2">
            {driver?.plateNumber && (
              <button
                onClick={() => setShowQR(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                QR
              </button>
            )}
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                editing
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "تعديل"}
            </button>
          </div>
        </div>

        {/* معاينة الحافلة */}
        {!editing && driver?.plateNumber && (
          <div className="mb-5 p-4 rounded-2xl text-center" style={{
            background: `linear-gradient(135deg, ${selectedColor?.hex ?? "#f9fafb"} 0%, ${selectedColor?.hex ?? "#f9fafb"}cc 100%)`,
            border: "2px solid rgba(0,0,0,0.08)",
          }}>
            <div className="text-4xl mb-2">🚌</div>
            <div className="font-black text-2xl text-gray-800" dir="ltr">{driver.plateNumber}</div>
            <div className="text-sm text-gray-600 mt-1">{driver.busType ?? "—"} • {driver.busCapacity ?? "—"} مقعد</div>
            {driver?.transportCompanyName && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Truck className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600 font-semibold">{driver.transportCompanyName}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Field label="رقم اللوحة" icon={Bus}>
            {editing
              ? <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="مثال: أ ب ج 1234" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none" dir="ltr" />
              : <span className="text-sm text-gray-700 font-mono">{driver?.plateNumber ?? "—"}</span>
            }
          </Field>

          <Field label="عدد المقاعد" icon={Users}>
            {editing
              ? <input type="number" value={form.busCapacity} onChange={(e) => setForm({ ...form, busCapacity: e.target.value })} placeholder="مثال: 45" min="1" max="100" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none" />
              : <span className="text-sm text-gray-700">{driver?.busCapacity ? `${driver.busCapacity} مقعد` : "—"}</span>
            }
          </Field>

          <Field label="نوع الحافلة" icon={Package}>
            {editing
              ? (
                <select value={form.busType} onChange={(e) => setForm({ ...form, busType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="">اختر النوع</option>
                  {BUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )
              : <span className="text-sm text-gray-700">{driver?.busType ?? "—"}</span>
            }
          </Field>

          {/* ── شركة النقل ── */}
          <Field label="اسم شركة النقل" icon={Building2}>
            {editing
              ? <input
                  value={form.transportCompanyName}
                  onChange={(e) => setForm({ ...form, transportCompanyName: e.target.value })}
                  placeholder="مثال: شركة الرحمة للنقل"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none"
                />
              : <span className="text-sm text-gray-700">{driver?.transportCompanyName ?? "—"}</span>
            }
          </Field>

          {editing && (
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">لون الحافلة</label>
              <div className="flex flex-wrap gap-2">
                {BUS_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, busColor: c.value })}
                    title={c.label}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.busColor === c.value ? "border-emerald-500 scale-110" : "border-gray-200"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {driver?.office && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
          <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            المكتب التابع له
          </h4>
          <p className="text-emerald-700 font-semibold">{driver.office.name}</p>
          <p className="text-emerald-600 text-xs mt-0.5">{driver.office.city} • {driver.office.phone}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// نافذة QR Code — بطاقة السائق الكاملة
// ══════════════════════════════════════════════════════
// الـ QR يشير مباشرة لـ Convex Site حيث يعمل الـ HTTP Action
// هذا يضمن عمل الرابط بدون أي إعدادات Vercel أو SPA routing
const BASE_URL = "https://calm-trout-152.convex.site";

function DriverQRModal({ driver, onClose }: { driver: any; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── رابط التحقق الرسمي الديناميكي ──
  // يشير دائماً إلى صفحة التحقق الرسمية بالـ driverCode
  const driverCode = driver?.driverCode ?? null;
  const verifyUrl  = driverCode
    ? `${BASE_URL}/verify/${driverCode}`
    : `${BASE_URL}/driver-profile?id=${driver?._id ?? ""}`;

  // ── رسم QR على الـ canvas ──
  useEffect(() => {
    if (!canvasRef.current || !verifyUrl) return;
    QRCode.toCanvas(canvasRef.current, verifyUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#064e3b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).catch(console.error);
  }, [verifyUrl]);

  // ── طباعة بطاقة التحقق الرسمية ──
  const handlePrint = () => {
    const busColorMap: Record<string, string> = {
      white: "#ffffff", silver: "#c0c0c0", gray: "#6b7280",
      black: "#1f2937", blue: "#3b82f6", red: "#ef4444",
      green: "#22c55e", yellow: "#eab308", orange: "#f97316",
    };
    const busColorHex = busColorMap[driver?.busColor ?? ""] ?? "#f9fafb";
    const printDate = new Date().toLocaleDateString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>بطاقة السائق — ${driver?.name ?? "المسار الذكي"}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal',Arial,sans-serif;background:#f8fafc;color:#1e293b;direction:rtl}
    .page{max-width:680px;margin:0 auto;padding:32px}
    .header{background:linear-gradient(135deg,#064e3b,#065f46);color:#fff;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px}
    .header h1{font-size:22px;font-weight:900;margin-bottom:4px}
    .header p{font-size:12px;opacity:.8}
    .card{background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .driver-header{display:flex;align-items:center;gap:20px;margin-bottom:20px;padding-bottom:20px;border-bottom:2px solid #f1f5f9}
    .driver-photo{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #065f46}
    .driver-name{font-size:22px;font-weight:900;color:#0f172a;margin-bottom:4px}
    .driver-company{font-size:14px;color:#475569;margin-bottom:8px}
    .driver-code{display:inline-flex;align-items:center;gap:6px;background:#0f172a;color:#34d399;padding:6px 14px;border-radius:8px;font-family:monospace;font-size:16px;font-weight:900;letter-spacing:2px}
    .row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9}
    .row:last-child{border-bottom:none}
    .row-label{font-size:14px;color:#64748b;font-weight:500}
    .row-value{font-size:14px;font-weight:700;color:#1e293b}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700}
    .badge-green{background:#dcfce7;color:#166534}
    .badge-red{background:#fee2e2;color:#991b1b}
    .badge-blue{background:#dbeafe;color:#1e40af}
    .bus-preview{background:linear-gradient(135deg,${busColorHex},${busColorHex}cc);border:2px solid rgba(0,0,0,.08);border-radius:14px;padding:14px;text-align:center;margin-bottom:12px}
    .plate{font-size:20px;font-weight:900;color:#1f2937;direction:ltr}
    .bus-info{font-size:12px;color:#4b5563;margin-top:4px}
    .qr-section{text-align:center;padding:20px;background:#f8fafc;border-radius:12px;margin-top:16px}
    .qr-section img{width:140px;height:140px}
    .qr-url{font-family:monospace;font-size:11px;color:#475569;margin-top:8px;word-break:break-all}
    .footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(6,95,70,.04);font-weight:900;pointer-events:none;white-space:nowrap}
    @media print{body{background:#fff}.page{padding:20px}}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>🕋 بطاقة سائق رسمية — المسار الذكي</h1>
      <p>منصة المسار الذكي لحجز العمرة • نظام التحقق الرسمي</p>
    </div>
    <div class="card">
      <div class="driver-header">
        ${driver?.profileImageUrl
          ? `<img src="${driver.profileImageUrl}" class="driver-photo" alt="${driver?.name}" />`
          : `<div style="width:90px;height:90px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:36px;border:3px solid #065f46">👤</div>`
        }
        <div>
          <div class="driver-name">${driver?.name ?? "—"}</div>
          ${driver?.transportCompanyName ? `<div class="driver-company">🚌 ${driver.transportCompanyName}</div>` : ""}
          ${driverCode ? `<div class="driver-code"># ${driverCode}</div>` : ""}
        </div>
      </div>

      <div class="row">
        <span class="row-label">👤 حالة السائق</span>
        <span class="badge ${driver?.isApproved ? "badge-green" : "badge-red"}">
          ${driver?.isApproved ? "✓ معتمد" : "⏳ قيد المراجعة"}
        </span>
      </div>
      ${driver?.licenseStatus ? `
      <div class="row">
        <span class="row-label">🛡️ رخصة القيادة</span>
        <span class="badge ${driver.licenseStatus === "valid" ? "badge-blue" : "badge-red"}">
          ${driver.licenseStatus === "valid" ? "✓ سارية" : driver.licenseStatus === "expired" ? "✗ منتهية" : "موقوفة"}
        </span>
      </div>` : ""}
      ${driver?.licenseExpiry ? `
      <div class="row">
        <span class="row-label">📅 انتهاء الرخصة</span>
        <span class="row-value">${driver.licenseExpiry}</span>
      </div>` : ""}
      ${driver?.plateNumber ? `
      <div class="row">
        <span class="row-label">🚗 رقم اللوحة</span>
        <span class="row-value" style="font-family:monospace">${driver.plateNumber}</span>
      </div>` : ""}
      ${driver?.busType ? `
      <div class="row">
        <span class="row-label">🚌 نوع الحافلة</span>
        <span class="row-value">${driver.busType} ${driver?.busCapacity ? `• ${driver.busCapacity} مقعد` : ""}</span>
      </div>` : ""}
      ${driver?.office?.name ? `
      <div class="row">
        <span class="row-label">🏢 مكتب العمرة</span>
        <span class="row-value">${driver.office.name}${driver.office.city ? ` — ${driver.office.city}` : ""}</span>
      </div>` : ""}

      <div class="qr-section">
        <p style="font-size:12px;color:#64748b;margin-bottom:12px">امسح الرمز للتحقق الفوري من هوية السائق</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}&color=064e3b" alt="QR Code" />
        <div class="qr-url">${verifyUrl}</div>
      </div>
    </div>
    <div class="footer">
      <p>تاريخ الإصدار: ${printDate}</p>
      <p>هذه الوثيقة صادرة إلكترونياً من منصة المسار الذكي لحجز العمرة</p>
    </div>
  </div>
  <div class="watermark">المسار الذكي</div>
</body>
</html>`;

    void printHtml(html, { width: "210mm", height: "297mm" });
    return;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-black text-lg">بطاقة السائق الرسمية</h2>
            <p className="text-emerald-200 text-xs">امسح الباركود للتحقق الفوري من الهوية</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">

            {/* ── صورة + اسم ── */}
            <div className="flex items-center gap-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              {driver?.profileImageUrl ? (
                <img src={driver.profileImageUrl} alt={driver?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-800 text-lg leading-tight truncate">{driver?.name ?? "—"}</h3>
                {driver?.transportCompanyName && (
                  <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                    <Truck className="w-3 h-3" />{driver.transportCompanyName}
                  </p>
                )}
                <span className={`mt-1.5 inline-block text-xs font-bold px-3 py-1 rounded-full ${
                  driver?.isApproved ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"
                }`}>
                  {driver?.isApproved ? "✓ سائق معتمد" : "⏳ قيد المراجعة"}
                </span>
              </div>
            </div>

            {/* ── QR Code — يشير لرابط التحقق الرسمي ── */}
            <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-gray-700">رمز التحقق الرسمي</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border-2 border-emerald-100 shadow-inner">
                <canvas ref={canvasRef} className="rounded-xl block" />
              </div>
              {driverCode && (
                <div className="bg-slate-900 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-slate-400 text-xs">رقم السائق:</span>
                  <span className="font-mono font-black text-emerald-400 tracking-widest">{driverCode}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                📱 امسح بكاميرا الجوال — يفتح صفحة التحقق الرسمية مباشرة
              </p>
              <p className="text-xs text-emerald-600 font-mono break-all text-center">{verifyUrl}</p>
            </div>

            {/* ── البيانات الشخصية ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h4 className="font-black text-gray-700 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> البيانات الشخصية
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                {[
                  { label: "رقم الهوية / الإقامة", value: driver?.idNumber ?? "—", ltr: true },
                  { label: "الجنسية",               value: driver?.nationality ?? "—" },
                  { label: "نوع الإقامة",           value: driver?.residenceType === "citizen" ? "مواطن" : driver?.residenceType === "resident" ? "مقيم" : "—" },
                  { label: "المكتب التابع له",       value: driver?.office?.name ?? "—" },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">{item.label}</p>
                    <p className="text-xs font-black text-gray-700"
                       style={item.ltr ? { direction: "ltr", textAlign: "right" } : {}}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── بيانات الحافلة ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h4 className="font-black text-gray-700 text-sm flex items-center gap-2">
                  <Bus className="w-4 h-4 text-emerald-600" /> بيانات الحافلة
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                {[
                  { label: "رقم اللوحة",  value: driver?.plateNumber ?? "—", ltr: true },
                  { label: "نوع الحافلة", value: driver?.busType ?? "—" },
                  { label: "عدد المقاعد", value: driver?.busCapacity ? `${driver.busCapacity} مقعد` : "—" },
                  { label: "شركة النقل",  value: driver?.transportCompanyName ?? "—" },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">{item.label}</p>
                    <p className="text-xs font-black text-gray-700"
                       style={item.ltr ? { direction: "ltr", textAlign: "right" } : {}}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── زر الطباعة ── */}
            <button
              onClick={handlePrint}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-800 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Printer className="w-4 h-4" />
              طباعة البطاقة الرسمية PDF
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── مكوّن حقل البيانات ──
function Field({ label, icon: Icon, children }: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  );
}
