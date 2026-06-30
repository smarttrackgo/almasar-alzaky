import { useQuery } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import {
  ArrowRight, CheckCircle, Clock, XCircle, Star,
  Calendar, Users, Phone, CreditCard,
  Building2, Hash, Printer, Share2,
  Bus, Navigation, User, FileText, Shield,
  Loader2, AlertCircle, QrCode, Hotel, Plane,
  Mail, Send, MapPin,
} from "lucide-react";
import { useEffect, useRef, ReactNode, useState } from "react";
import { toast } from "sonner";
import { printHtml } from "../lib/printDocument";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { programReference } from "../lib/programReference";

/* ══════════════════════════════════════════════════════════════════
   الثوابت والخرائط
   ══════════════════════════════════════════════════════════════════ */

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: ReactNode }> = {
  pending:   { label: "قيد المراجعة", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   icon: <Clock className="w-5 h-5 text-amber-500" /> },
  confirmed: { label: "مؤكد",         color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
  cancelled: { label: "ملغي",         color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle className="w-5 h-5 text-red-500" /> },
  completed: { label: "مكتمل",        color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: <Star className="w-5 h-5 text-blue-500" /> },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "في الانتظار", color: "text-amber-600" },
  completed: { label: "مدفوع",       color: "text-emerald-600" },
  failed:    { label: "فشل",         color: "text-red-600" },
  refunded:  { label: "مسترجع",      color: "text-blue-600" },
};

/* ══════════════════════════════════════════════════════════════════
   شاشة التحميل — تمنع الشاشة البيضاء عند تأخر البيانات
   ══════════════════════════════════════════════════════════════════ */

function TicketLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-6 text-center px-6">
        {/* أيقونة متحركة */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-800/60 border border-emerald-700/50 flex items-center justify-center shadow-2xl">
            <QrCode className="w-10 h-10 text-emerald-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-900 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
        </div>

        {/* النص */}
        <div>
          <p className="text-white font-bold text-lg mb-1">جاري تحميل التذكرة...</p>
          <p className="text-emerald-400 text-sm">يرجى الانتظار لحظة</p>
        </div>

        {/* هيكل عظمي للتذكرة (Skeleton) */}
        <div className="w-full max-w-sm bg-white/5 rounded-2xl p-5 space-y-3 border border-white/10">
          <div className="h-5 bg-white/10 rounded-lg w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-lg w-1/2 animate-pulse" />
          <div className="h-px bg-white/10 my-2" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
          </div>
          <div className="h-16 bg-white/10 rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   مكوّن الباركود — مفصول ومستقل
   ══════════════════════════════════════════════════════════════════ */

/**
 * SimpleBarcode
 * يرسم باركود بسيط على Canvas بناءً على قيمة نصية.
 * مفصول تماماً عن بقية الصفحة لسهولة الصيانة.
 */
function SimpleBarcode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value) return; // حماية من القيم الفارغة
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const chars = value.split("").map((c) => c.charCodeAt(0));
    const totalBars = 60;
    const barW = W / totalBars;

    // خلفية بيضاء
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    // رسم الأشرطة
    ctx.fillStyle = "#1a1a1a";
    for (let i = 0; i < totalBars; i++) {
      const charIdx = i % chars.length;
      const bit = (chars[charIdx] >> (i % 8)) & 1;
      if (bit) {
        const h = H * (0.6 + (chars[charIdx] % 4) * 0.1);
        ctx.fillRect(i * barW, (H - h) / 2, barW * 0.7, h);
      }
    }

    // رقم الحجز أسفل الباركود
    ctx.fillStyle = "#333";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, W / 2, H - 4);
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      className="mx-auto"
      style={{ imageRendering: "pixelated" }}
      aria-label={`باركود الحجز: ${value}`}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   مكوّن QR Code — مفصول ومستقل
   ══════════════════════════════════════════════════════════════════ */

/**
 * generateQRMatrix
 * دالة مساعدة خالصة (pure function) تولّد مصفوفة الـ QR بناءً على القيمة.
 * مفصولة عن الـ Canvas لسهولة الاختبار والصيانة.
 */
function generateQRMatrix(value: string): boolean[][] {
  const cells = 21;
  const hash = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const matrix: boolean[][] = Array.from({ length: cells }, () =>
    Array(cells).fill(false)
  );

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const isFinderZone =
        (r < 7 && c < 7) ||
        (r < 7 && c >= cells - 7) ||
        (r >= cells - 7 && c < 7);

      if (isFinderZone) {
        // حدود مربعات الزوايا
        const inBorder =
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= cells - 7 && (r === cells - 7 || r === cells - 1 || c === 0 || c === 6)) ||
          (r < 7 && c >= cells - 7 && (r === 0 || r === 6 || c === cells - 7 || c === cells - 1));
        // المربعات الداخلية الصغيرة
        const inInner =
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) ||
          (r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4);

        matrix[r][c] = inBorder || inInner;
      } else {
        // بيانات عشوائية مبنية على hash الرقم المرجعي
        matrix[r][c] = ((hash * (r + 1) * (c + 1)) % 3) === 0;
      }
    }
  }
  return matrix;
}

/**
 * SimpleQR
 * يرسم رمز QR على Canvas بناءً على قيمة نصية.
 * يستخدم generateQRMatrix لفصل منطق التوليد عن الرسم.
 */
