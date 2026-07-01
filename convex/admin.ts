import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new ConvexError("غير مصرح لك");
  return userId;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;
    const [offices, packages, bookings, users] = await Promise.all([
      ctx.db.query("offices").collect(),
      ctx.db.query("packages").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("users").collect(),
    ]);
    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + b.totalPrice, 0);
    return {
      totalOffices: offices.length,
      verifiedOffices: offices.filter((o) => o.isVerified).length,
      totalPackages: packages.length,
      activePackages: packages.filter((p) => p.isActive !== false).length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
      cancelledBookings: bookings.filter((b) => b.status === "cancelled").length,
      completedBookings: bookings.filter((b) => b.status === "completed").length,
      totalUsers: users.length,
      totalRevenue,
    };
  },
});

export const getAllOffices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const offices = await ctx.db.query("offices").collect();
    return await Promise.all(
      offices.map(async (o) => {
        const pkgs = await ctx.db
          .query("packages")
          .withIndex("by_office", (q) => q.eq("officeId", o._id))
          .collect();
        const bkgs = await ctx.db
          .query("bookings")
          .withIndex("by_office", (q) => q.eq("officeId", o._id))
          .collect();
        // جلب URL اللوجو من storage إذا كان موجوداً
        const logoUrl = o.logoStorageId
          ? await ctx.storage.getUrl(o.logoStorageId)
          : o.logoUrl ?? null;
        return { ...o, logoUrl, packageCount: pkgs.length, bookingCount: bkgs.length };
      })
    );
  },
});

export const getAllBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const bookings = await ctx.db.query("bookings").order("desc").collect();
    return await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        package: await ctx.db.get(b.packageId),
        office: await ctx.db.get(b.officeId),
        user: await ctx.db.get(b.userId),
      }))
    );
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    return await ctx.db.query("users").collect();
  },
});

export const verifyOffice = mutation({
  args: { officeId: v.id("offices"), isVerified: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.officeId, { isVerified: args.isVerified });
  },
});

export const toggleOfficeActive = mutation({
  args: { officeId: v.id("offices"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.officeId, { isActive: args.isActive });
  },
});

export const deleteOffice = mutation({
  args: { officeId: v.id("offices") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.officeId);
  },
});

export const setUserAdmin = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { isAdmin: args.isAdmin });
  },
});

export const adminUpdateBookingStatus = mutation({
  args: { bookingId: v.id("bookings"), status: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.bookingId, { status: args.status });
  },
});

