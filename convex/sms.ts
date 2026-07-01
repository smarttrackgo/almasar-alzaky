import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function settingToString(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return null;
  return String(value);
}

export const logSMS = internalMutation({
  args: {
    phone:       v.string(),
    messageType: v.string(),
    messageText: v.string(),
    status:      v.string(),
    twilioSid:   v.optional(v.string()),
    error:       v.optional(v.string()),
    bookingId:   v.optional(v.id("bookings")),
    userId:      v.optional(v.id("users")),
    officeId:    v.optional(v.id("offices")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("smsLogs", {
      phone:       args.phone,
      messageType: args.messageType,
      messageText: args.messageText,
      status:      args.status,
      twilioSid:   args.twilioSid,
      error:       args.error,
      bookingId:   args.bookingId,
      userId:      args.userId,
      officeId:    args.officeId,
      sentAt:      Date.now(),
    });
  },
});

export const adminGetLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) return [];
    const logs = await ctx.db.query("smsLogs").order("desc").take(args.limit ?? 100);
    return Promise.all(logs.map(async (log) => {
      const booking = log.bookingId ? await ctx.db.get(log.bookingId) : null;
      const u       = log.userId    ? await ctx.db.get(log.userId)    : null;
      return { ...log, booking, user: u };
    }));
  },
});

export const adminGetStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) return null;
    const all    = await ctx.db.query("smsLogs").collect();
    const sent   = all.filter((l) => l.status === "sent").length;
    const failed = all.filter((l) => l.status === "failed").length;
    const now    = new Date();
    const today  = all.filter((l) => {
      const d = new Date(l.sentAt);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const byType: Record<string, number> = {};
    for (const log of all) { byType[log.messageType] = (byType[log.messageType] ?? 0) + 1; }
    return { total: all.length, sent, failed, today, byType };
  },
});

export const adminSaveSetting = mutation({
  args: { key: v.string(), value: v.string(), label: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) throw new ConvexError("غير مصرح");
    const existing = await ctx.db.query("appSettings").withIndex("by_key", (q) => q.eq("key", args.key)).first();
    if (existing) { await ctx.db.patch(existing._id, { value: args.value }); }
    else { await ctx.db.insert("appSettings", { key: args.key, value: args.value, label: args.label }); }
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args): Promise<string | null> => {
    const row = await ctx.db.query("appSettings").withIndex("by_key", (q) => q.eq("key", args.key)).first();
    return settingToString(row?.value);
  },
});

export const adminGetSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!(user as any)?.isAdmin) return null;
    const keys = [
      "sms_enabled",
      "sms_provider",
      "twilio_account_sid",
      "twilio_auth_token",
      "twilio_from_number",
      "unifonic_app_sid",
      "unifonic_sender_id",
      "unifonic_base_url",
      "sms_driver_assigned",
      "sms_driver_accepted",
      "sms_trip_started",
      "sms_trip_completed",
    ];
    const result: Record<string, string> = {};
    for (const key of keys) {
      const row = await ctx.db.query("appSettings").withIndex("by_key", (q) => q.eq("key", key)).first();
      result[key] = settingToString(row?.value) ?? "";
    }
    return result;
  },
});
