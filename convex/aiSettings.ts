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

// الإعدادات الافتراضية لـ AI
const DEFAULTS = {
  system_prompt: `أنت مساعد ذكي متخصص في حجز العمرة لمنصة "المسار الذكي" السعودية.
مهمتك:
1. مساعدة المعتمرين في اختيار أفضل برامج العمرة المناسبة لهم
2. إخبارهم بأفضل الأوقات للعمرة من حيث الأسعار والازدحام
3. الإجابة على أسئلتهم عن مناسك العمرة والمشاعر المقدسة
4. مساعدتهم في مقارنة البرامج المتاحة
5. تقديم نصائح عملية للمعتمرين الجدد`,

  quick_questions: JSON.stringify([
    "ما أرخص وقت للعمرة؟",
    "ما الفرق بين البرامج الاقتصادية والفاخرة؟",
    "كم يستغرق أداء مناسك العمرة؟",
    "ما أفضل برنامج للعائلات؟",
  ]),

  knowledge_base: `معلومات مهمة عن أفضل أوقات العمرة:
- أرخص الأوقات: شهر محرم وصفر وربيع الأول (بعيداً عن رمضان والمواسم)
- أغلى الأوقات: رمضان (خاصة العشر الأواخر)، الأعياد، نهاية العام
- أفضل توازن بين السعر والتجربة: شهر رجب وشعبان
- أقل ازدحاماً: أشهر الشتاء (ديسمبر-فبراير) مع أسعار معتدلة

مناسك العمرة:
- الإحرام من الميقات
- الطواف حول الكعبة المشرفة (7 أشواط)
- السعي بين الصفا والمروة (7 أشواط)
- الحلق أو التقصير

نصائح للمعتمرين:
- احمل معك ملابس مريحة ومناسبة للمناخ
- تأكد من صحة وثائق السفر قبل الرحلة
- احجز مبكراً للحصول على أفضل الأسعار`,

  recommendations: JSON.stringify([
    { title: "للعائلات", text: "برامج 10-14 يوم مع فنادق 4-5 نجوم قريبة من الحرم" },
    { title: "للميزانية المحدودة", text: "شهر محرم أو صفر مع برامج اقتصادية 5-7 أيام" },
    { title: "لكبار السن", text: "برامج VIP مع خدمات خاصة وفنادق 5 نجوم" },
    { title: "للمرة الأولى", text: "برامج شاملة مع مرشد متخصص وجولات تعليمية" },
  ]),

  ai_personality: "ودود، محترم، متخصص في شؤون العمرة، يتكلم بالعربية الفصحى البسيطة",
  max_response_length: "200",
  welcome_message: "مرحباً! أنا مساعدك الذكي في المسار الذكي 🕌\n\nيمكنني مساعدتك في:\n• اختيار أفضل برنامج عمرة\n• معرفة أرخص أوقات السفر\n• الإجابة على أسئلتك عن المناسك\n\nكيف يمكنني مساعدتك؟",
};

// جلب إعداد واحد (عام)
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("aiSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (row) return row.value;
    return DEFAULTS[args.key as keyof typeof DEFAULTS] ?? null;
  },
});

// جلب كل الإعدادات كـ map (عام - للاستخدام في AI)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("aiSettings").collect();
    const map: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  },
});

// جلب الأسئلة السريعة (عام)
export const getQuickQuestions = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("aiSettings")
      .withIndex("by_key", (q) => q.eq("key", "quick_questions"))
      .first();
    try {
      const val = row?.value ?? DEFAULTS.quick_questions;
      return JSON.parse(val) as string[];
    } catch {
      return ["ما أرخص وقت للعمرة؟", "ما الفرق بين البرامج الاقتصادية والفاخرة؟", "كم يستغرق أداء مناسك العمرة؟", "ما أفضل برنامج للعائلات؟"];
    }
  },
});

// جلب التوصيات (عام)
export const getRecommendations = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("aiSettings")
      .withIndex("by_key", (q) => q.eq("key", "recommendations"))
      .first();
    try {
      const val = row?.value ?? DEFAULTS.recommendations;
      return JSON.parse(val) as { title: string; text: string }[];
    } catch {
      return [];
    }
  },
});

// تحديث إعداد (للأدمن فقط)
export const upsert = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("aiSettings", {
        key: args.key,
        value: args.value,
        isActive: true,
      });
    }
  },
});

// إعادة تعيين إعداد للقيمة الافتراضية
export const resetToDefault = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