// ── تحديث بيانات المكتب من الأدمن ──
export const adminUpdateOffice = mutation({
  args: {
    officeId: v.id("offices"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    legalName: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    locationUrl: v.optional(v.string()),
    contactNumbers: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { officeId, ...updates } = args;
    // إزالة القيم undefined
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(officeId, clean);
  },
});

// ── توليد رابط رفع اللوجو ──
export const generateLogoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ── حذف مستخدم كامل مع جميع بياناته ──
async function deleteAll(ctx: any, docs: any[]) {
  for (const doc of docs) {
    if (doc) await ctx.db.delete(doc._id);
  }
}

async function deleteBookingCascade(ctx: any, bookingId: any) {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return;

  await deleteAll(ctx, await ctx.db.query("payments").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("commissions").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("reviews").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("walletTransactions").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("whatsappLogs").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("smsLogs").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());
  await deleteAll(ctx, await ctx.db.query("emailLogs").withIndex("by_booking", (q: any) => q.eq("bookingId", bookingId)).collect());

  await ctx.db.delete(bookingId);
}

async function deleteOfficeCascade(ctx: any, officeId: any) {
  const office = await ctx.db.get(officeId);
  if (!office) return;

  const officeBookings = await ctx.db.query("bookings").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect();
  for (const booking of officeBookings) await deleteBookingCascade(ctx, booking._id);

  const packages = await ctx.db.query("packages").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect();
  for (const pkg of packages) {
    const packageBookings = await ctx.db.query("bookings").withIndex("by_package", (q: any) => q.eq("packageId", pkg._id)).collect();
    for (const booking of packageBookings) await deleteBookingCascade(ctx, booking._id);
    await ctx.db.delete(pkg._id);
  }

  await deleteAll(ctx, await ctx.db.query("buses").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect());
  await deleteAll(ctx, await ctx.db.query("payments").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect());
  await deleteAll(ctx, await ctx.db.query("commissions").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect());
  await deleteAll(ctx, await ctx.db.query("reviews").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect());
  await deleteAll(ctx, await ctx.db.query("whatsappLogs").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect());
  await deleteAll(ctx, (await ctx.db.query("smsLogs").collect()).filter((log: any) => log.officeId === officeId));

  const trips = await ctx.db.query("trips").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect();
  for (const trip of trips) await ctx.db.delete(trip._id);

  const officeDrivers = await ctx.db.query("drivers").withIndex("by_office", (q: any) => q.eq("officeId", officeId)).collect();
  for (const driver of officeDrivers) {
    await ctx.db.patch(driver._id, { officeId: undefined, busId: undefined });
  }

  await ctx.db.delete(officeId);
}

async function deleteAuthAccountCascade(ctx: any, accountId: any) {
  await deleteAll(ctx, await ctx.db.query("authVerificationCodes").withIndex("accountId", (q: any) => q.eq("accountId", accountId)).collect());
  const account = await ctx.db.get(accountId);
  if (account) await ctx.db.delete(accountId);
}

async function deleteAuthForUser(ctx: any, userId: any, email?: string) {
  const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q: any) => q.eq("userId", userId)).collect();
  for (const account of accounts) await deleteAuthAccountCascade(ctx, account._id);

  const sessions = await ctx.db.query("authSessions").withIndex("userId", (q: any) => q.eq("userId", userId)).collect();
  for (const session of sessions) {
    await deleteAll(ctx, await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q: any) => q.eq("sessionId", session._id)).collect());
    await deleteAll(ctx, (await ctx.db.query("authVerifiers").collect()).filter((v: any) => v.sessionId === session._id));
    await ctx.db.delete(session._id);
  }

  if (!email) return;
  const identifiers = Array.from(new Set([email.trim(), email.trim().toLowerCase()])).filter(Boolean);
  for (const identifier of identifiers) {
    await deleteAll(ctx, await ctx.db.query("authRateLimits").withIndex("identifier", (q: any) => q.eq("identifier", identifier)).collect());
    await deleteAll(ctx, await ctx.db.query("passwordResetCodes").withIndex("by_email", (q: any) => q.eq("email", identifier)).collect());
  }
}

