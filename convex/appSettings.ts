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

// الإعدادات الافتراضية
const DEFAULT_SETTINGS = [
  // ── هوية التطبيق ──
  { key: "app_name",        label: "اسم التطبيق",          type: "text",     value: "المسار الذكي" },
  { key: "app_tagline",     label: "الشعار الفرعي (Badge الرئيسية)", type: "text", value: "منصة حجز العمرة الأولى في المملكة" },
  { key: "logo_url",        label: "شعار الموقع (اللوجو)", type: "image",    value: "https://polished-pony-114.convex.cloud/api/storage/bdcd34f5-1db8-4d00-ac98-2ea9329effad" },
  // ── الصفحة الرئيسية ──
  { key: "hero_title",      label: "العنوان الرئيسي (Hero)", type: "text",   value: "رحلتك إلى بيت الله الحرام" },
  { key: "hero_subtitle",   label: "الوصف تحت العنوان",    type: "textarea", value: "اختر من أفضل برامج العمرة المعتمدة بكل سهولة وأمان" },
  { key: "hero_video_url",  label: "رابط فيديو الخلفية",   type: "text",     value: "https://videos.pexels.com/video-files/19820804/19820804-hd_1280_720_60fps.mp4" },
  { key: "hero_video_brightness", label: "سطوع الفيديو (0.1 - 1.0)", type: "text", value: "0.72" },
  // ── الألوان الرئيسية ──
  { key: "color_primary",   label: "اللون الرئيسي",        type: "color",    value: "#065f46" },
  { key: "color_secondary", label: "اللون الثانوي",        type: "color",    value: "#d97706" },
  { key: "color_accent",    label: "لون التمييز (Accent)", type: "color",    value: "#10b981" },
  // ── معلومات التواصل ──
  { key: "contact_phone",   label: "رقم الهاتف",            type: "text",     value: "920000000" },
  { key: "contact_email",   label: "البريد الإلكتروني",     type: "text",     value: "info@almasaraldaki.sa" },
  { key: "contact_address", label: "العنوان",               type: "text",     value: "المملكة العربية السعودية" },
  { key: "platform_legal_name", label: "اسم الشركة / المؤسسة الرسمي", type: "text", value: "المسار الذكي" },
  { key: "platform_commercial_register", label: "السجل التجاري للمنصة", type: "text", value: "" },
  { key: "platform_tax_number", label: "الرقم الضريبي للمنصة", type: "text", value: "" },
  { key: "platform_website", label: "الموقع الإلكتروني للمنصة", type: "text", value: "https://almasaralzaky.com" },
  { key: "platform_location_url", label: "رابط اللوكيشن للمنصة", type: "text", value: "" },
  { key: "platform_contact_numbers", label: "الأرقام الرسمية للمنصة", type: "text", value: "" },
  { key: "whatsapp",        label: "رقم واتساب",            type: "text",     value: "" },
  // ── وسائل التواصل الاجتماعي ──
  { key: "twitter",         label: "رابط حساب X (تويتر) — مثال: https://x.com/yourhandle",         type: "text", value: "" },
  { key: "instagram",       label: "رابط حساب إنستغرام — مثال: https://instagram.com/yourhandle",  type: "text", value: "" },
  { key: "facebook",        label: "رابط حساب فيسبوك — مثال: https://facebook.com/yourpage",       type: "text", value: "" },
  { key: "tiktok",          label: "رابط حساب تيك توك — مثال: https://tiktok.com/@yourhandle",     type: "text", value: "" },
  // ── الفوتر ──
  { key: "footer_text",     label: "نص الفوتر",             type: "textarea", value: "منصة متخصصة في حجز برامج العمرة داخل المملكة العربية السعودية." },
  // ── شاشة البداية (Splash Screen) ──
  { key: "splash_logo_url",    label: "شعار شاشة البداية",         type: "image",    value: "https://polished-pony-114.convex.cloud/api/storage/f940c87e-6ceb-4ca8-8dd8-8cd3bddc2b97" },
  { key: "splash_video_url",   label: "فيديو خلفية شاشة البداية",  type: "text",     value: "https://videos.pexels.com/video-files/19820804/19820804-hd_1280_720_60fps.mp4" },
  { key: "splash_title",       label: "النص الرئيسي في شاشة البداية",  type: "text",  value: "رحلتك للعمرة…" },
  { key: "splash_subtitle",    label: "النص الثانوي في شاشة البداية",  type: "text",  value: "منظمة وآمنة خطوة بخطوة" },
  // ── صور الوجهات المقدسة ──
  { key: "kaaba_image_url",    label: "صورة مكة المكرمة (الكعبة)",   type: "image",   value: "https://polished-pony-114.convex.cloud/api/storage/f8e21276-c3a4-4933-98bc-c719fc43ba8c" },
  { key: "kaaba_title",        label: "عنوان مكة المكرمة",           type: "text",    value: "مكة المكرمة" },
  { key: "kaaba_subtitle",     label: "وصف مكة المكرمة",             type: "text",    value: "قبلة المسلمين وأشرف البقاع" },
  { key: "madinah_image_url",  label: "صورة المدينة المنورة",        type: "image",   value: "https://polished-pony-114.convex.cloud/api/storage/22aaba82-1d53-4f51-b06a-98593b6f4678" },
  { key: "madinah_title",      label: "عنوان المدينة المنورة",       type: "text",    value: "المدينة المنورة" },
  { key: "madinah_subtitle",   label: "وصف المدينة المنورة",         type: "text",    value: "مدينة النبي ﷺ" },
  // ── نصوص قسم الإحصائيات ──
  { key: "stats_packages",     label: "إحصائية البرامج",             type: "text",    value: "+500" },
  { key: "stats_offices",      label: "إحصائية المكاتب",             type: "text",    value: "+50" },
  { key: "stats_pilgrims",     label: "إحصائية المعتمرين",           type: "text",    value: "+10,000" },
  { key: "stats_rating",       label: "إحصائية التقييم",             type: "text",    value: "4.8" },
  // ── نصوص قسم لماذا نحن ──
  { key: "why_title",          label: "عنوان قسم 'لماذا نحن'",       type: "text",    value: "لماذا المسار الذكي؟" },
  { key: "why_subtitle",       label: "وصف قسم 'لماذا نحن'",         type: "text",    value: "نقدم لك تجربة حجز آمنة وموثوقة" },
  // ── قسم CTA ──
  { key: "cta_title",          label: "عنوان قسم الدعوة للعمل",      type: "text",    value: "ابدأ رحلتك الروحانية اليوم" },
  { key: "cta_subtitle",       label: "وصف قسم الدعوة للعمل",        type: "textarea",value: "انضم إلى آلاف المعتمرين الذين وثقوا بالمسار الذكي لتنظيم رحلتهم المباركة" },
  { key: "cta_image_url",      label: "صورة خلفية قسم الدعوة (CTA)", type: "image",   value: "" },
  // ── صور الأقسام الأخرى ──
  { key: "about_image_url",    label: "صورة قسم 'من نحن'",           type: "image",   value: "" },
  { key: "features_image_url", label: "صورة قسم 'مميزاتنا'",         type: "image",   value: "" },
  { key: "og_image_url",       label: "صورة المشاركة (OG Image)",     type: "image",   value: "" },
  // ── إعدادات GCCMSG WhatsApp API ──
  { key: "wa_auto_send",      label: "الإرسال التلقائي",   type: "toggle",   value: "true" },
  { key: "gccmsg_base_url",   label: "GCCMSG Base URL",    type: "text",     value: "" },
  { key: "gccmsg_instance",   label: "GCCMSG Instance ID", type: "text",     value: "" },
  { key: "gccmsg_token",      label: "GCCMSG Token",       type: "password", value: "" },
  // ── إعدادات الدفع ──
  { key: "payment_mode",         label: "وضع الدفع (test/live)",      type: "text",     value: "test" },
  { key: "payment_bank_name",    label: "اسم البنك",                  type: "text",     value: "" },
  { key: "payment_iban",         label: "رقم الآيبان (IBAN)",         type: "text",     value: "" },
  { key: "payment_account_name", label: "اسم صاحب الحساب",           type: "text",     value: "" },
  { key: "payment_account_num",  label: "رقم الحساب البنكي",          type: "text",     value: "" },
  { key: "payment_method_mada",  label: "تفعيل مدى",                  type: "toggle",   value: "true" },
  { key: "payment_method_stc",   label: "تفعيل STC Pay",              type: "toggle",   value: "true" },
  { key: "payment_method_apple", label: "تفعيل Apple Pay",            type: "toggle",   value: "true" },
  { key: "payment_method_google",label: "تفعيل Google Pay",           type: "toggle",   value: "true" },
  { key: "payment_method_tabby", label: "تفعيل Tabby",                type: "toggle",   value: "true" },
  { key: "payment_method_tamara",label: "تفعيل Tamara",               type: "toggle",   value: "true" },
  { key: "payment_method_bank",  label: "تفعيل تحويل بنكي",          type: "toggle",   value: "false" },
  { key: "payment_tabby_checkout_url",  label: "Tabby Checkout URL",  type: "text",     value: "" },
  { key: "payment_tabby_public_key",    label: "Tabby Public Key",    type: "text",     value: "" },
  { key: "payment_tabby_secret_key",    label: "Tabby Secret Key",    type: "password", value: "" },
  { key: "payment_tamara_checkout_url", label: "Tamara Checkout URL", type: "text",     value: "" },
  { key: "payment_tamara_public_key",   label: "Tamara Public Key",   type: "text",     value: "" },
  { key: "payment_tamara_secret_key",   label: "Tamara Secret Key",   type: "password", value: "" },
  { key: "payment_return_url",          label: "Payment Return URL",  type: "text",     value: "" },
  { key: "payment_webhook_url",         label: "Payment Webhook URL", type: "text",     value: "" },
  { key: "payment_instructions", label: "تعليمات الدفع للمعتمر",      type: "textarea", value: "" },
  { key: "passenger_commission_rate", label: "نسبة إضافة المعتمر على السعر", type: "text", value: "0" },
  // ── صور طرق الدفع ──
  { key: "payment_img_mada",    label: "صورة مدى",            type: "image", value: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Mada_Logo.svg/320px-Mada_Logo.svg.png" },
  { key: "payment_img_stc",     label: "صورة STC Pay",        type: "image", value: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/STC_Pay_Logo.svg/320px-STC_Pay_Logo.svg.png" },
  { key: "payment_img_apple",   label: "صورة Apple Pay",      type: "image", value: "https://polished-pony-114.convex.cloud/api/storage/0c781a71-e621-42ff-941b-9aeca76e4559" },
  { key: "payment_img_google",  label: "صورة Google Pay",     type: "image", value: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/320px-Google_Pay_Logo.svg.png" },
  { key: "payment_img_tabby",   label: "صورة Tabby",          type: "image", value: "" },
  { key: "payment_img_tamara",  label: "صورة Tamara",         type: "image", value: "" },
  { key: "payment_img_bank",    label: "صورة التحويل البنكي", type: "image", value: "" },
];

// جلب جميع الإعدادات
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("appSettings").collect();
    const map: Record<string, any> = {};
    for (const r of rows) map[r.key] = r;
    return DEFAULT_SETTINGS.map((d) => ({
      ...d,
      ...(map[d.key] ?? {}),
      // الأولوية دائماً للـ label والـ type من DEFAULT_SETTINGS
      label: d.label,
      type: d.type,
      _id: map[d.key]?._id ?? null,
    }));
  },
});

