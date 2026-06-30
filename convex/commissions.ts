import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_COMMISSION_RATE = 5;

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new ConvexError("غير مصرح لك");
  return userId;
}

export const getDefaultRate = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rate"))
      .unique();
    return setting ? parseFloat(setting.value) : DEFAULT_COMMISSION_RATE;
  },
});

export const getOfficeRate = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const office = await ctx.db.get(args.officeId);
    if (!office) return DEFAULT_COMMISSION_RATE;
    if (office.commissionRate !== undefined) return office.commissionRate;
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rate"))
      .unique();
    return setting ? parseFloat(setting.value) : DEFAULT_COMMISSION_RATE;
  },
});

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;

    const all = await ctx.db.query("commissions").collect();
    const pending   = all.filter((c) => c.status === "pending");
    const settled   = all.filter((c) => c.status === "settled");
    const cancelled = all.filter((c) => c.status === "cancelled");

    const totalCommission = all.filter(c => c.status !== "cancelled").reduce((s, c) => s + c.commissionAmount, 0);
    const settledAmount   = settled.reduce((s, c) => s + c.commissionAmount, 0);
    const pendingAmount   = pending.reduce((s, c) => s + c.commissionAmount, 0);
    const totalBookingVol = all.filter(c => c.status !== "cancelled").reduce((s, c) => s + c.bookingAmount, 0);

    return {
      totalCommission, settledAmount, pendingAmount, totalBookingVol,
      totalCount: all.length, pendingCount: pending.length,
      settledCount: settled.length, cancelledCount: cancelled.length,
    };
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];

    const commissions = await ctx.db.query("commissions").order("desc").collect();
    return await Promise.all(
      commissions.map(async (c) => {
        const office  = await ctx.db.get(c.officeId);
        const booking = await ctx.db.get(c.bookingId);
        return { ...c, office, booking };
      })
    );
  },
});

// ── كشف حساب الأدمن الكامل مع فلترة ──
export const adminStatement = query({
  args: {
    officeId:  v.optional(v.id("offices")),
    dateFrom:  v.optional(v.number()),
    dateTo:    v.optional(v.number()),
    status:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;

    // جلب جميع الحجوزات
    const allBookings = await ctx.db.query("bookings").order("desc").collect();

    // فلترة الحجوزات
    let filtered = allBookings.filter(b => b.status !== "cancelled");

    if (args.officeId) {
      filtered = filtered.filter(b => b.officeId === args.officeId);
    }
    if (args.dateFrom) {
      filtered = filtered.filter(b => b._creationTime >= args.dateFrom!);
    }
    if (args.dateTo) {
      filtered = filtered.filter(b => b._creationTime <= args.dateTo!);
    }

    // بناء سطور الكشف
    const rows = await Promise.all(
      filtered.map(async (b) => {
        const office  = await ctx.db.get(b.officeId);
        const pkg     = await ctx.db.get(b.packageId);
        const comm    = await ctx.db
          .query("commissions")
          .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
          .unique();

        const commRate   = comm?.commissionRate ?? 0;
        const commAmount = comm?.commissionAmount ?? 0;
        const netAmount  = comm?.netAmount ?? b.totalPrice;
        const commStatus = comm?.status ?? "no_commission";

        return {
          bookingId:        b._id,
          bookingRef:       b.bookingReference,
          bookingDate:      b._creationTime,
          bookingStatus:    b.status,
          passengerName:    b.leadPassengerName,
          adultsCount:      b.adultsCount,
          officeName:       office?.name ?? "—",
          officeId:         b.officeId,
          packageTitle:     pkg?.title ?? "—",
          bookingAmount:    b.totalPrice,
          commissionRate:   commRate,
          commissionAmount: commAmount,
          netAmount:        netAmount,
          commissionStatus: commStatus,
          settledAt:        comm?.settledAt,
        };
      })
    );

    // فلترة بحالة العمولة إن طُلب
    const finalRows = args.status && args.status !== "all"
      ? rows.filter(r => r.commissionStatus === args.status)
      : rows;

    // ملخص مالي
    const totalBookingAmount  = finalRows.reduce((s, r) => s + r.bookingAmount, 0);
    const totalCommission     = finalRows.reduce((s, r) => s + r.commissionAmount, 0);
    const totalNet            = finalRows.reduce((s, r) => s + r.netAmount, 0);
    const settledCommission   = finalRows.filter(r => r.commissionStatus === "settled").reduce((s, r) => s + r.commissionAmount, 0);
    const pendingCommission   = finalRows.filter(r => r.commissionStatus === "pending").reduce((s, r) => s + r.commissionAmount, 0);

    return {
      rows: finalRows,
      summary: {
        totalRows: finalRows.length,
        totalBookingAmount,
        totalCommission,
        totalNet,
        settledCommission,
        pendingCommission,
      },
    };
  },
});

