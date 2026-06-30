import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyCompanions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("companions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    idNumber: v.string(),
    relation: v.string(),
    phone: v.optional(v.string()),
    passportNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");
    return await ctx.db.insert("companions", {
      userId,
      name: args.name,
      idNumber: args.idNumber,
      relation: args.relation,
      phone: args.phone,
      passportNumber: args.passportNumber,
    });
  },
});

export const remove = mutation({
  args: { companionId: v.id("companions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");
    const companion = await ctx.db.get(args.companionId);
    if (!companion || companion.userId !== userId) throw new Error("غير مصرح");
    await ctx.db.delete(args.companionId);
  },
});