// جلب إعداد واحد بالمفتاح (عام - بدون صلاحيات)
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (row) return row.value;
    const def = DEFAULT_SETTINGS.find((d) => d.key === args.key);
    return def?.value ?? null;
  },
});

// جلب كل الإعدادات كـ map (عام)
export const getMap = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("appSettings").collect();
    const map: Record<string, string> = {};
    for (const d of DEFAULT_SETTINGS) map[d.key] = d.value;
    for (const r of rows) {
      if (typeof r.value === "string") {
        map[r.key] = r.value;
      } else if (r.value === null || r.value === undefined) {
        map[r.key] = "";
      } else {
        map[r.key] = String(r.value);
      }
    }
    return map;
  },
});

// تحديث إعداد
export const upsert = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        ...(args.storageId ? { storageId: args.storageId } : {}),
      });
    } else {
      const def = DEFAULT_SETTINGS.find((d) => d.key === args.key);
      await ctx.db.insert("appSettings", {
        key: args.key,
        value: args.value,
        label: def?.label,
        type: def?.type,
        ...(args.storageId ? { storageId: args.storageId } : {}),
      });
    }
  },
});

// توليد رابط رفع صورة للإعدادات
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// رفع صورة وحفظ URL الصحيح تلقائياً
export const upsertImage = mutation({
  args: {
    key: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new ConvexError("فشل جلب رابط الصورة");
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    const def = DEFAULT_SETTINGS.find((d) => d.key === args.key);
    if (existing) {
      await ctx.db.patch(existing._id, { value: url, storageId: args.storageId });
    } else {
      await ctx.db.insert("appSettings", {
        key: args.key,
        value: url,
        label: def?.label,
        type: def?.type,
        storageId: args.storageId,
      });
    }
    return url;
  },
});
