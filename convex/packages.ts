import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculatePackagePricing } from "./pricing";

function fallbackPackageReference(id: unknown): string {
  return `PRG-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
}

function generatePackageReference(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PRG-${year}-${suffix}`;
}

async function uniquePackageReference(ctx: any): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const ref = generatePackageReference();
    const existing = await ctx.db
      .query("packages")
      .withIndex("by_package_reference", (q: any) => q.eq("packageReference", ref))
      .first();
    if (!existing) return ref;
  }
  return generatePackageReference();
}

function withPackageReference(pkg: any) {
  return {
    ...pkg,
    packageReference: pkg.packageReference ?? fallbackPackageReference(pkg._id),
  };
}

export const list = query({
  args: {
    departureCity: v.optional(v.string()),
    packageType: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("packages").collect();
    let filtered = all.filter((p) => p.isActive !== false);
    if (args.departureCity) filtered = filtered.filter((p) => p.departureCity === args.departureCity);
    if (args.packageType) filtered = filtered.filter((p) => p.packageType === args.packageType);
    if (args.maxPrice) filtered = filtered.filter((p) => p.price <= args.maxPrice!);
    return await Promise.all(
      filtered.map(async (pkg) => {
        const pricing = await calculatePackagePricing(ctx, pkg.officeId, pkg.price);
        return {
          ...withPackageReference(pkg),
          officePrice: pkg.price,
          price: pricing.displayPrice,
          pricing,
          office: await ctx.db.get(pkg.officeId),
        };
      })
    );
  },
});

export const getPassengerManifest = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) return null;

    // التحقق من الصلاحية: صاحب المكتب أو الأدمن
    const currentUser = await ctx.db.get(userId);
    const office = await ctx.db.get(pkg.officeId);
    const isOfficeOwner = office?.userId === userId;
    const isAdmin = currentUser?.isAdmin === true;
    if (!isOfficeOwner && !isAdmin) return null;

    // ── جلب الرحلة النشطة المرتبطة بهذا البرنامج ──
    const allTrips = await ctx.db
      .query("trips")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .collect();

    // نفضّل الرحلة النشطة، وإلا نأخذ أي رحلة
    const ACTIVE = ["driver_assigned", "driver_accepted", "in_progress", "completed"];
    const trip =
      allTrips.find((t) => ACTIVE.includes(t.status)) ??
      allTrips.find((t) => t.officeId === pkg.officeId) ??
      null;

    // ── بيانات الحافلة (القديمة) ──
    let bus = null;
    if (trip?.busId) {
      bus = await ctx.db.get(trip.busId);
    }

    // ── بيانات السائق الكاملة من جدول drivers ──
    let driver: Record<string, any> | null = null;
    if (trip?.driverId) {
      const drv = await ctx.db.get(trip.driverId);
      if (drv) {
        const profileImageUrl = drv.profileImageId
          ? await ctx.storage.getUrl(drv.profileImageId)
          : null;
        driver = {
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

    // ── جلب جميع الحجوزات لهذا البرنامج ──
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .collect();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (b) => {
        const user = await ctx.db.get(b.userId);
        const payment = await ctx.db
          .query("payments")
          .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
          .order("desc")
          .first();
        return {
          ...b,
          user,
          payment,
          nationality: (user as any)?.nationality ?? (user as any)?.city ?? null,
        };
      })
    );

    return { package: pkg, office, trip, bus, driver, bookings: bookingsWithDetails };
  },
});

export const getById = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) return null;
    const office = await ctx.db.get(pkg.officeId);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .collect();
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, userName: user?.name ?? "مجهول" };
      })
    );
    const pricing = await calculatePackagePricing(ctx, pkg.officeId, pkg.price);
    return {
      ...withPackageReference(pkg),
      officePrice: pkg.price,
      price: pricing.displayPrice,
      pricing,
      office,
      reviews: reviewsWithUsers,
    };
  },
});

export const getByOffice = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const packages = await ctx.db
      .query("packages")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();
    return packages.map(withPackageReference);
  },
});

export const create = mutation({
  args: {
    officeId: v.id("offices"),
    title: v.string(),
    description: v.string(),
    duration: v.number(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    departureCity: v.string(),
    departureDate: v.string(),
    returnDate: v.string(),
    availableSeats: v.number(),
    totalSeats: v.number(),
    includes: v.array(v.string()),
    excludes: v.optional(v.array(v.string())),
    hotelMecca: v.string(),
    hotelMadinah: v.optional(v.string()),
    hotelStars: v.number(),
    packageType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId)
      throw new ConvexError("غير مصرح لك بإضافة برامج لهذا المكتب");
    const packageReference = await uniquePackageReference(ctx);
    return await ctx.db.insert("packages", { ...args, packageReference, isActive: true });
  },
});

export const update = mutation({
  args: {
    packageId: v.id("packages"),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    availableSeats: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const { packageId, ...updates } = args;
    const pkg = await ctx.db.get(packageId);
    if (!pkg) throw new ConvexError("البرنامج غير موجود");
    const office = await ctx.db.get(pkg.officeId);
    if (!office || office.userId !== userId)
      throw new ConvexError("غير مصرح لك بتعديل هذا البرنامج");
    await ctx.db.patch(packageId, updates);
  },
});
