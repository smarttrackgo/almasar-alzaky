import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle, XCircle, AlertTriangle, User, Truck,
  Car, Calendar, Clock, Shield, Building2,
  BadgeCheck, Hash, Printer, Download, FileText
} from "lucide-react";
import { printHtml } from "../lib/printDocument";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

interface Props {
  driverCode: string;
  navigate: (p: any) => void;
}

export default function DriverVerifyPage({ driverCode, navigate }: Props) {
  const driver = useQuery(api.public.getDriverByCode, { driverCode });
  const printRef = useRef<HTMLDivElement>(null);

  // ── طباعة / تصدير PDF ──
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>بطاقة تحقق السائق - ${driverCode}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', sans-serif; background: #f8fafc; color: #1e293b; direction: rtl; }
          .page { max-width: 700px; margin: 0 auto; padding: 32px; }
          .header { background: linear-gradient(135deg, #065f46, #0f766e); color: white; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
          .header img { height: 48px; margin-bottom: 12px; filter: brightness(0) invert(1); }
          .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .header p { font-size: 13px; opacity: 0.8; }
          .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          .driver-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
          .driver-photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #065f46; }
          .driver-photo-placeholder { width: 90px; height: 90px; border-radius: 50%; background: #e2e8f0; border: 3px solid #065f46; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #94a3b8; }
          .driver-name { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
          .driver-company { font-size: 14px; color: #475569; margin-bottom: 8px; }
          .driver-code-badge { display: inline-flex; align-items: center; gap: 6px; background: #0f172a; color: #34d399; padding: 6px 14px; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: 900; letter-spacing: 2px; }
          .row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .row:last-child { border-bottom: none; }
          .row-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #64748b; font-weight: 500; }
          .row-value { font-size: 14px; font-weight: 700; color: #1e293b; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-blue { background: #dbeafe; color: #1e40af; }
          .badge-gray { background: #f1f5f9; color: #475569; }
          .status-box { border-radius: 12px; padding: 16px; margin-top: 16px; display: flex; align-items: flex-start; gap: 12px; }
          .status-box.ok { background: #f0fdf4; border: 2px solid #86efac; }
          .status-box.warn { background: #fef9c3; border: 2px solid #fde047; }
          .status-box.err { background: #fef2f2; border: 2px solid #fca5a5; }
          .status-icon { font-size: 24px; }
          .status-title { font-size: 15px; font-weight: 800; margin-bottom: 4px; }
          .status-desc { font-size: 12px; color: #64748b; line-height: 1.6; }
          .qr-section { text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; margin-top: 16px; }
          .qr-section p { font-size: 12px; color: #94a3b8; margin-top: 8px; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
          .footer .url { font-family: monospace; font-size: 11px; color: #64748b; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; color: rgba(6,95,70,0.04); font-weight: 900; pointer-events: none; white-space: nowrap; }
          @media print {
            body { background: white; }
            .page { padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <div class="watermark">المسار الذكي</div>
      </body>
      </html>
    `;
    void printHtml(html, { width: "210mm", height: "297mm" });
  };

  // ── حالة التحميل ──
  if (driver === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-emerald-300 text-sm font-medium">جارٍ التحقق من هوية السائق...</p>
          <p className="text-slate-500 text-xs">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // ── السائق غير موجود ──
  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">رمز غير صالح</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 font-semibold mb-2">هذا السائق غير معتمد أو تم إيقافه</p>
              <p className="text-gray-500 text-sm mb-6">
                رمز التحقق <span className="font-mono font-bold text-red-600">{driverCode}</span> غير موجود في قاعدة البيانات
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-right">
                <p className="text-red-700 text-sm font-semibold mb-1">تحذير رسمي</p>
                <p className="text-red-600 text-xs leading-relaxed">
                  إذا كان هذا السائق يدّعي أنه معتمد، يرجى التواصل مع الجهات المختصة أو منصة المسار الذكي فوراً.
                </p>
              </div>
              <button
                onClick={() => navigate({ name: "home" })}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
          <div className="text-center mt-4">
            <img src={LOGO} alt="المسار الذكي" className="h-8 w-auto mx-auto brightness-0 invert opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  // ── السائق موقوف ──
  if (driver.suspended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-amber-500 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">سائق موقوف</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-800 font-bold text-lg mb-1">{(driver as any).name}</p>
              <p className="text-gray-500 text-sm mb-6">هذا السائق غير معتمد أو تم إيقافه مؤقتاً</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-right">
                <p className="text-amber-700 text-sm font-semibold mb-1">تنبيه رسمي</p>
                <p className="text-amber-600 text-xs leading-relaxed">
                  هذا السائق لا يحق له مزاولة نشاط نقل المعتمرين حالياً. يرجى التواصل مع الجهات المختصة.
                </p>
              </div>
              <button
                onClick={() => navigate({ name: "home" })}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── بيانات السائق المعتمد ──
  const d = driver as any;
  const isActive = d.driverStatus !== "suspended" && d.driverStatus !== "inactive";
  const licenseValid = d.licenseStatus === "valid";
  const lastUpdate = d.lastDataUpdate
    ? new Date(d.lastDataUpdate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const verifyUrl = `https://calm-trout-152.convex.site/verify/${driverCode}`;
  const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">

      {/* شريط علوي رسمي */}
      <div className="bg-emerald-800 border-b border-emerald-700 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-300" />
          <span className="text-emerald-200 text-xs font-semibold">نظام التحقق الرسمي</span>
        </div>
        <img src={LOGO} alt="المسار الذكي" className="h-6 w-auto brightness-0 invert" />
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* زر الطباعة / PDF */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/40"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة / تصدير PDF رسمي</span>
          <Download className="w-4 h-4" />
        </button>

        {/* ── محتوى الطباعة ── */}
        <div ref={printRef} style={{ display: "none" }}>
          <div className="page">
            {/* Header */}
            <div className="header">
              <img src={LOGO} alt="المسار الذكي" />
              <h1>بطاقة تحقق رسمية — سائق معتمد</h1>
              <p>منصة المسار الذكي لحجز العمرة • نظام التحقق الرسمي</p>
            </div>

            {/* بيانات السائق */}
            <div className="card">
              <div className="driver-header">
                {d.profileImageUrl
                  ? <img src={d.profileImageUrl} alt={d.name} className="driver-photo" />
                  : <div className="driver-photo-placeholder">👤</div>
                }
                <div>
                  <div className="driver-name">{d.name}</div>
                  {d.transportCompanyName && <div className="driver-company">🚌 {d.transportCompanyName}</div>}
                  <div className="driver-code-badge"># {d.driverCode}</div>
                </div>
              </div>

              {/* حالة السائق */}
              <div className="row">
                <span className="row-label">👤 حالة السائق</span>
                <span className={`badge ${isActive ? "badge-green" : "badge-red"}`}>
                  {isActive ? "✓ نشط ومعتمد" : "✗ موقوف"}
                </span>
              </div>

              {/* حالة الرخصة */}
              <div className="row">
                <span className="row-label">🛡️ رخصة القيادة</span>
                <span className={`badge ${licenseValid ? "badge-blue" : "badge-red"}`}>
                  {licenseValid ? "✓ سارية" : d.licenseStatus === "expired" ? "✗ منتهية" : "غير محدد"}
                </span>
              </div>

              {/* تاريخ انتهاء الرخصة */}
              {d.licenseExpiry && (
                <div className="row">
                  <span className="row-label">📅 تاريخ انتهاء الرخصة</span>
                  <span className="row-value">{d.licenseExpiry}</span>
                </div>
              )}

              {/* شركة النقل */}
              {d.transportCompanyName && (
                <div className="row">
                  <span className="row-label">🚌 شركة النقل</span>
                  <span className="row-value">{d.transportCompanyName}</span>
                </div>
              )}

              {/* رقم اللوحة */}
              {d.plateNumber && (
                <div className="row">
                  <span className="row-label">🚗 رقم اللوحة</span>
                  <span className="row-value" style={{ fontFamily: "monospace" }}>{d.plateNumber}</span>
                </div>
              )}

              {/* نوع الحافلة */}
              {d.busType && (
                <div className="row">
                  <span className="row-label">🚌 نوع الحافلة</span>
                  <span className="row-value">{d.busType}</span>
                </div>
              )}

              {/* المكتب */}
              {d.officeName && (
                <div className="row">
                  <span className="row-label">🏢 مكتب العمرة</span>
                  <span className="row-value">{d.officeName}{d.officeCity ? ` — ${d.officeCity}` : ""}</span>
                </div>
              )}

              {/* آخر تحديث */}
              <div className="row">
                <span className="row-label">🕐 آخر تحديث للبيانات</span>
                <span className="row-value" style={{ fontSize: "12px" }}>{lastUpdate}</span>
              </div>

              {/* حالة التحقق */}
              <div className={`status-box ${isActive && licenseValid ? "ok" : "err"}`}>
                <span className="status-icon">{isActive && licenseValid ? "✅" : "⚠️"}</span>
                <div>
                  <div className="status-title">
                    {isActive && licenseValid ? "السائق معتمد ومرخص" : "تحذير: يوجد مشكلة في بيانات السائق"}
                  </div>
                  <div className="status-desc">
                    {isActive && licenseValid
                      ? "تم التحقق من هوية هذا السائق بنجاح. بياناته مسجلة ومعتمدة في منصة المسار الذكي."
                      : "يرجى التواصل مع الجهات المختصة أو منصة المسار الذكي للتحقق من وضع هذا السائق."
                    }
                  </div>
                </div>
              </div>

              {/* QR */}
              <div className="qr-section">
                <div id="qr-print-container" style={{ display: "inline-block" }}></div>
                <p>امسح الرمز للتحقق الفوري من هوية السائق</p>
                <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569", marginTop: "4px" }}>{verifyUrl}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <p>تاريخ إصدار هذه الوثيقة: {printDate}</p>
              <p>هذه الوثيقة صادرة إلكترونياً من منصة المسار الذكي لحجز العمرة</p>
              <p className="url">{verifyUrl}</p>
            </div>
          </div>
        </div>

        {/* بطاقة التحقق الرئيسية — للعرض على الشاشة */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* الجزء العلوي */}
          <div className={`px-6 pt-8 pb-14 text-center relative ${isActive ? "bg-gradient-to-br from-emerald-700 to-teal-800" : "bg-gradient-to-br from-red-700 to-red-900"}`}>
            <div className={`absolute top-4 start-4 flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-full font-bold border ${isActive ? "bg-emerald-500/30 border-emerald-400/40" : "bg-red-500/30 border-red-400/40"}`}>
              {isActive
                ? <><CheckCircle className="w-3.5 h-3.5" /> نشط</>
                : <><XCircle className="w-3.5 h-3.5" /> موقوف</>
              }
            </div>

            <div className="relative inline-block mb-4">
              {d.profileImageUrl ? (
                <img src={d.profileImageUrl} alt={d.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white shadow-2xl flex items-center justify-center">
                  <User className="w-14 h-14 text-white/80" />
                </div>
              )}
              {d.isApproved && (
                <div className="absolute -bottom-1 -start-1 w-9 h-9 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-black text-white mb-1">{d.name}</h1>
            {d.transportCompanyName && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Truck className="w-3.5 h-3.5 text-white/70" />
                <p className="text-white/80 text-sm">{d.transportCompanyName}</p>
              </div>
            )}
          </div>

          {/* رقم السائق الرسمي */}
          <div className="-mt-7 mx-6 relative z-10">
            <div className="bg-slate-900 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl border border-slate-700">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-xs font-medium">رقم السائق الرسمي</span>
              </div>
              <span className="font-mono font-black text-emerald-400 text-lg tracking-widest">{d.driverCode}</span>
            </div>
          </div>

          {/* تفاصيل التحقق */}
          <div className="px-6 pb-6 pt-4 space-y-3">

            {/* حالة السائق */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? "bg-emerald-100" : "bg-red-100"}`}>
                  <User className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-red-600"}`} />
                </div>
                <span className="text-gray-600 text-sm font-medium">حالة السائق</span>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {isActive ? "نشط ومعتمد" : "موقوف"}
              </span>
            </div>

            {/* حالة رخصة القيادة */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${licenseValid ? "bg-blue-100" : "bg-red-100"}`}>
                  <Shield className={`w-5 h-5 ${licenseValid ? "text-blue-600" : "text-red-600"}`} />
                </div>
                <span className="text-gray-600 text-sm font-medium">رخصة القيادة</span>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${licenseValid ? "bg-blue-100 text-blue-700" : d.licenseStatus === "expired" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                {licenseValid ? "سارية" : d.licenseStatus === "expired" ? "منتهية" : "غير محدد"}
              </span>
            </div>

            {/* تاريخ انتهاء الرخصة */}
            {d.licenseExpiry && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">تاريخ انتهاء الرخصة</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{d.licenseExpiry}</span>
              </div>
            )}

            {/* شركة النقل */}
            {d.transportCompanyName && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">شركة النقل</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{d.transportCompanyName}</span>
              </div>
            )}

            {/* رقم اللوحة */}
            {d.plateNumber && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">رقم اللوحة</span>
                </div>
                <span className="text-sm font-bold text-gray-800 font-mono">{d.plateNumber}</span>
              </div>
            )}

            {/* نوع الحافلة */}
            {d.busType && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">نوع الحافلة</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{d.busType}</span>
              </div>
            )}

            {/* المكتب */}
            {d.officeName && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">مكتب العمرة</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{d.officeName}</span>
              </div>
            )}

            {/* آخر تحديث */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-gray-500 text-sm">آخر تحديث للبيانات</span>
              </div>
              <span className="text-xs font-medium text-slate-600">{lastUpdate}</span>
            </div>
          </div>

          {/* ── الوثائق الرسمية المرفوعة ── */}
          {(d.profileImageUrl || d.licenseImageUrl || d.licenseFileUrl || d.operatingCardFileUrl) && (
            <div className="px-6 pb-6">
              <div className="border-t border-gray-100 pt-4 mb-3">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  الوثائق الرسمية المرفوعة
                </h3>
              </div>
              <div className="space-y-3">

                {/* ── 1. الصورة الشخصية للسائق (profileImageUrl) — مستقلة تماماً ── */}
                {d.profileImageUrl && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100/60">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-800">الصورة الشخصية للسائق</span>
                      <span className="mr-auto text-[10px] text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full font-bold">✓ مرفوعة</span>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                      <img
                        src={d.profileImageUrl}
                        alt="الصورة الشخصية للسائق"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-300 flex-shrink-0 shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">صورة شخصية رسمية</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">مسجّلة في منصة المسار الذكي — تُستخدم للتعرف على هوية السائق</p>
                        <a
                          href={d.profileImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          عرض / تحميل
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. صورة رخصة القيادة (licenseImageId) — منفصلة عن الصورة الشخصية ── */}
                {d.licenseImageUrl && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/60">
                      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-blue-800">صورة رخصة القيادة</span>
                      <span className="mr-auto text-[10px] text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full font-bold">✓ مرفوعة</span>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                      <img
                        src={d.licenseImageUrl}
                        alt="صورة رخصة القيادة"
                        className="w-32 h-20 rounded-xl object-cover border-2 border-blue-200 flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">رخصة القيادة الرسمية</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">وثيقة مستقلة عن الصورة الشخصية — تُثبت أحقية السائق بالقيادة</p>
                        <a
                          href={d.licenseImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          عرض / تحميل
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 3. ملف بطاقة السائق PDF (licenseFileId) ── */}
                {d.licenseFileUrl && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-100/60">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-indigo-800">ملف بطاقة السائق (PDF)</span>
                      <span className="mr-auto text-[10px] text-indigo-600 bg-indigo-200 px-2 py-0.5 rounded-full font-bold">✓ مرفوع</span>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">ملف بطاقة السائق الرسمية</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">وثيقة PDF رسمية مسجّلة في المنصة</p>
                        <a
                          href={d.licenseFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          فتح الملف
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* بطاقة تشغيل الحافلة */}
                {d.operatingCardFileUrl && (
                  <div className="rounded-xl border border-purple-100 bg-purple-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/60">
                      <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-800">بطاقة تشغيل الحافلة</span>
                      <span className="mr-auto text-[10px] text-purple-600 bg-purple-200 px-2 py-0.5 rounded-full font-bold">✓ مرفوعة</span>
                    </div>
                    <div className="p-3">
                      {d.operatingCardFileUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={d.operatingCardFileUrl}
                            alt="بطاقة تشغيل الحافلة"
                            className="w-28 h-20 rounded-xl object-cover border-2 border-purple-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 leading-relaxed">وثيقة تشغيل الحافلة الرسمية مسجّلة في المنصة</p>
                            <a
                              href={d.operatingCardFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              عرض / تحميل
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📋</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 leading-relaxed">ملف PDF — بطاقة تشغيل الحافلة الرسمية</p>
                            <a
                              href={d.operatingCardFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              فتح الملف
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* QR التحقق */}
        <div className="bg-white rounded-2xl p-5 text-center shadow-lg">
          <p className="text-slate-600 text-sm font-semibold mb-3">امسح للتحقق الفوري</p>
          <div className="flex justify-center mb-3">
            <QRCodeSVG
              value={verifyUrl}
              size={160}
              fgColor="#0f172a"
              bgColor="#ffffff"
              level="H"
            />
          </div>
          <p className="text-emerald-600 text-sm font-mono font-black tracking-widest">{driverCode}</p>
          <p className="text-slate-400 text-xs mt-1 break-all">{verifyUrl}</p>
        </div>

        {/* بطاقة التحقق الرسمية */}
        <div className={`rounded-2xl p-5 border-2 ${isActive && licenseValid ? "bg-emerald-900/40 border-emerald-600/40" : "bg-red-900/30 border-red-600/40"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive && licenseValid ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {isActive && licenseValid
                ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                : <AlertTriangle className="w-6 h-6 text-red-400" />
              }
            </div>
            <div>
              <p className={`font-bold text-sm mb-1 ${isActive && licenseValid ? "text-emerald-300" : "text-red-300"}`}>
                {isActive && licenseValid ? "السائق معتمد ومرخص" : "تحذير: يوجد مشكلة في بيانات السائق"}
              </p>
              <p className={`text-xs leading-relaxed ${isActive && licenseValid ? "text-emerald-400/80" : "text-red-400/80"}`}>
                {isActive && licenseValid
                  ? "تم التحقق من هوية هذا السائق بنجاح. بياناته مسجلة ومعتمدة في منصة المسار الذكي."
                  : "يرجى التواصل مع الجهات المختصة أو منصة المسار الذكي للتحقق من وضع هذا السائق."
                }
              </p>
            </div>
          </div>
        </div>

        {/* زر الطباعة مكرر في الأسفل */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-2xl font-semibold text-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة البطاقة الرسمية كـ PDF</span>
        </button>

        {/* Footer */}
        <div className="text-center pb-4 space-y-2">
          <img src={LOGO} alt="المسار الذكي" className="h-8 w-auto mx-auto brightness-0 invert opacity-60" />
          <p className="text-slate-500 text-xs">منصة المسار الذكي للعمرة</p>
          <p className="text-slate-600 text-xs">نظام التحقق الرسمي من هوية السائقين</p>
          <p className="text-slate-700 text-xs font-mono">{verifyUrl}</p>
        </div>
      </div>
    </div>
  );
}
