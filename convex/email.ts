import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── تسجيل إيميل مُرسَل (داخلي — يُستدعى من emailActions) ──
export const logEmail = internalMutation({
  args: {
    recipientEmail: v.string(),
    emailType: v.string(),
    subject: v.optional(v.string()),
    status: v.string(),
    bookingId: v.optional(v.id("bookings")),
    userId: v.optional(v.id("users")),
    error: v.optional(v.string()),
    messageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailLogs", {
      recipientEmail: args.recipientEmail,
      emailType: args.emailType,
      subject: args.subject,
      status: args.status,
      bookingId: args.bookingId,
      userId: args.userId,
      error: args.error,
      messageId: args.messageId,
    });
  },
});

// ── Query داخلية: جلب بيانات الحجز لإرسال الإيميل ──
export const getBookingForEmail = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const pkg    = await ctx.db.get(booking.packageId);
    const office = await ctx.db.get(booking.officeId);
    const user   = await ctx.db.get(booking.userId);

    const departureDateStr = pkg?.departureDate
      ? new Date(pkg.departureDate).toLocaleDateString("ar-SA", {
          year: "numeric", month: "long", day: "numeric",
        })
      : "";
    const returnDateStr = pkg?.returnDate
      ? new Date(pkg.returnDate).toLocaleDateString("ar-SA", {
          year: "numeric", month: "long", day: "numeric",
        })
      : undefined;

    return {
      bookingId:             booking._id,
      bookingReference:      booking.bookingReference,
      status:                booking.status,
      totalPrice:            booking.totalPrice,
      adultsCount:           booking.adultsCount,
      childrenCount:         booking.childrenCount,
      leadPassengerName:     booking.leadPassengerName,
      leadPassengerPhone:    booking.leadPassengerPhone,
      leadPassengerIdNumber: booking.leadPassengerIdNumber,
      permitNumber:          booking.permitNumber,
      userEmail:             user?.email ?? null,
      packageTitle:          pkg?.title ?? "برنامج العمرة",
      departureDate:         departureDateStr,
      returnDate:            returnDateStr,
      departureCity:         pkg?.departureCity,
      hotelMecca:            pkg?.hotelMecca,
      hotelMadinah:          pkg?.hotelMadinah,
      hotelStars:            pkg?.hotelStars,
      officeName:            office?.name ?? "مكتب السفر",
      officePhone:           office?.phone,
    };
  },
});

// ── جلب سجلات الإيميل (للأدمن فقط) ──
export const getLogs = query({
  args: {
    limit: v.optional(v.number()),
    emailType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];

    const limit = args.limit ?? 100;

    // جلب السجلات حسب النوع أو كلها
    let logs;
    if (args.emailType) {
      logs = await ctx.db
        .query("emailLogs")
        .withIndex("by_type", (q) => q.eq("emailType", args.emailType!))
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db
        .query("emailLogs")
        .order("desc")
        .take(limit);
    }

    // إضافة رقم الحجز لكل سجل
    const enriched = await Promise.all(
      logs.map(async (log) => {
        let bookingRef: string | null = null;
        if (log.bookingId) {
          const booking = await ctx.db.get(log.bookingId);
          bookingRef = (booking as any)?.bookingReference ?? null;
        }
        return { ...log, bookingRef };
      })
    );

    return enriched;
  },
});

// ── جلب سجلات إيميل المكتب (لصاحب المكتب) ──
export const getOfficeLogs = query({
  args: {
    officeId: v.id("offices"),
    limit:    v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId) return [];

    const limit = args.limit ?? 100;

    // جلب حجوزات المكتب
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();

    const bookingIds = new Set(bookings.map((b) => b._id));
    const bookingMap = new Map(bookings.map((b) => [b._id, b.bookingReference]));

    // جلب كل سجلات الإيميل المرتبطة بحجوزات هذا المكتب
    const allLogs = await ctx.db.query("emailLogs").order("desc").take(500);
    const officeLogs = allLogs
      .filter((log) => log.bookingId && bookingIds.has(log.bookingId as any))
      .slice(0, limit);

    return officeLogs.map((log) => ({
      ...log,
      bookingRef: log.bookingId ? (bookingMap.get(log.bookingId as any) ?? null) : null,
    }));
  },
});

// ── إحصائيات إيميل المكتب ──
export const getOfficeEmailStats = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId) return null;

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();

    const bookingIds = new Set(bookings.map((b) => b._id));
    const allLogs = await ctx.db.query("emailLogs").order("desc").take(500);
    const logs = allLogs.filter((l) => l.bookingId && bookingIds.has(l.bookingId as any));

    const total   = logs.length;
    const sent    = logs.filter((l) => l.status === "sent").length;
    const failed  = logs.filter((l) => l.status === "failed").length;

    const byType: Record<string, number> = {};
    for (const log of logs) {
      byType[log.emailType] = (byType[log.emailType] ?? 0) + 1;
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs   = logs.filter((l) => l._creationTime > sevenDaysAgo);

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      byType,
      recentTotal: recentLogs.length,
      recentSent:  recentLogs.filter((l) => l.status === "sent").length,
    };
  },
});

// ── إحصائيات الإيميل ──
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;

    const allLogs = await ctx.db.query("emailLogs").collect();

    const total   = allLogs.length;
    const sent    = allLogs.filter((l) => l.status === "sent").length;
    const failed  = allLogs.filter((l) => l.status === "failed").length;
    const pending = allLogs.filter((l) => l.status === "pending").length;

    // إحصائيات حسب النوع
    const byType: Record<string, number> = {};
    for (const log of allLogs) {
      byType[log.emailType] = (byType[log.emailType] ?? 0) + 1;
    }

    // آخر 7 أيام
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs   = allLogs.filter((l) => l._creationTime > sevenDaysAgo);
    const recentSent   = recentLogs.filter((l) => l.status === "sent").length;
    const recentFailed = recentLogs.filter((l) => l.status === "failed").length;

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      byType,
      recentSent,
      recentFailed,
      recentTotal: recentLogs.length,
    };
  },
});
