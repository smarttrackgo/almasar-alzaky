// ── دوال عامة بدون مصادقة ──
import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ── جلب بيانات السائق عبر Driver Code (للتحقق الرسمي) ──
export const getDriverByCode = query({
  args: { driverCode: v.string() },
  handler: async (ctx, args) => {
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_code", (q) => q.eq("driverCode", args.driverCode))
      .first();

    if (!driver) return null;

    // إذا كان السائق موقوفاً أو غير نشط
    if (driver.driverStatus === "suspended" || driver.isActive === false) {
      return { suspended: true, name: driver.name };
    }

    // صورة الملف الشخصي
    const profileImageUrl = driver.profileImageId
      ? await ctx.storage.getUrl(driver.profileImageId)
      : null;

    // ── روابط الملفات المرفوعة ──
    const licenseImageUrl = (driver as any).licenseImageId
      ? await ctx.storage.getUrl((driver as any).licenseImageId)
      : null;
    const licenseFileUrl = driver.licenseFileId
      ? await ctx.storage.getUrl(driver.licenseFileId)
      : null;
    const operatingCardFileUrl = driver.operatingCardFileId
      ? await ctx.storage.getUrl(driver.operatingCardFileId)
      : null;

    // المكتب التابع له
    const office = driver.officeId ? await ctx.db.get(driver.officeId) : null;

    // الحافلة المرتبطة
    const bus = driver.busId ? await ctx.db.get(driver.busId) : null;

    // حساب حالة الرخصة تلقائياً
    let licenseStatus = (driver as any).licenseStatus ?? "unknown";
    const licenseExpiry = (driver as any).licenseExpiry ?? null;
    if (licenseExpiry) {
      const expDate = new Date(licenseExpiry);
      const now = new Date();
      if (expDate < now) licenseStatus = "expired";
      else licenseStatus = "valid";
    }

    return {
      suspended: false,
      _id: driver._id,
      name: driver.name,
      driverCode: (driver as any).driverCode,
      transportCompanyName: (driver as any).transportCompanyName ?? null,
      plateNumber: driver.plateNumber ?? bus?.plateNumber ?? null,
      busNumber: bus?.plateNumber ?? driver.plateNumber ?? null,
      busType: driver.busType ?? bus?.busType ?? null,
      isApproved: driver.isApproved ?? false,
      driverStatus: (driver as any).driverStatus ?? "active",
      licenseStatus,
      licenseExpiry,
      lastDataUpdate: (driver as any).lastDataUpdate ?? driver._creationTime,
      profileImageUrl,
      licenseImageUrl,
      licenseFileUrl,
      operatingCardFileUrl,
      officeName: office?.name ?? null,
      officeCity: office?.city ?? null,
    };
  },
});

// ── جلب بيانات السائق العامة عبر driverId ──
export const getDriverPublicProfile = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver || driver.isActive === false) return null;

    // صورة الملف الشخصي
    const profileImageUrl = driver.profileImageId
      ? await ctx.storage.getUrl(driver.profileImageId)
      : null;

    // المكتب التابع له
    const office = driver.officeId ? await ctx.db.get(driver.officeId) : null;

    // الحافلة المرتبطة
    const bus = driver.busId ? await ctx.db.get(driver.busId) : null;

    // الرحلة النشطة الحالية
    const activeTrip = await ctx.db
      .query("trips")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect()
      .then((trips) =>
        trips.find((t) =>
          ["driver_accepted", "in_progress", "driver_assigned"].includes(t.status)
        ) ?? null
      );

    let activeTripData = null;
    if (activeTrip) {
      const pkg = await ctx.db.get(activeTrip.packageId);
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_trip", (q) => q.eq("tripId", activeTrip._id))
        .collect();
      activeTripData = {
        _id: activeTrip._id,
        status: activeTrip.status,
        departureDate: activeTrip.departureDate,
        currentLat: activeTrip.currentLat,
        currentLng: activeTrip.currentLng,
        currentSpeed: activeTrip.currentSpeed,
        lastLocationUpdate: activeTrip.lastLocationUpdate,
        packageTitle: pkg?.title ?? "رحلة عمرة",
        passengerCount: bookings.length,
      };
    }

    return {
      _id: driver._id,
      name: driver.name,
      phone: driver.phone,
      nationality: driver.nationality,
      idNumber: driver.idNumber,
      plateNumber: driver.plateNumber ?? bus?.plateNumber,
      busCapacity: driver.busCapacity ?? bus?.capacity,
      busType: driver.busType ?? bus?.busType,
      busColor: driver.busColor ?? bus?.busColor,
      transportCompanyName: (driver as any).transportCompanyName ?? null,
      driverCode: (driver as any).driverCode ?? null,
      isApproved: driver.isApproved,
      profileImageUrl,
      officeName: office?.name ?? null,
      officeCity: office?.city ?? null,
      officePhone: office?.phone ?? null,
      activeTrip: activeTripData,
    };
  },
});

