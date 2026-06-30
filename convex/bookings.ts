import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";
import { calculateBookingPricing, getOfficeCommissionRate, getPassengerFeeRate } from "./pricing";

function generateRef(): string {
  return "MSR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── جلب نسبة العمولة الفعّالة لمكتب ──
async function getEffectiveRate(ctx: any, officeId: string): Promise<number> {
  return await getOfficeCommissionRate(ctx, officeId);
}

async function upsertCommissionForBooking(ctx: any, bookingId: any) {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return null;

  const existing = await ctx.db
    .query("commissions")
    .withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId))
    .unique();

  if (booking.status === "cancelled") {
    if (existing && existing.status === "pending") {
      await ctx.db.patch(existing._id, { status: "cancelled" });
    }
    return existing?._id ?? null;
  }

  const rate = booking.commissionRate ?? await getEffectiveRate(ctx, booking.officeId);
  const bookingAmount = booking.officeBaseAmount ?? booking.totalPrice;
  const commissionAmount = Math.round((bookingAmount * rate) / 100);
  const netAmount = bookingAmount - commissionAmount;
  const status = booking.status === "completed" ? "settled" : "pending";
  const patch: any = {
    bookingAmount,
    commissionRate: rate,
    commissionAmount,
    netAmount,
    status,
    ...(status === "settled" ? { settledAt: Date.now() } : {}),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert("commissions", {
      bookingId,
      officeId: booking.officeId,
      ...patch,
    });
  }

  await ctx.db.patch(bookingId, { commissionRate: rate, commissionAmount, netAmount });
  return existing?._id ?? null;
}

export const create = mutation({
  args: {
    packageId:              v.id("packages"),
    adultsCount:            v.number(),
    childrenCount:          v.optional(v.number()),
    leadPassengerName:      v.string(),
    leadPassengerPhone:     v.string(),
    leadPassengerIdNumber:  v.string(),
    notes:                  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const user = await ctx.db.get(userId);
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new ConvexError("البرنامج غير موجود");
    if (pkg.availableSeats < args.adultsCount)
      throw new ConvexError("عدد المقاعد المتاحة غير كافٍ");

    const leadPassengerName = args.leadPassengerName.trim() || user?.name;
    const leadPassengerPhone = args.leadPassengerPhone.trim() || user?.phone;
    const leadPassengerIdNumber = args.leadPassengerIdNumber.trim() || (user as any)?.idNumber;

    if (!leadPassengerName || !leadPassengerPhone || !leadPassengerIdNumber) {
      throw new ConvexError("يرجى إكمال بيانات المعتمر الأساسية في الملف الشخصي أولاً");
    }

    const commissionRate = await getEffectiveRate(ctx, pkg.officeId);
    const passengerFeeRate = await getPassengerFeeRate(ctx, pkg.officeId);
    const pricing = calculateBookingPricing(
      pkg.price,
      args.adultsCount,
      args.childrenCount,
      commissionRate,
      passengerFeeRate,
    );
    const bookingRef = generateRef();

    const bookingId = await ctx.db.insert("bookings", {
      packageId:             args.packageId,
      officeId:              pkg.officeId,
      userId,
      status:                "pending",
      totalPrice:            pricing.totalPrice,
      adultsCount:           args.adultsCount,
      childrenCount:         args.childrenCount,
      leadPassengerName,
      leadPassengerPhone,
      leadPassengerIdNumber,
      notes:                 args.notes,
      bookingReference:      bookingRef,
      officeBaseAmount:      pricing.officeBaseAmount,
      passengerFeeRate:      pricing.passengerFeeRate,
      passengerFeeAmount:    pricing.passengerFeeAmount,
      platformRevenue:       pricing.platformRevenue,
      commissionRate,
      commissionAmount:      pricing.officeCommissionAmount,
      netAmount:             pricing.officeNetAmount,
    });

    await upsertCommissionForBooking(ctx, bookingId);

    await ctx.db.patch(args.packageId, {
      availableSeats: pkg.availableSeats - args.adultsCount,
    });

    // إشعار داخلي
    const profileUpdates: any = {};
    if (leadPassengerName && user?.name !== leadPassengerName) profileUpdates.name = leadPassengerName;
    if (leadPassengerPhone && user?.phone !== leadPassengerPhone) profileUpdates.phone = leadPassengerPhone;
    if (leadPassengerIdNumber && (user as any)?.idNumber !== leadPassengerIdNumber) profileUpdates.idNumber = leadPassengerIdNumber;
    if (Object.keys(profileUpdates).length > 0) {
      await ctx.db.patch(userId, profileUpdates);
    }

    await ctx.db.insert("notifications", {
      userId,
      title: "✅ تم استلام طلب حجزك",
      body:  `رقم الحجز: ${bookingRef} — برنامج: ${pkg.title}. سيتم مراجعة طلبك من قِبل المكتب قريباً.`,
      type:  "booking_created",
      linkId: bookingId,
      isRead: false,
    });

    // واتساب تلقائي
    const departureDateStr = pkg.departureDate
      ? new Date(pkg.departureDate).toLocaleDateString("ar-SA", {
          year: "numeric", month: "long", day: "numeric",
        })
      : "";
    await ctx.scheduler.runAfter(0, internal.whatsappActions.sendBookingCreated, {
      bookingId,
      phone:          leadPassengerPhone,
      passengerName:  leadPassengerName,
      bookingRef,
      packageTitle:   pkg.title,
      totalPrice:     pricing.totalPrice,
      departureDate:  departureDateStr,
    });

    return { bookingId, bookingRef };
  },
});

