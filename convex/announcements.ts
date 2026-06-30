import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("announcements").collect();
    const now = Date.now();
    return all
      .filter((a) => a.isActive && (!a.expiresAt || a.expiresAt > now))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    return await ctx.db.query("announcements").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    priority: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("صلاحيات المدير مطلوبة");
    return await ctx.db.insert("announcements", {
      title: args.title,
      content: args.content,
      type: args.type,
      imageUrl: args.imageUrl,
      linkUrl: args.linkUrl,
      priority: args.priority ?? 0,
      expiresAt: args.expiresAt,
      isActive: true,
    });
  },
});

export const toggle = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("صلاحيات المدير مطلوبة");
    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");
    await ctx.db.patch(args.announcementId, { isActive: !ann.isActive });
  },
});

export const remove = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("صلاحيات المدير مطلوبة");
    await ctx.db.delete(args.announcementId);
  },
});
