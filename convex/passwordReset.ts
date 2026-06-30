import { mutation, query, action, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// ── توليد رمز عشوائي 6 أرقام ──
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── طلب رمز الاسترداد (يُخزّن في قاعدة البيانات) ──
export const requestReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // تحقق أن الإيميل موجود في النظام
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) {
      // لا نكشف إن كان الإيميل موجوداً أم لا (أمان)
      return { success: true };
    }

    // احذف الرموز القديمة لنفس الإيميل
    const oldCodes = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const old of oldCodes) {
      await ctx.db.delete(old._id);
    }

    // أنشئ رمزاً جديداً صالحاً لـ 15 دقيقة
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("passwordResetCodes", {
      email,
      code,
      expiresAt,
      used: false,
    });

    return { success: true, code, email };
  },
});

// ── التحقق من الرمز ──
export const verifyCode = query({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const record = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();

    if (!record) return { valid: false, reason: "no_code" };
    if (record.used) return { valid: false, reason: "used" };
    if (Date.now() > record.expiresAt) return { valid: false, reason: "expired" };
    if (record.code !== args.code) return { valid: false, reason: "wrong_code" };

    return { valid: true };
  },
});

// ── mutation داخلية: التحقق من الرمز وتعليمه كمستخدم ──
export const markCodeUsed = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const record = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();

    if (!record) throw new ConvexError("لم يتم طلب رمز استرداد لهذا البريد");
    if (record.used) throw new ConvexError("تم استخدام هذا الرمز مسبقاً");
    if (Date.now() > record.expiresAt) throw new ConvexError("انتهت صلاحية الرمز، يرجى طلب رمز جديد");
    if (record.code !== args.code) throw new ConvexError("الرمز غير صحيح");

    await ctx.db.patch(record._id, { used: true });
    return { success: true };
  },
});

// ── إعادة تعيين كلمة المرور بعد التحقق (action لأن modifyAccountCredentials تحتاج ActionCtx) ──
export const resetPassword = action({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    if (args.newPassword.length < 8) {
      throw new ConvexError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }

    // تحقق من الرمز وعلّمه كمستخدم (mutation داخلية)
    await ctx.runMutation(internal.passwordReset.markCodeUsed, { email, code: args.code });

    // تحديث كلمة المرور عبر Convex Auth
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });

    return { success: true };
  },
});

// ── جلب وقت انتهاء الرمز (للعداد التنازلي) ──
export const getCodeExpiry = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const record = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();

    if (!record || record.used) return null;
    return { expiresAt: record.expiresAt };
  },
});
