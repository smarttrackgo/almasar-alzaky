import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("offices").collect();
  },
});

export const getById = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.officeId);
  },
});

export const getMyOffice = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    city: v.string(),
    phone: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const existing = await ctx.db
      .query("offices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) throw new ConvexError("لديك مكتب مسجل بالفعل");
    await ctx.db.patch(userId, { isOfficeOwner: true });
    return await ctx.db.insert("offices", {
      ...args,
      userId,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
    });
  },
});