// ── كشف حساب المكتب الكامل (يقرأ مباشرة من bookings بدون مزامنة) ──
export const officeStatement = query({
  args: {
    officeId: v.id("offices"),
    dateFrom: v.optional(v.number()),
    dateTo:   v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const office = await ctx.db.get(args.officeId);
    const currentUser = await ctx.db.get(userId);
    const isAdmin = currentUser?.isAdmin === true;
    if (!isAdmin && (!office || office.userId !== userId)) return null;

    // جلب حجوزات المكتب
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .order("desc")
      .collect();

    // استبعاد الملغية فقط
    let filtered = allBookings.filter(b => b.status !== "cancelled");

    if (args.dateFrom) {
      filtered = filtered.filter(b => b._creationTime >= args.dateFrom!);
    }
    if (args.dateTo) {
      filtered = filtered.filter(b => b._creationTime <= args.dateTo!);
    }

    // جلب نسبة العمولة الافتراضية مرة واحدة
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rate"))
      .unique();
    const defaultRate = setting ? parseFloat(setting.value) : DEFAULT_COMMISSION_RATE;
    const officeRate = office?.commissionRate !== undefined ? office.commissionRate : defaultRate;

    // بناء سطور الكشف — يقرأ من حقول bookings مباشرة (محسوبة عند الإنشاء)
    const rows = await Promise.all(
      filtered.map(async (b) => {
        const pkg = await ctx.db.get(b.packageId);

        // استخدام القيم المخزونة في الحجز مباشرة (تم حسابها عند الإنشاء)
        const commRate   = b.commissionRate   ?? officeRate;
        const commAmount = b.commissionAmount ?? Math.round((b.totalPrice * commRate) / 100);
        const netAmount  = b.netAmount        ?? (b.totalPrice - commAmount);

        // جلب حالة العمولة من جدول commissions إن وُجد
        const comm = await ctx.db
          .query("commissions")
          .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
          .unique();
        const commStatus = comm?.status ?? (b.status === "confirmed" || b.status === "completed" ? "pending" : "no_commission");

        return {
          bookingId:        b._id,
          bookingRef:       b.bookingReference,
          bookingDate:      b._creationTime,
          bookingStatus:    b.status,
          passengerName:    b.leadPassengerName,
          adultsCount:      b.adultsCount,
          packageTitle:     pkg?.title ?? "—",
          bookingAmount:    b.totalPrice,
          commissionRate:   commRate,
          commissionAmount: commAmount,
          netAmount:        netAmount,
          commissionStatus: commStatus,
          settledAt:        comm?.settledAt,
        };
      })
    );

    // ملخص مالي
    const totalBookingAmount = rows.reduce((s, r) => s + r.bookingAmount, 0);
    const totalCommission    = rows.reduce((s, r) => s + r.commissionAmount, 0);
    const totalNet           = rows.reduce((s, r) => s + r.netAmount, 0);
    const settledNet         = rows.filter(r => r.commissionStatus === "settled").reduce((s, r) => s + r.netAmount, 0);
    const pendingNet         = rows.filter(r => r.commissionStatus === "pending").reduce((s, r) => s + r.netAmount, 0);
    const confirmedCount     = rows.filter(r => r.bookingStatus === "confirmed").length;
    const completedCount     = rows.filter(r => r.bookingStatus === "completed").length;

    return {
      rows,
      summary: {
        totalRows: rows.length,
        totalBookingAmount,
        totalCommission,
        totalNet,
        settledNet,
        pendingNet,
        confirmedCount,
        completedCount,
      },
    };
  },
});

