import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  QrCode, Users, CheckCircle, XCircle, Clock,
  Phone, Hash, ChevronDown, ChevronUp, RotateCcw,
  UserCheck, UserX, Scan, X, AlertCircle,
} from "lucide-react";
import QRScanner from "./QRScanner";

interface Props {
  trip: any;
  onClose: () => void;
}

type ScanResult = {
  success: boolean;
  reason: string;
  message: string;
  booking?: {
    leadPassengerName:  string;
    leadPassengerPhone: string;
    bookingReference:   string;
    adultsCount:        number;
    childrenCount:      number;
    attendanceAt?:      number;
  };
};

function extractBookingReference(raw: string) {
  const trimmed = raw.trim();
  const prefixed = trimmed.match(/MASARDHAKI:REF:([A-Z0-9-]+)/i);
  if (prefixed?.[1]) return prefixed[1].toUpperCase();

  const ref = trimmed.match(/MSR-[A-Z0-9]+/i);
  if (ref?.[0]) return ref[0].toUpperCase();

  try {
    const url = new URL(trimmed);
    const fromParam = url.searchParams.get("ref") ?? url.searchParams.get("bookingReference");
    if (fromParam) return fromParam.trim().toUpperCase();
  } catch {
    // Not a URL; continue with the raw scanner value.
  }

  return trimmed.split(":").pop()?.trim().toUpperCase() ?? trimmed.toUpperCase();
}

