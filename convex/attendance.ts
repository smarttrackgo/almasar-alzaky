import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── مسح QR وتسجيل حضور المعتمر ──
export const scanAndCheckIn = mutation({
  args: {
    bookingReference: v.string(),
    tripId:           v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");

    // التحقق أن المستخدم سائق
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!driver) throw new ConvexError("هذه الميزة للسائقين فقط");

    // التحقق أن الرحلة مخصصة لهذا السائق
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.driverId !== driver._id) throw new ConvexError("هذه الرحلة ليست مخصصة لك");

    // البحث عن الحجز بالـ bookingReference
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_booking_reference", (q) => q.eq("bookingReference", args.bookingReference))
      .first();

    if (!booking) {
      return { success: false, reason: "not_found", message: "رقم التذكرة غير موجود في النظام" };
    }

    // التحقق أن الحجز مرتبط بنفس الرحلة أو نفس الباقة والمكتب
    const sameTrip    = booking.tripId === args.tripId;
    const samePackage = booking.packageId === trip.packageId && booking.officeId === trip.officeId;
    if (!sameTrip && !samePackage) {
      return { success: false, reason: "wrong_trip", message: "هذه التذكرة لرحلة مختلفة" };
    }

    // التحقق من حالة الحجز
    if (booking.status === "cancelled") {
      return { success: false, reason: "cancelled", message: "هذا الحجز ملغي" };
    }

    // التحقق من الحضور المسبق
    if (booking.attendanceStatus === "present") {
      const checkedAt = booking.attendanceAt
        ? new Date(booking.attendanceAt).toLocaleTimeString("ar-SA")
        : "";
      return {
        success: false,
        reason: "already_checked",
        message: `تم تسجيل حضور هذا الراكب مسبقاً${checkedAt ? ` الساعة ${checkedAt}` : ""}`,
        booking: {
          leadPassengerName:  booking.leadPassengerName,
          leadPassengerPhone: booking.leadPassengerPhone,
          bookingReference:   booking.bookingReference,
          adultsCount:        booking.adultsCount,
          childrenCount:      booking.childrenCount ?? 0,
          attendanceAt:       booking.attendanceAt,
        },
      };
    }

    // ── تسجيل الحضور ──
    await ctx.db.patch(booking._id, {
      attendanceStatus: "present",
      attendanceAt:     Date.now(),
      attendanceBy:     userId,
      // ربط الحجز بالرحلة إذا لم يكن مرتبطاً
      ...(booking.tripId ? {} : { tripId: args.tripId }),
    });

    // إشعار للمعتمر
    await ctx.db.insert("notifications", {
      userId:  booking.userId,
      title:   "✅ تم تسجيل حضورك!",
      body:    `تم تسجيل حضورك في رحلة العمرة بواسطة السائق ${driver.name}. رحلة موفقة!`,
      type:    "attendance_confirmed",
      linkId:  booking._id,
      isRead:  false,
    });

    // جلب بيانات المعتمر
    const passenger = await ctx.db.get(booking.userId);

    return {
      success: true,
      reason:  "checked_in",
      message: `تم تسجيل حضور ${booking.leadPassengerName} بنجاح`,
      booking: {
        leadPassengerName:  booking.leadPassengerName,
        leadPassengerPhone: booking.leadPassengerPhone,
        bookingReference:   booking.bookingReference,
        adultsCount:        booking.adultsCount,
        childrenCount:      booking.childrenCount ?? 0,
        passengerEmail:     (passenger as any)?.email ?? null,
        attendanceAt:       Date.now(),
      },
    };
  },
});

// ── جلب قائمة الحضور لرحلة (للسائق والمكتب) ──
export const getTripAttendance = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;

    // التحقق من الصلاحية (سائق أو مكتب)
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const user = await ctx.db.get(userId);

    const isDriver = driver && trip.driverId === driver._id;
    const isOffice = office && trip.officeId === office._id;
    const isAdmin  = (user as any)?.isAdmin;

    if (!isDriver && !isOffice && !isAdmin) return null;

    // جلب الحجوزات المرتبطة بالرحلة
    const directBookings = await ctx.db
      .query("bookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    // جلب حجوزات الباقة غير المرتبطة
    const packageBookings = await ctx.db
      .query("bookings")
      .withIndex("by_package", (q) => q.eq("packageId", trip.packageId))
      .collect();
    const unlinked = packageBookings.filter(
      (b) => !b.tripId && b.officeId === trip.officeId && b.status !== "cancelled"
    );

    const allBookings = [...directBookings, ...unlinked];
    const unique = Array.from(new Map(allBookings.map((b) => [b._id, b])).values());

    const present = unique.filter((b) => b.attendanceStatus === "present");
    const absent  = unique.filter((b) => b.attendanceStatus !== "present");

    return {
      total:   unique.length,
      present: present.length,
      absent:  absent.length,
      bookings: unique.map((b) => ({
        _id:                b._id,
        bookingReference:   b.bookingReference,
        leadPassengerName:  b.leadPassengerName,
        leadPassengerPhone: b.leadPassengerPhone,
        adultsCount:        b.adultsCount,
        childrenCount:      b.childrenCount ?? 0,
        status:             b.status,
        attendanceStatus:   b.attendanceStatus ?? "absent",
        attendanceAt:       b.attendanceAt ?? null,
      })),
    };
  },
});

// ── تسجيل غياب يدوي (من السائق) ──
export const markAbsent = mutation({
  args: {
    bookingId: v.id("bookings"),
    tripId:    v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!driver) throw new ConvexError("هذه الميزة للسائقين فقط");

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.driverId !== driver._id) throw new ConvexError("غير مصرح");

    await ctx.db.patch(args.bookingId, {
      attendanceStatus: "absent",
      attendanceAt:     Date.now(),
      attendanceBy:     userId,
    });
  },
});

// ── إلغاء تسجيل الحضور (تصحيح خطأ) ──
export const undoCheckIn = mutation({
  args: {
    bookingId: v.id("bookings"),
    tripId:    v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const user = await ctx.db.get(userId);
    const isAdmin = (user as any)?.isAdmin;

    if (!driver && !isAdmin) throw new ConvexError("غير مصرح");

    await ctx.db.patch(args.bookingId, {
      attendanceStatus: undefined,
      attendanceAt:     undefined,
      attendanceBy:     undefined,
    });
  },
});
