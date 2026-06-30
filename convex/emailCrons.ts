import { cronJobs } from "convex/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ── Query داخلية: جلب بيانات الحجز لإرسال الإيميل ──
export const getBookingDataForEmail = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const user   = await ctx.db.get(booking.userId);
    const pkg    = await ctx.db.get(booking.packageId);
    const office = await ctx.db.get(booking.officeId);
    if (!user?.email) return null;

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();
    const lastPayment = payments.filter((p) => p.status === "completed").pop();

    const fmt = (d?: string) =>
      d ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "";

    return {
      userEmail:     user.email,
      userName:      user.name ?? booking.leadPassengerName,
      bookingRef:    booking.bookingReference,
      packageTitle:  pkg?.title ?? "برنامج العمرة",
      officeName:    office?.name ?? "مكتب السفر",
      departureDate: fmt(pkg?.departureDate),
      returnDate:    fmt(pkg?.returnDate),
      adultsCount:   booking.adultsCount,
      totalPrice:    booking.totalPrice,
      paymentMethod: lastPayment?.method ?? "mada",
      tripType:      pkg?.transportType,
      busNumber:     undefined as string | undefined,
      seatNumber:    undefined as string | undefined,
    };
  },
});

// ── Query داخلية: جلب الحجوزات التي رحلتها غداً ──
export const getBookingsDepartingTomorrow = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now       = new Date();
    const tomorrow  = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const packages = await ctx.db.query("packages").collect();
    const tomorrowPackages = packages.filter((p) => {
      const depDate = p.departureDate?.split("T")[0] ?? p.departureDate;
      return depDate === tomorrowStr;
    });

    if (tomorrowPackages.length === 0) return [];

    const results = [];
    for (const pkg of tomorrowPackages) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_package", (q) => q.eq("packageId", pkg._id))
        .collect();

      const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

      for (const booking of confirmedBookings) {
        const user   = await ctx.db.get(booking.userId);
        const office = await ctx.db.get(booking.officeId);
        if (!user?.email) continue;

        const alreadySent = await ctx.db
          .query("emailLogs")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .collect();
        const reminderSent = alreadySent.some((l) => l.emailType === "trip_reminder");
        if (reminderSent) continue;

        const departureDateStr = new Date(pkg.departureDate).toLocaleDateString("ar-SA", {
          year: "numeric", month: "long", day: "numeric",
        });

        results.push({
          bookingId:     booking._id,
          email:         user.email,
          passengerName: booking.leadPassengerName,
          bookingRef:    booking.bookingReference,
          packageTitle:  pkg.title,
          officeName:    office?.name ?? "مكتب السفر",
          officePhone:   office?.phone,
          departureDate: departureDateStr,
          departureCity: pkg.departureCity,
          hotelMecca:    pkg.hotelMecca,
          adultsCount:   booking.adultsCount,
          childrenCount: booking.childrenCount,
        });
      }
    }

    return results;
  },
});

// ── Query داخلية: جلب الحجوزات المنتهية التي تحتاج إلغاء تلقائي ──
export const getExpiredBookings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // جلب جميع الباقات المنتهية (تاريخ العودة + يوم كامل)
    const packages = await ctx.db.query("packages").collect();
    const expiredPackages = packages.filter((p) => {
      if (!p.returnDate) return false;
      const returnTs = new Date(p.returnDate).getTime() + 24 * 60 * 60 * 1000; // +24 ساعة
      return returnTs < now;
    });

    if (expiredPackages.length === 0) return [];

    const results = [];
    for (const pkg of expiredPackages) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_package", (q) => q.eq("packageId", pkg._id))
        .collect();

      // الحجوزات المعلقة فقط (pending) — المؤكدة تُكمل كـ completed
      const pendingBookings = bookings.filter((b) => b.status === "pending");
      for (const b of pendingBookings) {
        results.push({ bookingId: b._id, bookingRef: b.bookingReference });
      }
    }
    return results;
  },
});

// ── Mutation داخلية: إلغاء حجز واحد تلقائياً ──
export const autoCancelBooking = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.status !== "pending") return;
    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    // إشعار للمستخدم
    await ctx.db.insert("notifications", {
      userId: booking.userId,
      title: "❌ تم إلغاء حجزك تلقائياً",
      body: `رقم الحجز: ${booking.bookingReference} — تم إلغاء الحجز تلقائياً لانتهاء تاريخ الرحلة.`,
      type: "booking_cancelled",
      linkId: booking._id,
      isRead: false,
    });
  },
});

// ── Action داخلية: إرسال التذكيرات ──
export const sendDailyReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.runQuery(internal.emailCrons.getBookingsDepartingTomorrow, {});

    let sent = 0;
    let failed = 0;

    for (const b of bookings) {
      try {
        await ctx.runAction(internal.emailActions.sendTripReminderEmail, {
          bookingId:     b.bookingId,
          email:         b.email,
          passengerName: b.passengerName,
          bookingRef:    b.bookingRef,
          packageTitle:  b.packageTitle,
          officeName:    b.officeName,
          officePhone:   b.officePhone,
          departureDate: b.departureDate,
          hotelMecca:    b.hotelMecca,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    console.log(`تذكيرات الرحلة: ${sent} تم الإرسال، ${failed} فشل`);
    return { sent, failed };
  },
});

// ── Action داخلية: الإلغاء التلقائي للحجوزات المنتهية ──
export const runAutoCancel = internalAction({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.runQuery(internal.emailCrons.getExpiredBookings, {});
    let cancelled = 0;
    for (const b of expired) {
      try {
        await ctx.runMutation(internal.emailCrons.autoCancelBooking, { bookingId: b.bookingId });
        cancelled++;
      } catch {
        // تجاهل الأخطاء الفردية
      }
    }
    console.log(`الإلغاء التلقائي: ${cancelled} حجز تم إلغاؤه`);
    return { cancelled };
  },
});

// ── Cron Jobs ──
const crons = cronJobs();

// يعمل كل يوم الساعة 8 صباحاً بتوقيت السعودية
crons.cron(
  "daily trip reminders",
  "0 5 * * *",
  internal.emailCrons.sendDailyReminders,
  {}
);

// يعمل كل يوم الساعة 2 صباحاً — إلغاء الحجوزات المنتهية
crons.cron(
  "auto cancel expired bookings",
  "0 23 * * *", // 2 صباحاً بتوقيت السعودية (UTC+3 = 23 UTC)
  internal.emailCrons.runAutoCancel,
  {}
);

export default crons;
