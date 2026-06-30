import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ── صفحة التحقق من هوية السائق — تُخدَّم مباشرة من Convex ──
// الرابط: /verify/{driverCode}
// يُولَّد هذا الرابط في الـ QR Code الخاص بكل سائق
http.route({
  pathPrefix: "/verify/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    // استخراج الـ driverCode من الرابط: /verify/DRV-XXXX
    const driverCode = url.pathname.replace(/^\/verify\//, "").trim().toUpperCase();

    if (!driverCode) {
      return new Response(buildErrorPage("رمز التحقق مفقود", "الرابط غير صالح"), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // جلب بيانات السائق من قاعدة البيانات
    const driver = await ctx.runQuery(internal.public.getDriverByCodeInternal, { driverCode });

    if (!driver) {
      return new Response(buildErrorPage("رمز غير صالح", `السائق برمز ${driverCode} غير موجود في قاعدة البيانات`), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if ((driver as any).suspended) {
      return new Response(buildSuspendedPage((driver as any).name, driverCode), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(buildVerifyPage(driver as any, driverCode), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }),
});

// ── بناء صفحة التحقق الكاملة ──
function buildVerifyPage(d: any, driverCode: string): string {
  const isActive    = d.driverStatus !== "suspended" && d.driverStatus !== "inactive";
  const licenseValid = d.licenseStatus === "valid";
  const lastUpdate  = d.lastDataUpdate
    ? new Date(d.lastDataUpdate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  // الرابط يشير مباشرة لـ Convex Site حيث يعمل الـ HTTP Action
  const verifyUrl = `https://calm-trout-152.convex.site/verify/${driverCode}`;
  const now = new Date().toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const statusColor  = isActive ? "#065f46" : "#991b1b";
  const statusBg     = isActive ? "#d1fae5" : "#fee2e2";
  const statusLabel  = isActive ? "✓ نشط ومعتمد" : "✗ موقوف";
  const licColor     = licenseValid ? "#1e40af" : "#991b1b";
  const licBg        = licenseValid ? "#dbeafe" : "#fee2e2";
  const licLabel     = licenseValid ? "✓ سارية" : d.licenseStatus === "expired" ? "✗ منتهية" : "⚠ موقوفة";
  const overallOk    = isActive && licenseValid;

  const profileImg = d.profileImageUrl
    ? `<img src="${d.profileImageUrl}" alt="${d.name}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:4px solid ${isActive ? "#34d399" : "#f87171"};display:block;margin:0 auto 12px;" />`
    : `<div style="width:100px;height:100px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:48px;">👤</div>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex"/>
  <title>التحقق من السائق — ${d.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal',sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);min-height:100vh;padding:16px;direction:rtl}
    .container{max-width:440px;margin:0 auto;padding-bottom:32px}
    /* شريط رسمي */
    .official-bar{background:#065f46;border-radius:12px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .official-bar span{color:#a7f3d0;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px}
    .official-bar img{height:28px;filter:brightness(0) invert(1)}
    /* البطاقة الرئيسية */
    .card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);margin-bottom:16px}
    .card-header{background:linear-gradient(135deg,${isActive ? "#065f46,#0f766e" : "#991b1b,#7f1d1d"});padding:32px 24px 48px;text-align:center;position:relative}
    .status-badge{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.3)}
    .driver-name{font-size:24px;font-weight:900;color:#fff;margin-bottom:4px}
    .driver-company{font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:0}
    /* رقم السائق */
    .code-bar{margin:-22px 20px 0;position:relative;z-index:10;background:#0f172a;border-radius:14px;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 24px rgba(0,0,0,0.3)}
    .code-label{color:#94a3b8;font-size:11px;font-weight:600}
    .code-value{color:#34d399;font-family:monospace;font-size:18px;font-weight:900;letter-spacing:3px}
    /* تفاصيل */
    .details{padding:20px}
    .detail-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9}
    .detail-row:last-child{border-bottom:none}
    .detail-label{display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;font-weight:500}
    .detail-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
    .detail-value{font-size:13px;font-weight:700;color:#1e293b}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
    /* حالة التحقق */
    .verify-box{margin:0 20px 20px;padding:16px;border-radius:14px;display:flex;align-items:flex-start;gap:12px;background:${overallOk ? "#f0fdf4" : "#fef2f2"};border:2px solid ${overallOk ? "#86efac" : "#fca5a5"}}
    .verify-icon{font-size:28px;flex-shrink:0}
    .verify-title{font-size:14px;font-weight:800;color:${overallOk ? "#065f46" : "#991b1b"};margin-bottom:4px}
    .verify-desc{font-size:11px;color:${overallOk ? "#047857" : "#b91c1c"};line-height:1.6}
    /* QR */
    .qr-section{background:#f8fafc;border-radius:16px;padding:20px;text-align:center;margin-bottom:16px}
    .qr-title{font-size:12px;color:#64748b;font-weight:600;margin-bottom:12px}
    .qr-img{width:160px;height:160px;border-radius:12px;border:3px solid #e2e8f0}
    .qr-url{font-family:monospace;font-size:10px;color:#94a3b8;margin-top:8px;word-break:break-all}
    /* تذييل */
    .footer{text-align:center;padding:16px}
    .footer img{height:32px;filter:brightness(0) invert(1);opacity:0.6;margin-bottom:8px}
    .footer p{color:#475569;font-size:11px;margin-bottom:2px}
    .footer .timestamp{color:#334155;font-size:10px;font-family:monospace}
    /* طباعة */
    @media print{body{background:#fff;padding:0}.official-bar{background:#065f46 !important;-webkit-print-color-adjust:exact}.card-header{-webkit-print-color-adjust:exact}}
  </style>
</head>
<body>
  <div class="container">

    <!-- شريط رسمي -->
    <div class="official-bar">
      <span>🛡️ نظام التحقق الرسمي</span>
      <img src="https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b" alt="المسار الذكي"/>
    </div>

    <!-- البطاقة الرئيسية -->
    <div class="card">
      <div class="card-header">
        <div class="status-badge">${statusLabel}</div>
        ${profileImg}
        <div class="driver-name">${d.name}</div>
        ${d.transportCompanyName ? `<div class="driver-company">🚌 ${d.transportCompanyName}</div>` : ""}
      </div>

      <!-- رقم السائق -->
      <div class="code-bar">
        <span class="code-label"># رقم السائق الرسمي</span>
        <span class="code-value">${driverCode}</span>
      </div>

      <!-- التفاصيل -->
      <div class="details">
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#f0fdf4">👤</div>
            حالة السائق
          </div>
          <span class="badge" style="background:${statusBg};color:${statusColor}">${statusLabel}</span>
        </div>

        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#eff6ff">🛡️</div>
            رخصة القيادة
          </div>
          <span class="badge" style="background:${licBg};color:${licColor}">${licLabel}</span>
        </div>

        ${d.licenseExpiry ? `
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#fffbeb">📅</div>
            انتهاء الرخصة
          </div>
          <span class="detail-value">${d.licenseExpiry}</span>
        </div>` : ""}

        ${d.transportCompanyName ? `
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#f0fdfa">🚌</div>
            شركة النقل
          </div>
          <span class="detail-value">${d.transportCompanyName}</span>
        </div>` : ""}

        ${d.plateNumber ? `
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#f5f3ff">🚗</div>
            رقم اللوحة
          </div>
          <span class="detail-value" style="font-family:monospace;font-size:15px">${d.plateNumber}</span>
        </div>` : ""}

        ${d.busType ? `
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#fdf4ff">🚌</div>
            نوع الحافلة
          </div>
          <span class="detail-value">${d.busType}</span>
        </div>` : ""}

        ${d.officeName ? `
        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#f0fdf4">🏢</div>
            مكتب العمرة
          </div>
          <span class="detail-value">${d.officeName}${d.officeCity ? ` — ${d.officeCity}` : ""}</span>
        </div>` : ""}

        <div class="detail-row">
          <div class="detail-label">
            <div class="detail-icon" style="background:#f8fafc">🕐</div>
            آخر تحديث
          </div>
          <span class="detail-value" style="font-size:11px">${lastUpdate}</span>
        </div>
      </div>

      <!-- حالة التحقق -->
      ${(d.profileImageUrl || d.licenseImageUrl || d.licenseFileUrl || d.operatingCardFileUrl) ? `
      <!-- الوثائق الرسمية المرفوعة -->
      <div style="padding:0 20px 20px">
        <div style="border-top:1px solid #f1f5f9;padding-top:16px;margin-bottom:12px">
          <p style="font-size:13px;font-weight:800;color:#374151;display:flex;align-items:center;gap:6px">📎 الوثائق الرسمية المرفوعة</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">

          ${d.profileImageUrl ? `
          <div style="border:1px solid #d1fae5;border-radius:12px;overflow:hidden;background:#f0fdf4">
            <div style="background:#a7f3d0;padding:8px 12px;display:flex;align-items:center;gap:8px">
              <span style="font-size:14px">👤</span>
              <span style="font-size:12px;font-weight:700;color:#065f46">الصورة الشخصية للسائق</span>
              <span style="margin-right:auto;font-size:10px;background:#6ee7b7;color:#064e3b;padding:2px 8px;border-radius:20px;font-weight:700">✓ مرفوعة</span>
            </div>
            <div style="padding:12px;display:flex;align-items:center;gap:12px">
              <img src="${d.profileImageUrl}" alt="الصورة الشخصية" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #34d399;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.1)"/>
              <div>
                <p style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:2px">صورة شخصية رسمية</p>
                <p style="font-size:11px;color:#6b7280;margin-bottom:8px">تُستخدم للتعرف على هوية السائق — مستقلة عن وثائق الترخيص</p>
                <a href="${d.profileImageUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#065f46;background:#fff;border:1px solid #6ee7b7;padding:5px 10px;border-radius:8px;text-decoration:none">⬇ عرض / تحميل</a>
              </div>
            </div>
          </div>` : ""}

          ${d.licenseImageUrl ? `
          <div style="border:1px solid #bfdbfe;border-radius:12px;overflow:hidden;background:#eff6ff">
            <div style="background:#bfdbfe;padding:8px 12px;display:flex;align-items:center;gap:8px">
              <span style="font-size:14px">🛡️</span>
              <span style="font-size:12px;font-weight:700;color:#1e40af">صورة رخصة القيادة</span>
              <span style="margin-right:auto;font-size:10px;background:#93c5fd;color:#1e3a8a;padding:2px 8px;border-radius:20px;font-weight:700">✓ مرفوعة</span>
            </div>
            <div style="padding:12px;display:flex;align-items:center;gap:12px">
              <img src="${d.licenseImageUrl}" alt="صورة رخصة القيادة" style="width:100px;height:68px;border-radius:10px;object-fit:cover;border:2px solid #93c5fd;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.1)"/>
              <div>
                <p style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:2px">صورة رخصة القيادة الرسمية</p>
                <p style="font-size:11px;color:#6b7280;margin-bottom:8px">وثيقة مستقلة عن الصورة الشخصية — تُثبت أحقية السائق بالقيادة</p>
                <a href="${d.licenseImageUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1e40af;background:#fff;border:1px solid #93c5fd;padding:5px 10px;border-radius:8px;text-decoration:none">⬇ عرض / تحميل</a>
              </div>
            </div>
          </div>` : ""}

          ${d.licenseFileUrl ? `
          <div style="border:1px solid #c7d2fe;border-radius:12px;overflow:hidden;background:#eef2ff">
            <div style="background:#c7d2fe;padding:8px 12px;display:flex;align-items:center;gap:8px">
              <span style="font-size:14px">📄</span>
              <span style="font-size:12px;font-weight:700;color:#3730a3">ملف بطاقة السائق (PDF)</span>
              <span style="margin-right:auto;font-size:10px;background:#a5b4fc;color:#312e81;padding:2px 8px;border-radius:20px;font-weight:700">✓ مرفوع</span>
            </div>
            <div style="padding:12px;display:flex;align-items:center;gap:12px">
              <div style="width:56px;height:56px;border-radius:10px;background:#e0e7ff;border:2px solid #a5b4fc;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">📄</div>
              <div>
                <p style="font-size:12px;font-weight:700;color:#3730a3;margin-bottom:2px">ملف بطاقة السائق الرسمية</p>
                <p style="font-size:11px;color:#6b7280;margin-bottom:8px">وثيقة PDF رسمية مسجّلة في المنصة</p>
                <a href="${d.licenseFileUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#3730a3;background:#fff;border:1px solid #a5b4fc;padding:5px 10px;border-radius:8px;text-decoration:none">⬇ فتح الملف</a>
              </div>
            </div>
          </div>` : ""}

          ${d.operatingCardFileUrl ? `
          <div style="border:1px solid #e9d5ff;border-radius:12px;overflow:hidden;background:#faf5ff">
            <div style="background:#e9d5ff;padding:8px 12px;display:flex;align-items:center;gap:8px">
              <span style="font-size:14px">📋</span>
              <span style="font-size:12px;font-weight:700;color:#6b21a8">بطاقة تشغيل الحافلة</span>
              <span style="margin-right:auto;font-size:10px;background:#d8b4fe;color:#581c87;padding:2px 8px;border-radius:20px;font-weight:700">✓ مرفوعة</span>
            </div>
            <div style="padding:12px;display:flex;align-items:center;gap:12px">
              ${d.operatingCardFileUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
                ? `<img src="${d.operatingCardFileUrl}" alt="بطاقة تشغيل الحافلة" style="width:90px;height:64px;border-radius:10px;object-fit:cover;border:2px solid #d8b4fe;flex-shrink:0"/>`
                : `<div style="width:56px;height:56px;border-radius:10px;background:#f3e8ff;border:2px solid #d8b4fe;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">📋</div>`
              }
              <div>
                <p style="font-size:11px;color:#6b7280;margin-bottom:8px">وثيقة تشغيل الحافلة الرسمية مسجّلة في المنصة</p>
                <a href="${d.operatingCardFileUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#6b21a8;background:#fff;border:1px solid #d8b4fe;padding:5px 10px;border-radius:8px;text-decoration:none">⬇ فتح الوثيقة</a>
              </div>
            </div>
          </div>` : ""}

        </div>
      </div>` : ""}
      <div class="verify-box">
        <div class="verify-icon">${overallOk ? "✅" : "⚠️"}</div>
        <div>
          <div class="verify-title">${overallOk ? "السائق معتمد ومرخص" : "تحذير: يوجد مشكلة في بيانات السائق"}</div>
          <div class="verify-desc">
            ${overallOk
              ? "تم التحقق من هوية هذا السائق بنجاح. بياناته مسجلة ومعتمدة في منصة المسار الذكي."
              : "يرجى التواصل مع الجهات المختصة أو منصة المسار الذكي للتحقق من وضع هذا السائق."
            }
          </div>
        </div>
      </div>
    </div>

    <!-- QR للتحقق المتكرر -->
    <div class="qr-section">
      <div class="qr-title">📱 امسح للتحقق الفوري من هوية السائق</div>
      <img class="qr-img"
        src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verifyUrl)}&color=065f46&bgcolor=ffffff"
        alt="QR Code"
      />
      <div class="qr-url">${verifyUrl}</div>
    </div>

    <!-- تذييل -->
    <div class="footer">
      <img src="https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b" alt="المسار الذكي"/>
      <p>منصة المسار الذكي لحجز العمرة</p>
      <p>نظام التحقق الرسمي من هوية السائقين</p>
      <div class="timestamp">تاريخ التحقق: ${now}</div>
    </div>

  </div>
</body>
</html>`;
}

// ── صفحة السائق الموقوف ──
function buildSuspendedPage(name: string, driverCode: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>سائق موقوف — ${driverCode}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;900&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal',sans-serif;background:#1e293b;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl}
    .card{background:#fff;border-radius:24px;overflow:hidden;max-width:380px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.4)}
    .header{background:linear-gradient(135deg,#b45309,#92400e);padding:32px 24px;text-align:center}
    .icon{width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:40px}
    h1{color:#fff;font-size:22px;font-weight:900}
    .body{padding:24px;text-align:center}
    .name{font-size:20px;font-weight:900;color:#1e293b;margin-bottom:8px}
    .msg{color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px}
    .warn{background:#fffbeb;border:2px solid #fde68a;border-radius:12px;padding:16px;text-align:right}
    .warn-title{color:#92400e;font-weight:800;font-size:13px;margin-bottom:6px}
    .warn-text{color:#b45309;font-size:12px;line-height:1.6}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">⚠️</div>
      <h1>سائق موقوف</h1>
    </div>
    <div class="body">
      <div class="name">${name}</div>
      <div class="msg">هذا السائق غير معتمد أو تم إيقافه مؤقتاً من منصة المسار الذكي</div>
      <div class="warn">
        <div class="warn-title">تنبيه رسمي</div>
        <div class="warn-text">هذا السائق لا يحق له مزاولة نشاط نقل المعتمرين حالياً. يرجى التواصل مع الجهات المختصة أو منصة المسار الذكي فوراً.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── صفحة الخطأ ──
function buildErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;900&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal',sans-serif;background:#1e293b;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl}
    .card{background:#fff;border-radius:24px;overflow:hidden;max-width:380px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.4)}
    .header{background:linear-gradient(135deg,#991b1b,#7f1d1d);padding:32px 24px;text-align:center}
    .icon{width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:40px}
    h1{color:#fff;font-size:22px;font-weight:900}
    .body{padding:24px;text-align:center}
    .msg{color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px}
    .code{background:#f1f5f9;border-radius:8px;padding:8px 16px;font-family:monospace;color:#ef4444;font-weight:900;display:inline-block;margin-bottom:16px}
    .warn{background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:16px;text-align:right}
    .warn-title{color:#991b1b;font-weight:800;font-size:13px;margin-bottom:6px}
    .warn-text{color:#b91c1c;font-size:12px;line-height:1.6}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">❌</div>
      <h1>${title}</h1>
    </div>
    <div class="body">
      <div class="msg">${message}</div>
      <div class="warn">
        <div class="warn-title">تحذير رسمي</div>
        <div class="warn-text">إذا كان هذا السائق يدّعي أنه معتمد، يرجى التواصل مع منصة المسار الذكي فوراً.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default http;
