import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── تسجيل إشعار واتساب في السجل ──
export const logNotification = mutation({
  args: {
    bookingId: v.id("bookings"),
    phone: v.string(),
    messageType: v.string(),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("الحجز غير موجود");

    const office = await ctx.db.get(booking.officeId);
    const currentUser = await ctx.db.get(userId);
    const isOfficeOwner = office?.userId === userId;
    const isAdmin = currentUser?.isAdmin === true;

    if (!isOfficeOwner && !isAdmin) {
      throw new ConvexError("غير مصرح لك بإرسال إشعارات لهذا الحجز");
    }

    return await ctx.db.insert("whatsappLogs", {
      bookingId: args.bookingId,
      officeId: booking.officeId,
      userId: booking.userId,
      phone: args.phone,
      messageType: args.messageType,
      messageText: args.messageText,
      sentAt: Date.now(),
      sentBy: userId,
    });
  },
});

// ── جلب سجل إشعارات واتساب لحجز معين ──
export const getLogsForBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return [];

    const office = await ctx.db.get(booking.officeId);
    const currentUser = await ctx.db.get(userId);
    const isOfficeOwner = office?.userId === userId;
    const isAdmin = currentUser?.isAdmin === true;

    if (!isOfficeOwner && !isAdmin) return [];

    const logs = await ctx.db
      .query("whatsappLogs")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .order("desc")
      .collect();

    return await Promise.all(
      logs.map(async (log) => {
        const sentByUser = await ctx.db.get(log.sentBy);
        return { ...log, sentByName: sentByUser?.name ?? "موظف المكتب" };
      })
    );
  },
});

// ── جلب سجل إشعارات واتساب للمكتب كاملاً ──
export const getOfficeWhatsappLogs = query({
  args: {
    officeId: v.id("offices"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const office = await ctx.db.get(args.officeId);
    const currentUser = await ctx.db.get(userId);
    const isOfficeOwner = office?.userId === userId;
    const isAdmin = currentUser?.isAdmin === true;

    if (!isOfficeOwner && !isAdmin) return [];

    const logs = await ctx.db
      .query("whatsappLogs")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .order("desc")
      .take(args.limit ?? 100);

    return await Promise.all(
      logs.map(async (log) => {
        const booking = await ctx.db.get(log.bookingId);
        const sentByUser = await ctx.db.get(log.sentBy);
        return {
          ...log,
          bookingReference: booking?.bookingReference ?? "—",
          passengerName: booking?.leadPassengerName ?? "—",
          passengerPhone: booking?.leadPassengerPhone ?? "—",
          sentByName: sentByUser?.name ?? "موظف المكتب",
        };
      })
    );
  },
});

// ── إحصائيات الإشعارات للمكتب ──
export const getOfficeStats = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const office = await ctx.db.get(args.officeId);
    const currentUser = await ctx.db.get(userId);
    const isOfficeOwner = office?.userId === userId;
    const isAdmin = currentUser?.isAdmin === true;

    if (!isOfficeOwner && !isAdmin) return null;

    const logs = await ctx.db
      .query("whatsappLogs")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();

    const byType: Record<string, number> = {};
    for (const log of logs) {
      byType[log.messageType] = (byType[log.messageType] ?? 0) + 1;
    }

    // إحصائيات الأسبوع الماضي
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = logs.filter((l) => l.sentAt >= oneWeekAgo).length;

    return {
      total: logs.length,
      byType,
      thisWeek,
      lastSentAt: logs.length > 0 ? Math.max(...logs.map((l) => l.sentAt)) : null,
    };
  },
});

// ── إحصائيات الإشعارات للأدمن (جميع المكاتب) ──
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const currentUser = await ctx.db.get(userId);
    if (!currentUser?.isAdmin) return null;

    const logs = await ctx.db.query("whatsappLogs").collect();
    const byType: Record<string, number> = {};
    for (const log of logs) {
      byType[log.messageType] = (byType[log.messageType] ?? 0) + 1;
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = logs.filter((l) => l.sentAt >= oneWeekAgo).length;

    return { total: logs.length, byType, thisWeek };
  },
});

// ── جلب آخر سجلات الإشعارات للأدمن ──
export const getAdminLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const currentUser = await ctx.db.get(userId);
    if (!currentUser?.isAdmin) return [];

    const logs = await ctx.db
      .query("whatsappLogs")
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      logs.map(async (log) => {
        const booking = await ctx.db.get(log.bookingId);
        const office = await ctx.db.get(log.officeId);
        const sentByUser = await ctx.db.get(log.sentBy);
        return {
          ...log,
          bookingReference: booking?.bookingReference ?? "—",
          passengerName: booking?.leadPassengerName ?? "—",
          officeName: office?.name ?? "—",
          sentByName: sentByUser?.name ?? "موظف المكتب",
        };
      })
    );
  },
});
