import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const userAudience = (user: any | null) => {
  if (!user) return "public";
  if (user.isAdmin) return "admins";
  if (user.accountType === "office" || user.isOfficeOwner) return "offices";
  if (user.accountType === "driver") return "drivers";
  return "pilgrims";
};

const audienceMatches = (announcementAudience: string | undefined, audience: string) => {
  if (!announcementAudience || announcementAudience === "all") return true;
  if (announcementAudience === "public") return audience === "public";
  if (announcementAudience === "pilgrims") return audience === "pilgrims" || audience === "public";
  return announcementAudience === audience;
};

export const getActive = query({
  args: {
    placement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const audience = userAudience(user);
    const all = await ctx.db.query("announcements").collect();
    const now = Date.now();
    return all
      .filter((a) => {
        const active = a.isActive !== false;
        const placementMatches = !args.placement || !a.placement || a.placement === args.placement || a.placement === "all";
        const started = !a.startsAt || a.startsAt <= now;
        const notExpired = !a.expiresAt || a.expiresAt > now;
        return active && placementMatches && started && notExpired && audienceMatches(a.targetAudience, audience);
      })
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
    isActive: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    placement: v.optional(v.string()),
    priority: v.optional(v.number()),
    startsAt: v.optional(v.number()),
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
      ctaLabel: args.ctaLabel,
      targetAudience: args.targetAudience ?? "all",
      placement: args.placement ?? "top",
      priority: args.priority ?? 0,
      startsAt: args.startsAt,
      expiresAt: args.expiresAt,
      isActive: args.isActive ?? true,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.string(),
    content: v.string(),
    type: v.string(),
    isActive: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    placement: v.optional(v.string()),
    priority: v.optional(v.number()),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("صلاحيات المدير مطلوبة");
    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");
    await ctx.db.patch(args.announcementId, {
      title: args.title,
      content: args.content,
      type: args.type,
      imageUrl: args.imageUrl,
      linkUrl: args.linkUrl,
      ctaLabel: args.ctaLabel,
      targetAudience: args.targetAudience ?? "all",
      placement: args.placement ?? "top",
      priority: args.priority ?? 0,
      startsAt: args.startsAt,
      expiresAt: args.expiresAt,
      isActive: args.isActive ?? true,
      updatedAt: Date.now(),
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