// ── كشف حساب المكتب مع فلترة حالة العمولة والتاريخ (للواجهة الجديدة) ──
export const officeStatements = query({
  args: {
    officeId: v.id("offices"),
    status:   v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId) return null;

    // جلب جميع حجوزات المكتب
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .order("desc")
      .collect();

    // فلترة التاريخ
    let filtered = allBookings;
    if (args.dateFrom) {
      const from = new Date(args.dateFrom).getTime();
      filtered = filtered.filter(b => b._creationTime >= from);
    }
    if (args.dateTo) {
      const to = new Date(args.dateTo).setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => b._creationTime <= to);
    }

    // بناء سطور الكشف
    const rows = await Promise.all(
      filtered.map(async (b) => {
        const pkg  = await ctx.db.get(b.packageId);
        const comm = await ctx.db
          .query("commissions")
          .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
          .unique();

        const commissionRate   = comm?.commissionRate   ?? null;
        const commissionAmount = comm?.commissionAmount ?? null;
        const netAmount        = comm?.netAmount        ?? null;
        const commissionStatus = comm?.status           ?? "no_commission";

        return {
          bookingId:         b._id,
          bookingReference:  b.bookingReference,
          leadPassengerName: b.leadPassengerName,
          bookingStatus:     b.status,
          createdAt:         b._creationTime,
          packageTitle:      pkg?.title ?? "—",
          bookingAmount:     b.totalPrice,
          commissionRate,
          commissionAmount,
          netAmount,
          commissionStatus,
          settledAt:         comm?.settledAt,
        };
      })
    );

    // فلترة حالة العمولة
    const finalRows = args.status && args.status !== "all"
      ? rows.filter(r => r.commissionStatus === args.status)
      : rows;

    // ملخص مالي
    const activeRows    = finalRows.filter(r => r.bookingStatus !== "cancelled");
    const totalSales    = activeRows.reduce((s, r) => s + r.bookingAmount, 0);
    const totalComm     = activeRows.reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const totalNet      = activeRows.reduce((s, r) => s + (r.netAmount ?? r.bookingAmount), 0);
    const settledComm   = activeRows.filter(r => r.commissionStatus === "settled").reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const pendingComm   = activeRows.filter(r => r.commissionStatus === "pending").reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const cancelledComm = activeRows.filter(r => r.commissionStatus === "cancelled").reduce((s, r) => s + (r.commissionAmount ?? 0), 0);

    return {
      rows: finalRows,
      summary: {
        totalBookings: finalRows.length,
        totalSales,
        totalComm,
        totalNet,
        settledComm,
        pendingComm,
        cancelledComm,
      },
    };
  },
});

export const officeCommissions = query({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const office = await ctx.db.get(args.officeId);
    if (!office || office.userId !== userId) return null;

    const commissions = await ctx.db
      .query("commissions")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .order("desc")
      .collect();

    const total     = commissions.filter(c => c.status !== "cancelled").reduce((s, c) => s + c.bookingAmount, 0);
    const totalComm = commissions.filter(c => c.status !== "cancelled").reduce((s, c) => s + c.commissionAmount, 0);
    const totalNet  = commissions.filter(c => c.status !== "cancelled").reduce((s, c) => s + c.netAmount, 0);
    const pending   = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
    const settled   = commissions.filter(c => c.status === "settled").reduce((s, c) => s + c.commissionAmount, 0);

    return { commissions, summary: { total, totalComm, totalNet, pending, settled } };
  },
});