export const getById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== userId) return null;
    return booking;
  },
});

// ── جلب حجز بالمعرف مع كل التفاصيل ──
export const getBookingById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const pkg     = await ctx.db.get(booking.packageId);
    const office  = await ctx.db.get(booking.officeId);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    const ACTIVE_TRIP_STATUSES = ["driver_assigned", "driver_accepted", "in_progress", "completed"];

    let trip = null;
    let bus  = null;

    // ── أولاً: جلب الرحلة المرتبطة مباشرة بالحجز ──
    if (booking.tripId) {
      trip = await ctx.db.get(booking.tripId);
      if (trip?.busId) bus = await ctx.db.get(trip.busId);
    }

    // ── ثانياً: إذا لم يكن الحجز مرتبطاً بـ tripId، ابحث عن رحلة نشطة ──
    if (!trip && booking.status !== "cancelled") {
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
        .collect();
      const activeTrip = trips.find(
        (t) => t.officeId === booking.officeId && ACTIVE_TRIP_STATUSES.includes(t.status)
      );
      if (activeTrip) {
        trip = activeTrip;
        if (trip.busId) bus = await ctx.db.get(trip.busId);
      }
    }

    // ── بيانات السائق الكاملة من جدول drivers ──
    let driverData = null;
    if (trip?.driverId) {
      const drv = await ctx.db.get(trip.driverId);
      if (drv) {
        const profileImageUrl = drv.profileImageId
          ? await ctx.storage.getUrl(drv.profileImageId)
          : null;
        driverData = {
          _id: drv._id,
          name: drv.name,
          phone: drv.phone ?? null,
          nationality: drv.nationality ?? null,
          plateNumber: drv.plateNumber ?? null,
          busColor: drv.busColor ?? null,
          busType: drv.busType ?? null,
          busCapacity: drv.busCapacity ?? null,
          transportCompanyName: drv.transportCompanyName ?? null,
          driverCode: drv.driverCode ?? null,
          licenseStatus: drv.licenseStatus ?? null,
          isApproved: drv.isApproved ?? false,
          profileImageUrl,
        };
      }
    }

    // حساب ما إذا كانت الرحلة خلال 6 ساعات
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;
    let showDriverInfo = false;
    if (trip) {
      const depTs = new Date(trip.departureDate).getTime();
      showDriverInfo = depTs - now <= sixHours || ACTIVE_TRIP_STATUSES.includes(trip.status);
    }

    return { ...booking, package: pkg, office, payment, trip, bus, driver: driverData, showDriverInfo };
  },
});

