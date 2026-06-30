import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// ── جلب رحلات السائق (بدون busId — بالـ driverId مباشرة) ──
export const getDriverTrips = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) return [];
    const trips = await ctx.db.query("trips").withIndex("by_driver", (q) => q.eq("driverId", driver._id)).collect();
    return Promise.all(trips.map(async (trip) => {
      const pkg = await ctx.db.get(trip.packageId);
      const office = await ctx.db.get(trip.officeId);
      const bookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", trip._id)).collect();
      const passengers = await Promise.all(bookings.map(async (b) => {
        const user = await ctx.db.get(b.userId);
        return { ...b, userName: user?.name ?? "مسافر" };
      }));
      return { ...trip, package: pkg, office, passengerCount: bookings.length, passengers };
    }));
  },
});

// ── تعيين سائق لرحلة (من المكتب) ──
export const assignDriver = mutation({
  args: {
    tripId: v.id("trips"),
    driverId: v.optional(v.id("drivers")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db.query("offices").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");

    // ── توليد shareToken إذا لم يكن موجوداً ──
    let shareToken = trip.shareToken;
    if (!shareToken && args.driverId) {
      shareToken =
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36);
    }

    await ctx.db.patch(args.tripId, {
      driverId: args.driverId,
      driverStatus: args.driverId ? "pending" : undefined,
      status: args.driverId ? "driver_assigned" : "scheduled",
      ...(shareToken ? { shareToken } : {}),
    });

    // إشعار للسائق
    if (args.driverId) {
      const driver = await ctx.db.get(args.driverId);
      if (driver) {
        const pkg = await ctx.db.get(trip.packageId);
        await ctx.db.insert("notifications", {
          userId: driver.userId,
          title: "🚌 طلب رحلة جديد!",
          body: `تم تعيينك لرحلة "${pkg?.title ?? "عمرة"}" بتاريخ ${trip.departureDate}. يرجى قبول أو رفض الرحلة.`,
          type: "trip_assigned",
          linkId: args.tripId,
          isRead: false,
        });
      }

      // ── إشعار للمعتمرين + رسالة واتساب تلقائية ──
      // جلب الحجوزات المرتبطة بالرحلة مباشرة
      const directBookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
      // جلب الحجوزات المرتبطة بالباقة والمكتب (غير مرتبطة بـ tripId بعد)
      const packageBookings = await ctx.db.query("bookings").withIndex("by_package", (q) => q.eq("packageId", trip.packageId)).collect();
      const unlinkedBookings = packageBookings.filter(
        (b) => !b.tripId && b.officeId === trip.officeId && b.status !== "cancelled"
      );
      // ربط الحجوزات غير المرتبطة بالرحلة
      for (const b of unlinkedBookings) {
        await ctx.db.patch(b._id, { tripId: args.tripId });
      }
      // دمج الحجوزات
      const bookings = [...directBookings, ...unlinkedBookings];
      const pkg = await ctx.db.get(trip.packageId);
      const driverInfo = await ctx.db.get(args.driverId);

      // رابط التتبع العام
      const appUrl = "https://masardhaki.com"; // يمكن تغييره من الإعدادات
      const trackingUrl = shareToken ? `${appUrl}?track=${shareToken}` : null;

      for (const b of bookings) {
        // إشعار داخلي
        await ctx.db.insert("notifications", {
          userId: b.userId,
          title: "🚌 تم تعيين سائقك!",
          body: `تم تعيين السائق ${driverInfo?.name ?? "السائق"} لرحلتك "${pkg?.title ?? ""}". سيتم إشعارك عند قبوله وانطلاق الرحلة.`,
          type: "driver_assigned",
          linkId: b._id,
          isRead: false,
        });

        // ── رسالة واتساب تلقائية للمعتمر ──
        const passenger = await ctx.db.get(b.userId);
        const passengerPhone = b.leadPassengerPhone ?? passenger?.phone;
        if (passengerPhone && driverInfo) {
          const waMsg = buildDriverAssignedWhatsApp({
            passengerName:   b.leadPassengerName,
            packageTitle:    pkg?.title ?? "رحلة العمرة",
            departureDate:   trip.departureDate,
            driverName:      driverInfo.name,
            driverPhone:     driverInfo.phone,
            plateNumber:     driverInfo.plateNumber ?? null,
            busType:         driverInfo.busType ?? null,
            companyName:     (driverInfo as any).transportCompanyName ?? null,
            trackingUrl,
            officeName:      office.name,
            officePhone:     office.phone,
          });

          // تسجيل رسالة الواتساب في السجل
          await ctx.db.insert("whatsappLogs", {
            bookingId: b._id,
            officeId:  trip.officeId,
            userId:    b.userId,
            phone:     passengerPhone,
            messageType: "driver_assigned",
            messageText: waMsg,
            sentAt:    Date.now(),
            sentBy:    userId,
          });

          // ── إرسال SMS تلقائي عند تعيين السائق ──
          await ctx.scheduler.runAfter(0, internal.smsActions.sendSMS, {
            phone:       passengerPhone,
            messageType: "driver_assigned",
            messageData: {
              passengerName: b.leadPassengerName,
              packageTitle:  pkg?.title ?? "رحلة العمرة",
              driverName:    driverInfo.name,
              driverPhone:   driverInfo.phone ?? undefined,
              plateNumber:   driverInfo.plateNumber ?? undefined,
              trackingUrl:   trackingUrl ?? undefined,
            },
            bookingId: b._id,
            userId:    b.userId,
            officeId:  trip.officeId,
          });
        }
      }
    }
  },
});

