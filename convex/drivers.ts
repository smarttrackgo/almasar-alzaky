import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── توليد Driver Code فريد ──
function generateDriverCode(): string {
  const prefix = "DRV";
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `${prefix}-${year}-${rand}`;
}

export const getMyDriver = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) return null;
    const office = driver.officeId ? await ctx.db.get(driver.officeId) : null;
    const profileImageUrl  = driver.profileImageId  ? await ctx.storage.getUrl(driver.profileImageId)  : null;
    const licenseImageUrl  = (driver as any).licenseImageId  ? await ctx.storage.getUrl((driver as any).licenseImageId)  : null;
    return { ...driver, office, profileImageUrl, licenseImageUrl };
  },
});

export const getAllMyTrips = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) return [];
    // جلب الرحلات المعيّنة للسائق مباشرة
    const myTrips = await ctx.db.query("trips").withIndex("by_driver", (q) => q.eq("driverId", driver._id)).collect();
    return Promise.all(myTrips.map(async (trip) => {
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

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    nationality: v.optional(v.string()),
    residenceType: v.optional(v.string()),
    idNumber: v.optional(v.string()),
    officeId: v.optional(v.id("offices")),
    plateNumber: v.optional(v.string()),
    busCapacity: v.optional(v.number()),
    busType: v.optional(v.string()),
    busColor: v.optional(v.string()),
    transportCompanyName: v.optional(v.string()),
    licenseExpiry: v.optional(v.string()),
    licenseStatus: v.optional(v.string()),
    driverStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const patch: Record<string, any> = { lastDataUpdate: Date.now() };
    for (const [k, val] of Object.entries(args)) {
      if (val !== undefined) patch[k] = val;
    }
    // توليد driverCode تلقائياً إذا لم يكن موجوداً
    if (!(driver as any).driverCode) {
      let code = generateDriverCode();
      // التأكد من عدم التكرار
      let existing = await ctx.db.query("drivers")
        .withIndex("by_driver_code", (q) => q.eq("driverCode", code)).first();
      while (existing) {
        code = generateDriverCode();
        existing = await ctx.db.query("drivers")
          .withIndex("by_driver_code", (q) => q.eq("driverCode", code)).first();
      }
      patch.driverCode = code;
    }
    await ctx.db.patch(driver._id, patch);
    if (args.name) await ctx.db.patch(userId, { name: args.name });
  },
});

// ── توليد Driver Code للسائقين الموجودين (من الأدمن) ──
export const adminGenerateDriverCode = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) throw new ConvexError("غير مصرح");
    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new ConvexError("السائق غير موجود");
    let code = generateDriverCode();
    let existing = await ctx.db.query("drivers")
      .withIndex("by_driver_code", (q) => q.eq("driverCode", code)).first();
    while (existing) {
      code = generateDriverCode();
      existing = await ctx.db.query("drivers")
        .withIndex("by_driver_code", (q) => q.eq("driverCode", code)).first();
    }
    await ctx.db.patch(args.driverId, { driverCode: code, lastDataUpdate: Date.now() });
    return code;
  },
});

// ── تحديث بيانات السائق من الأدمن ──
export const adminUpdateDriver = mutation({
  args: {
    driverId: v.id("drivers"),
    name: v.optional(v.string()),
    transportCompanyName: v.optional(v.string()),
    plateNumber: v.optional(v.string()),
    busType: v.optional(v.string()),
    licenseExpiry: v.optional(v.string()),
    licenseStatus: v.optional(v.string()),
    driverStatus: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    isApproved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) throw new ConvexError("غير مصرح");
    const { driverId, ...updates } = args;
    const patch: Record<string, any> = { lastDataUpdate: Date.now() };
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(driverId, patch);
  },
});

export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveProfileImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    await ctx.db.patch(driver._id, { profileImageId: args.storageId });
  },
});

export const generateFileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    return await ctx.storage.generateUploadUrl();
  },
});

// ── حفظ صورة رخصة القيادة (منفصلة عن الصورة الشخصية) ──
export const saveLicenseImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    await ctx.db.patch(driver._id, { licenseImageId: args.storageId });
  },
});

export const saveLicenseFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    await ctx.db.patch(driver._id, { licenseFileId: args.storageId });
  },
});

export const saveOperatingCardFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    await ctx.db.patch(driver._id, { operatingCardFileId: args.storageId });
  },
});

export const updateDriverLocation = mutation({
  args: {
    tripId: v.id("trips"),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.busId !== driver.busId) throw new ConvexError("هذه الرحلة ليست مرتبطة بحافلتك");
    await ctx.db.patch(args.tripId, {
      currentLat: args.lat,
      currentLng: args.lng,
      currentSpeed: args.speed,
      lastLocationUpdate: Date.now(),
      status: "in_progress",
    });
  },
});

export const startTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.busId !== driver.busId) throw new ConvexError("هذه الرحلة ليست مرتبطة بحافلتك");
    await ctx.db.patch(args.tripId, { status: "in_progress" });
  },
});

export const endTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const driver = await ctx.db.query("drivers").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!driver) throw new ConvexError("لم يتم العثور على بيانات السائق");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new ConvexError("الرحلة غير موجودة");
    if (trip.busId !== driver.busId) throw new ConvexError("هذه الرحلة ليست مرتبطة بحافلتك");
    await ctx.db.patch(args.tripId, { status: "completed" });
    const bookings = await ctx.db.query("bookings").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    for (const b of bookings) {
      if (b.status === "confirmed") await ctx.db.patch(b._id, { status: "completed" });
    }
  },
});

export const getByOffice = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const office = await ctx.db.query("offices").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!office) return [];

    // السائقون المرتبطون بالمكتب مباشرة
    const officeDrivers = await ctx.db.query("drivers")
      .withIndex("by_office", (q) => q.eq("officeId", office._id))
      .collect();

    // السائقون المعتمدون من الأدمن (isApproved = true) غير المرتبطين بمكتب آخر
    const allDrivers = await ctx.db.query("drivers").collect();
    const approvedFree = allDrivers.filter(
      (d) => d.isApproved === true && (!d.officeId || d.officeId === office._id)
    );

    // دمج بدون تكرار
    const seen = new Set<string>();
    const merged = [...officeDrivers, ...approvedFree].filter((d) => {
      if (seen.has(d._id)) return false;
      seen.add(d._id);
      return true;
    });

    return Promise.all(merged.map(async (d) => {
      const user = await ctx.db.get(d.userId);
      const profileImageUrl = d.profileImageId ? await ctx.storage.getUrl(d.profileImageId) : null;
      return { ...d, user, profileImageUrl };
    }));
  },
});

export const listOffices = query({
  args: {},
  handler: async (ctx) => {
    const offices = await ctx.db.query("offices").collect();
    return offices.filter((o) => o.isActive !== false).map((o) => ({ _id: o._id, name: o.name, city: o.city }));
  },
});

export const adminListAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) return [];
    const drivers = await ctx.db.query("drivers").collect();
    return Promise.all(drivers.map(async (d) => {
      const dUser = await ctx.db.get(d.userId);
      const office = d.officeId ? await ctx.db.get(d.officeId) : null;
      const profileImageUrl = d.profileImageId ? await ctx.storage.getUrl(d.profileImageId) : null;
      return { ...d, user: dUser, office, profileImageUrl };
    }));
  },
});

export const adminApprove = mutation({
  args: { driverId: v.id("drivers"), approved: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) throw new ConvexError("غير مصرح");
    await ctx.db.patch(args.driverId, { isApproved: args.approved });
  },
});
