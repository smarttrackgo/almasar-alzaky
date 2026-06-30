import {
  convexAuth,
  getAuthUserId,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    // Auto-promote the first user to admin so the app has an owner without a
    // separate setup wizard or hardcoded admin credentials.
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      const userCount = (await ctx.db.query("users").take(2)).length;
      if (userCount === 1) {
        await ctx.db.patch(userId, { isAdmin: true });
      }
    },
  },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

async function deleteAuthAccountCascade(ctx: any, accountId: any) {
  const codes = await ctx.db
    .query("authVerificationCodes")
    .withIndex("accountId", (q: any) => q.eq("accountId", accountId))
    .collect();
  for (const code of codes) {
    await ctx.db.delete(code._id);
  }
  await ctx.db.delete(accountId);
}

async function deleteRateLimitsForIdentifiers(ctx: any, identifiers: string[]) {
  for (const identifier of identifiers) {
    const limits = await ctx.db
      .query("authRateLimits")
      .withIndex("identifier", (q: any) => q.eq("identifier", identifier))
      .collect();
    for (const limit of limits) {
      await ctx.db.delete(limit._id);
    }
  }
}

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

async function deleteAuthForUser(ctx: any, userId: any, email?: string) {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q: any) => q.eq("userId", userId))
    .collect();
  for (const account of accounts) {
    await deleteAuthAccountCascade(ctx, account._id);
  }

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();
  for (const session of sessions) {
    await deleteAll(ctx, await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q: any) => q.eq("sessionId", session._id)).collect());
    await deleteAll(ctx, (await ctx.db.query("authVerifiers").collect()).filter((verifier: any) => verifier.sessionId === session._id));
    await ctx.db.delete(session._id);
  }

  if (email) {
    const identifiers = Array.from(new Set([email.trim(), email.trim().toLowerCase()])).filter(Boolean);
    await deleteRateLimitsForIdentifiers(ctx, identifiers);
    for (const identifier of identifiers) {
      await deleteAll(ctx, await ctx.db.query("passwordResetCodes").withIndex("by_email", (q: any) => q.eq("email", identifier)).collect());
    }
  }
}

async function deleteUserOwnedData(ctx: any, userId: any, email?: string) {
  const offices = await ctx.db.query("offices").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const office of offices) await deleteOfficeCascade(ctx, office._id);

  const bookings = await ctx.db.query("bookings").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const booking of bookings) await deleteBookingCascade(ctx, booking._id);

  const drivers = await ctx.db.query("drivers").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
  for (const driver of drivers) {
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

export const cleanupDeletedAccountAuthByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      return { cleaned: false, removedAccounts: 0 };
    }

    const identifiers = Array.from(new Set([trimmed, trimmed.toLowerCase()]));
    let removedAccounts = 0;

    for (const identifier of identifiers) {
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", identifier),
        )
        .collect();

      for (const account of accounts) {
        const user = await ctx.db.get(account.userId);
        if (user) continue;
        await deleteAuthAccountCascade(ctx, account._id);
        removedAccounts += 1;
      }
    }

    if (removedAccounts > 0) {
      await deleteRateLimitsForIdentifiers(ctx, identifiers);
      for (const identifier of identifiers) {
        const resetCodes = await ctx.db
          .query("passwordResetCodes")
          .withIndex("by_email", (q) => q.eq("email", identifier))
          .collect();
        for (const code of resetCodes) {
          await ctx.db.delete(code._id);
        }
      }
    }

    return { cleaned: removedAccounts > 0, removedAccounts };
  },
});

export const deleteMyAccount = mutation({
  args: {
    confirmation: v.string(),
  },
  handler: async (ctx, { confirmation }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");

    const user = await ctx.db.get(userId);
    if (!user) return { deleted: false };
    if (user.isAdmin) {
      throw new ConvexError("لا يمكن حذف حساب المدير من هنا. ألغِ صلاحيات الإدارة أولاً من لوحة الإدارة.");
    }
    if (confirmation.trim() !== "حذف حسابي") {
      throw new ConvexError("اكتب عبارة التأكيد بشكل صحيح: حذف حسابي");
    }

    await deleteUserOwnedData(ctx, userId, user.email);
    await deleteAuthForUser(ctx, userId, user.email);
    await ctx.db.delete(userId);

    return { deleted: true };
  },
});

// Change the signed-in user's password. The caller must be authenticated;
// the active session is the access proof, so no current-password challenge.
export const changePassword = action({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, { newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("You must be signed in to change your password.");
    }
    if (newPassword.length < 8) {
      throw new ConvexError("Password must be at least 8 characters.");
    }

    const user = await ctx.runQuery(api.auth.loggedInUser);
    if (!user?.email) {
      throw new ConvexError(
        "This account has no email and cannot use password sign-in.",
      );
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPassword },
    });
  },
});