// ── بناء رسالة واتساب عند تعيين السائق ──
function buildDriverAssignedWhatsApp(data: {
  passengerName: string;
  packageTitle: string;
  departureDate: string;
  driverName: string;
  driverPhone: string;
  plateNumber: string | null;
  busType: string | null;
  companyName: string | null;
  trackingUrl: string | null;
  officeName: string;
  officePhone: string;
}): string {
  const lines = [
    `🕋 *المسار الذكي للعمرة*`,
    ``,
    `السلام عليكم ${data.passengerName} 👋`,
    ``,
    `✅ *تم تعيين سائقك لرحلة العمرة!*`,
    ``,
    `📦 *البرنامج:* ${data.packageTitle}`,
    `📅 *تاريخ الانطلاق:* ${data.departureDate}`,
    ``,
    `🚌 *بيانات السائق:*`,
    `• الاسم: ${data.driverName}`,
    `• الجوال: ${data.driverPhone}`,
    data.plateNumber ? `• رقم اللوحة: ${data.plateNumber}` : null,
    data.busType     ? `• نوع الحافلة: ${data.busType}`    : null,
    data.companyName ? `• شركة النقل: ${data.companyName}` : null,
    ``,
    data.trackingUrl
      ? `📍 *تتبع موقع الحافلة مباشرة:*\n${data.trackingUrl}`
      : null,
    ``,
    `🏢 *للتواصل مع المكتب:*`,
    `${data.officeName} — ${data.officePhone}`,
    ``,
    `تقبّل الله منكم وأعانكم على أداء مناسككم 🤲`,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

// ── قبول أو رفض الرحلة (من السائق) ──
export const driverRespondToTrip = mutation({
  args: {
    tripId: v.id("trips"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.driverId !== driver._id) throw new ConvexError("هذه الرحلة ليست مخصصة لك");

    if (args.accept) {
      await ctx.db.patch(args.tripId, {
        driverStatus: "accepted",
        status: "driver_accepted",
      });
      // إشعار للمعتمرين
      const bookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
      const pkg = await ctx.db.get(trip.packageId);
      for (const b of bookings) {
        await ctx.db.insert("notifications", {
          userId: b.userId,
          title: "✅ السائق قبل الرحلة!",
          body: `السائق ${driver.name} قبل رحلتك "${pkg?.title ?? ""}". يمكنك الآن متابعة موقعه عند الانطلاق.`,
          type: "driver_accepted",
          linkId: b._id,
          isRead: false,
        });
      }
      // ── SMS عند قبول السائق ──
      for (const b of bookings) {
        const passenger = await ctx.db.get(b.userId);
        const passengerPhone = b.leadPassengerPhone ?? (passenger as any)?.phone;
        if (passengerPhone) {
          await ctx.scheduler.runAfter(0, internal.smsActions.sendSMS, {
            phone:       passengerPhone,
            messageType: "driver_accepted",
            messageData: {
              passengerName: b.leadPassengerName,
              packageTitle:  pkg?.title ?? "رحلة العمرة",
              driverName:    driver.name,
            },
            bookingId: b._id,
            userId:    b.userId,
            officeId:  trip.officeId,
          });
        }
      }

      // إشعار للمكتب
      const office = await ctx.db.get(trip.officeId);
      if (office) {
        await ctx.db.insert("notifications", {
          userId: office.userId,
          title: "✅ السائق قبل الرحلة",
          body: `السائق ${driver.name} قبل رحلة "${pkg?.title ?? ""}" بتاريخ ${trip.departureDate}.`,
          type: "driver_accepted",
          linkId: args.tripId,
          isRead: false,
        });
      }
    } else {
      await ctx.db.patch(args.tripId, {
        driverStatus: "rejected",
        status: "scheduled",
        driverId: undefined,
      });
      // إشعار للمكتب بالرفض
      const office = await ctx.db.get(trip.officeId);
      const pkg = await ctx.db.get(trip.packageId);
      if (office) {
        await ctx.db.insert("notifications", {
          userId: office.userId,
          title: "❌ السائق رفض الرحلة",
          body: `السائق ${driver.name} رفض رحلة "${pkg?.title ?? ""}" بتاريخ ${trip.departureDate}. يرجى تعيين سائق آخر.`,
          type: "driver_rejected",
          linkId: args.tripId,
          isRead: false,
        });
      }
    }
  },
});

// ── بدء الرحلة من السائق مع تفعيل التتبع ──
export const driverStartTrip = mutation({
  args: {
    tripId: v.id("trips"),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.driverId !== driver._id) throw new ConvexError("هذه الرحلة ليست مخصصة لك");

    await ctx.db.patch(args.tripId, {
      status: "in_progress",
      driverStatus: "accepted",
      currentLat: args.lat,
      currentLng: args.lng,
      lastLocationUpdate: Date.now(),
      trackingStartedAt: Date.now(),
    });

    // إشعار للمعتمرين بانطلاق الرحلة
    const bookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    const pkg = await ctx.db.get(trip.packageId);
    const appUrl = "https://masardhaki.com";
    const trackingUrl = trip.shareToken ? `${appUrl}?track=${trip.shareToken}` : null;

    for (const b of bookings) {
      await ctx.db.insert("notifications", {
        userId: b.userId,
        title: "🚌 انطلقت رحلتك!",
        body: `رحلة "${pkg?.title ?? "العمرة"}" انطلقت الآن. يمكنك متابعة موقع الحافلة مباشرة.`,
        type: "trip_started",
        linkId: b._id,
        isRead: false,
      });

      // ── SMS عند انطلاق الرحلة ──
      const passenger = await ctx.db.get(b.userId);
      const passengerPhone = b.leadPassengerPhone ?? (passenger as any)?.phone;
      if (passengerPhone) {
        await ctx.scheduler.runAfter(0, internal.smsActions.sendSMS, {
          phone:       passengerPhone,
          messageType: "trip_started",
          messageData: {
            passengerName: b.leadPassengerName,
            packageTitle:  pkg?.title ?? "رحلة العمرة",
            trackingUrl:   trackingUrl ?? undefined,
          },
          bookingId: b._id,
          userId:    b.userId,
          officeId:  trip.officeId,
        });
      }
    }
  },
});

// ── تحديث موقع السائق (يُستدعى كل 5 ثوانٍ) ──
export const driverUpdateLocation = mutation({
  args: {
    tripId: v.id("trips"),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.driverId !== driver._id) throw new ConvexError("هذه الرحلة ليست مخصصة لك");
    if (trip.status !== "in_progress") throw new ConvexError("الرحلة ليست نشطة");

    await ctx.db.patch(args.tripId, {
      currentLat: args.lat,
      currentLng: args.lng,
      currentSpeed: args.speed,
      currentHeading: args.heading,
      lastLocationUpdate: Date.now(),
    });
  },
});

