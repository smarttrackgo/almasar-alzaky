"use node";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY غير مُعدّ في متغيرات البيئة" };
  }

  const fromName    = process.env.EMAIL_FROM_NAME    ?? "المسار الذكي للعمرة";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "noreply@almasaralzaky.com";
  const fromField   = `${fromName} <${fromAddress}>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromField,
        to: [to],
        subject,
        html,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) return { success: false, error: data?.message ?? `HTTP ${res.status}` };
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "خطأ غير معروف" };
  }
}

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f0fdf4;direction:rtl}
    .container{max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#065f46,#0d9488);padding:32px 24px;text-align:center}
    .header h1{color:#fff;font-size:22px;font-weight:800;margin-bottom:4px}
    .header p{color:#a7f3d0;font-size:13px}
    .body{padding:28px 24px}
    .card{background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;padding:20px;margin:16px 0}
    .row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb}
    .row:last-child{border-bottom:none}
    .label{color:#6b7280;font-size:13px}
    .value{color:#111827;font-size:14px;font-weight:600}
    .otp-box{background:linear-gradient(135deg,#065f46,#0d9488);border-radius:16px;padding:24px;text-align:center;margin:20px 0}
    .otp-code{color:#fff;font-size:42px;font-weight:900;letter-spacing:12px;font-family:monospace}
    .otp-note{color:#a7f3d0;font-size:12px;margin-top:8px}
    .footer{background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb}
    .footer p{color:#9ca3af;font-size:12px;line-height:1.6}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:12px}
    .ticket-ref{background:#ecfdf5;border:2px dashed #6ee7b7;border-radius:12px;padding:16px;text-align:center;margin:16px 0}
    .ticket-ref .ref{font-size:24px;font-weight:900;color:#065f46;letter-spacing:4px;font-family:monospace}
    .divider{height:1px;background:linear-gradient(to right,transparent,#d1fae5,transparent);margin:20px 0}
    .highlight{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;padding:16px;margin:12px 0;border-right:4px solid #059669}
  </style>
</head>
<body>
  <div class="container">
    ${body}
    <div class="footer">
      <p>🕌 المسار الذكي للعمرة — منصة حجز العمرة الموثوقة</p>
      <p style="margin-top:6px">almasaralzaky.com | support@almasaralzaky.com</p>
      <p style="margin-top:6px;color:#d1d5db">هذا البريد أُرسل تلقائياً، يرجى عدم الرد عليه مباشرة</p>
    </div>
  </div>
</body>
</html>`;
}

// ── إرسال OTP للتحقق من البريد (internal — يُستدعى من otp.ts) ──
export const sendOtpEmail = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    otp: v.string(),
  },
  handler: async (_ctx, args) => {
    const nameStr = args.name ?? "عزيزي المستخدم";
    const html = wrapTemplate("رمز التحقق — المسار الذكي", `
      <div class="header">
        <h1>🔐 رمز التحقق من البريد</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:8px">مرحباً <strong>${args.name}</strong>،</p>
        <p style="color:#6b7280;font-size:13px;margin-bottom:20px">استخدم الرمز التالي للتحقق من بريدك الإلكتروني. الرمز صالح لمدة <strong>10 دقائق</strong> فقط.</p>
        <div class="otp-box">
          <div class="otp-code">${args.otp}</div>
          <div class="otp-note">⏱ صالح لمدة 10 دقائق</div>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px">⚠️ إذا لم تطلب هذا الرمز، تجاهل هذا البريد. لن يتم تفعيل حسابك بدون إدخال الرمز.</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, "رمز التحقق من بريدك الإلكتروني — المسار الذكي", html);
  },
});

// ── رسالة ترحيب بعد التحقق (يُستدعى من otp.ts) ──
export const sendWelcomeEmail = internalAction({
  args: {
    email:       v.string(),
    name:        v.optional(v.string()),
    accountType: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const welcomeName = args.name ?? "عزيزي المستخدم";
    const html = wrapTemplate("مرحباً بك في المسار الذكي", `
      <div class="header">
        <div class="badge">🎉 تم التحقق بنجاح</div>
        <h1>🕌 أهلاً وسهلاً بك!</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:16px;margin-bottom:16px">مرحباً <strong>${welcomeName}</strong>،</p>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">يسعدنا انضمامك إلى منصة المسار الذكي للعمرة. حسابك جاهز الآن ويمكنك البدء في استكشاف برامج العمرة المتاحة.</p>
        <div class="card">
          <div class="row"><span class="label">✅ حجز الباقات</span><span class="value">اختر من بين عشرات البرامج</span></div>
          <div class="row"><span class="label">💳 دفع آمن</span><span class="value">مدى، STC Pay، Apple Pay</span></div>
          <div class="row"><span class="label">📱 تذاكر رقمية</span><span class="value">تذكرتك دائماً في جيبك</span></div>
          <div class="row"><span class="label">💰 محفظة رقمية</span><span class="value">استرجاع سهل عند الإلغاء</span></div>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px;font-weight:600">🚀 ابدأ رحلتك الآن</p>
          <p style="color:#047857;font-size:12px;margin-top:4px">تصفح الباقات المتاحة واحجز رحلة عمرتك بكل سهولة وأمان.</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, "🎉 مرحباً بك في المسار الذكي للعمرة", html);
  },
});