export const settle = mutation({
  args: { commissionId: v.id("commissions"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const comm = await ctx.db.get(args.commissionId);
    if (!comm) throw new ConvexError("العمولة غير موجودة");
    if (comm.status === "settled") throw new ConvexError("هذه العمولة مسوّاة مسبقاً");
    await ctx.db.patch(args.commissionId, { status: "settled", settledAt: Date.now(), notes: args.notes });
  },
});

export const settleAllForOffice = mutation({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db
      .query("commissions")
      .withIndex("by_office", (q) => q.eq("officeId", args.officeId))
      .collect();
    const toSettle = all.filter((c) => c.status === "pending");
    for (const c of toSettle) {
      await ctx.db.patch(c._id, { status: "settled", settledAt: Date.now() });
    }
    return toSettle.length;
  },
});

export const updateDefaultRate = mutation({
  args: { rate: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.rate < 0 || args.rate > 50)
      throw new ConvexError("نسبة العمولة يجب أن تكون بين 0% و 50%");
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rate"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.rate.toString() });
    } else {
      await ctx.db.insert("appSettings", {
        key: "commission_rate", value: args.rate.toString(),
        label: "نسبة العمولة الافتراضية", type: "text",
      });
    }
  },
});

export const updateOfficeRate = mutation({
  args: { officeId: v.id("offices"), rate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.rate !== undefined && (args.rate < 0 || args.rate > 50))
      throw new ConvexError("نسبة العمولة يجب أن تكون بين 0% و 50%");
    await ctx.db.patch(args.officeId, { commissionRate: args.rate });
  },
});

export const createForBooking = mutation({
  args: {
    bookingId:      v.id("bookings"),
    officeId:       v.id("offices"),
    bookingAmount:  v.number(),
    commissionRate: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("commissions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();
    if (existing) return existing._id;

    const commissionAmount = Math.round((args.bookingAmount * args.commissionRate) / 100);
    const netAmount = args.bookingAmount - commissionAmount;

    const commId = await ctx.db.insert("commissions", {
      bookingId: args.bookingId, officeId: args.officeId,
      bookingAmount: args.bookingAmount, commissionRate: args.commissionRate,
      commissionAmount, netAmount, status: "pending",
    });

    await ctx.db.patch(args.bookingId, { commissionRate: args.commissionRate, commissionAmount, netAmount });
    return commId;
  },
});

export const syncAllCommissions = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rate"))
      .unique();
    const defaultRate = setting ? parseFloat(setting.value) : DEFAULT_COMMISSION_RATE;

    const bookings = await ctx.db.query("bookings").collect();
    const activeBookings = bookings.filter((b) => b.status !== "cancelled");

    let created = 0;
    let updated = 0;

    for (const booking of activeBookings) {
      const existing = await ctx.db
        .query("commissions")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .unique();

      if (!existing) {
        const office = await ctx.db.get(booking.officeId);
        const rate = office?.commissionRate !== undefined ? office.commissionRate : defaultRate;
        const commissionAmount = Math.round((booking.totalPrice * rate) / 100);
        const netAmount = booking.totalPrice - commissionAmount;
        const commStatus = booking.status === "completed" ? "settled" : "pending";

        await ctx.db.insert("commissions", {
          bookingId: booking._id, officeId: booking.officeId,
          bookingAmount: booking.totalPrice, commissionRate: rate,
          commissionAmount, netAmount, status: commStatus,
          ...(commStatus === "settled" ? { settledAt: Date.now() } : {}),
        });

        await ctx.db.patch(booking._id, { commissionRate: rate, commissionAmount, netAmount });
        created++;
      } else if (booking.status === "completed" && existing.status === "pending") {
        await ctx.db.patch(existing._id, { status: "settled", settledAt: Date.now() });
        updated++;
      }
    }

    return { created, updated, total: activeBookings.length };
  },
});

export const cancelForBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const existing = await ctx.db
      .query("commissions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();
    if (existing && existing.status === "pending") {
      await ctx.db.patch(existing._id, { status: "cancelled" });
    }
  },
});
