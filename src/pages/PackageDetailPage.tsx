import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Page } from "../App";
import { toast } from "sonner";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight, MapPin, Calendar, Clock, Users,
  Star, BadgeCheck, CheckCircle2, XCircle, ChevronDown,
} from "lucide-react";

// قائمة رموز الدول الأكثر استخداماً
const COUNTRY_CODES = [
  { code: "+966", flag: "🇸🇦", name: "السعودية" },
  { code: "+971", flag: "🇦🇪", name: "الإمارات" },
  { code: "+965", flag: "🇰🇼", name: "الكويت" },
  { code: "+974", flag: "🇶🇦", name: "قطر" },
  { code: "+973", flag: "🇧🇭", name: "البحرين" },
  { code: "+968", flag: "🇴🇲", name: "عُمان" },
  { code: "+962", flag: "🇯🇴", name: "الأردن" },
  { code: "+20",  flag: "🇪🇬", name: "مصر" },
  { code: "+212", flag: "🇲🇦", name: "المغرب" },
  { code: "+213", flag: "🇩🇿", name: "الجزائر" },
  { code: "+216", flag: "🇹🇳", name: "تونس" },
  { code: "+218", flag: "🇱🇾", name: "ليبيا" },
  { code: "+249", flag: "🇸🇩", name: "السودان" },
  { code: "+967", flag: "🇾🇪", name: "اليمن" },
  { code: "+963", flag: "🇸🇾", name: "سوريا" },
  { code: "+964", flag: "🇮🇶", name: "العراق" },
  { code: "+961", flag: "🇱🇧", name: "لبنان" },
  { code: "+92",  flag: "🇵🇰", name: "باكستان" },
  { code: "+880", flag: "🇧🇩", name: "بنغلاديش" },
  { code: "+91",  flag: "🇮🇳", name: "الهند" },
  { code: "+44",  flag: "🇬🇧", name: "بريطانيا" },
  { code: "+1",   flag: "🇺🇸", name: "أمريكا" },
];

const BG_VIDEO = "https://videos.pexels.com/video-files/19820804/19820804-hd_1280_720_60fps.mp4";

const TYPE_LABELS: Record<string, string> = {
  economy: "اقتصادي", luxury: "فاخر", ramadan: "رمضان", family: "عائلي",
};

