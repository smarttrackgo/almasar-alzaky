"use node";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── تنظيف رقم الهاتف ──
function cleanPhone(raw: string): string {
  let p = raw.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  // إذا بدأ بصفر فقط (مثل 05xxxxxxxx) أضف 966
  if (/^0[^0]/.test(p)) p = "966" + p.slice(1);
  return p;
}

// ── إرسال رسالة واتساب عبر GCCMSG API ──
export const sendWhatsAppMessage = internalAction({
  args: {
    phone: v.string(),
    messageText: v.string(),
    bookingId: v.id("bookings"),
    messageType: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const phone = cleanPhone(args.phone);

    // التحقق من تفعيل الإرسال التلقائي
    const isEnabled: string | null = await ctx.runQuery(
      internal.whatsappHelpers.getSetting,
      { key: "wa_auto_send" }
    );
    if (isEnabled === "false") {
      return { success: false, error: "الإرسال التلقائي موقوف من الإعدادات" };
    }

    // ── قراءة إعدادات GCCMSG ديناميكياً من قاعدة البيانات ──
    const [baseUrl, instance, token] = await Promise.all([
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "gccmsg_base_url" }),
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "gccmsg_instance" }),
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "gccmsg_token" }),
    ]);

    // ── التحقق من وجود الإعدادات — لا توجد قيم افتراضية ──
    if (!baseUrl || !instance || !token) {
      const missing = [
        !baseUrl   && "GCCMSG Base URL",
        !instance  && "GCCMSG Instance ID",
        !token     && "GCCMSG Token",
      ].filter(Boolean).join("، ");
      return {
        success: false,
        error: `⚠️ إعدادات الواتساب غير مكتملة. الحقول المفقودة: ${missing}. يرجى إدخالها من لوحة التحكم ← إعدادات الواتساب.`,
      };
    }

    const GCCMSG_BASE     = baseUrl.replace(/\/$/, "");
    const GCCMSG_INSTANCE = instance.trim();
    const GCCMSG_TOKEN    = token.trim();

    const url = `${GCCMSG_BASE}/${GCCMSG_INSTANCE}/messages/chat`;

    const bodyPayload = {
      token: GCCMSG_TOKEN,
      to: `${phone}@c.us`,
      body: args.messageText,
      priority: 10,
    };

    let response: Response;
    let data: any = {};

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { rawText };
      }
    } catch (err: any) {
      return { success: false, error: `فشل الاتصال: ${err?.message ?? "خطأ شبكة"}` };
    }

    // ── تحليل الاستجابة ──
    // GCCMSG ترجع { sent: true, id: "..." } أو { error: "..." }
    const isSuccess =
      response.ok &&
      (data.sent === true ||
        data.id != null ||
        data.status === "sent" ||
        data.success === true);

    if (isSuccess) {
      return { success: true, messageId: data.id ?? data.messageId ?? "sent" };
    }

    // بناء رسالة خطأ واضحة تساعد في التشخيص
    const errDetail =
      data.error ??
      data.message ??
      data.rawText ??
      `HTTP ${response.status}`;

    return {
      success: false,
      error: `[${response.status}] ${String(errDetail).slice(0, 300)}`,
    };
  },
});

// ── إرسال واتساب تلقائي عند تأكيد الحجز (من المكتب) ──
export const sendBookingConfirmed = internalAction({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    passengerName: v.string(),
    bookingRef: v.string(),
    packageTitle: v.string(),
    totalPrice: v.number(),
    departureDate: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const message =
      `🕌 *المسار الذكي - تأكيد الحجز*\n\n` +
      `السلام عليكم ${args.passengerName}،\n\n` +
      `✅ *تم تأكيد حجزك بنجاح!*\n\n` +
      `📋 رقم الحجز: *${args.bookingRef}*\n` +
      `🗓️ البرنامج: ${args.packageTitle}\n` +
      `📅 تاريخ الانطلاق: ${args.departureDate}\n` +
      `💰 إجمالي المبلغ: ${args.totalPrice.toLocaleString("ar-SA")} ريال\n\n` +
      `جزاكم الله خيراً وتقبّل الله منكم 🤲\n` +
      `_فريق المسار الذكي_`;

    const result = await ctx.runAction(internal.whatsappActions.sendWhatsAppMessage, {
      phone: args.phone,
      messageText: message,
      bookingId: args.bookingId,
      messageType: "confirmed",
    });

    await ctx.runMutation(internal.whatsappHelpers.logResult, {
      bookingId: args.bookingId,
      phone: args.phone,
      messageType: "confirmed",
      messageText: message,
      success: result.success,
      error: result.error,
    });
  },
});

