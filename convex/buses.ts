import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// ── جلب حافلات المكتب ──
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
    return await ctx.db
      .query("buses")
      .withIndex("by_office", (q) => q.eq("officeId", office._id))
      .collect();
  },
});

// ── جلب حافلة واحدة بالمعرف ──
export const getById = query({
  args: { busId: v.id("buses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const bus = await ctx.db.get(args.busId);
    if (!bus) return null;
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== bus.officeId) return null;
    return bus;
  },
});

// ── إنشاء حافلة جديدة ──
export const create = mutation({
  args: {
    plateNumber: v.string(),
    capacity: v.number(),
    driverName: v.string(),
    driverPhone: v.string(),
    busType: v.optional(v.string()),
    busColor: v.optional(v.string()),
    // بيانات السائق الكاملة
    driverIdNumber: v.optional(v.string()),
    driverNationality: v.optional(v.string()),
    driverLicenseNumber: v.optional(v.string()),
    driverLicenseExpiry: v.optional(v.string()),
    // بطاقة التشغيل
    operatingCardNumber: v.optional(v.string()),
    operatingCardExpiry: v.optional(v.string()),
    operatingCardIssuer: v.optional(v.string()),
    // رابط تطبيق السائق
    driverAppLink: v.optional(v.string()),
    driverAppToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office) throw new ConvexError("لا يوجد مكتب مرتبط بحسابك");
    return await ctx.db.insert("buses", {
      officeId: office._id,
      plateNumber: args.plateNumber,
      capacity: args.capacity,
      driverName: args.driverName,
      driverPhone: args.driverPhone,
      busType: args.busType,
      busColor: args.busColor,
      isActive: true,
      driverIdNumber: args.driverIdNumber,
      driverNationality: args.driverNationality,
      driverLicenseNumber: args.driverLicenseNumber,
      driverLicenseExpiry: args.driverLicenseExpiry,
      operatingCardNumber: args.operatingCardNumber,
      operatingCardExpiry: args.operatingCardExpiry,
      operatingCardIssuer: args.operatingCardIssuer,
      driverAppLink: args.driverAppLink,
      driverAppToken: args.driverAppToken,
    });
  },
});

// ── تحديث بيانات الحافلة ──
export const update = mutation({
  args: {
    busId: v.id("buses"),
    plateNumber: v.optional(v.string()),
    capacity: v.optional(v.number()),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    busType: v.optional(v.string()),
    busColor: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    driverIdNumber: v.optional(v.string()),
    driverNationality: v.optional(v.string()),
    driverLicenseNumber: v.optional(v.string()),
    driverLicenseExpiry: v.optional(v.string()),
    operatingCardNumber: v.optional(v.string()),
    operatingCardExpiry: v.optional(v.string()),
    operatingCardIssuer: v.optional(v.string()),
    driverAppLink: v.optional(v.string()),
    driverAppToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const bus = await ctx.db.get(args.busId);
    if (!bus) throw new ConvexError("الحافلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== bus.officeId) throw new ConvexError("غير مصرح بتعديل هذه الحافلة");

    const { busId, ...updates } = args;
    // إزالة القيم undefined
    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(args.busId, patch);
  },
});

// ── حذف حافلة ──
export const remove = mutation({
  args: { busId: v.id("buses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const bus = await ctx.db.get(args.busId);
    if (!bus) throw new ConvexError("الحافلة غير موجودة");
    const office = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!office || office._id !== bus.officeId) throw new ConvexError("غير مصرح بحذف هذه الحافلة");
    await ctx.db.delete(args.busId);
  },
});
