import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.filter((n) => !n.isRead).length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const n of unread.filter((n) => !n.isRead)) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const n = await ctx.db.get(args.notificationId);
    if (!n || n.userId !== userId) throw new ConvexError("غير مصرح لك");
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const send = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    linkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const caller = await ctx.db.get(callerId);
    if (!caller?.isAdmin) throw new ConvexError("غير مصرح لك");
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      body: args.body,
      type: args.type,
      linkId: args.linkId,
      isRead: false,
    });
  },
});