function LegacySimpleQR({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value) return; // حماية من القيم الفارغة
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    const cells = 21;
    const cellSize = size / cells;

    // خلفية بيضاء
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);

    // رسم الخلايا
    ctx.fillStyle = "#1a1a1a";
    const matrix = generateQRMatrix(value);
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="mx-auto"
      aria-label={`رمز QR للحجز: ${value}`}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   قسم الباركود والـ QR — مكوّن مستقل
   ══════════════════════════════════════════════════════════════════ */

/**
 * TicketCodesSection
 * يعرض الباركود ورمز QR معاً في بطاقة واحدة.
 * مفصول لسهولة إعادة الاستخدام في الطباعة والعرض.
 */
function SimpleQR({ value }: { value: string }) {
  return (
    <div className="inline-flex bg-white p-3 rounded-xl border-2 border-gray-900 shadow-sm">
      <QRCodeSVG
        value={value}
        size={168}
        level="H"
        marginSize={4}
        bgColor="#ffffff"
        fgColor="#000000"
        aria-label={`رمز QR للحجز: ${value}`}
      />
    </div>
  );
}

function AttendanceQRCode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: 240,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(console.error);
  }, [value]);

  return (
    <div className="inline-flex bg-white p-3 rounded-2xl border-4 border-emerald-700 shadow-md">
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        className="w-56 h-56 max-w-full"
        aria-label={`QR حضور الحجز: ${value}`}
      />
    </div>
  );
}

function TicketCodesSection({ bookingReference, bookingId }: {
  bookingReference: string;
  bookingId: string;
}) {
  // حماية: لا نرسم إذا كانت البيانات غير جاهزة
  if (!bookingReference || !bookingId) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>جاري تحميل رموز التذكرة...</span>
        </div>
      </div>
    );
  }

  // الصيغة: MASARDHAKI:REF:<bookingReference> — يقرأها ماسح السائق مباشرة
  const qrValue = `${window.location.origin}/?attendance=1&ref=${encodeURIComponent(bookingReference)}`;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 rounded-2xl p-5">
      {/* الباركود */}
      <div className="flex-1 text-center">
        <p className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1 font-medium">
          <QrCode className="w-3.5 h-3.5" />
          باركود الحجز
        </p>
        <SimpleBarcode value={bookingReference} />
        <p className="text-xs text-gray-400 mt-1 font-mono tracking-widest">{bookingReference}</p>
      </div>

      {/* فاصل */}
      <div className="hidden md:flex flex-col items-center gap-2">
        <div className="w-px h-20 bg-gray-200" />
        <span className="text-xs text-gray-300 font-medium">أو</span>
        <div className="w-px h-20 bg-gray-200" />
      </div>
      <div className="md:hidden w-full h-px bg-gray-200" />

      {/* QR Code */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1 font-medium">
          <QrCode className="w-3.5 h-3.5" />
          رمز QR للمسح
        </p>
        <AttendanceQRCode value={qrValue} />
        <p className="text-xs text-emerald-700 font-bold mt-2">يمسحه السائق لتسجيل الحضور</p>
        <p className="text-xs text-gray-500 mt-1 font-mono tracking-widest">{bookingReference}</p>
        <p className="text-xs text-gray-400 mt-1">امسح للتحقق</p>
      </div>
    </div>
  );
}

