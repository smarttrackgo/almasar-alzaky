import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function settingToString(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return null;
  return String(value);
}

// ── جلب إعداد واحد من قاعدة البيانات ──
export const getSetting = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<string | null> => {
    const row = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return settingToString(row?.value);
  },
});

// ── تسجيل نتيجة إرسال واتساب في قاعدة البيانات ──
export const logResult = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    messageType: v.string(),
    messageText: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;

    // نستخدم userId صاحب الحجز كـ sentBy (النظام يرسل نيابةً عنه)
    // إذا لم يوجد admin، نستخدم userId المعتمر نفسه — لا نوقف التسجيل
    const sentBy = booking.userId;

    await ctx.db.insert("whatsappLogs", {
      bookingId: args.bookingId,
      officeId: booking.officeId,
      userId: booking.userId,
      phone: args.phone,
      messageType: args.messageType + (args.success ? "_auto" : "_failed"),
      messageText: args.success
        ? args.messageText
        : `[فشل الإرسال: ${args.error ?? "خطأ غير معروف"}]\n\n${args.messageText}`,
      sentAt: Date.now(),
      sentBy,
    });
  },
});
