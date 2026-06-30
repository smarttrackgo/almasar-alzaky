import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QRCodeSVG } from "qrcode.react";
import {
  User, Car, MapPin, Shield, CheckCircle,
  Clock, Users, Navigation, Star, Building2, ArrowRight, Truck, Hash
} from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";
const BASE_URL = "https://calm-trout-152.convex.site";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  driver_assigned: { label: "في انتظار التأكيد", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  driver_accepted: { label: "جاهز للانطلاق",     color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  in_progress:     { label: "الرحلة جارية الآن", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

interface Props {
  driverId: Id<"drivers">;
  navigate: (p: any) => void;
}

export default function DriverPublicProfilePage({ driverId, navigate }: Props) {
  const driver = useQuery(api.public.getDriverPublicProfile, { driverId });

  if (driver === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-emerald-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-emerald-300 text-sm">جارٍ تحميل بيانات السائق...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-emerald-900 p-6" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">السائق غير موجود</h2>
          <p className="text-emerald-300 text-sm mb-6">هذا الرابط غير صالح أو انتهت صلاحيته</p>
          <button
            onClick={() => navigate({ name: "home" })}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // رابط التحقق الرسمي
  const driverCode = (driver as any).driverCode ?? null;
  const verifyUrl = driverCode
    ? `${BASE_URL}/verify/${driverCode}`
    : window.location.href;

  const tripStatus = driver.activeTrip ? STATUS_MAP[driver.activeTrip.status] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900" dir="rtl">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate({ name: "home" })}
          className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>
        <img src={LOGO} alt="المسار الذكي" className="h-8 w-auto object-contain brightness-0 invert" />
        <div className="w-16" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* بطاقة السائق الرئيسية */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* الجزء العلوي */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-8 pb-16 text-center relative">
            {driver.isApproved && (
              <div className="absolute top-4 start-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>معتمد</span>
              </div>
            )}

            <div className="relative inline-block mb-4">
              {driver.profileImageUrl ? (
                <img
                  src={driver.profileImageUrl}
                  alt={driver.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white shadow-xl flex items-center justify-center">
                  <User className="w-14 h-14 text-white/80" />
                </div>
              )}
              {driver.isApproved && (
                <div className="absolute -bottom-1 -start-1 w-8 h-8 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">{driver.name}</h1>
            {(driver as any).transportCompanyName && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Truck className="w-3.5 h-3.5 text-emerald-200" />
                <p className="text-emerald-100 text-sm font-medium">{(driver as any).transportCompanyName}</p>
              </div>
            )}
            {driver.nationality && (
              <p className="text-emerald-200 text-xs mt-0.5">{driver.nationality}</p>
            )}
          </div>

          {/* QR يشير لرابط التحقق الرسمي */}
          <div className="flex justify-center -mt-10 mb-2 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl p-3 border-4 border-emerald-100">
              <QRCodeSVG
                value={verifyUrl}
                size={100}
                fgColor="#065f46"
                bgColor="#ffffff"
                level="H"
              />
            </div>
          </div>

          {/* رقم السائق الرسمي */}
          {driverCode && (
            <div className="mx-6 mb-4">
              <div className="bg-slate-900 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400 text-xs">رقم السائق الرسمي</span>
                </div>
                <span className="font-mono font-black text-emerald-400 text-base tracking-widest">{driverCode}</span>
              </div>
            </div>
          )}

          <div className="px-6 pb-6 space-y-3">
            {/* شركة النقل */}
            {(driver as any).transportCompanyName && (
              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">شركة النقل</p>
                  <p className="font-semibold text-gray-800 text-sm">{(driver as any).transportCompanyName}</p>
                </div>
              </div>
            )}

            {/* المكتب */}
            {driver.officeName && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">مكتب العمرة</p>
                  <p className="font-semibold text-gray-800 text-sm">{driver.officeName}</p>
                  {driver.officeCity && <p className="text-xs text-gray-500">{driver.officeCity}</p>}
                </div>
              </div>
            )}

            {/* بيانات الحافلة */}
            {(driver.plateNumber || driver.busType) && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 text-sm">بيانات الحافلة</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {driver.plateNumber && (
                    <div>
                      <p className="text-xs text-gray-500">رقم اللوحة</p>
                      <p className="font-bold text-gray-800">{driver.plateNumber}</p>
                    </div>
                  )}
                  {driver.busCapacity && (
                    <div>
                      <p className="text-xs text-gray-500">السعة</p>
                      <p className="font-bold text-gray-800">{driver.busCapacity} راكب</p>
                    </div>
                  )}
                  {driver.busType && (
                    <div>
                      <p className="text-xs text-gray-500">النوع</p>
                      <p className="font-bold text-gray-800">{driver.busType}</p>
                    </div>
                  )}
                  {driver.busColor && (
                    <div>
                      <p className="text-xs text-gray-500">اللون</p>
                      <p className="font-bold text-gray-800">{driver.busColor}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* تنبيه: لا تعرض بيانات حساسة */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-700 text-xs">
                هذه بطاقة عامة — لا تحتوي على بيانات حساسة (جوال، هوية، بريد إلكتروني)
              </p>
            </div>
          </div>
        </div>

        {/* الرحلة النشطة */}
        {driver.activeTrip && tripStatus && (
          <div className={`rounded-2xl border-2 p-5 ${tripStatus.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-gray-800">الرحلة الحالية</span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${tripStatus.bg} ${tripStatus.color}`}>
                {tripStatus.label}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">{driver.activeTrip.packageTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">تاريخ الانطلاق: {driver.activeTrip.departureDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{driver.activeTrip.passengerCount} معتمر</span>
              </div>
              {driver.activeTrip.currentLat && driver.activeTrip.currentLng && (
                <a
                  href={`https://www.google.com/maps?q=${driver.activeTrip.currentLat},${driver.activeTrip.currentLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-3 bg-white border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors w-full justify-center"
                >
                  <MapPin className="w-4 h-4" />
                  <span>عرض الموقع الحالي على الخريطة</span>
                </a>
              )}
              {driver.activeTrip.lastLocationUpdate && (
                <p className="text-xs text-gray-400 text-center">
                  آخر تحديث: {new Date(driver.activeTrip.lastLocationUpdate).toLocaleTimeString("ar-SA")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* QR التحقق الرسمي */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-5 text-center border border-slate-700/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-300 text-sm font-semibold">رمز التحقق الرسمي</p>
          </div>
          <p className="text-slate-400 text-xs mb-4">
            امسح هذا الرمز للتحقق من هوية السائق رسمياً عبر قاعدة البيانات
          </p>
          <div className="flex justify-center mb-3">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <QRCodeSVG
                value={verifyUrl}
                size={150}
                fgColor="#0f172a"
                bgColor="#ffffff"
                level="H"
              />
            </div>
          </div>
          {driverCode && (
            <p className="text-emerald-400 text-sm font-mono font-black tracking-widest mt-2">{driverCode}</p>
          )}
          <p className="text-slate-600 text-xs mt-1 break-all">{verifyUrl}</p>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-emerald-400 text-xs">
            منصة المسار الذكي للعمرة • بطاقة سائق رسمية
          </p>
        </div>
      </div>
    </div>
  );
}