// ── تأكيد الحجز من المكتب (يُستدعى من bookings.ts) ──
export const sendBookingConfirmedEmail = internalAction({
  args: {
    bookingId:     v.id("bookings"),
    email:         v.string(),
    passengerName: v.string(),
    bookingRef:    v.string(),
    packageTitle:  v.string(),
    officeName:    v.string(),
    totalPrice:    v.number(),
    departureDate: v.string(),
    returnDate:    v.optional(v.string()),
    hotelMecca:    v.optional(v.string()),
    adultsCount:   v.number(),
    childrenCount: v.optional(v.number()),
    permitNumber:  v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const html = wrapTemplate(`تأكيد الحجز — ${args.bookingRef}`, `
      <div class="header">
        <div class="badge">✅ تم تأكيد حجزك</div>
        <h1>🕌 تأكيد حجز العمرة</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.passengerName}</strong>، قام مكتب السفر بتأكيد حجزك! 🎉</p>
        <div class="ticket-ref">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز</div>
          <div class="ref">${args.bookingRef}</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">البرنامج</span><span class="value">${args.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${args.officeName}</span></div>
          <div class="row"><span class="label">تاريخ المغادرة</span><span class="value">${args.departureDate}</span></div>
          ${args.returnDate ? `<div class="row"><span class="label">تاريخ العودة</span><span class="value">${args.returnDate}</span></div>` : ""}
          <div class="row"><span class="label">عدد البالغين</span><span class="value">${args.adultsCount}</span></div>
          ${args.childrenCount ? `<div class="row"><span class="label">عدد الأطفال</span><span class="value">${args.childrenCount}</span></div>` : ""}
          ${args.hotelMecca ? `<div class="row"><span class="label">فندق مكة</span><span class="value">${args.hotelMecca}</span></div>` : ""}
          ${args.permitNumber ? `<div class="row"><span class="label">رقم التصريح</span><span class="value" style="font-family:monospace">${args.permitNumber}</span></div>` : ""}
        </div>
        <div class="card" style="text-align:center;background:#ecfdf5;border-color:#6ee7b7">
          <p style="color:#374151;font-size:14px;font-weight:700">💰 إجمالي المبلغ</p>
          <p style="font-size:28px;font-weight:900;color:#065f46;margin-top:8px">${args.totalPrice.toLocaleString("ar-SA")} ر.س</p>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px;font-weight:600">📱 تذكرتك جاهزة</p>
          <p style="color:#047857;font-size:12px;margin-top:4px">يمكنك عرض تذكرتك الرقمية الكاملة من خلال تطبيق المسار الذكي ← حجوزاتي</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, `✅ تم تأكيد حجزك — ${args.bookingRef} | المسار الذكي`, html);
  },
});

// ── إشعار إلغاء الحجز (يُستدعى من bookings.ts) ──
export const sendBookingCancelledEmail = internalAction({
  args: {
    bookingId:     v.id("bookings"),
    email:         v.string(),
    passengerName: v.string(),
    bookingRef:    v.string(),
    packageTitle:  v.string(),
    officeName:    v.string(),
    cancelledBy:   v.string(),
  },
  handler: async (_ctx, args) => {
    const cancellerLabel = args.cancelledBy === "office" ? "مكتب السفر" :
                           args.cancelledBy === "admin"  ? "إدارة المنصة" : "المعتمر";
    const html = wrapTemplate(`إلغاء الحجز — ${args.bookingRef}`, `
      <div class="header" style="background:linear-gradient(135deg,#7f1d1d,#dc2626)">
        <div class="badge" style="background:#fee2e2;color:#991b1b">❌ تم إلغاء الحجز</div>
        <h1>إلغاء حجز العمرة</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.passengerName}</strong>،</p>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">نأسف لإبلاغك بأنه تم إلغاء حجزك من قِبل <strong>${cancellerLabel}</strong>.</p>
        <div class="ticket-ref" style="border-color:#fca5a5">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز الملغى</div>
          <div class="ref" style="color:#dc2626">${args.bookingRef}</div>
        </div>
        <div class="card" style="background:#fef2f2;border-color:#fecaca">
          <div class="row"><span class="label">البرنامج</span><span class="value">${args.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${args.officeName}</span></div>
          <div class="row"><span class="label">تم الإلغاء بواسطة</span><span class="value" style="color:#dc2626">${cancellerLabel}</span></div>
        </div>
        <div class="highlight" style="background:#fef2f2;border-right-color:#dc2626">
          <p style="color:#991b1b;font-size:13px;font-weight:600">💰 استرداد المبلغ</p>
          <p style="color:#b91c1c;font-size:12px;margin-top:4px">إذا كنت قد دفعت مسبقاً، سيتم إضافة المبلغ إلى محفظتك الرقمية خلال 24 ساعة.</p>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px">🔍 يمكنك البحث عن باقات عمرة أخرى من خلال تطبيق المسار الذكي.</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, `❌ تم إلغاء حجزك — ${args.bookingRef} | المسار الذكي`, html);
  },
});

// ── تذكير الرحلة (يُستدعى من emailCrons.ts) ──
export const sendTripReminderEmail = internalAction({
  args: {
    bookingId:     v.id("bookings"),
    email:         v.string(),
    passengerName: v.string(),
    bookingRef:    v.string(),
    packageTitle:  v.string(),
    officeName:    v.string(),
    officePhone:   v.optional(v.string()),
    departureDate: v.string(),
    daysLeft:      v.optional(v.number()),
    hotelMecca:    v.optional(v.string()),
    permitNumber:  v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const daysLeft     = args.daysLeft ?? 1;
    const urgencyColor = daysLeft <= 3 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#065f46";
    const urgencyBg    = daysLeft <= 3 ? "#fef2f2" : daysLeft <= 7 ? "#fffbeb" : "#ecfdf5";
    const html = wrapTemplate(`تذكير رحلتك — ${daysLeft} أيام`, `
      <div class="header">
        <div class="badge">⏰ تذكير الرحلة</div>
        <h1>🕌 رحلتك تقترب!</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.passengerName}</strong>،</p>
        <div class="otp-box" style="background:linear-gradient(135deg,${urgencyColor},${urgencyColor}cc)">
          <div style="color:#fff;font-size:48px;font-weight:900">${daysLeft}</div>
          <div style="color:rgba(255,255,255,0.9);font-size:16px;margin-top:4px">أيام متبقية على رحلتك</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">البرنامج</span><span class="value">${args.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${args.officeName}</span></div>
          ${args.officePhone ? `<div class="row"><span class="label">هاتف المكتب</span><span class="value">${args.officePhone}</span></div>` : ""}
          <div class="row"><span class="label">تاريخ المغادرة</span><span class="value" style="color:${urgencyColor};font-weight:700">${args.departureDate}</span></div>
          ${args.hotelMecca ? `<div class="row"><span class="label">فندق مكة</span><span class="value">${args.hotelMecca}</span></div>` : ""}
          ${args.permitNumber ? `<div class="row"><span class="label">رقم التصريح</span><span class="value" style="font-family:monospace">${args.permitNumber}</span></div>` : ""}
        </div>
        <div class="highlight" style="background:${urgencyBg};border-right-color:${urgencyColor}">
          <p style="color:${urgencyColor};font-size:13px;font-weight:600">📋 تأكد من جاهزيتك</p>
          <p style="color:${urgencyColor};font-size:12px;margin-top:4px;opacity:0.8">تأكد من صلاحية جواز سفرك، وتواصل مع مكتب السفر لتأكيد موعد التجمع.</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, `⏰ ${daysLeft} أيام على رحلتك — ${args.bookingRef} | المسار الذكي`, html);
  },
});

// ── إرسال تذكرة الحجز الكاملة ──
export const sendBookingTicket = internalAction({
  args: {
    to: v.string(),
    userName: v.string(),
    bookingRef: v.string(),
    packageTitle: v.string(),
    officeName: v.string(),
    departureDate: v.string(),
    returnDate: v.string(),
    adultsCount: v.number(),
    totalPrice: v.number(),
    paymentMethod: v.string(),
    tripType: v.optional(v.string()),
    busNumber: v.optional(v.string()),
    seatNumber: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const methodLabels: Record<string, string> = {
      mada: "مدى",
      stc_pay: "STC Pay",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay",
      wallet: "المحفظة الرقمية",
    };
    const methodLabel = methodLabels[args.paymentMethod] ?? args.paymentMethod;

    const html = wrapTemplate(`تذكرة حجز ${args.bookingRef}`, `
      <div class="header">
        <div class="badge">✅ تم تأكيد الحجز</div>
        <h1>🕌 تذكرة العمرة الرقمية</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.userName}</strong>، تم تأكيد حجزك بنجاح! 🎉</p>

        <div class="ticket-ref">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز</div>
          <div class="ref">${args.bookingRef}</div>
        </div>

        <div class="card">
          <div class="row">
            <span class="label">البرنامج</span>
            <span class="value">${args.packageTitle}</span>
          </div>
          <div class="row">
            <span class="label">مكتب السفر</span>
            <span class="value">${args.officeName}</span>
          </div>
          <div class="row">
            <span class="label">تاريخ المغادرة</span>
            <span class="value">${args.departureDate}</span>
          </div>
          <div class="row">
            <span class="label">تاريخ العودة</span>
            <span class="value">${args.returnDate}</span>
          </div>
          <div class="row">
            <span class="label">عدد المسافرين</span>
            <span class="value">${args.adultsCount} بالغ</span>
          </div>
          ${args.tripType ? `<div class="row"><span class="label">نوع الرحلة</span><span class="value">${args.tripType === "air" ? "✈️ جوي" : "🚌 بري"}</span></div>` : ""}
          ${args.busNumber ? `<div class="row"><span class="label">رقم الحافلة</span><span class="value">${args.busNumber}</span></div>` : ""}
          ${args.seatNumber ? `<div class="row"><span class="label">رقم المقعد</span><span class="value">${args.seatNumber}</span></div>` : ""}
        </div>

        <div class="divider"></div>

        <div class="card" style="background:#fefce8;border-color:#fde68a">
          <div class="row">
            <span class="label">طريقة الدفع</span>
            <span class="value">${methodLabel}</span>
          </div>
          <div class="row">
            <span class="label" style="font-weight:700;color:#374151">إجمالي المبلغ المدفوع</span>
            <span class="value" style="font-size:18px;color:#065f46;font-weight:900">${args.totalPrice.toLocaleString("ar-SA")} ر.س</span>
          </div>
        </div>

        <div class="highlight">
          <p style="color:#065f46;font-size:13px;font-weight:600">📱 احتفظ بهذه التذكرة</p>
          <p style="color:#047857;font-size:12px;margin-top:4px">يمكنك عرض تذكرتك الرقمية في أي وقت من خلال تطبيق المسار الذكي ← حجوزاتي</p>
        </div>
      </div>
    `);

    return await sendViaResend(
      args.to,
      `✅ تأكيد حجزك — ${args.bookingRef} | المسار الذكي`,
      html
    );
  },
});

// ── تأكيد الدفع (يُستدعى من payments.ts) ──
export const sendPaymentConfirmedEmail = internalAction({
  args: {
    bookingId:     v.id("bookings"),
    email:         v.string(),
    passengerName: v.string(),
    bookingRef:    v.string(),
    packageTitle:  v.string(),
    officeName:    v.string(),
    totalPrice:    v.number(),
    transactionId: v.string(),
    departureDate: v.optional(v.string()),
    method:        v.string(),
  },
  handler: async (_ctx, args) => {
    const methodLabels: Record<string, string> = {
      mada: "مدى", stc_pay: "STC Pay",
      apple_pay: "Apple Pay", google_pay: "Google Pay", wallet: "المحفظة الرقمية",
    };
    const methodLabel = methodLabels[args.method] ?? args.method;

    const html = wrapTemplate(`تأكيد الدفع — ${args.bookingRef}`, `
      <div class="header">
        <div class="badge">✅ تم استلام الدفع</div>
        <h1>💳 تأكيد الدفع</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.passengerName}</strong>، تم استلام دفعتك بنجاح! 🎉</p>
        <div class="ticket-ref">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز</div>
          <div class="ref">${args.bookingRef}</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">البرنامج</span><span class="value">${args.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${args.officeName}</span></div>
          ${args.departureDate ? `<div class="row"><span class="label">تاريخ المغادرة</span><span class="value">${args.departureDate}</span></div>` : ""}
          <div class="row"><span class="label">طريقة الدفع</span><span class="value">${methodLabel}</span></div>
          <div class="row"><span class="label">رقم المعاملة</span><span class="value" style="font-family:monospace;font-size:12px">${args.transactionId}</span></div>
          <div class="row"><span class="label" style="font-weight:700">المبلغ المدفوع</span><span class="value" style="font-size:18px;color:#065f46;font-weight:900">${args.totalPrice.toLocaleString("ar-SA")} ر.س</span></div>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px">📧 ستصلك تذكرتك الكاملة خلال لحظات على هذا البريد الإلكتروني.</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, `✅ تأكيد الدفع — ${args.bookingRef} | المسار الذكي`, html);
  },
});