async function deleteUserOwnedData(ctx: any, userId: any, email?: string) {
  const offices = await ctx.db.query("offices").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const office of offices) await deleteOfficeCascade(ctx, office._id);

  const bookings = await ctx.db.query("bookings").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const booking of bookings) await deleteBookingCascade(ctx, booking._id);

  const driverRecords = await ctx.db.query("drivers").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const driver of driverRecords) {
    const trips = await ctx.db.query("trips").withIndex("by_driver", (q: any) => q.eq("driverId", driver._id)).collect();
    for (const trip of trips) await ctx.db.patch(trip._id, { driverId: undefined, driverStatus: "pending" });
    await ctx.db.delete(driver._id);
  }

  const supervisedTrips = (await ctx.db.query("trips").collect()).filter((trip: any) => trip.supervisorId === userId);
  for (const trip of supervisedTrips) await ctx.db.patch(trip._id, { supervisorId: undefined });

  await deleteAll(ctx, await ctx.db.query("notifications").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("walletTransactions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("companions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("aiChats").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("payments").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("whatsappLogs").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());
  await deleteAll(ctx, await ctx.db.query("smsLogs").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect());

  const chats = await ctx.db.query("supportChats").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const chat of chats) {
    await deleteAll(ctx, await ctx.db.query("supportMessages").withIndex("by_chat", (q: any) => q.eq("chatId", chat._id)).collect());
    await ctx.db.delete(chat._id);
  }
  await deleteAll(ctx, await ctx.db.query("supportMessages").withIndex("by_sender", (q: any) => q.eq("senderId", userId)).collect());

  await deleteAll(ctx, (await ctx.db.query("reviews").collect()).filter((review: any) => review.userId === userId));
  await deleteAll(ctx, (await ctx.db.query("whatsappLogs").collect()).filter((log: any) => log.sentBy === userId));
  await deleteAll(ctx, (await ctx.db.query("emailLogs").collect()).filter((log: any) => log.userId === userId));
  await deleteAll(ctx, (await ctx.db.query("otpCodes").collect()).filter((code: any) => code.userId === userId || (email && code.email === email)));
}

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    {
    if (args.userId === adminId) throw new ConvexError("لا يمكنك حذف حسابك الخاص");

    const user = await ctx.db.get(args.userId);
    if (!user) return { deleted: false };

    await deleteUserOwnedData(ctx, args.userId, user.email);
    await deleteAuthForUser(ctx, args.userId, user.email);
    await ctx.db.delete(args.userId);

    return { deleted: true };
    }
    if (args.userId === adminId) throw new ConvexError("لا يمكنك حذف حسابك الخاص");

    // 1. حذف الإشعارات
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const n of notifs) await ctx.db.delete(n._id);

    // 2. حذف الحجوزات وما يرتبط بها (مدفوعات، عمولات، تقييمات)
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const b of bookings) {
      // مدفوعات الحجز
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
        .collect();
      for (const p of payments) await ctx.db.delete(p._id);
      // عمولات الحجز
      const comms = await ctx.db
        .query("commissions")
        .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
        .collect();
      for (const c of comms) await ctx.db.delete(c._id);
      // تقييمات الحجز
      const revs = await ctx.db
        .query("reviews")
        .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
        .collect();
      for (const r of revs) await ctx.db.delete(r._id);
      // حذف الحجز نفسه
      await ctx.db.delete(b._id);
    }

    // 3. حذف معاملات المحفظة
    const walletTxs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const tx of walletTxs) await ctx.db.delete(tx._id);

    // 4. حذف المرافقين
    const companions = await ctx.db
      .query("companions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const c of companions) await ctx.db.delete(c._id);

    // 5. حذف محادثات الدعم ورسائلها
    const chats = await ctx.db
      .query("supportChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const chat of chats) {
      const msgs = await ctx.db
        .query("supportMessages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();
      for (const m of msgs) await ctx.db.delete(m._id);
      await ctx.db.delete(chat._id);
    }

    // 6. حذف محادثات AI
    const aiChats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const ac of aiChats) await ctx.db.delete(ac._id);

    // 7. حذف سجل السائق إن وجد
    const driverRecord = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (driverRecord) await ctx.db.delete((driverRecord as any)._id);

    // 8. حذف سجلات OTP
    const user = await ctx.db.get(args.userId);
    if (user?.email) {
      const otps = await ctx.db
        .query("otpCodes")
        .withIndex("by_email", (q) => q.eq("email", (user as any).email))
        .collect();
      for (const o of otps) await ctx.db.delete(o._id);
    }

    // 9. حذف سجلات المصادقة (authAccounts, authSessions, authRefreshTokens)
    // حتى يتمكن المستخدم من التسجيل مجدداً بنفس الإيميل
    try {
      const authAccounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
        .collect();
      for (const acc of authAccounts) await ctx.db.delete(acc._id);
    } catch (_) { /* نتجاهل الخطأ */ }

    let sessionIds: any[] = [];
    try {
      const authSessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q: any) => q.eq("userId", args.userId))
        .collect();
      sessionIds = authSessions.map((s: any) => s._id);
      for (const s of authSessions) await ctx.db.delete(s._id);
    } catch (_) {}

    // حذف refresh tokens لكل جلسة
    for (const sessionId of sessionIds) {
      try {
        const tokens = await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q: any) => q.eq("sessionId", sessionId))
          .collect();
        for (const t of tokens) await ctx.db.delete(t._id);
      } catch (_) {}
    }

    // 10. حذف المستخدم نفسه
    await ctx.db.delete(args.userId);
  },
});

// ── إضافة مكتب جديد من الأدمن ──
export const cleanupOrphanedAuthRecords = mutation({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const email = args.email?.trim();
    const identifiers = email ? Array.from(new Set([email, email.toLowerCase()])) : null;
    let removedAccounts = 0;
    let removedSessions = 0;

    const authAccounts = identifiers
      ? (await Promise.all(identifiers.map((identifier) =>
          ctx.db.query("authAccounts").withIndex("providerAndAccountId", (q: any) =>
            q.eq("provider", "password").eq("providerAccountId", identifier),
          ).collect(),
        ))).flat()
      : await ctx.db.query("authAccounts").collect();

    for (const account of authAccounts) {
      const user = await ctx.db.get(account.userId);
      if (user) continue;
      await deleteAuthAccountCascade(ctx, account._id);
      removedAccounts += 1;
    }

    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      const user = await ctx.db.get(session.userId);
      if (user) continue;
      await deleteAll(ctx, await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q: any) => q.eq("sessionId", session._id)).collect());
      await deleteAll(ctx, (await ctx.db.query("authVerifiers").collect()).filter((v: any) => v.sessionId === session._id));
      await ctx.db.delete(session._id);
      removedSessions += 1;
    }

    if (identifiers) {
      for (const identifier of identifiers) {
        await deleteAll(ctx, await ctx.db.query("authRateLimits").withIndex("identifier", (q: any) => q.eq("identifier", identifier)).collect());
        await deleteAll(ctx, await ctx.db.query("passwordResetCodes").withIndex("by_email", (q: any) => q.eq("email", identifier)).collect());
      }
    }

    return { removedAccounts, removedSessions };
  },
});