// ── إنهاء الرحلة من السائق ──
export const driverEndTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.driverId !== driver._id) throw new ConvexError("هذه الرحلة ليست مخصصة لك");

    await ctx.db.patch(args.tripId, { status: "completed" });
    const bookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    const pkg = await ctx.db.get(trip.packageId);
    for (const b of bookings) {
      if (b.status === "confirmed") await ctx.db.patch(b._id, { status: "completed" });
      await ctx.db.insert("notifications", {
        userId: b.userId,
        title: "🏁 وصلتم بسلامة!",
        body: `رحلة "${pkg?.title ?? "العمرة"}" اكتملت بنجاح. تقبّل الله منكم 🤲`,
        type: "trip_completed",
        linkId: b._id,
        isRead: false,
      });

      // ── SMS عند اكتمال الرحلة ──
      const passenger = await ctx.db.get(b.userId);
      const passengerPhone = b.leadPassengerPhone ?? (passenger as any)?.phone;
      if (passengerPhone) {
        await ctx.scheduler.runAfter(0, internal.smsActions.sendSMS, {
          phone:       passengerPhone,
          messageType: "trip_completed",
          messageData: {
            passengerName: b.leadPassengerName,
            packageTitle:  pkg?.title ?? "رحلة العمرة",
          },
          bookingId: b._id,
          userId:    b.userId,
          officeId:  trip.officeId,
        });
      }
    }
  },
});