// ── التذكرة الكاملة (يُستدعى من payments.ts) ──
export const sendTicketEmail = internalAction({
  args: {
    bookingId:             v.id("bookings"),
    email:                 v.string(),
    passengerName:         v.string(),
    bookingRef:            v.string(),
    packageTitle:          v.string(),
    officeName:            v.string(),
    officePhone:           v.optional(v.string()),
    totalPrice:            v.number(),
    departureDate:         v.string(),
    returnDate:            v.optional(v.string()),
    departureCity:         v.optional(v.string()),
    hotelMecca:            v.optional(v.string()),
    hotelMadinah:          v.optional(v.string()),
    hotelStars:            v.optional(v.number()),
    adultsCount:           v.number(),
    childrenCount:         v.optional(v.number()),
    permitNumber:          v.optional(v.string()),
    leadPassengerPhone:    v.optional(v.string()),
    leadPassengerIdNumber: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const html = wrapTemplate(`تذكرة حجز ${args.bookingRef}`, `
      <div class="header">
        <div class="badge">🎫 تذكرتك الرقمية</div>
        <h1>🕌 تذكرة العمرة</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${args.passengerName}</strong>، إليك تذكرتك الكاملة 🎉</p>
        <div class="ticket-ref">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز</div>
          <div class="ref">${args.bookingRef}</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">البرنامج</span><span class="value">${args.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${args.officeName}</span></div>
          ${args.officePhone ? `<div class="row"><span class="label">هاتف المكتب</span><span class="value">${args.officePhone}</span></div>` : ""}
          <div class="row"><span class="label">تاريخ المغادرة</span><span class="value">${args.departureDate}</span></div>
          ${args.returnDate ? `<div class="row"><span class="label">تاريخ العودة</span><span class="value">${args.returnDate}</span></div>` : ""}
          ${args.departureCity ? `<div class="row"><span class="label">مدينة المغادرة</span><span class="value">${args.departureCity}</span></div>` : ""}
          <div class="row"><span class="label">عدد البالغين</span><span class="value">${args.adultsCount}</span></div>
          ${args.childrenCount ? `<div class="row"><span class="label">عدد الأطفال</span><span class="value">${args.childrenCount}</span></div>` : ""}
        </div>
        ${(args.hotelMecca || args.hotelMadinah) ? `
        <div class="card" style="background:#fefce8;border-color:#fde68a">
          <p style="font-weight:700;color:#374151;margin-bottom:8px">🏨 الفنادق</p>
          ${args.hotelMecca ? `<div class="row"><span class="label">فندق مكة</span><span class="value">${args.hotelMecca} ${args.hotelStars ? "⭐".repeat(args.hotelStars) : ""}</span></div>` : ""}
          ${args.hotelMadinah ? `<div class="row"><span class="label">فندق المدينة</span><span class="value">${args.hotelMadinah}</span></div>` : ""}
        </div>` : ""}
        ${(args.permitNumber || args.leadPassengerIdNumber) ? `
        <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
          <p style="font-weight:700;color:#374151;margin-bottom:8px">📋 بيانات المسافر</p>
          ${args.permitNumber ? `<div class="row"><span class="label">رقم التصريح</span><span class="value" style="font-family:monospace">${args.permitNumber}</span></div>` : ""}
          ${args.leadPassengerIdNumber ? `<div class="row"><span class="label">رقم الهوية</span><span class="value" style="font-family:monospace">${args.leadPassengerIdNumber}</span></div>` : ""}
          ${args.leadPassengerPhone ? `<div class="row"><span class="label">رقم الجوال</span><span class="value">${args.leadPassengerPhone}</span></div>` : ""}
        </div>` : ""}
        <div class="highlight">
          <p style="color:#065f46;font-size:13px;font-weight:600">📱 احتفظ بهذه التذكرة</p>
          <p style="color:#047857;font-size:12px;margin-top:4px">يمكنك عرض تذكرتك الرقمية في أي وقت من خلال تطبيق المسار الذكي ← حجوزاتي</p>
        </div>
        <div class="card" style="text-align:center">
          <p style="color:#374151;font-size:14px;font-weight:700">💰 إجمالي المبلغ المدفوع</p>
          <p style="font-size:28px;font-weight:900;color:#065f46;margin-top:8px">${args.totalPrice.toLocaleString("ar-SA")} ر.س</p>
        </div>
      </div>
    `);
    return await sendViaResend(args.email, `🎫 تذكرتك — ${args.bookingRef} | المسار الذكي`, html);
  },
});

