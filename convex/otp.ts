import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── إرسال OTP ──
export const sendOtp = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const user = await ctx.runQuery(internal.otp.getUserForOtp, { userId });
    if (!user) return { success: false, error: "المستخدم غير موجود" };
    if (!user.email) return { success: false, error: "لا يوجد بريد إلكتروني مرتبط بحسابك" };
    if (user.emailVerified) return { success: false, error: "البريد الإلكتروني مؤكد مسبقاً" };

    const recentOtp = await ctx.runQuery(internal.otp.getRecentOtp, { email: user.email });
    if (recentOtp) {
      const minutesLeft = Math.ceil((recentOtp.expiresAt - Date.now()) / 1000 / 60);
      return { success: false, error: `يرجى الانتظار ${minutesLeft} دقيقة قبل إعادة الإرسال` };
    }

    const otp       = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.runMutation(internal.otp.createOtpCode, {
      email: user.email,
      code: otp,
      expiresAt,
      userId,
    });

    const result = await ctx.runAction(internal.emailActions.sendOtpEmail, {
      email: user.email,
      name:  user.name ?? undefined,
      otp,
    });

    return result;
  },
});

// ── التحقق من OTP ──
export const verifyOtp = action({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const user = await ctx.runQuery(internal.otp.getUserForOtp, { userId });
    if (!user?.email) return { success: false, error: "لا يوجد بريد إلكتروني مرتبط بحسابك" };

    const result = await ctx.runMutation(internal.otp.checkAndMarkOtp, {
      email:  user.email,
      code:   args.code.trim(),
      userId,
    });

    // ── إرسال إيميل ترحيب بعد التأكيد ──
    if (result.success && user.email) {
      await ctx.runAction(internal.emailActions.sendWelcomeEmail, {
        email:       user.email,
        name:        user.name ?? undefined,
        accountType: user.accountType ?? undefined,
      });
    }

    return result;
  },
});

// ── Query: هل الإيميل مؤكد؟ ──
export const isEmailVerified = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return (user as any)?.emailVerified ?? false;
  },
});

// ══════════════════════════════════════════════
// دوال داخلية
// ══════════════════════════════════════════════

export const getUserForOtp = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      email:         user.email ?? null,
      name:          user.name ?? null,
      emailVerified: (user as any).emailVerified ?? false,
      accountType:   (user as any).accountType ?? null,
    };
  },
});

export const getRecentOtp = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const codes = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(1);
    const latest = codes[0];
    if (!latest) return null;
    if (latest._creationTime > twoMinutesAgo && latest.expiresAt > Date.now() && !latest.used) {
      return latest;
    }
    return null;
  },
});

export const createOtpCode = internalMutation({
  args: {
    email:     v.string(),
    code:      v.string(),
    expiresAt: v.number(),
    userId:    v.id("users"),
  },
  handler: async (ctx, args) => {
    const old = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const o of old) await ctx.db.delete(o._id);

    await ctx.db.insert("otpCodes", {
      email:     args.email,
      code:      args.code,
      expiresAt: args.expiresAt,
      userId:    args.userId,
      used:      false,
    });
  },
});

export const checkAndMarkOtp = internalMutation({
  args: {
    email:  v.string(),
    code:   v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const codes = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(5);

    const valid = codes.find(
      (c) => c.code === args.code && !c.used && c.expiresAt > Date.now()
    );

    if (!valid) {
      const expired = codes.find((c) => c.code === args.code && c.expiresAt <= Date.now());
      if (expired) return { success: false, error: "انتهت صلاحية الرمز. أرسل رمزاً جديداً." };
      return { success: false, error: "الرمز غير صحيح. تحقق من بريدك وأعد المحاولة." };
    }

    await ctx.db.patch(valid._id, { used: true });
    await ctx.db.patch(args.userId, { emailVerified: true } as any);

    return { success: true };
  },
});
