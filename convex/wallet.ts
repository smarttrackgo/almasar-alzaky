import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── جلب رصيد المحفظة وآخر المعاملات ──
export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return {
      balance: user.walletBalance ?? 0,
      transactions,
    };
  },
});

// ── طلب استرداد رصيد المحفظة ──
export const requestWithdrawal = mutation({
  args: {
    amount: v.number(),
    paymentMethod: v.string(), // "mada" | "stc_pay" | "apple_pay" | "google_pay"
    accountDetails: v.string(), // رقم الحساب أو رقم الجوال
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const balance = user.walletBalance ?? 0;
    if (args.amount <= 0) throw new ConvexError("المبلغ يجب أن يكون أكبر من صفر");
    if (args.amount > balance) throw new ConvexError("رصيد المحفظة غير كافٍ");
    if (args.amount < 10) throw new ConvexError("الحد الأدنى للاسترداد هو 10 ريال");

    // خصم الرصيد فوراً وإنشاء طلب معلق
    await ctx.db.patch(userId, {
      walletBalance: balance - args.amount,
    });

    const methodLabels: Record<string, string> = {
      mada: "مدى",
      stc_pay: "STC Pay",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay",
    };

    await ctx.db.insert("walletTransactions", {
      userId,
      type: "withdrawal_request",
      amount: args.amount,
      description: `طلب استرداد ${args.amount.toLocaleString("ar-SA")} ر.س عبر ${methodLabels[args.paymentMethod] ?? args.paymentMethod} — ${args.accountDetails}`,
      paymentMethod: args.paymentMethod,
      status: "pending",
    });

    // إشعار للمستخدم
    await ctx.db.insert("notifications", {
      userId,
      title: "💳 تم استلام طلب الاسترداد",
      body: `طلبك باسترداد ${args.amount.toLocaleString("ar-SA")} ر.س قيد المعالجة. سيتم التحويل خلال 3-5 أيام عمل.`,
      type: "wallet_withdrawal",
      isRead: false,
    });

    return { success: true };
  },
});

// ── إضافة رصيد للمحفظة (داخلي — يُستدعى من bookings) ──
export const addRefund = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    bookingId: v.id("bookings"),
    bookingRef: v.string(),
    paymentMethod: v.optional(v.string()),
    packageTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const currentBalance = user.walletBalance ?? 0;
    await ctx.db.patch(args.userId, {
      walletBalance: currentBalance + args.amount,
    });

    const methodLabels: Record<string, string> = {
      mada: "مدى",
      stc_pay: "STC Pay",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay",
    };
    const methodLabel = args.paymentMethod ? (methodLabels[args.paymentMethod] ?? args.paymentMethod) : "الدفع الإلكتروني";

    await ctx.db.insert("walletTransactions", {
      userId: args.userId,
      type: "refund",
      amount: args.amount,
      bookingId: args.bookingId,
      bookingRef: args.bookingRef,
      description: `استرداد مبلغ حجز ${args.packageTitle ?? ""} (${args.bookingRef}) — طريقة الدفع الأصلية: ${methodLabel}`,
      paymentMethod: args.paymentMethod,
      status: "completed",
      processedAt: Date.now(),
    });

    // إشعار للمستخدم
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "💰 تم إضافة المبلغ لمحفظتك",
      body: `تم إضافة ${args.amount.toLocaleString("ar-SA")} ر.س لمحفظتك بعد إلغاء الحجز ${args.bookingRef}. يمكنك استخدامه في حجوزاتك القادمة أو استرداده.`,
      type: "wallet_refund",
      isRead: false,
    });
  },
});

// ── جلب طلبات الاسترداد للأدمن (جميع الحالات) ──
export const getAllWithdrawalRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const admin = await ctx.db.get(userId);
    if (!admin?.isAdmin) return [];

    // جلب جميع معاملات الاسترداد (withdrawal_request + withdrawal_done)
    const allTx = await ctx.db
      .query("walletTransactions")
      .order("desc")
      .collect();

    const withdrawals = allTx.filter(
      (t) => t.type === "withdrawal_request" || t.type === "withdrawal_done"
    );

    return await Promise.all(
      withdrawals.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, userName: user?.name ?? "مستخدم", userEmail: user?.email ?? "" };
      })
    );
  },
});

// ── معالجة طلب الاسترداد (أدمن) ──
export const processWithdrawal = mutation({
  args: {
    transactionId: v.id("walletTransactions"),
    action: v.string(), // "approve" | "reject"
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const admin = await ctx.db.get(userId);
    if (!admin?.isAdmin) throw new ConvexError("غير مصرح لك");

    const tx = await ctx.db.get(args.transactionId);
    if (!tx) throw new ConvexError("الطلب غير موجود");
    if (tx.status !== "pending") throw new ConvexError("الطلب تمت معالجته مسبقاً");

    if (args.action === "approve") {
      await ctx.db.patch(args.transactionId, {
        status: "completed",
        type: "withdrawal_done",
        adminNote: args.adminNote,
        processedAt: Date.now(),
      });
      await ctx.db.insert("notifications", {
        userId: tx.userId,
        title: "✅ تم تحويل مبلغ الاسترداد",
        body: `تم تحويل ${tx.amount.toLocaleString("ar-SA")} ر.س إلى حسابك بنجاح.`,
        type: "wallet_withdrawal_done",
        isRead: false,
      });
    } else {
      // رفض — إعادة المبلغ للمحفظة
      const user = await ctx.db.get(tx.userId);
      if (user) {
        await ctx.db.patch(tx.userId, {
          walletBalance: (user.walletBalance ?? 0) + tx.amount,
        });
      }
      await ctx.db.patch(args.transactionId, {
        status: "rejected",
        adminNote: args.adminNote,
        processedAt: Date.now(),
      });
      await ctx.db.insert("notifications", {
        userId: tx.userId,
        title: "❌ تم رفض طلب الاسترداد",
        body: `تم رفض طلب استرداد ${tx.amount.toLocaleString("ar-SA")} ر.س. تم إعادة المبلغ لمحفظتك. ${args.adminNote ? "السبب: " + args.adminNote : ""}`,
        type: "wallet_withdrawal_rejected",
        isRead: false,
      });
    }
  },
});
