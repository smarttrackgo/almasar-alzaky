import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import { useCallback } from "react";
import { printHtml } from "../lib/printDocument";
import {
  ArrowRight, Printer, Users, Calendar, MapPin,
  Building2, CheckCircle, XCircle,
  Shield, Loader2, AlertCircle, Download, Bus, User, Phone,
  CreditCard, Hash, Globe, BadgeCheck, Truck,
} from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "مؤكد",         cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغي",         cls: "bg-red-100 text-red-600" },
  completed: { label: "مكتمل",        cls: "bg-blue-100 text-blue-700" },
};

const TRIP_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  scheduled:       { label: "مجدولة",          cls: "bg-gray-100 text-gray-600" },
  driver_assigned: { label: "تم تعيين السائق", cls: "bg-amber-100 text-amber-700" },
  driver_accepted: { label: "السائق قبل",      cls: "bg-blue-100 text-blue-700" },
  in_progress:     { label: "جارية الآن",      cls: "bg-green-100 text-green-700" },
  completed:       { label: "مكتملة",          cls: "bg-emerald-100 text-emerald-700" },
  cancelled:       { label: "ملغاة",           cls: "bg-red-100 text-red-600" },
};

const BUS_COLOR_MAP: Record<string, string> = {
  white: "#ffffff", silver: "#c0c0c0", gray: "#6b7280",
  black: "#1f2937", blue: "#3b82f6", red: "#ef4444",
  green: "#22c55e", yellow: "#eab308", orange: "#f97316", beige: "#d4b896",
};
const BUS_COLOR_LABELS: Record<string, string> = {
  white: "أبيض", silver: "فضي", gray: "رمادي", black: "أسود",
  blue: "أزرق", red: "أحمر", green: "أخضر", yellow: "أصفر",
  orange: "برتقالي", beige: "بيج",
};

