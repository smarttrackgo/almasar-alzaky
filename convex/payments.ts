import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      payments.map(async (p) => {
        const booking = await ctx.db.get(p.bookingId);
        const pkg = booking ? await ctx.db.get(booking.packageId) : null;
        return { ...p, booking, package: pkg };
      })
    );
  },
});

export const getOfficePaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office) return null;
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_office", (q) => q.eq("officeId", office._id))
      .collect();
    const completed = payments.filter((p) => p.status === "completed");
    const pending   = payments.filter((p) => p.status === "processing");
    const totalRevenue  = completed.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalRevenue,
      pendingAmount,
      completedCount: completed.length,
      pendingCount:   pending.length,
      payments: payments.slice(0, 20),
    };
  },
});

export const create = mutation({
  args: {
    bookingId: v.id("bookings"),
    amount:    v.number(),
    method:    v.string(),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    provider: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("الحجز غير موجود");
    if (booking.userId !== userId) throw new Error("غير مصرح");
    const transactionId = "TXN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const paymentId = await ctx.db.insert("payments", {
      bookingId: args.bookingId,
      userId,
      officeId: booking.officeId,
      amount:   args.amount,
      method:   args.method,
      status:   "processing",
      transactionId,
      cardLast4: args.cardLast4,
      cardBrand: args.cardBrand,
      provider: args.provider,
      checkoutUrl: args.checkoutUrl,
      currency: args.currency,
    });
    return { paymentId, transactionId };
  },
});

export const confirm = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("الدفعة غير موجودة");
    if (payment.userId !== userId) throw new Error("غير مصرح");

    await ctx.db.patch(args.paymentId, {
      status: "completed",
      paidAt: Date.now(),
    });
    await ctx.db.patch(payment.bookingId, { status: "confirmed" });

    await ctx.db.insert("notifications", {
      userId,
      title: "تم تأكيد الدفع ✓",
      body:  `تم استلام دفعتك بنجاح. رقم المعاملة: ${payment.transactionId}`,
      type:  "payment",
      isRead: false,
    });

    const booking = await ctx.db.get(payment.bookingId);
    if (booking) {
      const pkg    = await ctx.db.get(booking.packageId);
      const office = await ctx.db.get(booking.officeId);
      const user   = await ctx.db.get(userId);

      const departureDateStr = pkg?.departureDate
        ? new Date(pkg.departureDate).toLocaleDateString("ar-SA", {
            year: "numeric", month: "long", day: "numeric",
          })
        : "";

      // ── واتساب تلقائي ──
      await ctx.scheduler.runAfter(0, internal.whatsappActions.sendPaymentConfirmed, {
        bookingId:     payment.bookingId,
        phone:         booking.leadPassengerPhone,
        passengerName: booking.leadPassengerName,
        bookingRef:    booking.bookingReference,
        packageTitle:  pkg?.title ?? "برنامج العمرة",
        totalPrice:    booking.totalPrice,
        departureDate: departureDateStr,
        transactionId: payment.transactionId ?? "",
      });

      // ── إيميل تأكيد الدفع + التذكرة الكاملة ──
      if (user?.email) {
        const returnDateStr = pkg?.returnDate
          ? new Date(pkg.returnDate).toLocaleDateString("ar-SA", {
              year: "numeric", month: "long", day: "numeric",
            })
          : undefined;

        // إيميل تأكيد الدفع
        await ctx.scheduler.runAfter(0, internal.emailActions.sendPaymentConfirmedEmail, {
          bookingId:     payment.bookingId,
          email:         user.email,
          passengerName: booking.leadPassengerName,
          bookingRef:    booking.bookingReference,
          packageTitle:  pkg?.title ?? "برنامج العمرة",
          officeName:    office?.name ?? "مكتب السفر",
          totalPrice:    booking.totalPrice,
          transactionId: payment.transactionId ?? "",
          departureDate: departureDateStr || undefined,
          method:        payment.method,
        });

        // التذكرة الكاملة بعد 3 ثوانٍ
        await ctx.scheduler.runAfter(3000, internal.emailActions.sendTicketEmail, {
          bookingId:             payment.bookingId,
          email:                 user.email,
          passengerName:         booking.leadPassengerName,
          bookingRef:            booking.bookingReference,
          packageTitle:          pkg?.title ?? "برنامج العمرة",
          officeName:            office?.name ?? "مكتب السفر",
          officePhone:           office?.phone,
          totalPrice:            booking.totalPrice,
          departureDate:         departureDateStr,
          returnDate:            returnDateStr,
          departureCity:         pkg?.departureCity,
          hotelMecca:            pkg?.hotelMecca,
          hotelMadinah:          pkg?.hotelMadinah,
          hotelStars:            pkg?.hotelStars,
          adultsCount:           booking.adultsCount,
          childrenCount:         booking.childrenCount,
          permitNumber:          booking.permitNumber,
          leadPassengerPhone:    booking.leadPassengerPhone,
          leadPassengerIdNumber: booking.leadPassengerIdNumber,
        });
      }
    }
  },
});

export const reject = mutation({
  args: {
    paymentId: v.id("payments"),
    reason:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("الدفعة غير موجودة");
    await ctx.db.patch(args.paymentId, {
      status:        "failed",
      failureReason: args.reason ?? "فشل الدفع",
    });
  },
});
