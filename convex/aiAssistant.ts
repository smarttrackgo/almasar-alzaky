"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

type ChatResult = { reply: string; error: boolean };

// ── نظام الرد الذكي المحلي (يعمل بدون OpenAI) ──
function localSmartReply(
  userMessage: string,
  packagesContext: string | undefined,
  bookingsContext: string | undefined,
  knowledgeBase: string,
  recommendations: { title: string; text: string }[]
): string {
  const msg = userMessage.toLowerCase().trim();

  // ── أسئلة عن الأسعار والأوقات ──
  if (msg.includes("أرخص") || msg.includes("ارخص") || msg.includes("سعر") || msg.includes("تكلفة") || msg.includes("وقت")) {
    return `أفضل الأوقات من حيث السعر والازدحام 📅

🟢 **الأرخص:** شهر محرم وصفر وربيع الأول
   - أسعار أقل بنسبة 30-40% عن المواسم
   - ازدحام أقل في الحرم

🟡 **متوسط السعر:** رجب وشعبان
   - توازن ممتاز بين السعر والتجربة

🔴 **الأغلى:** رمضان (خاصة العشر الأواخر)
   - أعلى الأسعار لكن أعظم الأجر

💡 نصيحة: احجز مبكراً قبل 3-6 أشهر للحصول على أفضل سعر!`;
  }

  // ── أسئلة عن المناسك ──
  if (msg.includes("مناسك") || msg.includes("طواف") || msg.includes("سعي") || msg.includes("إحرام") || msg.includes("احرام") || msg.includes("كيف أؤدي") || msg.includes("خطوات")) {
    return `مناسك العمرة خطوة بخطوة 🕌

1️⃣ **الإحرام** - من الميقات المحدد لمدينتك
   - النية والتلبية: "لبيك اللهم عمرة"

2️⃣ **الطواف** - حول الكعبة المشرفة
   - 7 أشواط عكس عقارب الساعة
   - يبدأ من الحجر الأسود

3️⃣ **السعي** - بين الصفا والمروة
   - 7 أشواط (من الصفا إلى المروة = شوط)

4️⃣ **الحلق أو التقصير**
   - للرجال: الحلق أفضل
   - للنساء: قص قدر أنملة

⏱️ المدة الإجمالية: 3-5 ساعات عادةً`;
  }

  // ── أسئلة عن البرامج ──
  if (msg.includes("برنامج") || msg.includes("باقة") || msg.includes("عروض") || msg.includes("متاح") || msg.includes("موجود")) {
    if (packagesContext) {
      return `البرامج المتاحة حالياً في المسار الذكي 🌟\n\n${packagesContext}\n\n💡 اضغط على أي برنامج في الصفحة الرئيسية لعرض التفاصيل والحجز مباشرة!`;
    }
    return `يمكنك الاطلاع على جميع البرامج المتاحة في الصفحة الرئيسية 🏠\n\nتجد هناك:\n• برامج اقتصادية للميزانية المحدودة\n• برامج عائلية مع فنادق 4-5 نجوم\n• برامج VIP لكبار السن\n• برامج شاملة للمرة الأولى\n\nاضغط على أي برنامج لعرض التفاصيل الكاملة والحجز!`;
  }

  // ── أسئلة عن الفرق بين البرامج ──
  if (msg.includes("فرق") || msg.includes("اقتصادي") || msg.includes("فاخر") || msg.includes("vip") || msg.includes("عائلي")) {
    return `الفرق بين أنواع البرامج 🏨

💚 **البرامج الاقتصادية:**
   - فنادق 3 نجوم، بعيدة قليلاً عن الحرم
   - مناسبة للأفراد والميزانية المحدودة
   - السعر: أقل تكلفة

💛 **البرامج العائلية:**
   - فنادق 4 نجوم، قريبة من الحرم
   - غرف عائلية واسعة
   - مناسبة للعائلات والأطفال

💎 **البرامج الفاخرة/VIP:**
   - فنادق 5 نجوم، مطلة على الحرم
   - خدمات خاصة ومرشد شخصي
   - مناسبة لكبار السن وذوي الاحتياجات الخاصة

أي نوع يناسبك؟ أخبرني وسأساعدك في الاختيار! 😊`;
  }

  // ── أسئلة عن المدة ──
  if (msg.includes("كم يوم") || msg.includes("مدة") || msg.includes("يستغرق") || msg.includes("أيام")) {
    return `مدة برامج العمرة ⏰

📅 **البرامج القصيرة (5-7 أيام):**
   - مناسبة للأفراد وأصحاب الوقت المحدود
   - تشمل: مكة المكرمة فقط أو مع زيارة المدينة

📅 **البرامج المتوسطة (10-12 يوم):**
   - الأكثر طلباً وتوازناً
   - تشمل: مكة + المدينة + وقت كافٍ للعبادة

📅 **البرامج الطويلة (14-21 يوم):**
   - للراغبين في الإقامة الطويلة
   - وقت أكثر للعبادة والزيارات

⏱️ أداء مناسك العمرة نفسها: 3-5 ساعات فقط`;
  }

  // ── أسئلة عن العائلات ──
  if (msg.includes("عائل") || msg.includes("أطفال") || msg.includes("أسرة")) {
    return `نصائح للعائلات في العمرة 👨‍👩‍👧‍👦

✅ **اختيار البرنامج المناسب:**
   - فنادق 4-5 نجوم قريبة من الحرم (أقل مشي للأطفال)
   - مدة 10-14 يوم مريحة للعائلة
   - غرف عائلية واسعة

✅ **نصائح عملية:**
   - احجز مبكراً لضمان غرف متجاورة
   - اختر أوقات أقل ازدحاماً (محرم/صفر)
   - تأكد من وجود مرشد يتحدث العربية

✅ **للأطفال:**
   - الحد الأدنى للعمر المُوصى به: 7 سنوات
   - احمل عربة أطفال للصغار

💡 ابحث في البرامج عن خيار "عائلي" للحصول على أفضل العروض!`;
  }

  // ── أسئلة عن الحجوزات ──
  if (msg.includes("حجز") || msg.includes("حجوزات") || msg.includes("حجوزاتي") || msg.includes("رحلتي")) {
    if (bookingsContext) {
      return `حجوزاتك الحالية 📋\n\n${bookingsContext}\n\nيمكنك الاطلاع على تفاصيل كل حجز من صفحة "حجوزاتي" في التطبيق.`;
    }
    return `لعرض حجوزاتك 📋\n\nاذهب إلى صفحة **"حجوزاتي"** من القائمة الرئيسية\n\nستجد هناك:\n• تفاصيل رحلتك\n• حالة الحجز\n• باركود التأكيد\n• إمكانية تتبع الرحلة المباشر`;
  }

  // ── أسئلة عن القرآن والأذكار ──
  if (msg.includes("قرآن") || msg.includes("مصحف") || msg.includes("أذكار") || msg.includes("دعاء") || msg.includes("ذكر")) {
    return `التطبيق يحتوي على 📖\n\n🕌 **مصحف شريف كامل:**\n   - جميع السور مع التلاوة\n   - بحث في الآيات\n   - إشارات مرجعية\n\n📿 **أذكار وأدعية:**\n   - أذكار الصباح والمساء\n   - أدعية العمرة والطواف\n   - أذكار متنوعة\n\nاضغط على زر المصحف 📖 في أسفل الشاشة للوصول المباشر!`;
  }

  // ── أسئلة عن الدعم ──
  if (msg.includes("مشكلة") || msg.includes("دعم") || msg.includes("مساعدة") || msg.includes("تواصل") || msg.includes("شكوى")) {
    return `للتواصل مع فريق الدعم 💬\n\nاضغط على زر **"الدعم"** 🎧 في أسفل يمين الشاشة\n\nيمكنك:\n• إرسال رسالة مباشرة للإدارة\n• الإبلاغ عن مشكلة في الحجز\n• طلب المساعدة في أي وقت\n\n⏰ أوقات الدعم: 24/7`;
  }

  // ── أسئلة عن مواقيت الصلاة ──
  if (msg.includes("صلاة") || msg.includes("أذان") || msg.includes("مواقيت") || msg.includes("وقت الصلاة")) {
    return `مواقيت الصلاة 🕌\n\nيمكنك الاطلاع على مواقيت الصلاة الدقيقة من صفحة **"مواقيت الصلاة"** في التطبيق\n\nتجد هناك:\n• مواقيت الصلوات الخمس\n• اتجاه القبلة\n• تنبيهات الأذان\n\nاضغط على أيقونة الصلاة في القائمة للوصول!`;
  }

  // ── أسئلة عن التوصيات ──
  if (msg.includes("توصية") || msg.includes("ينصح") || msg.includes("أنصح") || msg.includes("أفضل") || recommendations.length > 0) {
    if (recommendations.length > 0) {
      const recsText = recommendations.map(r => `• **${r.title}:** ${r.text}`).join("\n");
      return `توصياتنا الذكية لك 💡\n\n${recsText}\n\nأخبرني أي فئة تنتمي إليها وسأساعدك في اختيار البرنامج المثالي! 😊`;
    }
  }

  // ── تحية ──
  if (msg.includes("مرحبا") || msg.includes("السلام") || msg.includes("أهلا") || msg.includes("هلا") || msg === "hi" || msg === "hello") {
    return `وعليكم السلام ورحمة الله وبركاته 🌙\n\nأهلاً بك في مساعد المسار الذكي!\n\nيمكنني مساعدتك في:\n• 🔍 اختيار أفضل برنامج عمرة\n• 💰 معرفة أرخص أوقات السفر\n• 📖 شرح مناسك العمرة\n• 📋 الاطلاع على حجوزاتك\n\nكيف يمكنني مساعدتك اليوم؟`;
  }

  // ── رد افتراضي ذكي ──
  return `شكراً على سؤالك! 😊\n\nيمكنني مساعدتك في:\n\n• **البرامج المتاحة** - اسألني "ما البرامج المتاحة؟"\n• **أفضل الأوقات** - اسألني "ما أرخص وقت للعمرة؟"\n• **مناسك العمرة** - اسألني "كيف أؤدي العمرة؟"\n• **الفرق بين البرامج** - اسألني "ما الفرق بين الاقتصادي والفاخر؟"\n• **حجوزاتك** - اسألني "ما حجوزاتي؟"\n\nأو اضغط على أحد الأسئلة السريعة أدناه 👇`;
}