export default function BookingDetailPage({
  bookingId,
  navigate,
}: {
  bookingId: Id<"bookings">;
  navigate: (p: Page) => void;
}) {
  const data = useQuery(api.bookings.getBookingById, { bookingId });
  const resendTicket = useAction(api.emailActions.resendTicket);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleResendTicket = async () => {
    setSendingEmail(true);
    try {
      const result = await resendTicket({ bookingId });
      if (result.success) {
        toast.success("✅ تم إرسال التذكرة بنجاح إلى بريدك الإلكتروني!");
      } else {
        toast.error(result.error ?? "فشل إرسال التذكرة");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ أثناء الإرسال");
    } finally {
      setSendingEmail(false);
    }
  };

  /* ── حالة التحميل: البيانات لم تصل بعد (undefined = جاري التحميل) ── */
  if (data === undefined) {
    return <TicketLoadingScreen />;
  }

  /* ── حالة الخطأ: الحجز غير موجود أو لا صلاحية ── */
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center" dir="rtl">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-red-900/40 border border-red-700/50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">الحجز غير موجود</h2>
          <p className="text-emerald-300 mb-6 text-sm leading-relaxed max-w-xs mx-auto">
            لم يتم العثور على هذا الحجز أو ليس لديك صلاحية الوصول إليه.
          </p>
          <button
            onClick={() => navigate({ name: "bookings" })}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            العودة لحجوزاتي
          </button>
        </div>
      </div>
    );
  }

  /* ── حماية إضافية: تحقق من الحقول الأساسية قبل العرض ── */
  if (!data.bookingReference || !data._id) {
    return <TicketLoadingScreen />;
  }

  const status        = STATUS_MAP[data.status] ?? STATUS_MAP.pending;
  const paymentStatus = data.payment ? (PAYMENT_STATUS[data.payment.status] ?? PAYMENT_STATUS.pending) : null;
  const isConfirmed   = data.status === "confirmed" || data.status === "completed";
  const packageRef    = programReference(data.package);

  const departureDateStr = data.package?.departureDate
    ? new Date(data.package.departureDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const returnDateStr = data.package?.returnDate
    ? new Date(data.package.returnDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const issueDateStr = new Date(data._creationTime).toLocaleDateString("ar-SA");

  // ── بناء HTML نظيف للطباعة (iframe منفصل) ──
  const buildTicketHTML = async () => {
    if (!data) return "";

    const status        = STATUS_MAP[data.status] ?? STATUS_MAP.pending;
    const paymentStatus = data.payment ? (PAYMENT_STATUS[data.payment.status] ?? PAYMENT_STATUS.pending) : null;
    const isConfirmed   = data.status === "confirmed" || data.status === "completed";

    const departureDateStr = data.package?.departureDate
      ? new Date(data.package.departureDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
      : "—";
    const returnDateStr = data.package?.returnDate
      ? new Date(data.package.returnDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
      : "—";
    const issueDateStr = new Date(data._creationTime).toLocaleDateString("ar-SA");
    const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const qrValue = `${window.location.origin}/?attendance=1&ref=${encodeURIComponent(data.bookingReference)}`;
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 240,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const statusColors: Record<string, string> = {
      pending:   "#92400e",
      confirmed: "#065f46",
      cancelled: "#dc2626",
      completed: "#1d4ed8",
    };
    const statusBg: Record<string, string> = {
      pending:   "#fef3c7",
      confirmed: "#d1fae5",
      cancelled: "#fee2e2",
      completed: "#dbeafe",
    };
    const statusLabel: Record<string, string> = {
      pending: "قيد المراجعة", confirmed: "مؤكد", cancelled: "ملغي", completed: "مكتمل",
    };

    const driverSection = (data.driver || data.bus) && data.showDriverInfo ? `
      <div class="drv-card">
        <div class="drv-header">🚌 بيانات السائق والحافلة</div>
        <div class="drv-body">
          ${data.driver?.profileImageUrl
            ? `<img src="${data.driver.profileImageUrl}" class="drv-img" alt="${data.driver.name}"/>`
            : `<div class="drv-img-ph">${(data.driver?.name ?? "؟").charAt(0)}</div>`}
          <div class="drv-info">
            <div class="drv-name">${data.driver?.name ?? data.bus?.driverName ?? "—"}</div>
            ${data.driver?.transportCompanyName ? `<div class="drv-company">🚌 ${data.driver.transportCompanyName}</div>` : ""}
            ${(data.driver?.phone ?? data.bus?.driverPhone) ? `<div class="drv-phone" dir="ltr">${data.driver?.phone ?? data.bus?.driverPhone}</div>` : ""}
          </div>
        </div>
        <div class="drv-grid">
          ${(data.driver?.plateNumber ?? data.bus?.plateNumber) ? `<div class="drv-field"><div class="lbl">رقم اللوحة</div><div class="val plate">${data.driver?.plateNumber ?? data.bus?.plateNumber}</div></div>` : ""}
          ${(data.driver?.busType ?? data.bus?.busType) ? `<div class="drv-field"><div class="lbl">نوع الحافلة</div><div class="val">${data.driver?.busType ?? data.bus?.busType}</div></div>` : ""}
          ${(data.driver?.nationality ?? data.bus?.driverNationality) ? `<div class="drv-field"><div class="lbl">الجنسية</div><div class="val">${data.driver?.nationality ?? data.bus?.driverNationality}</div></div>` : ""}
          ${data.trip?.departureDate ? `<div class="drv-field"><div class="lbl">موعد الانطلاق</div><div class="val">${new Date(data.trip.departureDate).toLocaleDateString("ar-SA")}</div></div>` : ""}
        </div>
      </div>` : data.trip?.driverId ? `
      <div class="info-box amber">⏳ تم تعيين سائق لرحلتك — ستظهر بياناته قبل 6 ساعات من الانطلاق</div>` : `
      <div class="info-box gray">🚌 لم يُعيَّن سائق بعد — سيتم إشعارك فور التعيين</div>`;

    const hotelSection = data.package?.hotelMecca ? `
      <div class="section">
        <div class="section-title">🏨 الفندق</div>
        <div class="hotel-card">
          <div>
            <div class="hotel-name">${data.package.hotelMecca}</div>
            ${data.package.hotelMadinah ? `<div class="hotel-sub">المدينة المنورة: ${data.package.hotelMadinah}</div>` : ""}
            ${data.package.hotelStars ? `<div class="stars">${"★".repeat(data.package.hotelStars)}</div>` : ""}
          </div>
        </div>
      </div>` : "";

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>تذكرة عمرة — ${data.bookingReference}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  @page{size:A4 portrait;margin:10mm 12mm;}
  html,body{
    width:100%;font-family:'Tajawal',Arial,sans-serif;
    font-size:12px;color:#111;background:#fff;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
  }
  .ticket{border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff;max-width:700px;margin:0 auto;}

  /* Header */
  .hdr{background:linear-gradient(135deg,#065f46,#047857,#0f766e);color:#fff;padding:20px 24px;position:relative;overflow:hidden;}
  .hdr::before{content:"";position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.08);}
  .hdr::after{content:"";position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.06);}
  .hdr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;position:relative;}
  .hdr-badge{font-size:10px;color:#a7f3d0;margin-bottom:4px;}
  .hdr-title{font-size:20px;font-weight:900;margin-bottom:4px;}
  .hdr-office{font-size:11px;color:#a7f3d0;}
  .hdr-logo{height:44px;object-fit:contain;opacity:.9;mix-blend-mode:screen;flex-shrink:0;}
  .ref-bar{background:rgba(255,255,255,.12);border-radius:12px;padding:12px 16px;margin-top:14px;display:flex;justify-content:space-between;align-items:center;position:relative;}
  .ref-label{font-size:10px;color:#a7f3d0;margin-bottom:3px;}
  .ref-num{font-size:22px;font-family:monospace;font-weight:900;letter-spacing:3px;}
  .status-badge{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;background:${statusBg[data.status] ?? "#fef3c7"};color:${statusColors[data.status] ?? "#92400e"};}

  /* Divider */
  .divider{display:flex;align-items:center;margin:0;}
  .divider-circle{width:24px;height:24px;border-radius:50%;background:#f8fafc;border:1px solid #e5e7eb;flex-shrink:0;}
  .divider-line{flex:1;border-top:2px dashed #e5e7eb;margin:0 8px;}

  /* Sections */
  .section{padding:16px 24px;}
  .section-title{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  .cell .lbl{font-size:9px;color:#9ca3af;margin-bottom:3px;}
  .cell .val{font-size:12px;font-weight:700;color:#1f2937;}
  .cell .val.big{font-size:15px;color:#059669;}

  /* Barcode area */
  .barcode-area{background:linear-gradient(135deg,#f9fafb,#f3f4f6);border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:0 24px 16px;display:flex;align-items:center;justify-content:space-around;gap:16px;}
  .barcode-box{text-align:center;}
  .barcode-box .lbl{font-size:9px;color:#9ca3af;margin-bottom:6px;}
  .barcode-sep{width:1px;height:60px;background:#e5e7eb;}
  .barcode-ref{font-family:monospace;font-size:11px;color:#6b7280;margin-top:4px;letter-spacing:2px;}

  /* Passenger */
  .passenger-box{background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:12px;padding:14px;margin:0 24px 16px;}

  /* Payment */
  .payment-box{background:linear-gradient(135deg,#ecfdf5,#f0fdfa);border:1px solid #a7f3d0;border-radius:12px;padding:14px;margin:0 24px 16px;}

  /* Driver */
  .drv-card{background:linear-gradient(135deg,#065f46,#047857);color:#fff;border-radius:12px;padding:16px;margin:0 24px 16px;}
  .drv-header{font-size:11px;font-weight:900;margin-bottom:12px;color:#a7f3d0;}
  .drv-body{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
  .drv-img{width:56px;height:56px;border-radius:10px;object-fit:cover;border:2px solid rgba(255,255,255,.3);flex-shrink:0;}
  .drv-img-ph{width:56px;height:56px;border-radius:10px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;flex-shrink:0;}
  .drv-name{font-size:16px;font-weight:900;}
  .drv-company{font-size:10px;color:#a7f3d0;margin-top:2px;}
  .drv-phone{font-size:11px;color:#6ee7b7;margin-top:3px;font-family:monospace;}
  .drv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .drv-field .lbl{font-size:9px;color:rgba(255,255,255,.6);}
  .drv-field .val{font-size:11px;font-weight:700;color:#fff;}
  .drv-field .val.plate{font-family:monospace;font-size:13px;font-weight:900;color:#fde68a;}

  /* Hotel */
  .hotel-card{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;}
  .hotel-name{font-size:14px;font-weight:900;color:#1f2937;}
  .hotel-sub{font-size:10px;color:#6b7280;margin-top:3px;}
  .stars{color:#f59e0b;font-size:14px;margin-top:4px;}

  /* Info boxes */
  .info-box{border-radius:10px;padding:12px 16px;margin:0 24px 16px;font-size:11px;font-weight:600;}
  .info-box.amber{background:#fffbeb;border:1px solid #fde68a;color:#92400e;}
  .info-box.gray{background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;}

  /* Footer */
  .ticket-footer{padding:12px 24px;border-top:2px dashed #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#9ca3af;}

  /* Instructions */
  .instructions{padding:14px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;}
  .instructions-title{font-size:11px;font-weight:700;color:#374151;margin-bottom:10px;}
  .instructions-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
  .instruction-item{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:10px;color:#4b5563;display:flex;align-items:flex-start;gap:6px;}

  /* Print footer */
  .print-footer{text-align:center;padding:10px;font-size:9px;color:#9ca3af;border-top:1px solid #f3f4f6;}
</style>
</head>
<body>
<div class="ticket">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="hdr-badge">تذكرة عمرة رقمية ${isConfirmed ? "✓ مؤكدة" : "• معلّقة"}</div>
        <div class="hdr-title">${data.package?.title ?? "برنامج عمرة"}</div>
        <div class="hdr-office">🏢 ${data.office?.name ?? "مكتب السفر"}</div>
      </div>
      <img src="${LOGO}" class="hdr-logo" alt="المسار الذكي"/>
    </div>
    <div class="ref-bar">
      <div>
        <div class="ref-label">رقم الحجز</div>
        <div class="ref-num">${data.bookingReference}</div>
        <div style="margin-top:8px;font-size:10px;color:#d1fae5">رقم البرنامج: <span style="font-family:monospace;font-weight:900;color:#fcd34d">${packageRef}</span></div>
      </div>
      <div class="status-badge">${statusLabel[data.status] ?? data.status}</div>
    </div>
  </div>

  <!-- Divider -->
  <div class="divider">
    <div class="divider-circle"></div>
    <div class="divider-line"></div>
    <div class="divider-circle"></div>
  </div>

  <!-- Barcode area -->
  <div class="barcode-area">
    <div class="barcode-box">
      <div class="lbl">📊 باركود الحجز</div>
      <svg width="220" height="60" viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({ length: 55 }, (_, i) => {
          const chars = data.bookingReference.split("").map((c: string) => c.charCodeAt(0));
          const charIdx = i % chars.length;
          const bit = (chars[charIdx] >> (i % 8)) & 1;
          if (!bit) return "";
          const h = 40 + (chars[charIdx] % 4) * 5;
          const x = i * 4;
          const y = (60 - h) / 2;
          return `<rect x="${x}" y="${y}" width="3" height="${h}" fill="#1a1a1a"/>`;
        }).join("")}
        <text x="110" y="58" text-anchor="middle" font-family="monospace" font-size="9" fill="#555">${data.bookingReference}</text>
      </svg>
    </div>
    <div class="barcode-sep"></div>
    <div class="barcode-box">
      <div class="lbl">📱 رمز QR للمسح</div>
      <img src="${qrDataUrl}" alt="QR ${data.bookingReference}" style="width:132px;height:132px;background:#fff;border:2px solid #111;border-radius:10px;padding:8px;"/>
      <div class="barcode-ref" style="font-size:10px;line-height:1.4">امسح لتسجيل الحضور<br/><span style="font-family:monospace">${data.bookingReference}</span></div>
      <svg style="display:none" width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- QR corners -->
        <rect x="2" y="2" width="26" height="26" rx="3" fill="none" stroke="#1a1a1a" stroke-width="3"/>
        <rect x="8" y="8" width="14" height="14" rx="1" fill="#1a1a1a"/>
        <rect x="52" y="2" width="26" height="26" rx="3" fill="none" stroke="#1a1a1a" stroke-width="3"/>
        <rect x="58" y="8" width="14" height="14" rx="1" fill="#1a1a1a"/>
        <rect x="2" y="52" width="26" height="26" rx="3" fill="none" stroke="#1a1a1a" stroke-width="3"/>
        <rect x="8" y="58" width="14" height="14" rx="1" fill="#1a1a1a"/>
        <!-- QR data dots -->
        ${Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
          const hash = data.bookingReference.split("").reduce((a: number, ch: string) => a + ch.charCodeAt(0), 0);
          if (((hash * (r + 3) * (c + 3)) % 3) === 0) {
            return `<rect x="${32 + c * 6}" y="${32 + r * 6}" width="5" height="5" fill="#1a1a1a"/>`;
          }
          return "";
        }).join("")).join("")}
      </svg>
      <div class="barcode-ref">امسح للتحقق</div>
    </div>
  </div>

  <!-- Divider -->
  <div class="divider">
    <div class="divider-circle"></div>
    <div class="divider-line"></div>
    <div class="divider-circle"></div>
  </div>

  <!-- Trip details -->
  <div class="section">
    <div class="section-title">✈️ تفاصيل الرحلة</div>
    <div class="grid-4">
      <div class="cell"><div class="lbl">تاريخ الانطلاق</div><div class="val">${departureDateStr}</div></div>
      <div class="cell"><div class="lbl">تاريخ العودة</div><div class="val">${returnDateStr}</div></div>
      <div class="cell"><div class="lbl">عدد المعتمرين</div><div class="val">${data.adultsCount} بالغ${data.childrenCount ? ` + ${data.childrenCount} طفل` : ""}</div></div>
      <div class="cell"><div class="lbl">مدينة الانطلاق</div><div class="val">${data.package?.departureCity ?? "مكة المكرمة"}</div></div>
    </div>
  </div>

  ${hotelSection}

  <!-- Divider -->
  <div class="divider">
    <div class="divider-circle"></div>
    <div class="divider-line"></div>
    <div class="divider-circle"></div>
  </div>

  <!-- Passenger -->
  <div class="section">
    <div class="section-title">👤 بيانات المسافر الرئيسي</div>
    <div class="passenger-box">
      <div class="grid-3">
        <div class="cell"><div class="lbl">الاسم الكامل</div><div class="val">${data.leadPassengerName}</div></div>
        <div class="cell"><div class="lbl">رقم الجوال</div><div class="val" dir="ltr">${data.leadPassengerPhone ?? "—"}</div></div>
        <div class="cell"><div class="lbl">رقم الهوية</div><div class="val">${data.leadPassengerIdNumber ?? "—"}</div></div>
      </div>
      ${data.notes ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb"><div class="lbl">ملاحظات</div><div style="font-size:11px;color:#374151;margin-top:3px">${data.notes}</div></div>` : ""}
    </div>
  </div>

  <!-- Payment -->
  <div class="section" style="padding-top:0">
    <div class="section-title">💳 تفاصيل الدفع</div>
    <div class="payment-box">
      <div class="grid-4">
        <div class="cell"><div class="lbl">إجمالي المبلغ</div><div class="val big">${data.totalPrice?.toLocaleString("ar-SA")} ريال</div></div>
        <div class="cell"><div class="lbl">حالة الدفع</div><div class="val" style="color:${paymentStatus ? (data.payment?.status === "completed" ? "#059669" : "#92400e") : "#92400e"}">${paymentStatus?.label ?? "لم يُدفع بعد"}</div></div>
        ${data.payment?.transactionId ? `<div class="cell"><div class="lbl">رقم المعاملة</div><div class="val" style="font-family:monospace;font-size:10px">${data.payment.transactionId}</div></div>` : ""}
        ${data.payment?.paidAt ? `<div class="cell"><div class="lbl">تاريخ الدفع</div><div class="val">${new Date(data.payment.paidAt).toLocaleDateString("ar-SA")}</div></div>` : ""}
      </div>
    </div>
  </div>

  ${data.trip ? `
  <!-- Driver -->
  <div class="section" style="padding-top:0">
    <div class="section-title">🚌 معلومات النقل والسائق</div>
    ${driverSection}
  </div>` : ""}

  <!-- Divider -->
  <div class="divider">
    <div class="divider-circle"></div>
    <div class="divider-line"></div>
    <div class="divider-circle"></div>
  </div>

  <!-- Instructions -->
  <div class="instructions">
    <div class="instructions-title">📋 تعليمات مهمة</div>
    <div class="instructions-grid">
      <div class="instruction-item"><span>📋</span><span>احتفظ بهذه التذكرة أو اطبعها للمراجعة عند الحاجة</span></div>
      <div class="instruction-item"><span>🪪</span><span>أحضر هويتك الوطنية أو جواز سفرك في يوم الانطلاق</span></div>
      <div class="instruction-item"><span>⏰</span><span>كن في نقطة التجمع قبل موعد الانطلاق بـ 30 دقيقة</span></div>
      <div class="instruction-item"><span>📞</span><span>تواصل مع المكتب في حال وجود أي استفسار أو تغيير</span></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="ticket-footer">
    <span>🕋 المسار الذكي للعمرة — وثيقة رسمية</span>
    <span>تاريخ الإصدار: ${issueDateStr}</span>
    <span>جميع الحقوق محفوظة ©</span>
  </div>

  <div class="print-footer">طُبع بتاريخ: ${printDate}</div>
</div>
</body>
</html>`;
  };

  const handlePrint = async () => {
    const html = await buildTicketHTML();
    if (!html) return;
    void printHtml(html, { width: "210mm", height: "297mm" });
  };

  const handleShare = async () => {
    const text = [
      `🕋 تذكرة عمرة رقمية - المسار الذكي`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 البرنامج: ${data.package?.title ?? "برنامج عمرة"}`,
      `🏢 المكتب: ${data.office?.name ?? "—"}`,
      `🔖 رقم الحجز: ${data.bookingReference}`,
      `✅ الحالة: ${status.label}`,
      `📅 تاريخ الانطلاق: ${departureDateStr}`,
      `📅 تاريخ العودة: ${returnDateStr}`,
      `👤 المسافر: ${data.leadPassengerName}`,
      `📞 الجوال: ${data.leadPassengerPhone}`,
      `💰 الإجمالي: ${data.totalPrice?.toLocaleString("ar-SA")} ريال`,
    ].join("\n");

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ text })) {
        await navigator.share({ title: "تذكرة عمرة - المسار الذكي", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("✅ تم نسخ تفاصيل التذكرة!");
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success("✅ تم نسخ تفاصيل التذكرة!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("✅ تم نسخ تفاصيل التذكرة!");
      } catch {
        toast.error("يرجى تصوير الشاشة لمشاركة التذكرة.");
      }
    }
  };

  return (
    <div id="ticket-print-root" className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50" dir="rtl">

      {/* شريط التنقل العلوي */}
      <div className="print-hidden bg-gradient-to-r from-emerald-900 to-teal-800 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ name: "bookings" })}
            className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة لحجوزاتي</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* زر إعادة إرسال التذكرة بالإيميل */}
            {isConfirmed && (
              <button
                onClick={handleResendTicket}
                disabled={sendingEmail}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {sendingEmail ? "جارٍ الإرسال..." : "إرسال التذكرة بالإيميل"}
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              مشاركة
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              تحميل PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة التذكرة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* التذكرة الرقمية الرئيسية */}
        <div id="ticket-print-area" className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

          {/* رأس التذكرة */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-32 -translate-y-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-24 translate-y-24" />
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 text-sm font-medium">تذكرة عمرة رقمية</span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {isConfirmed ? "✓ مؤكدة" : "معلّقة"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold mb-1">{data.package?.title ?? "برنامج عمرة"}</h1>
                <p className="text-emerald-200 text-sm flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {data.office?.name ?? "مكتب السفر"}
                </p>
              </div>
              <img src={LOGO} alt="المسار الذكي" className="h-12 w-auto object-contain opacity-90" style={{ mixBlendMode: "screen" }} />
            </div>
            <div className="relative mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-xs mb-1">رقم الحجز</p>
                <p className="text-2xl font-mono font-bold tracking-widest">{data.bookingReference}</p>
                <p className="text-emerald-200 text-xs mt-2">
                  رقم البرنامج <span className="font-mono font-black text-amber-200 tracking-wider">{packageRef}</span>
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${status.bg} ${status.color}`}>
                {status.icon}
                <span className="font-semibold text-sm">{status.label}</span>
              </div>
            </div>
          </div>

          <TicketDivider />

          {/* ── رموز التذكرة: الباركود + QR ── */}
          <div className="px-6 pt-6 pb-2">
            <TicketCodesSection
              bookingReference={data.bookingReference}
              bookingId={data._id}
            />
          </div>

          <TicketDivider />

          {/* تفاصيل الرحلة */}
          <div className="px-6 py-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Plane className="w-4 h-4 text-emerald-600" />
              تفاصيل الرحلة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCell icon={<Calendar className="w-5 h-5 text-emerald-600" />} label="تاريخ الانطلاق" value={departureDateStr} />
              <InfoCell icon={<Calendar className="w-5 h-5 text-blue-600" />} label="تاريخ العودة" value={returnDateStr} />
              <InfoCell icon={<Users className="w-5 h-5 text-purple-600" />} label="عدد المعتمرين"
                value={`${data.adultsCount} بالغ${data.childrenCount ? ` + ${data.childrenCount} طفل` : ""}`} />
              <InfoCell icon={<MapPin className="w-5 h-5 text-rose-600" />} label="مدينة الانطلاق"
                value={data.package?.departureCity ?? "مكة المكرمة"} />
            </div>
          </div>

          {/* الفندق */}
          {data.package?.hotelMecca && (
            <div className="px-6 pb-5">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Hotel className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-600 font-medium mb-0.5">فندق مكة المكرمة</p>
                  <p className="font-bold text-gray-800">{data.package.hotelMecca}</p>
                  {data.package.hotelMadinah && (
                    <p className="text-xs text-gray-500 mt-0.5">المدينة المنورة: {data.package.hotelMadinah}</p>
                  )}
                  {data.package.hotelStars && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: data.package.hotelStars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(data.package.hotelMecca + " مكة المكرمة")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors print:hidden"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  الخريطة
                </a>
              </div>
            </div>
          )}

          <TicketDivider />

          {/* بيانات المسافر */}
          <div className="px-6 py-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <User className="w-4 h-4 text-emerald-600" />
              بيانات المسافر الرئيسي
            </h3>
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCell icon={<User className="w-4 h-4 text-gray-500" />} label="الاسم الكامل" value={data.leadPassengerName} small />
                <InfoCell icon={<Phone className="w-4 h-4 text-gray-500" />} label="رقم الجوال" value={data.leadPassengerPhone} small />
                <InfoCell icon={<Shield className="w-4 h-4 text-gray-500" />} label="رقم الهوية" value={data.leadPassengerIdNumber} small />
              </div>
              {data.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">ملاحظات</p>
                  <p className="text-sm text-gray-700">{data.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* تفاصيل الدفع */}
          <div className="px-6 pb-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              تفاصيل الدفع
            </h3>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCell icon={<Hash className="w-4 h-4 text-gray-500" />} label="إجمالي المبلغ"
                  value={`${data.totalPrice?.toLocaleString("ar-SA")} ريال`} highlight small />
                <InfoCell icon={<CreditCard className="w-4 h-4 text-gray-500" />} label="حالة الدفع"
                  value={paymentStatus?.label ?? "لم يُدفع بعد"}
                  valueClass={paymentStatus?.color ?? "text-amber-600"} small />
                {data.payment?.transactionId && (
                  <InfoCell icon={<FileText className="w-4 h-4 text-gray-500" />} label="رقم المعاملة"
                    value={data.payment.transactionId} small />
                )}
                {data.payment?.paidAt && (
                  <InfoCell icon={<Calendar className="w-4 h-4 text-gray-500" />} label="تاريخ الدفع"
                    value={new Date(data.payment.paidAt).toLocaleDateString("ar-SA")} small />
                )}
              </div>
            </div>
          </div>

          {/* معلومات النقل والسائق */}
          {data.trip && (
            <div className="px-6 pb-5">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Bus className="w-4 h-4 text-blue-600" />
                معلومات النقل والسائق
              </h3>

              {/* بطاقة السائق — تظهر فور تعيين السائق */}
              {(data.driver || data.bus) && data.showDriverInfo ? (
                <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 text-white mb-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    {/* صورة السائق */}
                    {data.driver?.profileImageUrl ? (
                      <img
                        src={data.driver.profileImageUrl}
                        alt={data.driver.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black flex-shrink-0">
                        {(data.driver?.name ?? data.bus?.driverName ?? "؟").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-200 text-xs font-semibold">سائقك المعيّن</p>
                      <p className="text-xl font-black truncate">{data.driver?.name ?? data.bus?.driverName}</p>
                      {data.driver?.transportCompanyName && (
                        <p className="text-emerald-300 text-xs mt-0.5">🚌 {data.driver.transportCompanyName}</p>
                      )}
                      {(data.driver?.phone ?? data.bus?.driverPhone) && (
                        <a
                          href={`tel:${data.driver?.phone ?? data.bus?.driverPhone}`}
                          className="flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mt-1 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span dir="ltr">{data.driver?.phone ?? data.bus?.driverPhone}</span>
                        </a>
                      )}
                    </div>
                    {data.driver?.driverCode && (
                      <span className="text-[10px] font-mono bg-white/10 text-emerald-200 px-2 py-1 rounded-full flex-shrink-0">
                        #{data.driver.driverCode}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(data.driver?.plateNumber ?? data.bus?.plateNumber) && (
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-emerald-200 text-xs mb-0.5">رقم اللوحة</p>
                        <p className="font-black font-mono">{data.driver?.plateNumber ?? data.bus?.plateNumber}</p>
                      </div>
                    )}
                    {(data.driver?.busType ?? data.bus?.busType) && (
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-emerald-200 text-xs mb-0.5">نوع الحافلة</p>
                        <p className="font-bold">{data.driver?.busType ?? data.bus?.busType ?? "حافلة"}</p>
                      </div>
                    )}
                    {(data.driver?.nationality ?? data.bus?.driverNationality) && (
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-emerald-200 text-xs mb-0.5">الجنسية</p>
                        <p className="font-bold">{data.driver?.nationality ?? data.bus?.driverNationality}</p>
                      </div>
                    )}
                    {data.trip?.departureDate && (
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-emerald-200 text-xs mb-0.5">موعد الانطلاق</p>
                        <p className="font-bold">{new Date(data.trip.departureDate).toLocaleDateString("ar-SA")}</p>
                      </div>
                    )}
                  </div>
                  {/* زر تتبع الحافلة */}
                  {data.trip && ["driver_assigned","driver_accepted","in_progress"].includes(data.trip.status) && (
                    <button
                      onClick={() => navigate({ name: "trip-tracking" })}
                      className="mt-4 w-full py-3 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Navigation className="w-4 h-4" />
                      {data.trip.status === "in_progress" ? "🔴 تتبع موقع الحافلة مباشرة" : "متابعة الرحلة"}
                    </button>
                  )}
                </div>
              ) : data.trip?.driverId ? (
                /* السائق معيّن لكن showDriverInfo = false */
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-800">تم تعيين سائق لرحلتك ✅</p>
                      <p className="text-amber-600 text-xs mt-0.5">
                        ستظهر بيانات السائق الكاملة قبل 6 ساعات من موعد الانطلاق
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* لم يُعيَّن سائق بعد */
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-600">لم يُعيَّن سائق بعد</p>
                      <p className="text-gray-400 text-xs mt-0.5">سيتم إشعارك فور تعيين السائق من قِبل المكتب</p>
                    </div>
                  </div>
                </div>
              )}

              {/* معلومات إضافية */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data.trip.departureDate && (
                    <InfoCell icon={<Plane className="w-4 h-4 text-gray-500" />} label="موعد الانطلاق"
                      value={new Date(data.trip.departureDate).toLocaleDateString("ar-SA")} small />
                  )}
                  {data.trip.currentLat && data.trip.currentLng && (
                    <InfoCell icon={<Navigation className="w-4 h-4 text-gray-500" />} label="آخر موقع للحافلة"
                      value={`${data.trip.currentLat.toFixed(4)}, ${data.trip.currentLng.toFixed(4)}`} small />
                  )}
                  {data.trip.lastLocationUpdate && (
                    <InfoCell icon={<Clock className="w-4 h-4 text-gray-500" />} label="آخر تحديث"
                      value={new Date(data.trip.lastLocationUpdate).toLocaleTimeString("ar-SA")} small />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* تذييل التذكرة */}
          <div className="mx-6 mb-6 pt-4 border-t border-dashed border-gray-200 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              المسار الذكي للعمرة
            </span>
            <span>تاريخ الإصدار: {issueDateStr}</span>
            <span>جميع الحقوق محفوظة ©</span>
          </div>
        </div>

        {/* خريطة الفندق */}
        {data.package?.hotelMecca && (
          <div className="print-hidden bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-amber-500" />
                موقع فندق مكة المكرمة
              </h2>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(data.package.hotelMecca + " مكة المكرمة")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Navigation className="w-4 h-4" />
                فتح في خرائط Google
              </a>
            </div>
            <div className="relative h-64 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "linear-gradient(#a7f3d0 1px, transparent 1px), linear-gradient(90deg, #a7f3d0 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/50 via-transparent to-teal-200/50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-amber-400">
                    <Hotel className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow animate-bounce" />
                </div>
                <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
                  <p className="font-bold text-gray-800">{data.package.hotelMecca}</p>
                  <p className="text-emerald-700 text-xs mt-0.5">مكة المكرمة، المملكة العربية السعودية</p>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(data.package.hotelMecca + " مكة المكرمة")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-all hover:shadow-lg"
                >
                  <Navigation className="w-4 h-4" />
                  افتح في خرائط Google
                </a>
              </div>
            </div>
            <div className="p-4 bg-amber-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Hotel className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{data.package.hotelMecca}</p>
                <p className="text-sm text-gray-500">مكة المكرمة</p>
              </div>
              {data.package.hotelStars && (
                <div className="flex items-center gap-0.5 mr-auto">
                  {Array.from({ length: data.package.hotelStars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* تعليمات مهمة */}
        <div className="print-hidden bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            تعليمات مهمة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: "📋", text: "احتفظ بهذه التذكرة الرقمية أو اطبعها للمراجعة عند الحاجة" },
              { icon: "🪪", text: "أحضر هويتك الوطنية أو جواز سفرك في يوم الانطلاق" },
              { icon: "⏰", text: "كن في نقطة التجمع قبل موعد الانطلاق بـ 30 دقيقة على الأقل" },
              { icon: "📞", text: "تواصل مع المكتب في حال وجود أي استفسار أو تغيير" },
              { icon: "🚫", text: "لا يمكن الإلغاء خلال 24 ساعة من موعد الانطلاق" },
              { icon: "💊", text: "أحضر أدويتك الشخصية وما يكفي من الملابس المناسبة" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="print-hidden flex flex-wrap gap-3">
          <button
            onClick={() => navigate({ name: "bookings" })}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لحجوزاتي
          </button>
          {data.trip && ["driver_assigned","driver_accepted","in_progress","completed"].includes(data.trip.status) && (
            <button
              onClick={() => navigate({ name: "trip-tracking" })}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              {data.trip.status === "in_progress" ? "🔴 تتبع مباشر" : "متابعة الرحلة"}
            </button>
          )}
          {!data.payment && data.status === "confirmed" && (
            <button
              onClick={() => navigate({ name: "payment", bookingId: data._id })}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              إتمام الدفع
            </button>
          )}
          {/* زر إعادة إرسال التذكرة */}
          {isConfirmed && (
            <button
              onClick={handleResendTicket}
              disabled={sendingEmail}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendingEmail ? "جارٍ الإرسال..." : "إعادة إرسال التذكرة بالإيميل"}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            تحميل PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة التذكرة
          </button>
        </div>
      </div>


    </div>
  );
}

function TicketDivider() {
  return (
    <div className="relative flex items-center">
      <div className="w-8 h-8 rounded-full bg-slate-50 border border-gray-100 -mr-4 z-10" />
      <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-4" />
      <div className="w-8 h-8 rounded-full bg-slate-50 border border-gray-100 -ml-4 z-10" />
    </div>
  );
}

function InfoCell({
  icon, label, value, small, highlight, valueClass,
}: {
  icon: ReactNode; label: string; value?: string | null;
  small?: boolean; highlight?: boolean; valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className={`font-semibold ${small ? "text-sm" : "text-base"} ${highlight ? "text-emerald-700 text-lg" : valueClass ?? "text-gray-800"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}