// ── تعيين نوع الحساب ──
export const setAccountType = mutation({
  args: { accountType: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    await ctx.db.patch(userId, {
      accountType: args.accountType,
      accountTypeSet: true,
      isOfficeOwner: args.accountType === "office",
    });
    // إذا كان السائق، أنشئ سجل سائق مبدئي
    if (args.accountType === "driver") {
      const existing = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (!existing) {
        const user = await ctx.db.get(userId);
        await ctx.db.insert("drivers", {
          userId,
          name: user?.name ?? "سائق جديد",
          phone: user?.phone ?? "",
          isActive: true,
          isApproved: false,
        });
      }
    }
  },
});

// ── إنشاء حجز من الأدمن ──
export const adminCreateBooking = mutation({
  args: {
    packageId:             v.id("packages"),
    userId:                v.id("users"),
    adultsCount:           v.number(),
    childrenCount:         v.optional(v.number()),
    leadPassengerName:     v.string(),
    leadPassengerPhone:    v.string(),
    leadPassengerIdNumber: v.string(),
    notes:                 v.optional(v.string()),
    status:                v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new ConvexError("غير مصرح لك");

    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new ConvexError("البرنامج غير موجود");

    const commissionRate = await getEffectiveRate(ctx, pkg.officeId);
    const passengerFeeRate = await getPassengerFeeRate(ctx, pkg.officeId);
    const pricing = calculateBookingPricing(
      pkg.price,
      args.adultsCount,
      args.childrenCount,
      commissionRate,
      passengerFeeRate,
    );
    const bookingRef = generateRef();

    const bookingId = await ctx.db.insert("bookings", {
      packageId:             args.packageId,
      officeId:              pkg.officeId,
      userId:                args.userId,
      status:                args.status ?? "confirmed",
      totalPrice:            pricing.totalPrice,
      adultsCount:           args.adultsCount,
      childrenCount:         args.childrenCount,
      leadPassengerName:     args.leadPassengerName,
      leadPassengerPhone:    args.leadPassengerPhone,
      leadPassengerIdNumber: args.leadPassengerIdNumber,
      notes:                 args.notes,
      bookingReference:      bookingRef,
      officeBaseAmount:      pricing.officeBaseAmount,
      passengerFeeRate:      pricing.passengerFeeRate,
      passengerFeeAmount:    pricing.passengerFeeAmount,
      platformRevenue:       pricing.platformRevenue,
      commissionRate,
      commissionAmount:      pricing.officeCommissionAmount,
      netAmount:             pricing.officeNetAmount,
    });

    await upsertCommissionForBooking(ctx, bookingId);

    if (pkg.availableSeats >= args.adultsCount) {
      await ctx.db.patch(args.packageId, {
        availableSeats: pkg.availableSeats - args.adultsCount,
      });
    }

    await ctx.db.insert("notifications", {
      userId:  args.userId,
      title:   "✅ تم إنشاء حجزك",
      body:    `رقم الحجز: ${bookingRef} — تم إنشاء حجزك من قِبل الإدارة.`,
      type:    "booking_created",
      linkId:  bookingId,
      isRead:  false,
    });

    return { bookingId, bookingRef };
  },
});

export const myBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const ACTIVE_TRIP_STATUSES = ["driver_assigned", "driver_accepted", "in_progress", "completed"];

    return await Promise.all(
      bookings.map(async (b) => {
        const pkg    = await ctx.db.get(b.packageId);
        const office = await ctx.db.get(b.officeId);

        // ── أولاً: جلب الرحلة المرتبطة مباشرة بالحجز ──
        let trip = b.tripId ? await ctx.db.get(b.tripId) : null;

        // ── ثانياً: إذا لم يكن الحجز مرتبطاً بـ tripId، ابحث عن رحلة نشطة ──
        if (!trip && b.status !== "cancelled") {
          const trips = await ctx.db
            .query("trips")
            .withIndex("by_package", (q) => q.eq("packageId", b.packageId))
            .collect();
          const activeTrip = trips.find(
            (t) => t.officeId === b.officeId && ACTIVE_TRIP_STATUSES.includes(t.status)
          );
          if (activeTrip) trip = activeTrip;
        }

        return { ...b, package: pkg, office, trip };
      })
    );
  },
});