export const chat = action({
  args: {
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
    })),
    packagesContext: v.optional(v.string()),
    appContext: v.optional(v.string()),
    bookingsContext: v.optional(v.string()),
    officesContext: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ChatResult> => {
    // ── جلب إعدادات AI من قاعدة البيانات ──
    const aiConfig: Record<string, string> = await ctx.runQuery(api.aiSettings.getAll, {});

    const knowledgeBase: string = aiConfig.knowledge_base || "";
    const personality: string = aiConfig.ai_personality || "ودود، محترم، متخصص في شؤون العمرة";
    const maxLength: number = parseInt(aiConfig.max_response_length || "300");
    const recommendations: { title: string; text: string }[] = (() => {
      try { return JSON.parse(aiConfig.recommendations || "[]"); } catch { return []; }
    })();

    // آخر رسالة من المستخدم
    const lastUserMessage = [...args.messages].reverse().find(m => m.role === "user")?.content || "";

    // ── محاولة OpenAI أولاً ──
    const apiKey: string | undefined = process.env.OPENAI_API_KEY;

    if (apiKey) {
      const systemPrompt: string = aiConfig.system_prompt || `أنت مساعد ذكي متخصص في حجز العمرة لمنصة "المسار الذكي" السعودية.`;
      const recsText: string = recommendations.length > 0
        ? `\nالتوصيات المتاحة:\n${recommendations.map((r) => `- ${r.title}: ${r.text}`).join("\n")}`
        : "";

      const fullSystemPrompt: string = `${systemPrompt}

شخصيتك: ${personality}

${knowledgeBase}
${recsText}

${args.packagesContext ? `البرامج المتاحة حالياً في المنصة:\n${args.packagesContext}` : ""}
${args.appContext ? `\nمعلومات إضافية عن المنصة:\n${args.appContext}` : ""}
${args.officesContext ? `\nمكاتب السفر المعتمدة في المنصة:\n${args.officesContext}` : ""}
${args.bookingsContext ? `\nحجوزات المستخدم الحالية:\n${args.bookingsContext}` : ""}

قواعد الرد:
- تكلم بالعربية الفصحى البسيطة
- كن ودوداً ومحترماً
- اذكر الأسعار والتفاصيل بدقة إذا كانت متاحة
- إذا سأل عن حجز برنامج معين، أخبره بأنه يمكنه الضغط على البرنامج للحجز مباشرة
- إذا سأل عن الدعم أو مشكلة، أخبره بأن يتواصل مع الدعم عبر زر الدعم في التطبيق
- إذا سأل عن حجوزاته، أخبره بأن يذهب لصفحة "حجوزاتي"
- إذا سأل عن القرآن أو الأذكار، أخبره بأن التطبيق يحتوي على مصحف كامل وأذكار
- لا تتجاوز ${maxLength} كلمة في الرد`;

      try {
        const response: Response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: fullSystemPrompt },
              ...args.messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            max_tokens: Math.min(maxLength * 3, 800),
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          return {
            reply: data.choices[0]?.message?.content ?? "لم أتمكن من الرد، حاول مرة أخرى.",
            error: false,
          };
        }
      } catch (e) {
        console.error("OpenAI error, falling back to local:", e);
      }
    }

    // ── الرد الذكي المحلي (احتياطي أو عند غياب OpenAI) ──
    const localReply = localSmartReply(
      lastUserMessage,
      args.packagesContext,
      args.bookingsContext,
      knowledgeBase,
      recommendations
    );

    return { reply: localReply, error: false };
  },
});