// ── إرسال واتساب تلقائي عند إتمام الدفع من العميل ──
export const sendPaymentConfirmed = internalAction({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    passengerName: v.string(),
    bookingRef: v.string(),
    packageTitle: v.string(),
    totalPrice: v.number(),
    departureDate: v.string(),
    transactionId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const message =
      `🕌 *المسار الذكي - تأكيد الدفع*\n\n` +
      `السلام عليكم ${args.passengerName}،\n\n` +
      `💳 *تم استلام دفعتك بنجاح!*\n\n` +
      `📋 رقم الحجز: *${args.bookingRef}*\n` +
      `🗓️ البرنامج: ${args.packageTitle}\n` +
      `📅 تاريخ الانطلاق: ${args.departureDate}\n` +
      `💰 المبلغ المدفوع: ${args.totalPrice.toLocaleString("ar-SA")} ريال\n` +
      `🔖 رقم المعاملة: ${args.transactionId}\n\n` +
      `سيتم مراجعة حجزك من قِبل المكتب وتأكيده قريباً.\n\n` +
      `جزاكم الله خيراً وتقبّل الله منكم 🤲\n` +
      `_فريق المسار الذكي_`;

    const result = await ctx.runAction(internal.whatsappActions.sendWhatsAppMessage, {
      phone: args.phone,
      messageText: message,
      bookingId: args.bookingId,
      messageType: "payment_confirmed",
    });

    await ctx.runMutation(internal.whatsappHelpers.logResult, {
      bookingId: args.bookingId,
      phone: args.phone,
      messageType: "payment_confirmed",
      messageText: message,
      success: result.success,
      error: result.error,
    });
  },
});

// ── إرسال واتساب تلقائي عند إلغاء الحجز ──
export const sendBookingCancelled = internalAction({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    passengerName: v.string(),
    bookingRef: v.string(),
    packageTitle: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const message =
      `🕌 *المسار الذكي - إشعار إلغاء*\n\n` +
      `السلام عليكم ${args.passengerName}،\n\n` +
      `❌ *تم إلغاء حجزك*\n\n` +
      `📋 رقم الحجز: *${args.bookingRef}*\n` +
      `🗓️ البرنامج: ${args.packageTitle}\n\n` +
      `للاستفسار أو إعادة الحجز، تواصل مع المكتب مباشرة.\n\n` +
      `_فريق المسار الذكي_`;

    const result = await ctx.runAction(internal.whatsappActions.sendWhatsAppMessage, {
      phone: args.phone,
      messageText: message,
      bookingId: args.bookingId,
      messageType: "cancelled",
    });

    await ctx.runMutation(internal.whatsappHelpers.logResult, {
      bookingId: args.bookingId,
      phone: args.phone,
      messageType: "cancelled",
      messageText: message,
      success: result.success,
      error: result.error,
    });
  },
});

// ── إرسال واتساب تلقائي عند إنشاء الحجز من العميل ──
export const sendBookingCreated = internalAction({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    passengerName: v.string(),
    bookingRef: v.string(),
    packageTitle: v.string(),
    totalPrice: v.number(),
    departureDate: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const message =
      `🕌 *المسار الذكي - استلام طلب الحجز*\n\n` +
      `السلام عليكم ${args.passengerName}،\n\n` +
      `📩 *تم استلام طلب حجزك بنجاح!*\n\n` +
      `📋 رقم الحجز: *${args.bookingRef}*\n` +
      `🗓️ البرنامج: ${args.packageTitle}\n` +
      (args.departureDate ? `📅 تاريخ الانطلاق: ${args.departureDate}\n` : "") +
      `💰 إجمالي المبلغ: ${args.totalPrice.toLocaleString("ar-SA")} ريال\n\n` +
      `سيتم مراجعة طلبك من قِبل المكتب وتأكيده قريباً.\n\n` +
      `جزاكم الله خيراً وتقبّل الله منكم 🤲\n` +
      `_فريق المسار الذكي_`;

    const result = await ctx.runAction(internal.whatsappActions.sendWhatsAppMessage, {
      phone: args.phone,
      messageText: message,
      bookingId: args.bookingId,
      messageType: "booking_created",
    });

    await ctx.runMutation(internal.whatsappHelpers.logResult, {
      bookingId: args.bookingId,
      phone: args.phone,
      messageType: "booking_created",
      messageText: message,
      success: result.success,
      error: result.error,
    });
  },
});

// ── إرسال واتساب يدوي من لوحة الأدمن أو المكتب ──
export const sendManual = action({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    messageText: v.string(),
    messageType: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const result = await ctx.runAction(internal.whatsappActions.sendWhatsAppMessage, {
      phone: args.phone,
      messageText: args.messageText,
      bookingId: args.bookingId,
      messageType: args.messageType,
    });

    await ctx.runMutation(internal.whatsappHelpers.logResult, {
      bookingId: args.bookingId,
      phone: args.phone,
      messageType: args.messageType,
      messageText: args.messageText,
      success: result.success,
      error: result.error,
    });

    return result;
  },
});