export default function PackageDetailPage({
  packageId, navigate,
}: {
  packageId: Id<"packages">;
  navigate: (p: Page) => void;
}) {
  const pkg = useQuery(api.packages.getById, { packageId });
  const createBooking = useMutation(api.bookings.create);

  const [showForm, setShowForm]       = useState(false);
  const [adults, setAdults]           = useState(1);
  const [children, setChildren]       = useState(0);
  const [name, setName]               = useState("");
  const [phoneLocal, setPhoneLocal]   = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [idNum, setIdNum]             = useState("");
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);

  // دمج رمز الدولة مع الرقم المحلي وتنظيفه
  const buildFullPhone = (): string => {
    let local = phoneLocal.trim().replace(/[\s\-\(\)]/g, "");
    // حذف الصفر الأول إذا وُجد
    if (local.startsWith("0")) local = local.slice(1);
    // حذف الـ + من رمز الدولة ودمجه مع الرقم
    const dialCode = countryCode.replace("+", "");
    return dialCode + local;
  };

  if (pkg === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }
  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">البرنامج غير موجود</h2>
          <button onClick={() => navigate({ name: "home" })} className="mt-4 text-emerald-600 hover:underline">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = pkg.price * adults + pkg.price * 0.5 * children;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = buildFullPhone();
    if (!name || !phoneLocal.trim() || !idNum) { toast.error("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    if (phoneLocal.trim().replace(/\D/g, "").length < 7) { toast.error("رقم الجوال غير صحيح"); return; }
    setLoading(true);
    try {
      const result = await createBooking({
        packageId,
        adultsCount: adults,
        childrenCount: children || undefined,
        leadPassengerName: name,
        leadPassengerPhone: fullPhone,
        leadPassengerIdNumber: idNum,
        notes: notes || undefined,
      });
      const bookingId = (result as any).bookingId ?? result;
      toast.success("تم تسجيل الحجز! أكمل الدفع الآن 💳");
      // الانتقال لصفحة الدفع مباشرة
      navigate({ name: "payment", bookingId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحجز");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate({ name: "home" })}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 transition-colors font-medium text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للبرامج
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden text-white anim-fade-up" style={{ minHeight: 260 }}>
              {/* فيديو الخلفية */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "brightness(0.5)" }}
              >
                <source src={BG_VIDEO} type="video/mp4" />
              </video>
              {/* طبقة تدرج */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, rgba(2,44,34,0.55) 0%, rgba(6,78,59,0.70) 60%, rgba(2,44,34,0.90) 100%)" }}
              />
              {/* المحتوى */}
              <div className="relative z-10 p-8">
                <div className="flex items-start justify-between mb-4">
                  <span className="bg-amber-400 text-emerald-900 text-sm font-bold px-3 py-1 rounded-full">
                    {TYPE_LABELS[pkg.packageType] ?? pkg.packageType}
                  </span>
                  {pkg.originalPrice && (
                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      خصم {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black mb-3">{pkg.title}</h1>
                <p className="text-emerald-200 leading-relaxed">{pkg.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {[
                    { Icon: Clock,    label: "المدة",           value: `${pkg.duration} يوم` },
                    { Icon: MapPin,   label: "الانطلاق",        value: pkg.departureCity },
                    { Icon: Calendar, label: "تاريخ الرحلة",    value: new Date(pkg.departureDate).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) },
                    { Icon: Users,    label: "المقاعد المتاحة", value: `${pkg.availableSeats} مقعد` },
                  ].map(({ Icon, label, value }, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                      <Icon className="w-4 h-4 text-amber-300 mx-auto mb-1" strokeWidth={1.5} />
                      <div className="text-amber-300 text-xs mb-0.5">{label}</div>
                      <div className="font-bold text-sm">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Office */}
            {pkg.office && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 anim-fade-up d-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">المكتب المنظم</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl">
                    {pkg.office.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800">{pkg.office.name}</h3>
                      {pkg.office.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                    </div>
                    {pkg.office.rating ? (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(pkg.office!.rating!) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                        <span className="text-sm text-gray-500 mr-1">
                          {pkg.office.rating} ({(pkg.office as any).reviewCount ?? 0} تقييم)
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Includes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 anim-fade-up d-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">ما يشمله البرنامج</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pkg.includes.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              {pkg.excludes && pkg.excludes.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 mb-3">لا يشمل:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pkg.excludes.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-gray-400 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hotels */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 anim-fade-up d-300">
              <h2 className="text-lg font-bold text-gray-800 mb-4">الفنادق</h2>
              <div className="space-y-3">
                <HotelRow label="مكة المكرمة" name={pkg.hotelMecca} stars={pkg.hotelStars} color="emerald" />
                {pkg.hotelMadinah && (
                  <HotelRow label="المدينة المنورة" name={pkg.hotelMadinah} stars={pkg.hotelStars} color="amber" />
                )}
              </div>
            </div>

            {/* Reviews */}
            {pkg.reviews && pkg.reviews.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 anim-fade-up d-400">
                <h2 className="text-lg font-bold text-gray-800 mb-4">تقييمات المعتمرين</h2>
                <div className="space-y-4">
                  {pkg.reviews.map((r) => (
                    <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                          {r.userName.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{r.userName}</span>
                        <div className="flex mr-auto">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden anim-scale-in">
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 p-5 text-white">
                  <div className="text-3xl font-black">{pkg.price.toLocaleString("ar-SA")} <span className="text-base font-semibold text-emerald-200">ر.س</span></div>
                  <div className="text-emerald-300 text-sm">للشخص الواحد</div>
                  {pkg.originalPrice && (
                    <div className="text-emerald-400 line-through text-sm">{pkg.originalPrice.toLocaleString("ar-SA")} ر.س</div>
                  )}
                </div>

                <div className="p-5">
                  {!showForm ? (
                    <>
                      <div className="space-y-3 mb-5 text-sm">
                        {[
                          { label: "المدة",          value: `${pkg.duration} يوم` },
                          { label: "تاريخ الانطلاق", value: new Date(pkg.departureDate).toLocaleDateString("ar-SA") },
                          { label: "تاريخ العودة",   value: new Date(pkg.returnDate).toLocaleDateString("ar-SA") },
                          { label: "المقاعد المتاحة", value: `${pkg.availableSeats} مقعد`, highlight: pkg.availableSeats <= 5 },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-gray-400">{row.label}</span>
                            <span className={`font-semibold ${row.highlight ? "text-red-500" : "text-gray-800"}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <Authenticated>
                        <button
                          onClick={() => setShowForm(true)}
                          disabled={pkg.availableSeats === 0}
                          className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
                        >
                          {pkg.availableSeats === 0 ? "مكتمل العدد" : "احجز الآن"}
                        </button>
                      </Authenticated>
                      <Unauthenticated>
                        <button
                          onClick={() => navigate({ name: "signin" })}
                          className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg"
                          style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
                        >
                          سجّل دخولك للحجز
                        </button>
                      </Unauthenticated>
                    </>
                  ) : (
                    <form onSubmit={handleBooking} className="space-y-4">
                      <h3 className="font-bold text-gray-800 text-base">بيانات الحجز</h3>

                      {/* Counters */}
                      <div className="grid grid-cols-2 gap-3">
                        <Counter label="البالغون" value={adults} min={1} max={pkg.availableSeats} onChange={setAdults} />
                        <Counter label="الأطفال"  value={children} min={0} max={10} onChange={setChildren} />
                      </div>

                      <Field label="اسم المسافر الرئيسي *" value={name} onChange={setName} placeholder="الاسم الكامل" />

                      {/* حقل رقم الجوال مع قائمة رمز الدولة */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">رقم الجوال *</label>
                        <div className="flex gap-2 items-stretch">
                          {/* زر اختيار رمز الدولة */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCountryList(v => !v)}
                              className="h-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white flex items-center gap-1.5 text-sm font-semibold hover:border-emerald-400 transition-colors min-w-[90px] justify-between"
                            >
                              <span>{COUNTRY_CODES.find(c => c.code === countryCode)?.flag ?? "🌍"}</span>
                              <span className="text-gray-700">{countryCode}</span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showCountryList && (
                              <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-64 max-h-64 overflow-y-auto">
                                {COUNTRY_CODES.map(c => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => { setCountryCode(c.code); setShowCountryList(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors text-right ${countryCode === c.code ? "bg-emerald-50 font-bold text-emerald-700" : "text-gray-700"}`}
                                  >
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="flex-1">{c.name}</span>
                                    <span className="text-gray-400 font-mono text-xs">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* حقل الرقم المحلي */}
                          <input
                            type="tel"
                            value={phoneLocal}
                            onChange={e => setPhoneLocal(e.target.value)}
                            placeholder="5xxxxxxxx"
                            dir="ltr"
                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 text-left"
                          />
                        </div>
                      </div>

                      <Field label="رقم الهوية / الإقامة *" value={idNum} onChange={setIdNum} placeholder="رقم الهوية" />
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">ملاحظات</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أي طلبات خاصة..."
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>

                      {/* Summary */}
                      <div className="bg-emerald-50 rounded-xl p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{adults} بالغ × {pkg.price.toLocaleString("ar-SA")}</span>
                          <span className="font-semibold">{(pkg.price * adults).toLocaleString("ar-SA")} ر.س</span>
                        </div>
                        {children > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">{children} طفل × {(pkg.price * 0.5).toLocaleString("ar-SA")}</span>
                            <span className="font-semibold">{(pkg.price * 0.5 * children).toLocaleString("ar-SA")} ر.س</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-emerald-800 border-t border-emerald-200 pt-2 mt-1">
                          <span>الإجمالي</span>
                          <span>{totalPrice.toLocaleString("ar-SA")} ر.س</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                          إلغاء
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-md disabled:opacity-50" style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}>
                          {loading ? "جاري الحجز..." : "تأكيد الحجز"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HotelRow({ label, name, stars, color }: { label: string; name: string; stars: number; color: string }) {
  const bg = color === "emerald" ? "bg-emerald-50" : "bg-amber-50";
  const txt = color === "emerald" ? "text-emerald-600" : "text-amber-600";
  return (
    <div className={`flex items-center justify-between p-4 ${bg} rounded-xl`}>
      <div>
        <div className={`text-xs font-semibold ${txt} mb-0.5`}>{label}</div>
        <div className="font-bold text-gray-800 text-sm">{name}</div>
      </div>
      <div className="flex">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
    </div>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 transition-colors">−</button>
        <span className="flex-1 text-center font-bold text-sm">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 transition-colors">+</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        required
      />
    </div>
  );
}