// ── جلب رحلة نشطة للمعتمر (محسّنة) ──
export const myActiveTripFull = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const ACTIVE_STATUSES = ["scheduled", "driver_assigned", "driver_accepted", "in_progress", "completed"];

    // ── المسار الأول: الحجز مرتبط مباشرة بـ tripId ──
    for (const booking of bookings) {
      if (!booking.tripId) continue;
      if (booking.status === "cancelled") continue;
      const trip = await ctx.db.get(booking.tripId);
      if (!trip) continue;
      // أظهر الرحلة حتى لو كانت scheduled (لكن بها سائق)
      if (!ACTIVE_STATUSES.includes(trip.status)) continue;
      // إذا كانت scheduled بدون سائق، تجاهلها
      if (trip.status === "scheduled" && !trip.driverId) continue;

      return await buildTripResult(ctx, trip, booking);
    }

    // ── المسار الثاني: البحث عن رحلة نشطة عبر packageId + officeId ──
    // (يُستخدم عندما لا يكون الحجز مرتبطاً بـ tripId بعد)
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;

      // ابحث عن رحلة نشطة لنفس الباقة والمكتب
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
        .collect();

      for (const trip of trips) {
        if (trip.officeId !== booking.officeId) continue;
        if (!ACTIVE_STATUSES.includes(trip.status)) continue;
        // إذا كانت scheduled بدون سائق، تجاهلها
        if (trip.status === "scheduled" && !trip.driverId) continue;

        return await buildTripResult(ctx, trip, booking);
      }
    }

    return null;
  },
});

// ── دالة مساعدة لبناء نتيجة الرحلة مع بيانات السائق الكاملة ──
async function buildTripResult(ctx: any, trip: any, booking: any) {
  const pkg    = await ctx.db.get(trip.packageId);
  const office = await ctx.db.get(trip.officeId);
  const bus    = trip.busId ? await ctx.db.get(trip.busId) : null;

  // ── بيانات السائق الكاملة ──
  let driverData: Record<string, any> | null = null;

  // المسار الأول: السائق من جدول drivers (النظام الجديد)
  if (trip.driverId) {
    const drv = await ctx.db.get(trip.driverId);
    if (drv) {
      const profileImageUrl = drv.profileImageId
        ? await ctx.storage.getUrl(drv.profileImageId)
        : null;
      driverData = {
        _id:                  drv._id,
        name:                 drv.name,
        phone:                drv.phone                ?? null,
        nationality:          drv.nationality          ?? null,
        plateNumber:          drv.plateNumber          ?? null,
        busColor:             drv.busColor             ?? null,
        busType:              drv.busType              ?? null,
        busCapacity:          drv.busCapacity          ?? null,
        transportCompanyName: drv.transportCompanyName ?? null,
        driverCode:           drv.driverCode           ?? null,
        licenseStatus:        drv.licenseStatus        ?? null,
        driverStatus:         drv.driverStatus         ?? null,
        isApproved:           drv.isApproved           ?? false,
        profileImageUrl,
      };
    }
  }

  // المسار الثاني: السائق من جدول buses (النظام القديم — fallback)
  if (!driverData && bus) {
    driverData = {
      _id:                  null,
      name:                 bus.driverName             ?? null,
      phone:                bus.driverPhone            ?? null,
      nationality:          bus.driverNationality      ?? null,
      plateNumber:          bus.plateNumber            ?? null,
      busColor:             bus.busColor               ?? null,
      busType:              bus.busType                ?? null,
      busCapacity:          bus.capacity               ?? null,
      transportCompanyName: null,
      driverCode:           null,
      licenseStatus:        null,
      driverStatus:         null,
      isApproved:           false,
      profileImageUrl:      null,
    };
  }

  return {
    ...trip,
    package: pkg,
    office,
    bus,
    booking,
    driver: driverData,
  };
}

