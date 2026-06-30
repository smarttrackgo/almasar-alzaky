import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const seedPackages = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("packages").first();
    if (existing) return "البيانات موجودة بالفعل";
    const userId = await getAuthUserId(ctx);
    if (!userId) return "يجب تسجيل الدخول";

    const office1 = await ctx.db.insert("offices", {
      name: "مكتب النور للسياحة والسفر",
      description: "مكتب متخصص في برامج العمرة منذ أكثر من 15 عاماً",
      city: "الرياض",
      phone: "0112345678",
      email: "alnoor@travel.sa",
      rating: 4.8,
      reviewCount: 124,
      isVerified: true,
      userId,
    });

    const office2 = await ctx.db.insert("offices", {
      name: "شركة الحرمين للسياحة",
      description: "رحلات عمرة مميزة بأعلى مستوى من الخدمة",
      city: "جدة",
      phone: "0122345678",
      email: "haramain@travel.sa",
      rating: 4.6,
      reviewCount: 89,
      isVerified: true,
      userId,
    });

    const office3 = await ctx.db.insert("offices", {
      name: "مجموعة الإيمان للسفر",
      description: "خبرة 20 عاماً في تنظيم رحلات العمرة والحج",
      city: "الدمام",
      phone: "0132345678",
      email: "aliman@travel.sa",
      rating: 4.9,
      reviewCount: 210,
      isVerified: true,
      userId,
    });

    await ctx.db.insert("packages", {
      officeId: office1,
      title: "برنامج العمرة الاقتصادي 10 أيام",
      description: "برنامج عمرة متكامل يشمل مكة المكرمة والمدينة المنورة بأسعار مناسبة لجميع الفئات",
      duration: 10,
      price: 3500,
      originalPrice: 4200,
      departureCity: "الرياض",
      departureDate: "2025-08-15",
      returnDate: "2025-08-25",
      availableSeats: 25,
      totalSeats: 40,
      includes: ["تذاكر الطيران", "الفندق 3 نجوم", "الإفطار والعشاء", "المواصلات", "المرشد الديني"],
      excludes: ["الوجبات الخارجية", "المصروف الشخصي"],
      hotelMecca: "فندق أجياد مكة",
      hotelMadinah: "فندق المدينة الدولي",
      hotelStars: 3,
      packageType: "economy",
      isActive: true,
    });

    await ctx.db.insert("packages", {
      officeId: office1,
      title: "برنامج العمرة الفاخر 14 يوم",
      description: "تجربة روحانية فاخرة في أقدس البقاع مع أرقى الخدمات الفندقية",
      duration: 14,
      price: 8500,
      originalPrice: 10000,
      departureCity: "الرياض",
      departureDate: "2025-09-01",
      returnDate: "2025-09-15",
      availableSeats: 12,
      totalSeats: 20,
      includes: ["تذاكر الطيران درجة رجال الأعمال", "فندق 5 نجوم", "جميع الوجبات", "مواصلات VIP", "مرشد خاص", "زيارة المواقع الأثرية"],
      excludes: ["المصروف الشخصي"],
      hotelMecca: "فندق برج ساعة مكة",
      hotelMadinah: "فندق أنوار المدينة",
      hotelStars: 5,
      packageType: "luxury",
      isActive: true,
    });

    await ctx.db.insert("packages", {
      officeId: office2,
      title: "عمرة رمضان المبارك 15 يوم",
      description: "عيش أجواء رمضان في مكة المكرمة والمدينة المنورة مع برنامج روحاني متكامل",
      duration: 15,
      price: 6200,
      originalPrice: 7500,
      departureCity: "جدة",
      departureDate: "2025-10-01",
      returnDate: "2025-10-16",
      availableSeats: 8,
      totalSeats: 30,
      includes: ["الإقامة الفندقية", "وجبة السحور والإفطار", "المواصلات", "المرشد الديني", "حقيبة الحاج"],
      excludes: ["تذاكر الطيران", "المصروف الشخصي"],
      hotelMecca: "فندق هيلتون مكة",
      hotelMadinah: "فندق موفنبيك المدينة",
      hotelStars: 4,
      packageType: "ramadan",
      isActive: true,
    });

    await ctx.db.insert("packages", {
      officeId: office2,
      title: "برنامج العمرة العائلي 12 يوم",
      description: "برنامج مصمم خصيصاً للعائلات مع خدمات متكاملة للأطفال وكبار السن",
      duration: 12,
      price: 4800,
      departureCity: "الرياض",
      departureDate: "2025-11-10",
      returnDate: "2025-11-22",
      availableSeats: 20,
      totalSeats: 35,
      includes: ["تذاكر الطيران", "فندق 4 نجوم", "جميع الوجبات", "المواصلات", "مرشد عائلي", "أنشطة للأطفال"],
      excludes: ["المصروف الشخصي"],
      hotelMecca: "فندق ميريديان مكة",
      hotelMadinah: "فندق كراون بلازا المدينة",
      hotelStars: 4,
      packageType: "family",
      isActive: true,
    });

    await ctx.db.insert("packages", {
      officeId: office3,
      title: "العمرة الممتازة 7 أيام",
      description: "برنامج مكثف لمن يريد أداء العمرة في وقت قصير مع أعلى مستوى من الخدمة",
      duration: 7,
      price: 5500,
      originalPrice: 6000,
      departureCity: "الدمام",
      departureDate: "2025-08-20",
      returnDate: "2025-08-27",
      availableSeats: 15,
      totalSeats: 25,
      includes: ["تذاكر الطيران", "فندق 5 نجوم", "جميع الوجبات", "مواصلات خاصة", "مرشد متخصص"],
      excludes: ["المصروف الشخصي"],
      hotelMecca: "فندق ماريوت مكة",
      hotelMadinah: "فندق شيراتون المدينة",
      hotelStars: 5,
      packageType: "luxury",
      isActive: true,
    });

    await ctx.db.insert("packages", {
      officeId: office3,
      title: "برنامج العمرة الشبابي 10 أيام",
      description: "برنامج خاص للشباب يجمع بين العبادة والتعرف على التاريخ الإسلامي",
      duration: 10,
      price: 3200,
      departureCity: "الدمام",
      departureDate: "2025-09-15",
      returnDate: "2025-09-25",
      availableSeats: 30,
      totalSeats: 40,
      includes: ["تذاكر الطيران", "فندق 3 نجوم", "الإفطار", "المواصلات", "جولات تاريخية"],
      excludes: ["العشاء", "المصروف الشخصي"],
      hotelMecca: "فندق الزمزم مكة",
      hotelMadinah: "فندق قباء المدينة",
      hotelStars: 3,
      packageType: "economy",
      isActive: true,
    });

    return "تم إضافة البيانات التجريبية بنجاح";
  },
});
