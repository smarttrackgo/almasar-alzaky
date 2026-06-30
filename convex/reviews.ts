import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// جلب تقييمات برنامج معين
export const getByPackage = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .collect();
    return Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, userName: user?.name ?? "معتمر" };
      })
    );
  },
});

// جلب تقييمات مكتب معين
export const getByOffice = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();
    return Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        const pkg = await ctx.db.get(r.packageId);
        return { ...r, userName: user?.name ?? "معتمر", packageTitle: pkg?.title ?? "" };
      })
    );
  },
});

// هل قيّم المستخدم هذا الحجز؟
export const myReviewForBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
      .collect();
    return reviews.find((r) => r.bookingId === args.bookingId && r.userId === userId) ?? null;
  },
});

// إضافة تقييم جديد
export const create = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("الحجز غير موجود");
    if (booking.userId !== userId) throw new Error("غير مصرح");
    if (booking.status !== "completed") throw new Error("يمكن التقييم فقط بعد اكتمال الرحلة");

    // تحقق من عدم وجود تقييم سابق
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
      .collect();
    const alreadyReviewed = existing.find((r) => r.bookingId === args.bookingId && r.userId === userId);
    if (alreadyReviewed) throw new Error("لقد قيّمت هذه الرحلة مسبقاً");

    if (args.rating < 1 || args.rating > 5) throw new Error("التقييم يجب أن يكون بين 1 و 5");

    const reviewId = await ctx.db.insert("reviews", {
      packageId: booking.packageId,
      officeId: booking.officeId,
      userId,
      bookingId: args.bookingId,
      rating: args.rating,
      comment: args.comment,
    });

    // تحديث متوسط تقييم المكتب
    const allOfficeReviews = await ctx.db
      .query("reviews")
      .withIndex("by_office", (q) => q.eq("officeId", booking.officeId))
      .collect();
    const total = allOfficeReviews.reduce((s, r) => s + r.rating, args.rating);
    const avg = total / (allOfficeReviews.length + 1);
    await ctx.db.patch(booking.officeId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allOfficeReviews.length + 1,
    });

    // تحديث متوسط تقييم البرنامج
    const allPkgReviews = await ctx.db
      .query("reviews")
      .withIndex("by_package", (q) => q.eq("packageId", booking.packageId))
      .collect();
    const pkgTotal = allPkgReviews.reduce((s, r) => s + r.rating, args.rating);
    const pkgAvg = pkgTotal / (allPkgReviews.length + 1);
    await ctx.db.patch(booking.packageId, {
      rating: Math.round(pkgAvg * 10) / 10,
      reviewCount: allPkgReviews.length + 1,
    } as any);

    return reviewId;
  },
});

// حذف تقييم (للأدمن)
export const remove = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("غير مصرح - للأدمن فقط");
    await ctx.db.delete(args.reviewId);
  },
});

// جلب كل التقييمات للأدمن مع بيانات المستخدم والبرنامج والمكتب
export const getAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const all = await ctx.db.query("reviews").order("desc").collect();
    return Promise.all(
      all.map(async (r) => {
        const reviewer = await ctx.db.get(r.userId);
        const pkg      = await ctx.db.get(r.packageId);
        const office   = await ctx.db.get(r.officeId);
        return {
          ...r,
          userName:    reviewer?.name ?? "معتمر",
          packageTitle: pkg?.title ?? "",
          officeName:  (office as any)?.name ?? "",
        };
      })
    );
  },
});

// إحصائيات التقييمات للأدمن
export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;
    const all = await ctx.db.query("reviews").collect();
    const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
    return {
      total: all.length,
      average: Math.round(avg * 10) / 10,
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: all.filter((r) => r.rating === star).length,
      })),
    };
  },
});