// ── رسالة ترحيب عامة (يُستدعى من الواجهة بعد اختيار نوع الحساب) ──
export const sendWelcomeEmailPublic = action({
  args: {
    email:       v.string(),
    name:        v.optional(v.string()),
    accountType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    return await ctx.runAction(internal.emailActions.sendWelcomeEmail, {
      email:       args.email,
      name:        args.name,
      accountType: args.accountType,
    });
  },
});

// ── إعادة إرسال التذكرة (يُستدعى من الواجهة) ──
export const resendTicket = action({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const data = await ctx.runQuery(
      internal.emailCrons.getBookingDataForEmail,
      { bookingId: args.bookingId }
    );
    if (!data) return { success: false, error: "الحجز غير موجود" };

    // استدعاء sendViaResend مباشرة لتجنب circular reference
    const methodLabels: Record<string, string> = {
      mada: "مدى",
      stc_pay: "STC Pay",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay",
      wallet: "المحفظة الرقمية",
    };
    const methodLabel = methodLabels[data.paymentMethod] ?? data.paymentMethod;

    const tripTypeHtml = data.tripType
      ? `<div class="row"><span class="label">نوع الرحلة</span><span class="value">${data.tripType === "air" ? "✈️ جوي" : "🚌 بري"}</span></div>`
      : "";
    const busHtml = data.busNumber
      ? `<div class="row"><span class="label">رقم الحافلة</span><span class="value">${data.busNumber}</span></div>`
      : "";
    const seatHtml = data.seatNumber
      ? `<div class="row"><span class="label">رقم المقعد</span><span class="value">${data.seatNumber}</span></div>`
      : "";

    const html = wrapTemplate(`تذكرة حجز ${data.bookingRef}`, `
      <div class="header">
        <div class="badge">✅ تم تأكيد الحجز</div>
        <h1>🕌 تذكرة العمرة الرقمية</h1>
        <p>المسار الذكي للعمرة</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin-bottom:16px">مرحباً <strong>${data.userName}</strong>، تم تأكيد حجزك بنجاح! 🎉</p>
        <div class="ticket-ref">
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">رقم الحجز</div>
          <div class="ref">${data.bookingRef}</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">البرنامج</span><span class="value">${data.packageTitle}</span></div>
          <div class="row"><span class="label">مكتب السفر</span><span class="value">${data.officeName}</span></div>
          <div class="row"><span class="label">تاريخ المغادرة</span><span class="value">${data.departureDate}</span></div>
          <div class="row"><span class="label">تاريخ العودة</span><span class="value">${data.returnDate}</span></div>
          <div class="row"><span class="label">عدد المسافرين</span><span class="value">${data.adultsCount} بالغ</span></div>
          ${tripTypeHtml}${busHtml}${seatHtml}
        </div>
        <div class="card" style="background:#fefce8;border-color:#fde68a">
          <div class="row"><span class="label">طريقة الدفع</span><span class="value">${methodLabel}</span></div>
          <div class="row">
            <span class="label" style="font-weight:700;color:#374151">إجمالي المبلغ المدفوع</span>
            <span class="value" style="font-size:18px;color:#065f46;font-weight:900">${data.totalPrice.toLocaleString("ar-SA")} ر.س</span>
          </div>
        </div>
        <div class="highlight">
          <p style="color:#065f46;font-size:13px;font-weight:600">📱 احتفظ بهذه التذكرة</p>
          <p style="color:#047857;font-size:12px;margin-top:4px">يمكنك عرض تذكرتك الرقمية في أي وقت من خلال تطبيق المسار الذكي ← حجوزاتي</p>
        </div>
      </div>
    `);

    return await sendViaResend(
      data.userEmail,
      `✅ تأكيد حجزك — ${data.bookingRef} | المسار الذكي`,
      html
    );
  },
});
