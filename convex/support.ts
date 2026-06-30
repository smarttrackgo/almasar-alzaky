import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// ── إنشاء أو جلب محادثة دعم للمستخدم ──
export const getOrCreateChat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");

    // هل توجد محادثة مفتوحة؟
    const existing = await ctx.db
      .query("supportChats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (existing) return existing._id;

    // إنشاء محادثة جديدة
    const chatId = await ctx.db.insert("supportChats", {
      userId,
      status: "open",
      lastMessageAt: Date.now(),
      unreadByAdmin: 0,
      unreadByUser: 0,
    });
    return chatId;
  },
});

// ── جلب محادثة المستخدم الحالي ──
export const getMyChat = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const chat = await ctx.db
      .query("supportChats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!chat) return null;

    const user = await ctx.db.get(userId);
    return { ...chat, userName: user?.name ?? "مستخدم", userEmail: user?.email ?? "" };
  },
});

// ── جلب رسائل محادثة ──
export const getMessages = query({
  args: { chatId: v.id("supportChats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const chat = await ctx.db.get(args.chatId);
    if (!chat) return [];

    const user = await ctx.db.get(userId);
    // السماح للمستخدم صاحب المحادثة أو الأدمن
    if (chat.userId !== userId && !user?.isAdmin) return [];

    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return messages;
  },
});

// ── إرسال رسالة ──
export const sendMessage = mutation({
  args: {
    chatId: v.id("supportChats"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("يجب تسجيل الدخول أولاً");
    if (!args.text.trim()) throw new ConvexError("الرسالة لا يمكن أن تكون فارغة");

    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new ConvexError("المحادثة غير موجودة");

    const user = await ctx.db.get(userId);
    const isAdmin = user?.isAdmin ?? false;

    // التحقق من الصلاحية
    if (chat.userId !== userId && !isAdmin) {
      throw new ConvexError("غير مصرح لك بإرسال رسائل في هذه المحادثة");
    }

    // إدراج الرسالة
    await ctx.db.insert("supportMessages", {
      chatId: args.chatId,
      senderId: userId,
      senderName: user?.name ?? (isAdmin ? "الإدارة" : "مستخدم"),
      isAdmin,
      text: args.text.trim(),
      isRead: false,
      sentAt: Date.now(),
    });

    // تحديث المحادثة
    await ctx.db.patch(args.chatId, {
      lastMessageAt: Date.now(),
      lastMessage: args.text.trim().slice(0, 80),
      status: "open",
      unreadByAdmin: isAdmin ? chat.unreadByAdmin : (chat.unreadByAdmin ?? 0) + 1,
      unreadByUser: isAdmin ? (chat.unreadByUser ?? 0) + 1 : chat.unreadByUser,
    });

    // إشعار للطرف الآخر
    if (isAdmin) {
      await ctx.db.insert("notifications", {
        userId: chat.userId,
        title: "رسالة جديدة من الإدارة",
        body: args.text.trim().slice(0, 60),
        type: "support",
        isRead: false,
      });
    }

    return null;
  },
});

// ── تعليم الرسائل كمقروءة ──
export const markAsRead = mutation({
  args: { chatId: v.id("supportChats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const user = await ctx.db.get(userId);
    const isAdmin = user?.isAdmin ?? false;

    const chat = await ctx.db.get(args.chatId);
    if (!chat) return;

    if (chat.userId !== userId && !isAdmin) return;

    // تحديث عداد غير المقروء
    if (isAdmin) {
      await ctx.db.patch(args.chatId, { unreadByAdmin: 0 });
    } else {
      await ctx.db.patch(args.chatId, { unreadByUser: 0 });
    }

    return null;
  },
});

// ── جلب جميع المحادثات (للأدمن) ──
export const getAllChats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];

    const chats = await ctx.db
      .query("supportChats")
      .order("desc")
      .collect();

    // إضافة بيانات المستخدم لكل محادثة
    const enriched = await Promise.all(
      chats.map(async (chat) => {
        const chatUser = await ctx.db.get(chat.userId);
        return {
          ...chat,
          userName: chatUser?.name ?? "مستخدم",
          userEmail: chatUser?.email ?? "",
          userPhone: chatUser?.phone ?? "",
        };
      })
    );

    // ترتيب حسب آخر رسالة
    return enriched.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
  },
});

// ── إغلاق محادثة (للأدمن) ──
export const closeChat = mutation({
  args: { chatId: v.id("supportChats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new ConvexError("للأدمن فقط");

    await ctx.db.patch(args.chatId, { status: "closed" });
    return null;
  },
});

// ── إعادة فتح محادثة ──
export const reopenChat = mutation({
  args: { chatId: v.id("supportChats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("غير مصرح");

    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new ConvexError("المحادثة غير موجودة");

    const user = await ctx.db.get(userId);
    if (chat.userId !== userId && !user?.isAdmin) throw new ConvexError("غير مصرح");

    await ctx.db.patch(args.chatId, { status: "open" });
    return null;
  },
});

// ── إحصائيات الدعم (للأدمن) ──
export const getSupportStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return null;

    const allChats = await ctx.db.query("supportChats").collect();
    const openChats = allChats.filter((c) => c.status === "open");
    const closedChats = allChats.filter((c) => c.status === "closed");
    const totalUnread = allChats.reduce((sum, c) => sum + (c.unreadByAdmin ?? 0), 0);

    return {
      total: allChats.length,
      open: openChats.length,
      closed: closedChats.length,
      unread: totalUnread,
    };
  },
});