export const officeBookings = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId) return [];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .order("desc")
      .collect();
    return await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        package: await ctx.db.get(b.packageId),
        user:    await ctx.db.get(b.userId),
      }))
    );
  },
});

export const updateStatus = mutation({
  args: {
    bookingId:    v.id("bookings"),
    status:       v.string(),
    permitNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("الحجز غير موجود");
    const office = await ctx.db.get(booking.officeId);
    if (!office || office.userId !== userId)
      throw new ConvexError("غير مصرح لك بتعديل هذا الحجز");

    const updates: any = { status: args.status };
    if (args.permitNumber) updates.permitNumber = args.permitNumber;
    await ctx.db.patch(args.bookingId, updates);
    await upsertCommissionForBooking(ctx, args.bookingId);

    // ── تأكيد الحجز ──
    if (args.status === "confirmed") {
      // إشعار داخلي
      await ctx.db.insert("notifications", {
        userId:  booking.userId,
        title:   "🎉 تم تأكيد حجزك!",
        body:    `رقم الحجز: ${booking.bookingReference} — تم تأكيد حجزك من قِبل المكتب. استعد لرحلتك الروحانية!`,
        type:    "booking_confirmed",
        linkId:  args.bookingId,
        isRead:  false,
      });

      // واتساب تلقائي
      const pkg = await ctx.db.get(booking.packageId);
      await ctx.scheduler.runAfter(0, internal.whatsappActions.sendBookingConfirmed, {
        bookingId:     args.bookingId,
        phone:         booking.leadPassengerPhone,
        passengerName: booking.leadPassengerName,
        bookingRef:    booking.bookingReference,
        packageTitle:  pkg?.title ?? "برنامج العمرة",
        totalPrice:    booking.totalPrice,
        departureDate: pkg?.departureDate ?? "",
      });

      // ── إيميل تأكيد الحجز ──
      const user = await ctx.db.get(booking.userId);
      if (user?.email) {
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
        await ctx.scheduler.runAfter(1000, internal.emailActions.sendBookingConfirmedEmail, {
          bookingId:     args.bookingId,
          email:         user.email,
          passengerName: booking.leadPassengerName,
          bookingRef:    booking.bookingReference,
          packageTitle:  pkg?.title ?? "برنامج العمرة",
          officeName:    office.name,
          totalPrice:    booking.totalPrice,
          departureDate: departureDateStr,
          returnDate:    returnDateStr,
          hotelMecca:    pkg?.hotelMecca,
          adultsCount:   booking.adultsCount,
          childrenCount: booking.childrenCount,
          permitNumber:  args.permitNumber ?? booking.permitNumber,
        });

        await ctx.scheduler.runAfter(3000, internal.emailActions.sendTicketEmail, {
          bookingId:             args.bookingId,
          email:                 user.email,
          passengerName:         booking.leadPassengerName,
          bookingRef:            booking.bookingReference,
          packageTitle:          pkg?.title ?? "برنامج العمرة",
          officeName:            office.name,
          officePhone:           office.phone,
          totalPrice:            booking.totalPrice,
          departureDate:         departureDateStr,
          returnDate:            returnDateStr,
          departureCity:         pkg?.departureCity,
          hotelMecca:            pkg?.hotelMecca,
          hotelMadinah:          pkg?.hotelMadinah,
          hotelStars:            pkg?.hotelStars,
          adultsCount:           booking.adultsCount,
          childrenCount:         booking.childrenCount,
          permitNumber:          args.permitNumber ?? booking.permitNumber,
          leadPassengerPhone:    booking.leadPassengerPhone,
          leadPassengerIdNumber: booking.leadPassengerIdNumber,
        });
      }
    }

    // ── إلغاء الحجز من المكتب ──
    if (args.status === "cancelled") {
      const existing = await ctx.db
        .query("commissions")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .unique();
      if (existing && existing.status === "pending") {
        await ctx.db.patch(existing._id, { status: "cancelled" });
      }
      const pkg = await ctx.db.get(booking.packageId);
      if (pkg) {
        await ctx.db.patch(booking.packageId, {
          availableSeats: pkg.availableSeats + booking.adultsCount,
        });
      }

      // ── إضافة المبلغ لمحفظة المعتمر ──
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (payment) {
        const refundAmount = booking.totalPrice;
        const userDoc = await ctx.db.get(booking.userId);
        if (userDoc) {
          await ctx.db.patch(booking.userId, {
            walletBalance: (userDoc.walletBalance ?? 0) + refundAmount,
          });
          await ctx.db.insert("walletTransactions", {
            userId: booking.userId,
            type: "refund",
            amount: refundAmount,
            bookingId: args.bookingId,
            bookingRef: booking.bookingReference,
            description: `استرداد مبلغ حجز ${pkg?.title ?? "برنامج العمرة"} (${booking.bookingReference}) — تم الإلغاء من المكتب`,
            paymentMethod: payment.method,
            status: "completed",
            processedAt: Date.now(),
          });
          await ctx.db.insert("notifications", {
            userId: booking.userId,
            title: "💰 تم إضافة المبلغ لمحفظتك",
            body: `تم إضافة ${refundAmount.toLocaleString("ar-SA")} ر.س لمحفظتك بعد إلغاء الحجز ${booking.bookingReference}. يمكنك استخدامه في حجوزاتك القادمة أو استرداده.`,
            type: "wallet_refund",
            isRead: false,
          });
        }
      }

      // إشعار داخلي
      await ctx.db.insert("notifications", {
        userId:  booking.userId,
        title:   "❌ تم إلغاء حجزك",
        body:    `رقم الحجز: ${booking.bookingReference} — تم إلغاء حجزك من قِبل المكتب.`,
        type:    "booking_cancelled",
        linkId:  args.bookingId,
        isRead:  false,
      });

      // واتساب تلقائي
      await ctx.scheduler.runAfter(0, internal.whatsappActions.sendBookingCancelled, {
        bookingId:     args.bookingId,
        phone:         booking.leadPassengerPhone,
        passengerName: booking.leadPassengerName,
        bookingRef:    booking.bookingReference,
        packageTitle:  pkg?.title ?? "برنامج العمرة",
      });

      // ── إيميل إلغاء الحجز ──
      const user = await ctx.db.get(booking.userId);
      if (user?.email) {
        await ctx.scheduler.runAfter(1000, internal.emailActions.sendBookingCancelledEmail, {
          bookingId:     args.bookingId,
          email:         user.email,
          passengerName: booking.leadPassengerName,
          bookingRef:    booking.bookingReference,
          packageTitle:  pkg?.title ?? "برنامج العمرة",
          officeName:    office.name,
          cancelledBy:   "المكتب",
        });
      }
    }
  },
});