export default function AttendanceScanner({ trip, onClose }: Props) {
  const [showScanner,  setShowScanner]  = useState(false);
  const [lastResult,   setLastResult]   = useState<ScanResult | null>(null);
  const [scanning,     setScanning]     = useState(false);
  const [showList,     setShowList]     = useState(true);

  const attendance = useQuery(api.attendance.getTripAttendance, { tripId: trip._id });
  const scanAndCheckIn = useMutation(api.attendance.scanAndCheckIn);
  const undoCheckIn    = useMutation(api.attendance.undoCheckIn);

  const handleScan = useCallback(async (raw: string) => {
    setShowScanner(false);
    setScanning(true);
    setLastResult(null);

    try {
      // استخراج bookingReference من QR
      // الـ QR يحتوي على: "MASARDHAKI:REF:XXXXXXXX" أو مجرد الـ reference
      let ref = raw.trim();
      if (ref.includes("MASARDHAKI:REF:")) {
        ref = ref.split("MASARDHAKI:REF:")[1].trim();
      } else if (ref.includes(":")) {
        // أي صيغة أخرى — خذ آخر جزء
        ref = ref.split(":").pop()?.trim() ?? ref;
      }

      ref = extractBookingReference(raw);

      const result = await scanAndCheckIn({
        bookingReference: ref,
        tripId: trip._id as Id<"trips">,
      });

      setLastResult(result as ScanResult);

      if ((result as ScanResult).success) {
        toast.success(`✅ ${(result as ScanResult).message}`);
      } else if ((result as ScanResult).reason === "already_checked") {
        toast.info(`ℹ️ ${(result as ScanResult).message}`);
      } else {
        toast.error(`❌ ${(result as ScanResult).message}`);
      }
    } catch (err: any) {
      const msg = err?.message ?? "حدث خطأ";
      setLastResult({ success: false, reason: "error", message: msg });
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  }, [scanAndCheckIn, trip._id]);

  const handleUndo = async (bookingId: Id<"bookings">) => {
    try {
      await undoCheckIn({ bookingId, tripId: trip._id });
      toast.success("تم إلغاء تسجيل الحضور");
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  const present = attendance?.present ?? 0;
  const total   = attendance?.total   ?? 0;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col" dir="rtl">
      {/* ── Header ── */}
      <div className="bg-gradient-to-l from-emerald-800 to-emerald-700 text-white px-4 pt-safe pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="font-black text-lg">تسجيل الحضور</h1>
          <div className="w-9" />
        </div>

        {/* إحصائيات */}
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-emerald-200 text-xs">رحلة</p>
              <p className="font-bold text-sm">{trip.package?.title ?? "رحلة العمرة"}</p>
            </div>
            <div className="text-left">
              <p className="text-emerald-200 text-xs">الحضور</p>
              <p className="font-black text-2xl">{present}<span className="text-emerald-300 text-base font-normal">/{total}</span></p>
            </div>
          </div>
          {/* شريط التقدم */}
          <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-emerald-200 text-xs mt-1.5 text-left">{pct}% حضروا</p>
        </div>
      </div>

      {/* ── المحتوى ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* زر المسح */}
        <button
          onClick={() => { setLastResult(null); setShowScanner(true); }}
          disabled={scanning}
          className="w-full py-5 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          {scanning ? (
            <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />جاري التحقق...</>
          ) : (
            <><Scan className="w-7 h-7" />مسح QR التذكرة</>
          )}
        </button>

        {/* نتيجة المسح الأخير */}
        {lastResult && (
          <div className={`rounded-2xl p-4 border-2 ${
            lastResult.success
              ? "bg-emerald-50 border-emerald-300"
              : lastResult.reason === "already_checked"
              ? "bg-blue-50 border-blue-300"
              : "bg-red-50 border-red-300"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                lastResult.success ? "bg-emerald-100" :
                lastResult.reason === "already_checked" ? "bg-blue-100" : "bg-red-100"
              }`}>
                {lastResult.success
                  ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                  : lastResult.reason === "already_checked"
                  ? <AlertCircle className="w-5 h-5 text-blue-600" />
                  : <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex-1">
                <p className={`font-black text-sm ${
                  lastResult.success ? "text-emerald-800" :
                  lastResult.reason === "already_checked" ? "text-blue-800" : "text-red-800"
                }`}>{lastResult.message}</p>
                {lastResult.booking && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {lastResult.booking.leadPassengerName}
                      {lastResult.booking.adultsCount > 1 && ` (+${lastResult.booking.adultsCount - 1} بالغ)`}
                      {lastResult.booking.childrenCount > 0 && ` (+${lastResult.booking.childrenCount} طفل)`}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {lastResult.booking.leadPassengerPhone}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      {lastResult.booking.bookingReference}
                    </p>
                    {lastResult.booking.attendanceAt && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(lastResult.booking.attendanceAt).toLocaleTimeString("ar-SA")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* قائمة الركاب */}
        {attendance && attendance.bookings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowList(!showList)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-gray-800">قائمة الركاب</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                  {attendance.bookings.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-bold">{present} حضر</span>
                {showList ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {showList && (
              <div className="divide-y divide-gray-50">
                {attendance.bookings.map((b: any) => (
                  <PassengerRow
                    key={b._id}
                    booking={b}
                    tripId={trip._id}
                    onUndo={handleUndo}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* حالة فارغة */}
        {attendance && attendance.bookings.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">لا يوجد ركاب مرتبطون بهذه الرحلة</p>
            <p className="text-gray-300 text-sm mt-1">سيظهرون هنا بعد ربط الحجوزات</p>
          </div>
        )}
      </div>

      {/* ماسح QR */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

// ── صف راكب في القائمة ──
function PassengerRow({ booking, tripId, onUndo }: {
  booking: any;
  tripId: string;
  onUndo: (id: Id<"bookings">) => void;
}) {
  const isPresent = booking.attendanceStatus === "present";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`px-4 py-3 transition-colors ${isPresent ? "bg-emerald-50/50" : ""}`}>
      <div className="flex items-center gap-3">
        {/* أيقونة الحالة */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isPresent ? "bg-emerald-100" : "bg-gray-100"
        }`}>
          {isPresent
            ? <UserCheck className="w-4 h-4 text-emerald-600" />
            : <UserX    className="w-4 h-4 text-gray-400" />}
        </div>

        {/* البيانات */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{booking.leadPassengerName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{booking.bookingReference}</span>
            <span className="text-gray-200">•</span>
            <span className="text-xs text-gray-400">
              {booking.adultsCount} بالغ{booking.childrenCount > 0 ? ` + ${booking.childrenCount} طفل` : ""}
            </span>
          </div>
          {isPresent && booking.attendanceAt && (
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(booking.attendanceAt).toLocaleTimeString("ar-SA")}
            </p>
          )}
        </div>

        {/* زر التوسع */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      {/* تفاصيل موسّعة */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5" />
            <a href={`tel:${booking.leadPassengerPhone}`} className="text-blue-600 font-medium">
              {booking.leadPassengerPhone}
            </a>
          </div>
          {isPresent && (
            <button
              onClick={() => onUndo(booking._id as Id<"bookings">)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إلغاء تسجيل الحضور (تصحيح خطأ)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