export const adminCreateOffice = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    city: v.string(),
    phone: v.string(),
    email: v.string(),
    licenseNumber: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    legalName: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    locationUrl: v.optional(v.string()),
    contactNumbers: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    ownerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { isVerified, ownerEmail, description, ...rest } = args;

    // البحث عن المستخدم بالبريد الإلكتروني إذا تم تحديده
    let ownerId: any = "admin_created";
    if (ownerEmail) {
      const ownerUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", ownerEmail))
        .first();
      if (ownerUser) {
        ownerId = ownerUser._id;
        // تعيينه كمالك مكتب
        await ctx.db.patch(ownerUser._id, { isOfficeOwner: true });
      }
    }

    return await ctx.db.insert("offices", {
      ...rest,
      description: description ?? "",
      userId: ownerId,
      rating: 0,
      reviewCount: 0,
      isVerified: isVerified ?? false,
    });
  },
});

// ── تحديث حالة المستخدم (تفعيل/تعطيل) ──
export const toggleUserActive = mutation({
  args: { userId: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { isActive: args.isActive });
  },
});

// ── تحديث نوع الحساب من الأدمن ──
export const adminSetAccountType = mutation({
  args: {
    userId: v.id("users"),
    accountType: v.string(), // "pilgrim" | "office" | "driver" | "user"
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const updates: any = { accountType: args.accountType, accountTypeSet: true };
    if (args.accountType === "office") updates.isOfficeOwner = true;
    else updates.isOfficeOwner = false;
    await ctx.db.patch(args.userId, updates);
  },
});

// ── تحديث بيانات المستخدم من الأدمن ──
export const adminUpdateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    accountType: v.optional(v.string()),
    customPermissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const { userId, ...updates } = args;
    const clean: any = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    if (clean.accountType) {
      clean.accountTypeSet = true;
      if (clean.accountType === "office") clean.isOfficeOwner = true;
      else clean.isOfficeOwner = false;
    }
    await ctx.db.patch(userId, clean);
  },
});

// ── جلب المستخدمين حسب نوع الحساب ──
export const getUsersByType = query({
  args: { accountType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const allUsers = await ctx.db.query("users").collect();
    if (!args.accountType) return allUsers;
    return allUsers.filter((u) => u.accountType === args.accountType);
  },
});

// ── جلب السائقين مع بيانات driver record ──
export const getDriverUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const driverUsers = (await ctx.db.query("users").collect()).filter(
      (u) => u.accountType === "driver"
    );
    return await Promise.all(
      driverUsers.map(async (u) => {
        const driverRecord = await ctx.db
          .query("drivers")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .first();
        return { ...u, driverRecord };
      })
    );
  },
});

// ── جلب المعتمرين مع بيانات الحجوزات ──
export const getPilgrimUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const pilgrims = (await ctx.db.query("users").collect()).filter(
      (u) => u.accountType === "pilgrim"
    );
    return await Promise.all(
      pilgrims.map(async (u) => {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        return {
          ...u,
          bookingCount: bookings.length,
          walletBalance: u.walletBalance ?? 0,
        };
      })
    );
  },
});

// ── حفظ نوع الحساب عند التسجيل (من المستخدم نفسه) ──
export const setMyAccountType = mutation({
  args: { accountType: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("المستخدم غير موجود");
    // لا يمكن تغيير نوع الحساب بعد تعيينه
    if (user.accountTypeSet) throw new ConvexError("لا يمكن تغيير نوع الحساب بعد تعيينه");
    const updates: any = {
      accountType: args.accountType,
      accountTypeSet: true,
    };
    if (args.accountType === "office") updates.isOfficeOwner = true;
    await ctx.db.patch(userId, updates);
  },
});