// ── إلغاء الحجز من قِبل المعتمر ──
export const cancelByUser = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("الحجز غير موجود");
    if (booking.userId !== userId) throw new ConvexError("غير مصرح لك بإلغاء هذا الحجز");
    if (booking.status === "cancelled") throw new ConvexError("الحجز ملغى مسبقاً");
    if (booking.status === "completed") throw new ConvexError("لا يمكن إلغاء رحلة مكتملة");

    const pkg = await ctx.db.get(booking.packageId);
    if (pkg) {
      const hoursLeft = (new Date(pkg.departureDate).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft < 24)
        throw new ConvexError("لا يمكن الإلغاء خلال 24 ساعة من موعد الانطلاق. تواصل مع المكتب مباشرة.");
      await ctx.db.patch(booking.packageId, {
        availableSeats: pkg.availableSeats + booking.adultsCount,
      });
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    await upsertCommissionForBooking(ctx, args.bookingId);

    const commission = await ctx.db
      .query("commissions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();
    if (commission && commission.status === "pending") {
      await ctx.db.patch(commission._id, { status: "cancelled" });
    }

    // ── إضافة المبلغ لمحفظة المعتمر ──
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (payment) {
      const refundAmount = booking.totalPrice;
      const userDoc = await ctx.db.get(userId);
      if (userDoc) {
        await ctx.db.patch(userId, {
          walletBalance: (userDoc.walletBalance ?? 0) + refundAmount,
        });
        await ctx.db.insert("walletTransactions", {
          userId,
          type: "refund",
          amount: refundAmount,
          bookingId: args.bookingId,
          bookingRef: booking.bookingReference,
          description: `استرداد مبلغ حجز ${pkg?.title ?? "برنامج العمرة"} (${booking.bookingReference}) — تم الإلغاء من المعتمر`,
          paymentMethod: payment.method,
          status: "completed",
          processedAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId,
          title: "💰 تم إضافة المبلغ لمحفظتك",
          body: `تم إضافة ${refundAmount.toLocaleString("ar-SA")} ر.س لمحفظتك بعد إلغاء الحجز ${booking.bookingReference}. يمكنك استخدامه في حجوزاتك القادمة أو استرداده.`,
          type: "wallet_refund",
          isRead: false,
        });
      }
    }

    // إشعار للمكتب
    const office = await ctx.db.get(booking.officeId);
    if (office) {
      await ctx.db.insert("notifications", {
        userId:  office.userId,
        title:   "⚠️ إلغاء حجز من المعتمر",
        body:    `قام المعتمر بإلغاء الحجز رقم ${booking.bookingReference}. يرجى المراجعة.`,
        type:    "booking_cancelled_by_user",
        linkId:  args.bookingId,
        isRead:  false,
      });
    }

    // ── إيميل إلغاء للمعتمر ──
    const user = await ctx.db.get(userId);
    if (user?.email) {
      await ctx.scheduler.runAfter(1000, internal.emailActions.sendBookingCancelledEmail, {
        bookingId:     args.bookingId,
        email:         user.email,
        passengerName: booking.leadPassengerName,
        bookingRef:    booking.bookingReference,
        packageTitle:  pkg?.title ?? "برنامج العمرة",
        officeName:    office?.name ?? "مكتب السفر",
        cancelledBy:   "المعتمر",
      });
    }
  },
});