function makeToken(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

export const getByOffice = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office) return [];
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_office", (q) => q.eq("officeId", office._id))
      .collect();
    return Promise.all(
      trips.map(async (trip) => {
        const pkg = await ctx.db.get(trip.packageId);
        const bus = trip.busId ? await ctx.db.get(trip.busId) : null;
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
          .collect();
        return { ...trip, package: pkg, bus, bookingCount: bookings.length };
      })
    );
  },
});

// جلب رحلة واحدة بالتفاصيل (للتتبع)
export const getById = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const pkg = await ctx.db.get(trip.packageId);
    const office = await ctx.db.get(trip.officeId);
    const bus = trip.busId ? await ctx.db.get(trip.busId) : null;
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
      .collect();
    const passengers = await Promise.all(
      bookings.map(async (b) => {
        const user = await ctx.db.get(b.userId);
        return { ...b, userName: user?.name ?? "مسافر" };
      })
    );

    // ── بيانات السائق الكاملة ──
    let driverData: Record<string, any> | null = null;
    if (trip.driverId) {
      const drv = await ctx.db.get(trip.driverId);
      if (drv) {
        const profileImageUrl = drv.profileImageId
          ? await ctx.storage.getUrl(drv.profileImageId)
          : null;
        driverData = {
          _id:                  drv._id,
          name:                 drv.name,
          phone:                drv.phone                ?? null,
          nationality:          drv.nationality          ?? null,
          plateNumber:          drv.plateNumber          ?? null,
          busColor:             drv.busColor             ?? null,
          busType:              drv.busType              ?? null,
          busCapacity:          drv.busCapacity          ?? null,
          transportCompanyName: drv.transportCompanyName ?? null,
          driverCode:           drv.driverCode           ?? null,
          licenseStatus:        drv.licenseStatus        ?? null,
          isApproved:           drv.isApproved           ?? false,
          profileImageUrl,
        };
      }
    }

    return { ...trip, package: pkg, office, bus, passengers, driver: driverData };
  },
});

// جلب رحلة المستخدم الحالي (للمعتمر)
export const myActiveTrip = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    // ابحث عن حجز مرتبط برحلة نشطة
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const booking of bookings) {
      if (!booking.tripId) continue;
      const trip = await ctx.db.get(booking.tripId);
      if (trip && trip.status === "in_progress") {
        const pkg = await ctx.db.get(trip.packageId);
        const office = await ctx.db.get(trip.officeId);
        const bus = trip.busId ? await ctx.db.get(trip.busId) : null;
        return { ...trip, package: pkg, office, bus, booking };
      }
    }
    return null;
  },
});

export const create = mutation({
  args: {
    packageId: v.id("packages"),
    busId: v.optional(v.id("buses")),
    departureDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office) throw new ConvexError("لا يوجد مكتب مرتبط بحسابك");
    const token = makeToken();
    return await ctx.db.insert("trips", {
      officeId: office._id,
      packageId: args.packageId,
      busId: args.busId,
      departureDate: args.departureDate,
      status: "scheduled",
      notes: args.notes,
      driverToken: token,
    });
  },
});

// ── إنشاء رحلة وربطها بحجز معين ──
export const createAndLinkToBooking = mutation({
  args: {
    packageId: v.id("packages"),
    bookingId: v.id("bookings"),
    busId: v.optional(v.id("buses")),
    departureDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office) throw new ConvexError("لا يوجد مكتب مرتبط بحسابك");

    const token = makeToken();
    const tripId = await ctx.db.insert("trips", {
      officeId: office._id,
      packageId: args.packageId,
      busId: args.busId,
      departureDate: args.departureDate,
      status: "scheduled",
      notes: args.notes,
      driverToken: token,
    });

    // ربط الحجز بالرحلة
    await ctx.db.patch(args.bookingId, { tripId });

    // إشعار للمعتمر
    const booking = await ctx.db.get(args.bookingId);
    if (booking) {
      const bus = args.busId ? await ctx.db.get(args.busId) : null;
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        title: "🚌 تم تعيين سائقك!",
        body: bus
          ? `تم تعيين الحافلة ${bus.plateNumber} والسائق ${bus.driverName} لرحلتك. يمكنك متابعة موقع الحافلة مباشرة.`
          : "تم تعيين سائق لرحلتك. ستجد تفاصيله في صفحة الحجز.",
        type: "driver_assigned",
        linkId: args.bookingId,
        isRead: false,
      });
    }

    return { tripId, driverToken: token };
  },
});

