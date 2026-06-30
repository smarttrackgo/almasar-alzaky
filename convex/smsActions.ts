"use node";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import twilio from "twilio";

function cleanPhone(raw: string): string {
  let p = raw.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (/^0[^0]/.test(p)) p = "966" + p.slice(1);
  return "+" + p;
}

function buildSMSText(type: string, data: Record<string, string>): string {
  switch (type) {
    case "driver_assigned":
      return ["المسار الذكي للعمرة", `السلام عليكم ${data.passengerName}`, `تم تعيين سائقك لرحلة ${data.packageTitle}`, `السائق: ${data.driverName}`, data.driverPhone ? `جوال السائق: ${data.driverPhone}` : "", data.plateNumber ? `رقم اللوحة: ${data.plateNumber}` : "", data.trackingUrl ? `تتبع الرحلة: ${data.trackingUrl}` : ""].filter(Boolean).join("\n");
    case "driver_accepted":
      return ["المسار الذكي للعمرة", `السلام عليكم ${data.passengerName}`, `السائق ${data.driverName} قبل رحلتك وسينطلق في الموعد المحدد`, `رحلة: ${data.packageTitle}`, data.trackingUrl ? `تتبع الرحلة: ${data.trackingUrl}` : ""].filter(Boolean).join("\n");
    case "trip_started":
      return ["المسار الذكي للعمرة", `السلام عليكم ${data.passengerName}`, `انطلقت رحلتك الآن! رحلة ${data.packageTitle}`, data.trackingUrl ? `تابع موقع الحافلة مباشرة: ${data.trackingUrl}` : "", "تقبّل الله منكم وأعانكم على أداء مناسككم"].filter(Boolean).join("\n");
    case "trip_completed":
      return ["المسار الذكي للعمرة", `السلام عليكم ${data.passengerName}`, `وصلتم بسلامة! رحلة ${data.packageTitle} اكتملت بنجاح`, "تقبّل الله منكم صالح الأعمال"].filter(Boolean).join("\n");
    default:
      return data.message ?? "رسالة من المسار الذكي للعمرة";
  }
}

export const sendSMS = internalAction({
  args: {
    phone:       v.string(),
    messageType: v.string(),
    messageData: v.object({
      passengerName: v.optional(v.string()),
      packageTitle:  v.optional(v.string()),
      driverName:    v.optional(v.string()),
      driverPhone:   v.optional(v.string()),
      plateNumber:   v.optional(v.string()),
      trackingUrl:   v.optional(v.string()),
      bookingRef:    v.optional(v.string()),
      totalPrice:    v.optional(v.string()),
      message:       v.optional(v.string()),
    }),
    bookingId: v.optional(v.id("bookings")),
    userId:    v.optional(v.id("users")),
    officeId:  v.optional(v.id("offices")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; sid?: string; error?: string }> => {
    const isEnabled: string | null = await ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "sms_enabled" });
    if (isEnabled === "false") return { success: false, error: "SMS موقوف من الإعدادات" };

    const [accountSid, authToken, fromNumber] = await Promise.all([
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "twilio_account_sid" }),
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "twilio_auth_token" }),
      ctx.runQuery(internal.whatsappHelpers.getSetting, { key: "twilio_from_number" }),
    ]);

    if (!accountSid || !authToken || !fromNumber) {
      const missing = [!accountSid && "Account SID", !authToken && "Auth Token", !fromNumber && "From Number"].filter(Boolean).join("، ");
      await ctx.runMutation(internal.sms.logSMS, { phone: args.phone, messageType: args.messageType, messageText: `[إعدادات Twilio ناقصة: ${missing}]`, status: "failed", error: `إعدادات ناقصة: ${missing}`, bookingId: args.bookingId, userId: args.userId, officeId: args.officeId });
      return { success: false, error: `إعدادات Twilio ناقصة: ${missing}` };
    }

    const phone = cleanPhone(args.phone);
    const messageText = buildSMSText(args.messageType, {
      passengerName: args.messageData.passengerName ?? "",
      packageTitle:  args.messageData.packageTitle  ?? "",
      driverName:    args.messageData.driverName    ?? "",
      driverPhone:   args.messageData.driverPhone   ?? "",
      plateNumber:   args.messageData.plateNumber   ?? "",
      trackingUrl:   args.messageData.trackingUrl   ?? "",
      bookingRef:    args.messageData.bookingRef     ?? "",
      totalPrice:    args.messageData.totalPrice     ?? "",
      message:       args.messageData.message        ?? "",
    });

    try {
      const client = twilio(accountSid, authToken);
      const msg = await client.messages.create({ body: messageText, from: fromNumber, to: phone });
      await ctx.runMutation(internal.sms.logSMS, { phone, messageType: args.messageType, messageText, status: "sent", twilioSid: msg.sid, bookingId: args.bookingId, userId: args.userId, officeId: args.officeId });
      return { success: true, sid: msg.sid };
    } catch (err: any) {
      const errMsg = err?.message ?? "خطأ غير معروف";
      await ctx.runMutation(internal.sms.logSMS, { phone, messageType: args.messageType, messageText, status: "failed", error: errMsg, bookingId: args.bookingId, userId: args.userId, officeId: args.officeId });
      return { success: false, error: errMsg };
    }
  },
});

export const adminSendSMS = action({
  args: { phone: v.string(), message: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; sid?: string; error?: string }> => {
    return await ctx.runAction(internal.smsActions.sendSMS, { phone: args.phone, messageType: "manual", messageData: { message: args.message } });
  },
});