export const getPackageReviews = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .order("desc")
      .collect();
    return await Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, userName: user?.name ?? "معتمر" };
      })
    );
  },
});

export const addReview = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating:    v.number(),
    comment:   v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("الحجز غير موجود");
    if (booking.userId !== userId) throw new ConvexError("غير مصرح لك");
    if (booking.status !== "completed") throw new ConvexError("يمكن التقييم فقط بعد اكتمال الرحلة");
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
      .collect();
    if (existing.some((r) => r.userId === userId && r.bookingId === args.bookingId))
      throw new ConvexError("لقد قيّمت هذا البرنامج مسبقاً");
    await ctx.db.insert("reviews", {
      packageId: booking.packageId,
      officeId:  booking.officeId,
      userId,
      rating:    args.rating,
      comment:   args.comment,
      bookingId: args.bookingId,
    });

    // تحديث متوسط التقييم
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
      .collect();
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    const office = await ctx.db.get(booking.officeId);
    if (office) {
      await ctx.db.patch(booking.officeId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length,
      });
    }
  },
});

export const updateProfile = mutation({
  args: {
    name:           v.optional(v.string()),
    phone:          v.optional(v.string()),
    idNumber:       v.optional(v.string()),
    passportNumber: v.optional(v.string()),
    city:           v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const updates: any = {};
    if (args.name           !== undefined) updates.name           = args.name;
    if (args.phone          !== undefined) updates.phone          = args.phone;
    if (args.idNumber       !== undefined) updates.idNumber       = args.idNumber;
    if (args.passportNumber !== undefined) updates.passportNumber = args.passportNumber;
    if (args.city           !== undefined) updates.city           = args.city;
    await ctx.db.patch(userId, updates);
  },
});

export const adminGetAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const admin = await ctx.db.get(userId);
    if (!admin?.isAdmin) return [];
    const bookings = await ctx.db.query("bookings").order("desc").collect();
    return await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        package: await ctx.db.get(b.packageId),
        office:  await ctx.db.get(b.officeId),
        user:    await ctx.db.get(b.userId),
      }))
    );
  },
});

export const adminUpdateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status:    v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const admin = await ctx.db.get(userId);
    if (!admin?.isAdmin) throw new ConvexError("غير مصرح لك");
    await ctx.db.patch(args.bookingId, { status: args.status });
    await upsertCommissionForBooking(ctx, args.bookingId);
  },
});