// ── تحديث موقع السائق عبر token (بدون تسجيل دخول) ──
export const updateLocationByToken = mutation({
  args: {
    token: v.string(),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_driver_token", (q) => q.eq("driverToken", args.token))
      .first();
    if (!trip) return { success: false, error: "رابط غير صالح" };

    await ctx.db.patch(trip._id, {
      currentLat: args.lat,
      currentLng: args.lng,
      currentSpeed: args.speed,
      currentHeading: args.heading,
      lastLocationUpdate: Date.now(),
    });

    return { success: true, tripId: trip._id };
  },
});

// ── جلب بيانات الرحلة عبر shareToken (بدون تسجيل دخول — للعائلة) ──
export const getTripByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.shareToken) return null;

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
          plateNumber:          drv.plateNumber          ?? null,
          busType:              drv.busType              ?? null,
          busColor:             drv.busColor             ?? null,
          transportCompanyName: (drv as any).transportCompanyName ?? null,
          driverCode:           (drv as any).driverCode  ?? null,
          profileImageUrl,
        };
      }
    }

    // حساب ما إذا كان السائق متصلاً (آخر تحديث خلال 90 ثانية)
    const secondsAgo = trip.lastLocationUpdate
      ? Math.floor((Date.now() - trip.lastLocationUpdate) / 1000)
      : null;
    const isLive = secondsAgo !== null && secondsAgo < 90;

    return {
      _id:                trip._id,
      status:             trip.status,
      departureDate:      trip.departureDate,
      currentLat:         trip.currentLat         ?? null,
      currentLng:         trip.currentLng         ?? null,
      currentSpeed:       trip.currentSpeed        ?? null,
      lastLocationUpdate: trip.lastLocationUpdate  ?? null,
      trackingStartedAt:  trip.trackingStartedAt   ?? null,
      isLive,
      secondsAgo,
      package:  pkg  ? { title: pkg.title, packageType: pkg.packageType } : null,
      office:   office ? { name: office.name, city: office.city }         : null,
      driver:   driverData,
    };
  },
});

// ── توليد shareToken لرحلة (من المكتب أو الأدمن) ──
export const generateShareToken = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("الرحلة غير موجودة");

    // إذا كان هناك token موجود، أعده مباشرة
    if (trip.shareToken) return trip.shareToken;

    // توليد token فريد
    const token =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10) +
      Date.now().toString(36);

    await ctx.db.patch(args.tripId, { shareToken: token });
    return token;
  },
});

// ── دالة داخلية لجلب بيانات السائق (تُستخدم من HTTP Action) ──
export const getDriverByCodeInternal = internalQuery({
  args: { driverCode: v.string() },
  handler: async (ctx, args) => {
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_code", (q) => q.eq("driverCode", args.driverCode))
      .first();

    if (!driver) return null;

    if ((driver as any).driverStatus === "suspended" || driver.isActive === false) {
      return { suspended: true, name: driver.name };
    }

    const profileImageUrl = driver.profileImageId
      ? await ctx.storage.getUrl(driver.profileImageId)
      : null;

    // ── روابط الملفات المرفوعة ──
    const licenseImageUrl = (driver as any).licenseImageId
      ? await ctx.storage.getUrl((driver as any).licenseImageId)
      : null;
    const licenseFileUrl = driver.licenseFileId
      ? await ctx.storage.getUrl(driver.licenseFileId)
      : null;
    const operatingCardFileUrl = driver.operatingCardFileId
      ? await ctx.storage.getUrl(driver.operatingCardFileId)
      : null;

    const office = driver.officeId ? await ctx.db.get(driver.officeId) : null;
    const bus    = driver.busId    ? await ctx.db.get(driver.busId)    : null;

    let licenseStatus = (driver as any).licenseStatus ?? "unknown";
    const licenseExpiry = (driver as any).licenseExpiry ?? null;
    if (licenseExpiry) {
      const expDate = new Date(licenseExpiry);
      if (expDate < new Date()) licenseStatus = "expired";
      else licenseStatus = "valid";
    }

    return {
      suspended: false,
      name: driver.name,
      driverCode: (driver as any).driverCode,
      transportCompanyName: (driver as any).transportCompanyName ?? null,
      plateNumber: driver.plateNumber ?? bus?.plateNumber ?? null,
      busType: driver.busType ?? bus?.busType ?? null,
      isApproved: driver.isApproved ?? false,
      driverStatus: (driver as any).driverStatus ?? "active",
      licenseStatus,
      licenseExpiry,
      lastDataUpdate: (driver as any).lastDataUpdate ?? driver._creationTime,
      profileImageUrl,
      licenseImageUrl,
      licenseFileUrl,
      operatingCardFileUrl,
      officeName: office?.name ?? null,
      officeCity: office?.city ?? null,
    };
  },
});