// ── تعيين حافلة لرحلة موجودة ──
export const assignBus = mutation({
  args: {
    tripId: v.id("trips"),
    busId: v.optional(v.id("buses")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");
    await ctx.db.patch(args.tripId, { busId: args.busId });

    // إشعار للمعتمرين المرتبطين بهذه الرحلة
    if (args.busId) {
      const bus = await ctx.db.get(args.busId);
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
        .collect();
      for (const b of bookings) {
        await ctx.db.insert("notifications", {
          userId: b.userId,
          title: "🚌 تم تحديث بيانات السائق",
          body: bus
            ? `تم تعيين الحافلة ${bus.plateNumber} والسائق ${bus.driverName} لرحلتك.`
            : "تم تحديث بيانات النقل لرحلتك.",
          type: "driver_assigned",
          linkId: b._id,
          isRead: false,
        });
      }
    }
  },
});

export const updateStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");
    await ctx.db.patch(args.tripId, { status: args.status });

    if (args.status === "completed") {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
        .collect();
      for (const b of bookings) {
        if (b.status === "confirmed") {
          await ctx.db.patch(b._id, { status: "completed" });
        }
      }
    }
  },
});

export const updateLocation = mutation({
  args: {
    tripId: v.id("trips"),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const isSupervisor = trip.supervisorId === userId;
    if (!office && !isSupervisor) throw new ConvexError("غير مصرح");
    if (office && office._id !== trip.officeId && !isSupervisor) throw new ConvexError("غير مصرح");

    await ctx.db.patch(args.tripId, {
      currentLat: args.lat,
      currentLng: args.lng,
      currentSpeed: args.speed,
      lastLocationUpdate: Date.now(),
      status: "in_progress",
    });
  },
});

export const assignSupervisor = mutation({
  args: {
    tripId: v.id("trips"),
    supervisorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");
    await ctx.db.patch(args.tripId, { supervisorId: args.supervisorId });
  },
});

// ── توليد token فريد للسائق ──
export const generateDriverToken = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");

    const token = makeToken();
    await ctx.db.patch(args.tripId, { driverToken: token });
    return token;
  },
});

export const remove = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== trip.officeId) throw new ConvexError("غير مصرح");
    await ctx.db.delete(args.tripId);
  },
});

// ── جلب رحلة عامة بالـ shareToken (بدون تسجيل دخول — للعائلة والأصدقاء) ──
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!trip) return null;

    const pkg    = await ctx.db.get(trip.packageId);
    const office = await ctx.db.get(trip.officeId);

    // بيانات السائق (محدودة — بدون بيانات حساسة)
    let driverData: Record<string, any> | null = null;
    if (trip.driverId) {
      const drv = await ctx.db.get(trip.driverId);
      if (drv) {
        const profileImageUrl = drv.profileImageId
          ? await ctx.storage.getUrl(drv.profileImageId)
          : null;
        driverData = {
          name:                 drv.name,
          nationality:          drv.nationality          ?? null,
          plateNumber:          drv.plateNumber          ?? null,
          busColor:             drv.busColor             ?? null,
          busType:              drv.busType              ?? null,
          busCapacity:          drv.busCapacity          ?? null,
          transportCompanyName: drv.transportCompanyName ?? null,
          driverCode:           drv.driverCode           ?? null,
          profileImageUrl,
          // ❌ لا نُرجع: phone, idNumber, licenseStatus (بيانات حساسة)
        };
      }
    }

    return {
      _id:                trip._id,
      status:             trip.status,
      departureDate:      trip.departureDate,
      currentLat:         trip.currentLat         ?? null,
      currentLng:         trip.currentLng         ?? null,
      currentSpeed:       trip.currentSpeed       ?? null,
      lastLocationUpdate: trip.lastLocationUpdate ?? null,
      package: pkg ? {
        title:         pkg.title,
        departureDate: pkg.departureDate,
        returnDate:    pkg.returnDate,
        duration:      pkg.duration,
      } : null,
      office: office ? {
        name: office.name,
        city: office.city,
        // ❌ لا نُرجع: phone, email (بيانات حساسة)
      } : null,
      driver: driverData,
    };
  },
});