export default function PassengerManifestPage({
  packageId,
  navigate,
}: {
  packageId: Id<"packages">;
  navigate: (p: Page) => void;
}) {
  const data = useQuery(api.packages.getPassengerManifest, { packageId });
  // manifestRef محذوف — نستخدم buildPrintHTML بدلاً من innerHTML

  const buildPrintHTML = useCallback(() => {
    if (!data) return "";
    const { package: pkg, office, driver, trip, bookings } = data;
    const activeBookings = bookings.filter((b: any) => b.status !== "cancelled");
    const confirmedCount = bookings.filter((b: any) => b.status === "confirmed" || b.status === "completed").length;
    const pendingCount   = bookings.filter((b: any) => b.status === "pending").length;
    const cancelledCount = bookings.filter((b: any) => b.status === "cancelled").length;
    const totalPassengers = activeBookings.reduce((s: number, b: any) => s + b.adultsCount + (b.childrenCount ?? 0), 0);

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "—";
    const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const tripStatusLabel: Record<string, string> = {
      scheduled: "مجدولة", driver_assigned: "تم تعيين السائق",
      driver_accepted: "السائق قبل", in_progress: "جارية الآن",
      completed: "مكتملة", cancelled: "ملغاة",
    };
    const bookingStatusBadge: Record<string, string> = {
      pending:   `<span class="badge badge-pending">قيد المراجعة</span>`,
      confirmed: `<span class="badge badge-confirmed">مؤكد</span>`,
      cancelled: `<span class="badge badge-cancelled">ملغي</span>`,
      completed: `<span class="badge badge-completed">مكتمل</span>`,
    };
    const busColorHex = driver?.busColor ? (BUS_COLOR_MAP[driver.busColor] ?? "#888") : null;
    const busColorLabel = driver?.busColor ? (BUS_COLOR_LABELS[driver.busColor] ?? driver.busColor) : null;

    const driverSection = driver ? `
      <div class="drv-card">
        <div class="drv-title">
          🚌 بيانات السائق والحافلة
          ${driver.isApproved ? `<span class="badge-approved">✓ معتمد</span>` : ""}
        </div>
        <div class="drv-body">
          <div>
            ${driver.profileImageUrl
              ? `<img src="${driver.profileImageUrl}" class="drv-img" alt="${driver.name}"/>`
              : `<div class="drv-img-ph">👤</div>`}
            ${driver.driverCode ? `<div class="drv-code">#${driver.driverCode}</div>` : ""}
          </div>
          <div class="drv-grid">
            <div class="drv-field"><div class="lbl">اسم السائق</div><div class="val">${driver.name}</div></div>
            ${driver.phone ? `<div class="drv-field"><div class="lbl">رقم الجوال</div><div class="val" dir="ltr">${driver.phone}</div></div>` : ""}
            ${driver.nationality ? `<div class="drv-field"><div class="lbl">الجنسية</div><div class="val">${driver.nationality}</div></div>` : ""}
            ${driver.plateNumber ? `<div class="drv-field"><div class="lbl">رقم اللوحة</div><div class="val plate">${driver.plateNumber}</div></div>` : ""}
            ${driver.busType ? `<div class="drv-field"><div class="lbl">نوع الحافلة</div><div class="val">${driver.busType}</div></div>` : ""}
            ${busColorHex ? `<div class="drv-field"><div class="lbl">لون الحافلة</div><div class="val"><span class="color-dot" style="background:${busColorHex}"></span>${busColorLabel}</div></div>` : ""}
            ${driver.busCapacity ? `<div class="drv-field"><div class="lbl">عدد المقاعد</div><div class="val">${driver.busCapacity} مقعد</div></div>` : ""}
            ${driver.transportCompanyName ? `<div class="drv-field"><div class="lbl">شركة النقل</div><div class="val">${driver.transportCompanyName}</div></div>` : ""}
            ${driver.licenseStatus ? `<div class="drv-field"><div class="lbl">حالة الرخصة</div><div class="val ${driver.licenseStatus === "valid" ? "valid" : "expired"}">${driver.licenseStatus === "valid" ? "سارية ✓" : "منتهية ✗"}</div></div>` : ""}
          </div>
        </div>
      </div>` : trip ? `
      <div class="no-drv">⚠️ لم يتم تعيين سائق لهذا البرنامج بعد</div>` : `
      <div class="no-drv">لم يتم إنشاء رحلة لهذا البرنامج بعد</div>`;

    const rows = bookings.map((b: any, i: number) => `
      <tr class="${b.status === "cancelled" ? "cancelled" : ""}">
        <td style="color:#9ca3af;font-family:monospace;font-weight:700">${i + 1}</td>
        <td><strong>${b.leadPassengerName}</strong>${b.notes ? `<br/><span style="font-size:8px;color:#9ca3af">${b.notes}</span>` : ""}</td>
        <td class="id-num">${b.leadPassengerIdNumber ?? "—"}</td>
        <td><span class="phone">${b.leadPassengerPhone ?? "—"}</span></td>
        <td>${b.nationality ?? "—"}</td>
        <td style="text-align:center"><span class="badge badge-pending" style="background:#ede9fe;color:#5b21b6">${b.adultsCount} بالغ${b.childrenCount ? ` + ${b.childrenCount} طفل` : ""}</span></td>
        <td class="ref">${b.bookingReference ?? "—"}</td>
        <td>${bookingStatusBadge[b.status] ?? bookingStatusBadge.pending}</td>
      </tr>`).join("");

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>كشف الركاب — ${pkg.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  @page{size:A4 landscape;margin:8mm 12mm;}
  html,body{width:100%;font-family:'Tajawal',Arial,sans-serif;font-size:11px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .wrap{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;}
  /* Header */
  .hdr{background:linear-gradient(135deg,#4c1d95,#5b21b6,#3730a3);color:#fff;padding:14px 18px;}
  .hdr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
  .hdr h1{font-size:18px;font-weight:900;margin-bottom:3px;}
  .hdr .sub{font-size:10px;color:#c4b5fd;}
  .hdr .logo{height:42px;object-fit:contain;opacity:.9;mix-blend-mode:screen;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;}
  .stat-box{background:rgba(255,255,255,.13);border-radius:8px;padding:7px;text-align:center;}
  .stat-box .val{font-size:20px;font-weight:900;}
  .stat-box .lbl{font-size:9px;color:#c4b5fd;margin-top:1px;}
  /* Trip status badge */
  .trip-st{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:rgba(255,255,255,.2);color:#fff;margin-top:4px;}
  /* Info bar */
  .info-bar{background:#f5f3ff;border-bottom:1px solid #e9d5ff;padding:8px 18px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .info-item .lbl{font-size:9px;color:#9ca3af;}
  .info-item .val{font-size:11px;font-weight:700;color:#1f2937;}
  /* Driver */
  .drv-card{background:linear-gradient(135deg,#ecfdf5,#f0fdfa);border-bottom:1px solid #a7f3d0;padding:10px 18px;}
  .drv-title{font-size:11px;font-weight:900;color:#065f46;margin-bottom:8px;}
  .drv-body{display:flex;align-items:flex-start;gap:14px;}
  .drv-img{width:64px;height:64px;border-radius:10px;object-fit:cover;border:2px solid #6ee7b7;flex-shrink:0;}
  .drv-img-ph{width:64px;height:64px;border-radius:10px;background:#d1fae5;border:2px solid #6ee7b7;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;}
  .drv-code{font-size:8px;font-family:monospace;color:#9ca3af;text-align:center;margin-top:3px;background:#f3f4f6;border-radius:4px;padding:1px 4px;}
  .drv-grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
  .drv-field .lbl{font-size:8px;color:#9ca3af;}
  .drv-field .val{font-size:10px;font-weight:700;color:#1f2937;}
  .drv-field .val.plate{color:#92400e;font-family:monospace;font-size:12px;font-weight:900;}
  .drv-field .val.valid{color:#065f46;}
  .drv-field .val.expired{color:#dc2626;}
  .badge-approved{display:inline-flex;align-items:center;gap:3px;background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:20px;padding:1px 8px;font-size:8px;font-weight:700;}
  .color-dot{width:10px;height:10px;border-radius:50%;border:1px solid #d1d5db;display:inline-block;vertical-align:middle;margin-left:3px;}
  .no-drv{background:#fffbeb;border-bottom:1px solid #fde68a;padding:8px 18px;color:#92400e;font-size:10px;font-weight:600;}
  /* Table */
  table{width:100%;border-collapse:collapse;}
  thead tr{background:linear-gradient(90deg,#f9fafb,#f3f4f6);border-bottom:2px solid #e5e7eb;}
  th{padding:6px 8px;text-align:right;font-size:9px;font-weight:700;color:#6b7280;white-space:nowrap;}
  td{padding:5px 8px;font-size:10px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:middle;}
  tr:nth-child(even) td{background:#fafafa;}
  tr.cancelled td{opacity:.4;}
  .badge{display:inline-block;padding:1px 7px;border-radius:20px;font-size:8px;font-weight:700;}
  .badge-confirmed{background:#d1fae5;color:#065f46;}
  .badge-pending{background:#fef3c7;color:#92400e;}
  .badge-cancelled{background:#fee2e2;color:#dc2626;}
  .badge-completed{background:#dbeafe;color:#1d4ed8;}
  .ref{font-family:monospace;font-weight:900;color:#059669;font-size:9px;}
  .id-num{font-family:monospace;font-size:9px;}
  .phone{font-family:monospace;font-size:9px;direction:ltr;display:inline-block;}
  tfoot td{background:#f5f3ff;border-top:2px solid #c4b5fd;font-weight:700;font-size:10px;padding:6px 8px;}
  /* Footer */
  .page-footer{padding:6px 18px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#9ca3af;border-top:1px dashed #e5e7eb;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="sub">كشف الركاب الرسمي — ${office?.name ?? "مكتب السفر"}</div>
        <h1>${pkg.title}</h1>
        ${trip ? `<div class="trip-st">${tripStatusLabel[trip.status] ?? trip.status}</div>` : ""}
      </div>
      <img src="${LOGO}" class="logo" alt="المسار الذكي"/>
    </div>
    <div class="stats">
      <div class="stat-box"><div class="val">${bookings.length}</div><div class="lbl">إجمالي الحجوزات</div></div>
      <div class="stat-box"><div class="val">${totalPassengers}</div><div class="lbl">إجمالي الركاب</div></div>
      <div class="stat-box"><div class="val">${confirmedCount}</div><div class="lbl">مؤكد</div></div>
      <div class="stat-box"><div class="val">${pendingCount}</div><div class="lbl">قيد المراجعة</div></div>
    </div>
  </div>

  <div class="info-bar">
    <div class="info-item"><div class="lbl">تاريخ الانطلاق</div><div class="val">${fmt(pkg.departureDate)}</div></div>
    <div class="info-item"><div class="lbl">تاريخ العودة</div><div class="val">${fmt(pkg.returnDate)}</div></div>
    <div class="info-item"><div class="lbl">مدينة الانطلاق</div><div class="val">${pkg.departureCity ?? "—"}</div></div>
    <div class="info-item"><div class="lbl">إجمالي الركاب</div><div class="val" style="color:#059669">${totalPassengers} راكب</div></div>
  </div>

  ${driverSection}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>اسم المسافر الرئيسي</th>
        <th>رقم الهوية</th>
        <th>الجوال</th>
        <th>الجنسية</th>
        <th>الركاب</th>
        <th>رقم الحجز</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    ${bookings.length > 0 ? `
    <tfoot>
      <tr>
        <td colspan="5">الإجمالي — ${activeBookings.length} حجز نشط</td>
        <td style="text-align:center"><span class="badge" style="background:#ede9fe;color:#5b21b6">${totalPassengers} راكب</span></td>
        <td></td>
        <td style="font-size:9px">
          <span style="color:#059669">✓ ${confirmedCount} مؤكد</span>
          ${pendingCount > 0 ? ` &nbsp; <span style="color:#92400e">⏳ ${pendingCount}</span>` : ""}
          ${cancelledCount > 0 ? ` &nbsp; <span style="color:#dc2626">✗ ${cancelledCount}</span>` : ""}
        </td>
      </tr>
    </tfoot>` : ""}
  </table>

  <div class="page-footer">
    <span>🕋 المسار الذكي للعمرة — وثيقة رسمية</span>
    <span>تاريخ الطباعة: ${printDate}</span>
    <span>جميع الحقوق محفوظة ©</span>
  </div>
</div>
</body>
</html>`;
  }, [data]);

  const handlePrint = useCallback(() => {
    const html = buildPrintHTML();
    if (!html) return;
    void printHtml(html, { width: "297mm", height: "210mm" });
    return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();

    // انتظر تحميل الخطوط ثم اطبع
    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 2000);
    }, 800);
  }, [buildPrintHTML]);

  if (data === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500">جارٍ تحميل كشف الركاب...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-500 mb-6">ليس لديك صلاحية عرض هذا الكشف</p>
          <button
            onClick={() => navigate({ name: "office-dashboard" })}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            العودة للوحة المكتب
          </button>
        </div>
      </div>
    );
  }

  const { package: pkg, office, driver, trip, bookings } = data;
  const activeBookings  = bookings.filter((b) => b.status !== "cancelled");
  const confirmedCount  = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const pendingCount    = bookings.filter((b) => b.status === "pending").length;
  const cancelledCount  = bookings.filter((b) => b.status === "cancelled").length;
  const totalPassengers = activeBookings.reduce((s, b) => s + b.adultsCount + (b.childrenCount ?? 0), 0);

  const departureDateStr = pkg.departureDate
    ? new Date(pkg.departureDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const returnDateStr = pkg.returnDate
    ? new Date(pkg.returnDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const printDateStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const tripSt = trip ? (TRIP_STATUS_MAP[trip.status] ?? { label: trip.status, cls: "bg-gray-100 text-gray-600" }) : null;
  const busColorHex = driver?.busColor ? (BUS_COLOR_MAP[driver.busColor] ?? "#f3f4f6") : null;

  return (
    <div id="manifest-root" className="min-h-screen bg-gray-50" dir="rtl">

      {/* شريط التنقل */}
      <div className="no-print bg-gradient-to-r from-purple-900 to-purple-800 text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate({ name: "office-dashboard" })}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للوحة المكتب
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة الكشف
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* الكشف الرئيسي */}
        <div id="manifest-area" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* ── رأس الكشف ── */}
          <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-700 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-purple-200 text-sm mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  كشف الركاب الرسمي
                </p>
                <h1 className="text-2xl font-black mb-1">{pkg.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-purple-200 text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {office?.name ?? "مكتب السفر"}
                  </p>
                  {tripSt && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tripSt.cls}`}>
                      {tripSt.label}
                    </span>
                  )}
                </div>
              </div>
              <img src={LOGO} alt="المسار الذكي" className="h-12 w-auto object-contain opacity-90" style={{ mixBlendMode: "screen" }} />
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "إجمالي الحجوزات", value: bookings.length },
                { label: "إجمالي الركاب",   value: totalPassengers },
                { label: "مؤكد",            value: confirmedCount },
                { label: "قيد المراجعة",    value: pendingCount },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black">{s.value}</div>
                  <div className="text-xs text-purple-200 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── تفاصيل البرنامج ── */}
          <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">تاريخ الانطلاق</p>
                  <p className="font-bold text-gray-800">{departureDateStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">تاريخ العودة</p>
                  <p className="font-bold text-gray-800">{returnDateStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">مدينة الانطلاق</p>
                  <p className="font-bold text-gray-800">{pkg.departureCity}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">إجمالي الركاب</p>
                  <p className="font-bold text-emerald-700">{totalPassengers} راكب</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── بطاقة السائق الكاملة (من جدول drivers) ── */}
          {driver ? (
            <div className="px-6 py-5 bg-gradient-to-l from-emerald-50 to-teal-50 border-b border-emerald-100">
              <h3 className="text-sm font-black text-emerald-800 mb-4 flex items-center gap-2">
                <Bus className="w-4 h-4" />
                بيانات السائق والحافلة
                {driver.isApproved && (
                  <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    <BadgeCheck className="w-3 h-3" />
                    معتمد
                  </span>
                )}
              </h3>

              <div className="flex items-start gap-5">
                {/* صورة السائق */}
                <div className="flex-shrink-0">
                  {driver.profileImageUrl ? (
                    <img
                      src={driver.profileImageUrl}
                      alt={driver.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-emerald-400" />
                    </div>
                  )}
                  {driver.driverCode && (
                    <p className="text-center text-[10px] font-mono text-gray-400 mt-1.5 bg-gray-100 rounded-lg px-1.5 py-0.5">
                      #{driver.driverCode}
                    </p>
                  )}
                </div>

                {/* تفاصيل السائق */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {/* الاسم */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">اسم السائق</p>
                      <p className="font-black text-gray-800">{driver.name}</p>
                    </div>
                  </div>

                  {/* الجوال */}
                  {driver.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">رقم الجوال</p>
                        <p className="font-bold text-gray-800 font-mono" dir="ltr">{driver.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* الجنسية */}
                  {driver.nationality && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">الجنسية</p>
                        <p className="font-bold text-gray-800">{driver.nationality}</p>
                      </div>
                    </div>
                  )}

                  {/* رقم اللوحة */}
                  {driver.plateNumber && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">رقم اللوحة</p>
                        <p className="font-black text-amber-800 font-mono">{driver.plateNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* نوع الحافلة */}
                  {driver.busType && (
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">نوع الحافلة</p>
                        <p className="font-bold text-gray-800">{driver.busType}</p>
                      </div>
                    </div>
                  )}

                  {/* لون الحافلة */}
                  {driver.busColor && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: busColorHex ?? "#888" }}
                      />
                      <div>
                        <p className="text-xs text-gray-400">لون الحافلة</p>
                        <p className="font-bold text-gray-800">{BUS_COLOR_LABELS[driver.busColor] ?? driver.busColor}</p>
                      </div>
                    </div>
                  )}

                  {/* عدد المقاعد */}
                  {driver.busCapacity && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">عدد المقاعد</p>
                        <p className="font-bold text-gray-800">{driver.busCapacity} مقعد</p>
                      </div>
                    </div>
                  )}

                  {/* شركة النقل */}
                  {driver.transportCompanyName && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">شركة النقل</p>
                        <p className="font-bold text-gray-800">{driver.transportCompanyName}</p>
                      </div>
                    </div>
                  )}

                  {/* حالة الرخصة */}
                  {driver.licenseStatus && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">حالة الرخصة</p>
                        <p className={`font-bold text-sm ${driver.licenseStatus === "valid" ? "text-emerald-700" : "text-red-600"}`}>
                          {driver.licenseStatus === "valid" ? "سارية" : driver.licenseStatus === "expired" ? "منتهية" : driver.licenseStatus}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : trip ? (
            /* رحلة موجودة لكن بدون سائق بعد */
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">لم يتم تعيين سائق لهذا البرنامج بعد — ستظهر بيانات السائق هنا فور تعيينه</p>
              </div>
            </div>
          ) : (
            /* لا توجد رحلة */
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3 text-gray-400">
                <Bus className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">لم يتم إنشاء رحلة لهذا البرنامج بعد</p>
              </div>
            </div>
          )}

          {/* ── جدول الركاب ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-l from-gray-100 to-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">اسم المسافر الرئيسي</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">رقم الهوية</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">الجوال</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">الجنسية</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">الركاب</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">رقم الحجز</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400 font-semibold">لا توجد حجوزات لهذا البرنامج بعد</p>
                    </td>
                  </tr>
                ) : bookings.map((b, idx) => {
                  const st = STATUS_MAP[b.status] ?? STATUS_MAP.pending;
                  const isCancelled = b.status === "cancelled";
                  return (
                    <tr
                      key={b._id}
                      className={`transition-colors ${isCancelled ? "opacity-40 bg-red-50/30" : "hover:bg-purple-50/30"}`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs font-bold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800">{b.leadPassengerName}</div>
                        {b.notes && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{b.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-semibold">{b.leadPassengerIdNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600" dir="ltr">{b.leadPassengerPhone}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {(b as any).nationality ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          {b.adultsCount} بالغ{b.childrenCount ? ` + ${b.childrenCount} طفل` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-black text-emerald-700">{b.bookingReference}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {bookings.length > 0 && (
                <tfoot>
                  <tr className="bg-purple-50 border-t-2 border-purple-200">
                    <td colSpan={5} className="px-4 py-3 font-black text-gray-700 text-sm">
                      الإجمالي — {activeBookings.length} حجز نشط
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs font-black">
                        {totalPassengers} راكب
                      </span>
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                      <div className="text-emerald-600 font-semibold">✓ {confirmedCount} مؤكد</div>
                      {pendingCount > 0 && <div className="text-amber-600">⏳ {pendingCount} قيد المراجعة</div>}
                      {cancelledCount > 0 && <div className="text-red-500">✗ {cancelledCount} ملغي</div>}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ── تذييل الكشف ── */}
          <div className="px-6 py-4 border-t border-dashed border-gray-200 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              المسار الذكي للعمرة — وثيقة رسمية
            </span>
            <span>تاريخ الطباعة: {printDateStr}</span>
            <span>جميع الحقوق محفوظة ©</span>
          </div>
        </div>

        {/* ── ملخص إضافي (لا يُطبع) ── */}
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-purple-700">{totalPassengers} راكب</p>
              <p className="text-sm text-gray-500 mt-0.5">إجمالي الركاب</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-700">
                {bookings.length ? Math.round((confirmedCount / bookings.length) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-0.5">نسبة التأكيد</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-600">{cancelledCount} حجز</p>
              <p className="text-sm text-gray-500 mt-0.5">حجوزات ملغاة</p>
            </div>
          </div>
        </div>

        {/* ── أزرار ── */}
        <div className="no-print flex gap-3">
          <button
            onClick={() => navigate({ name: "office-dashboard" })}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للوحة المكتب
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة الكشف
          </button>
        </div>
      </div>


    </div>
  );
}
