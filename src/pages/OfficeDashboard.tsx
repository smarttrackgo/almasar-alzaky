import { Fragment, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import {
  LayoutDashboard, Package, CalendarCheck, PlusCircle, MapPin, BadgeCheck,
  TrendingUp, Users, Banknote, Clock, Filter, X, FileText, Printer,
  CheckCircle, Building2,
  MessageCircle, Send, Phone, Copy, History, ChevronDown, ChevronUp,
  Bell, CheckCheck, AlertCircle, Edit3,
  Smartphone, BarChart3, RefreshCw, Zap,
  Mail, Key, ShieldCheck, XCircle, Loader2,
  Bus, User, CreditCard, Globe, Hash, Shield, Link, Pencil, Trash2, Plus,
  Star, Play, Navigation,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { printHtml } from "../lib/printDocument";
import { printTaxInvoice } from "../lib/taxInvoice";
import { SAUDI_CITIES } from "../lib/saudiCities";

const LOGO_URL = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "مؤكد",         cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغي",         cls: "bg-red-100 text-red-600" },
  completed: { label: "مكتمل",        cls: "bg-blue-100 text-blue-700" },
};

// ── قوالب رسائل واتساب ──
const WA_TEMPLATES = {
  confirmed: (name: string, ref: string, pkg: string, price: string) =>
    `السلام عليكم ${name} 🌙\n\nيسعدنا إبلاغكم بأنه تم *تأكيد حجزكم* بنجاح ✅\n\n📋 رقم الحجز: *${ref}*\n🕌 البرنامج: ${pkg}\n💰 الإجمالي: ${price} ر.س\n\nنتمنى لكم رحلة مباركة وعمرة مقبولة 🤲\nالمسار الذكي للعمرة`,

  cancelled: (name: string, ref: string) =>
    `السلام عليكم ${name}\n\nنأسف لإبلاغكم بأنه تم *إلغاء حجزكم* ❌\n\n📋 رقم الحجز: *${ref}*\n\nللاستفسار أو إعادة الحجز، يرجى التواصل معنا.\nنعتذر عن أي إزعاج 🙏\nالمسار الذكي للعمرة`,

  completed: (name: string, ref: string) =>
    `السلام عليكم ${name} 🌟\n\nنبارك لكم إتمام رحلة العمرة المباركة ✨\n\n📋 رقم الحجز: *${ref}*\n\nتقبّل الله منكم صالح الأعمال 🤲\nيسعدنا تقييمكم لتجربتكم معنا.\nالمسار الذكي للعمرة`,

  reminder: (name: string, ref: string, pkg: string) =>
    `السلام عليكم ${name} 🌙\n\nتذكير بموعد رحلتكم القادمة 📅\n\n📋 رقم الحجز: *${ref}*\n🕌 البرنامج: ${pkg}\n\nيرجى التأكد من جاهزية الوثائق المطلوبة.\nالمسار الذكي للعمرة`,

  custom: () => "",
};

const TEMPLATE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  confirmed:  { label: "تأكيد الحجز",    color: "emerald", icon: CheckCheck },
  cancelled:  { label: "إلغاء الحجز",    color: "red",     icon: AlertCircle },
  completed:  { label: "إتمام الرحلة",   color: "blue",    icon: CheckCircle },
  reminder:   { label: "تذكير بالرحلة",  color: "amber",   icon: Bell },
  custom:     { label: "رسالة مخصصة",    color: "purple",  icon: Edit3 },
};

// ألوان الحافلات
const BUS_COLORS = [
  { value: "white",  label: "أبيض",   hex: "#ffffff" },
  { value: "silver", label: "فضي",    hex: "#c0c0c0" },
  { value: "gray",   label: "رمادي",  hex: "#6b7280" },
  { value: "black",  label: "أسود",   hex: "#1f2937" },
  { value: "blue",   label: "أزرق",   hex: "#3b82f6" },
  { value: "red",    label: "أحمر",   hex: "#ef4444" },
  { value: "green",  label: "أخضر",   hex: "#22c55e" },
  { value: "yellow", label: "أصفر",   hex: "#eab308" },
  { value: "orange", label: "برتقالي", hex: "#f97316" },
];

const BUS_TYPES = ["حافلة كبيرة", "حافلة متوسطة", "ميني باص", "فان", "سيارة خاصة"];

const NATIONALITIES = [
  "سعودي", "مصري", "باكستاني", "هندي", "بنغلاديشي", "إندونيسي",
  "ماليزي", "تركي", "يمني", "سوداني", "مغربي", "جزائري", "تونسي",
  "أردني", "فلسطيني", "سوري", "عراقي", "لبناني", "إثيوبي", "نيجيري",
];

type Tab = "overview" | "packages" | "bookings" | "trips" | "whatsapp" | "email" | "add-package" | "statements" | "buses" | "reviews";

export default function OfficeDashboard({ navigate }: { navigate: (p: Page) => void }) {
  const myOffice = useQuery(api.offices.getMyOffice);
  const [tab, setTab] = useState<Tab>("overview");

  if (myOffice === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div>;
  }

  if (!myOffice) return <CreateOfficeForm />;

  const TABS: { key: Tab; label: string; Icon: any }[] = [
    { key: "overview",     label: "نظرة عامة",         Icon: LayoutDashboard },
    { key: "packages",     label: "البرامج",            Icon: Package },
    { key: "bookings",     label: "الحجوزات",           Icon: CalendarCheck },
    { key: "trips",        label: "الرحلات",            Icon: MapPin },
    { key: "buses",        label: "الحافلات والسائقين", Icon: Bus },
    { key: "whatsapp",     label: "إشعارات واتساب",     Icon: Smartphone },
    { key: "email",        label: "سجل الإيميل",         Icon: Mail },
    { key: "statements",   label: "كشف الحساب",         Icon: FileText },
    { key: "add-package",  label: "إضافة برنامج",       Icon: PlusCircle },
    { key: "reviews",      label: "التقييمات",           Icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard header */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black">
            {myOffice.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{myOffice.name}</h1>
              {myOffice.isVerified && <BadgeCheck className="w-6 h-6 text-blue-300" />}
            </div>
            <div className="flex items-center gap-1 text-emerald-200 text-sm mt-0.5">
              <MapPin className="w-3.5 h-3.5" />{myOffice.city}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === "whatsapp" && <WhatsAppTabBadge officeId={myOffice._id} />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === "overview"    && <OverviewTab officeId={myOffice._id} />}
        {tab === "packages"    && <PackagesTab officeId={myOffice._id} />}
        {tab === "bookings"    && <BookingsTab officeId={myOffice._id} onSwitchToWhatsApp={() => setTab("whatsapp")} navigate={navigate} />}
        {tab === "trips"       && <TripsManagementTab officeId={myOffice._id} navigate={navigate} />}
        {tab === "buses"       && <BusesTab officeId={myOffice._id} />}
        {tab === "whatsapp"    && <WhatsAppCenterTab officeId={myOffice._id} />}
        {tab === "email"       && <OfficeEmailTab officeId={myOffice._id} />}
        {tab === "statements"  && <StatementsTab officeId={myOffice._id} officeName={myOffice.name} />}
        {tab === "add-package" && <AddPackageForm officeId={myOffice._id} onSuccess={() => setTab("packages")} />}
        {tab === "reviews"     && <OfficeReviewsTab officeId={myOffice._id} />}
      </div>
    </div>
  );
}

// ── شارة عدد الإشعارات في تبويب واتساب ──
function WhatsAppTabBadge({ officeId }: { officeId: any }) {
  const stats = useQuery(api.whatsapp.getOfficeStats, { officeId });
  if (!stats || stats.thisWeek === 0) return null;
  return (
    <span className="bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {stats.thisWeek}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   تبويب إدارة الحافلات والسائقين
══════════════════════════════════════════════════════════ */
function BusesTab({ officeId }: { officeId: any }) {
  const buses      = useQuery(api.buses.getByOffice);
  const createBus  = useMutation(api.buses.create);
  const updateBus  = useMutation(api.buses.update);
  const removeBus  = useMutation(api.buses.remove);

  const [showForm, setShowForm]       = useState(false);
  const [editingBus, setEditingBus]   = useState<any | null>(null);
  const [viewingBus, setViewingBus]   = useState<any | null>(null);
  const [loading, setLoading]         = useState(false);
  const [activeCard, setActiveCard]   = useState<"driver" | "operating" | null>(null);

  const emptyForm = {
    plateNumber: "", capacity: 45, busType: "حافلة كبيرة", busColor: "white",
    driverName: "", driverPhone: "", driverIdNumber: "", driverNationality: "سعودي",
    driverLicenseNumber: "", driverLicenseExpiry: "",
    operatingCardNumber: "", operatingCardExpiry: "", operatingCardIssuer: "",
    driverAppLink: "", driverAppToken: "",
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditingBus(null);
    setForm(emptyForm);
    setShowForm(true);
    setViewingBus(null);
  };

  const openEdit = (bus: any) => {
    setEditingBus(bus);
    setForm({
      plateNumber: bus.plateNumber ?? "",
      capacity: bus.capacity ?? 45,
      busType: bus.busType ?? "حافلة كبيرة",
      busColor: bus.busColor ?? "white",
      driverName: bus.driverName ?? "",
      driverPhone: bus.driverPhone ?? "",
      driverIdNumber: bus.driverIdNumber ?? "",
      driverNationality: bus.driverNationality ?? "سعودي",
      driverLicenseNumber: bus.driverLicenseNumber ?? "",
      driverLicenseExpiry: bus.driverLicenseExpiry ?? "",
      operatingCardNumber: bus.operatingCardNumber ?? "",
      operatingCardExpiry: bus.operatingCardExpiry ?? "",
      operatingCardIssuer: bus.operatingCardIssuer ?? "",
      driverAppLink: bus.driverAppLink ?? "",
      driverAppToken: bus.driverAppToken ?? "",
    });
    setShowForm(true);
    setViewingBus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBus) {
        await updateBus({
          busId: editingBus._id,
          ...form,
          capacity: Number(form.capacity),
        });
        toast.success("تم تحديث بيانات الحافلة ✅");
      } else {
        await createBus({ ...form, capacity: Number(form.capacity) });
        toast.success("تم إضافة الحافلة بنجاح 🚌");
      }
      setShowForm(false);
      setEditingBus(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (busId: any, plateNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحافلة ${plateNumber}؟`)) return;
    try {
      await removeBus({ busId });
      toast.success("تم حذف الحافلة");
      if (viewingBus?._id === busId) setViewingBus(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const getBusColorHex = (color?: string) =>
    BUS_COLORS.find((c) => c.value === color)?.hex ?? "#f3f4f6";

  if (!buses) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Bus className="w-4 h-4 text-blue-700" />
            </div>
            إدارة الحافلات والسائقين
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">إدارة أسطول الحافلات وبيانات السائقين الكاملة</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة حافلة جديدة
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الحافلات",  value: buses.length,                                          from: "from-blue-500",    to: "to-blue-700" },
          { label: "حافلات نشطة",      value: buses.filter((b) => b.isActive !== false).length,      from: "from-emerald-500", to: "to-emerald-700" },
          { label: "إجمالي المقاعد",   value: buses.reduce((s, b) => s + b.capacity, 0),             from: "from-purple-500",  to: "to-purple-700" },
          { label: "سائقون مسجلون",    value: buses.filter((b) => b.driverIdNumber).length,          from: "from-amber-500",   to: "to-amber-700" },
        ].map(({ label, value, from, to }, i) => (
          <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-white/75 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* نموذج الإضافة / التعديل */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-l from-blue-700 to-blue-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-black flex items-center gap-2">
              <Bus className="w-5 h-5" />
              {editingBus ? "تعديل بيانات الحافلة" : "إضافة حافلة جديدة"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ── قسم بيانات الحافلة ── */}
            <div>
              <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                <Bus className="w-4 h-4 text-blue-600" />
                بيانات الحافلة
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormRow label="رقم اللوحة *">
                  <input value={form.plateNumber} onChange={(e) => set("plateNumber", e.target.value)} required className={inp} placeholder="أ ب ج 1234" />
                </FormRow>
                <FormRow label="السعة (مقعد) *">
                  <input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} required min={1} max={100} className={inp} />
                </FormRow>
                <FormRow label="نوع الحافلة">
                  <select value={form.busType} onChange={(e) => set("busType", e.target.value)} className={inp}>
                    {BUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormRow>
                <FormRow label="لون الحافلة">
                  <div className="flex gap-2 flex-wrap">
                    {BUS_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("busColor", c.value)}
                        title={c.label}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${form.busColor === c.value ? "border-blue-500 scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </FormRow>
              </div>
            </div>

            {/* ── قسم بيانات السائق ── */}
            <div>
              <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="w-4 h-4 text-indigo-600" />
                بيانات السائق الكاملة
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormRow label="اسم السائق *">
                  <input value={form.driverName} onChange={(e) => set("driverName", e.target.value)} required className={inp} placeholder="الاسم الكامل" />
                </FormRow>
                <FormRow label="جوال السائق *">
                  <input value={form.driverPhone} onChange={(e) => set("driverPhone", e.target.value)} required className={inp} placeholder="05xxxxxxxx" dir="ltr" />
                </FormRow>
                <FormRow label="رقم الهوية">
                  <input value={form.driverIdNumber} onChange={(e) => set("driverIdNumber", e.target.value)} className={inp} placeholder="1xxxxxxxxx" dir="ltr" />
                </FormRow>
                <FormRow label="الجنسية">
                  <select value={form.driverNationality} onChange={(e) => set("driverNationality", e.target.value)} className={inp}>
                    {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </FormRow>
                <FormRow label="رقم رخصة القيادة">
                  <input value={form.driverLicenseNumber} onChange={(e) => set("driverLicenseNumber", e.target.value)} className={inp} placeholder="رقم الرخصة" dir="ltr" />
                </FormRow>
                <FormRow label="انتهاء الرخصة">
                  <input type="date" value={form.driverLicenseExpiry} onChange={(e) => set("driverLicenseExpiry", e.target.value)} className={inp} />
                </FormRow>
              </div>
            </div>

            {/* ── قسم بطاقة التشغيل ── */}
            <div>
              <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                <Shield className="w-4 h-4 text-rose-600" />
                بطاقة التشغيل
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormRow label="رقم بطاقة التشغيل">
                  <input value={form.operatingCardNumber} onChange={(e) => set("operatingCardNumber", e.target.value)} className={inp} placeholder="رقم البطاقة" dir="ltr" />
                </FormRow>
                <FormRow label="انتهاء البطاقة">
                  <input type="date" value={form.operatingCardExpiry} onChange={(e) => set("operatingCardExpiry", e.target.value)} className={inp} />
                </FormRow>
                <FormRow label="جهة الإصدار">
                  <input value={form.operatingCardIssuer} onChange={(e) => set("operatingCardIssuer", e.target.value)} className={inp} placeholder="مثال: وزارة النقل" />
                </FormRow>
              </div>
            </div>

            {/* ── قسم ربط تطبيق السائق ── */}
            <div>
              <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                <Link className="w-4 h-4 text-emerald-600" />
                ربط تطبيق السائق
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormRow label="رابط تطبيق السائق">
                  <input value={form.driverAppLink} onChange={(e) => set("driverAppLink", e.target.value)} className={inp} placeholder="https://driver.almasaralzaky.com/..." dir="ltr" />
                </FormRow>
                <FormRow label="رمز الدخول (Token)">
                  <input value={form.driverAppToken} onChange={(e) => set("driverAppToken", e.target.value)} className={inp} placeholder="رمز الدخول الخاص بالسائق" dir="ltr" />
                </FormRow>
              </div>
              {form.driverAppLink && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <Link className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-700 font-semibold">رابط التطبيق للسائق:</p>
                    <p className="text-xs text-emerald-600 font-mono truncate" dir="ltr">{form.driverAppLink}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(form.driverAppLink); toast.success("تم نسخ الرابط"); }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors"
                  >
                    نسخ
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 bg-gradient-to-l from-blue-700 to-blue-600"
              >
                {loading ? "جاري الحفظ..." : editingBus ? "حفظ التعديلات" : "إضافة الحافلة"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* قائمة الحافلات */}
      {buses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="w-10 h-10 text-blue-200" />
          </div>
          <h3 className="text-gray-600 font-bold mb-1">لا توجد حافلات مسجلة</h3>
          <p className="text-gray-400 text-sm mb-6">أضف أول حافلة لمكتبك الآن</p>
          <button onClick={openAdd} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
            إضافة حافلة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {buses.map((bus) => {
            const colorHex = getBusColorHex(bus.busColor);
            const colorLabel = BUS_COLORS.find((c) => c.value === bus.busColor)?.label ?? bus.busColor ?? "—";
            const isViewing = viewingBus?._id === bus._id;

            return (
              <div key={bus._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* رأس البطاقة */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* أيقونة الحافلة بلونها */}
                      <div
                        className="w-14 h-14 rounded-2xl border-2 border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: colorHex }}
                      >
                        <Bus className="w-7 h-7" style={{ color: colorHex === "#ffffff" || colorHex === "#eab308" ? "#374151" : "#ffffff" }} />
                      </div>
                      <div>
                        <div className="font-black text-gray-800 text-lg font-mono">{bus.plateNumber}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {bus.busType ?? "حافلة"} • {bus.capacity} مقعد • {colorLabel}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${bus.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {bus.isActive !== false ? "نشطة" : "متوقفة"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(bus)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bus._id, bus.plateNumber)}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* بيانات السائق المختصرة */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">السائق</p>
                        <p className="font-bold text-gray-800 truncate">{bus.driverName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">الجوال</p>
                        <p className="font-bold text-gray-800 font-mono text-xs" dir="ltr">{bus.driverPhone}</p>
                      </div>
                    </div>
                    {bus.driverNationality && (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                        <Globe className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">الجنسية</p>
                          <p className="font-bold text-gray-800">{bus.driverNationality}</p>
                        </div>
                      </div>
                    )}
                    {bus.driverIdNumber && (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                        <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">رقم الهوية</p>
                          <p className="font-bold text-gray-800 font-mono text-xs">{bus.driverIdNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* أزرار عرض البطاقات */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { setViewingBus(bus); setActiveCard("driver"); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      <User className="w-3.5 h-3.5" />
                      بطاقة السائق
                    </button>
                    <button
                      onClick={() => { setViewingBus(bus); setActiveCard("operating"); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-100"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      بطاقة التشغيل
                    </button>
                    {bus.driverAppLink && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(bus.driverAppLink!); toast.success("تم نسخ رابط التطبيق"); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                        title="نسخ رابط تطبيق السائق"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal عرض البطاقات */}
      {viewingBus && activeCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewingBus(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {activeCard === "driver" ? (
              /* بطاقة السائق */
              <div>
                <div className="bg-gradient-to-l from-indigo-700 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span className="font-black text-lg">بطاقة السائق</span>
                    </div>
                    <button onClick={() => setViewingBus(null)} className="text-white/70 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                      {viewingBus.driverName?.charAt(0) ?? "؟"}
                    </div>
                    <div>
                      <div className="text-xl font-black">{viewingBus.driverName}</div>
                      <div className="text-indigo-200 text-sm mt-0.5 font-mono" dir="ltr">{viewingBus.driverPhone}</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    { icon: Globe,    label: "الجنسية",          value: viewingBus.driverNationality },
                    { icon: CreditCard, label: "رقم الهوية",     value: viewingBus.driverIdNumber },
                    { icon: Hash,     label: "رقم رخصة القيادة", value: viewingBus.driverLicenseNumber },
                    { icon: Clock,    label: "انتهاء الرخصة",    value: viewingBus.driverLicenseExpiry },
                    { icon: Bus,      label: "الحافلة المخصصة",  value: viewingBus.plateNumber },
                  ].map(({ icon: Icon, label, value }) => value ? (
                    <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-bold text-gray-800 font-mono text-sm">{value}</p>
                      </div>
                    </div>
                  ) : null)}
                  {viewingBus.driverAppLink && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1">
                        <Link className="w-3 h-3" /> رابط تطبيق السائق
                      </p>
                      <p className="text-xs font-mono text-emerald-700 truncate" dir="ltr">{viewingBus.driverAppLink}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(viewingBus.driverAppLink); toast.success("تم نسخ الرابط"); }}
                        className="mt-2 w-full py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors"
                      >
                        نسخ الرابط
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* بطاقة التشغيل */
              <div>
                <div className="bg-gradient-to-l from-rose-700 to-rose-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-black text-lg">بطاقة تشغيل الحافلة</span>
                    </div>
                    <button onClick={() => setViewingBus(null)} className="text-white/70 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl border-2 border-white/30 flex items-center justify-center"
                      style={{ backgroundColor: getBusColorHex(viewingBus.busColor) }}
                    >
                      <Bus className="w-8 h-8 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono">{viewingBus.plateNumber}</div>
                      <div className="text-rose-200 text-sm mt-0.5">{viewingBus.busType ?? "حافلة"} • {viewingBus.capacity} مقعد</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {viewingBus.operatingCardNumber || viewingBus.operatingCardExpiry || viewingBus.operatingCardIssuer ? (
                    <>
                      {[
                        { icon: Hash,     label: "رقم بطاقة التشغيل", value: viewingBus.operatingCardNumber },
                        { icon: Clock,    label: "تاريخ الانتهاء",    value: viewingBus.operatingCardExpiry },
                        { icon: Building2, label: "جهة الإصدار",      value: viewingBus.operatingCardIssuer },
                        { icon: User,     label: "السائق المعين",     value: viewingBus.driverName },
                        { icon: Phone,    label: "جوال السائق",       value: viewingBus.driverPhone },
                      ].map(({ icon: Icon, label, value }) => value ? (
                        <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-rose-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className="font-bold text-gray-800 font-mono text-sm">{value}</p>
                          </div>
                        </div>
                      ) : null)}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">لم يتم إدخال بيانات بطاقة التشغيل بعد</p>
                      <button
                        onClick={() => { setViewingBus(null); openEdit(viewingBus); }}
                        className="mt-3 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition-colors"
                      >
                        إضافة بيانات البطاقة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ officeId }: { officeId: any }) {
  const packages = useQuery(api.packages.getByOffice, { officeId });
  const bookings = useQuery(api.bookings.officeBookings, { officeId });
  const waStats  = useQuery(api.whatsapp.getOfficeStats, { officeId });

  const totalRevenue = bookings?.reduce((s, b) => s + (b.status !== "cancelled" ? b.totalPrice : 0), 0) ?? 0;
  const pending      = bookings?.filter((b) => b.status === "pending").length ?? 0;
  const confirmed    = bookings?.filter((b) => b.status === "confirmed").length ?? 0;

  const stats = [
    { Icon: Package,    label: "إجمالي البرامج",         value: packages?.length ?? 0,                  from: "from-emerald-500", to: "to-emerald-700" },
    { Icon: Users,      label: "إجمالي الحجوزات",        value: bookings?.length ?? 0,                  from: "from-blue-500",    to: "to-blue-700" },
    { Icon: Clock,      label: "حجوزات معلقة",           value: pending,                                from: "from-amber-500",   to: "to-amber-700" },
    { Icon: Banknote,   label: "إجمالي الإيرادات (ر.س)", value: totalRevenue.toLocaleString("ar-SA"),   from: "from-purple-500",  to: "to-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ Icon, label, value, from, to }, i) => (
          <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
            <Icon className="w-6 h-6 text-white/70 mb-2" strokeWidth={1.5} />
            <div className="text-2xl font-black">{value}</div>
            <div className="text-white/75 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {waStats && (
        <div className="bg-gradient-to-l from-green-800 to-green-600 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-green-200 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              إشعارات واتساب المرسلة
            </p>
            <div className="text-3xl font-black">{waStats.total}</div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-green-200">
              <span>هذا الأسبوع: <span className="font-bold text-white">{waStats.thisWeek}</span></span>
              {Object.entries(waStats.byType).slice(0, 3).map(([type, count]) => (
                <span key={type}>{TEMPLATE_LABELS[type]?.label ?? type}: <span className="font-bold text-white">{count as number}</span></span>
              ))}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-7 h-7 text-white/80" />
          </div>
        </div>
      )}

      <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-emerald-200 text-sm font-semibold mb-1">إجمالي إيرادات المكتب</p>
            <div className="text-4xl font-black">
              {totalRevenue.toLocaleString("ar-SA")}
              <span className="text-2xl text-emerald-300 mr-1">ر.س</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              <span className="text-emerald-200">مؤكدة: <span className="font-bold text-white">{confirmed}</span></span>
              <span className="text-amber-300">معلقة: <span className="font-bold text-amber-200">{pending}</span></span>
              <span className="text-emerald-200">إجمالي: <span className="font-bold text-white">{bookings?.length ?? 0}</span></span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-8 h-8 text-white/80" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          آخر الحجوزات
        </h2>
        {!bookings || bookings.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">لا توجد حجوزات بعد</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => {
              const st = STATUS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={b._id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{b.leadPassengerName}</div>
                      <div className="text-xs text-gray-400">{b.package?.title}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  {b.status !== "cancelled" && (
                    <div className="text-xs text-gray-500 mt-1">
                      الإجمالي: <span className="font-bold text-emerald-700">{b.totalPrice.toLocaleString("ar-SA")} ر.س</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Packages tab ── */
function PackagesTab({ officeId }: { officeId: any }) {
  const packages = useQuery(api.packages.getByOffice, { officeId });
  const update   = useMutation(api.packages.update);

  const toggle = async (id: any, current: boolean | undefined) => {
    try {
      await update({ packageId: id, isActive: !current });
      toast.success("تم تحديث حالة البرنامج");
    } catch { toast.error("حدث خطأ"); }
  };

  if (!packages) return <Spinner />;

  return (
    <div className="space-y-4">
      {packages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لا توجد برامج بعد</p>
        </div>
      ) : packages.map((pkg) => (
        <div key={pkg._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{pkg.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{pkg.duration} يوم</span>
              <span>•</span>
              <span>{pkg.departureCity}</span>
              <span>•</span>
              <span>{pkg.availableSeats} مقعد متاح</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-black text-emerald-800 text-sm">{pkg.price.toLocaleString("ar-SA")} ر.س</span>
            <button
              onClick={() => toggle(pkg._id, pkg.isActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                pkg.isActive !== false
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {pkg.isActive !== false ? "نشط" : "متوقف"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── مكوّن بطاقة واتساب لحجز واحد ── */
function WhatsAppCard({ booking, officeId, autoOpen = false }: { booking: any; officeId: any; autoOpen?: boolean }) {
  const [open, setOpen]           = useState(autoOpen);
  const [template, setTemplate]   = useState<keyof typeof WA_TEMPLATES>("confirmed");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending]     = useState(false);
  const [showLogs, setShowLogs]   = useState(false);

  const logNotification = useMutation(api.whatsapp.logNotification);
  const logs = useQuery(
    api.whatsapp.getLogsForBooking,
    showLogs ? { bookingId: booking._id } : "skip"
  );

  const buildMessage = () => {
    const name  = booking.leadPassengerName ?? "";
    const ref   = booking.bookingReference ?? "";
    const pkg   = booking.package?.title ?? "";
    const price = booking.totalPrice?.toLocaleString("ar-SA") ?? "";
    if (template === "custom") return customMsg;
    return WA_TEMPLATES[template](name, ref, pkg, price);
  };

  const phone = (booking.leadPassengerPhone ?? "").replace(/\D/g, "");
  const intlPhone = phone.startsWith("0") ? "966" + phone.slice(1) : phone;

  const handleSend = async () => {
    const msg = buildMessage();
    if (!msg.trim()) { toast.error("الرسالة فارغة"); return; }
    if (!intlPhone) { toast.error("رقم الجوال غير متوفر"); return; }

    setSending(true);
    try {
      const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");

      await logNotification({
        bookingId: booking._id,
        phone: intlPhone,
        messageType: template,
        messageText: msg,
      });
      toast.success("تم فتح واتساب وتسجيل الإشعار ✅");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(buildMessage());
    toast.success("تم نسخ الرسالة");
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          إشعار واتساب
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-semibold hover:bg-gray-100 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          السجل
        </button>
      </div>

      {open && (
        <div className="mt-3 bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-xs font-bold text-gray-600 mb-2">اختر نوع الرسالة:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(TEMPLATE_LABELS) as Array<keyof typeof TEMPLATE_LABELS>).map((key) => {
              const { label, color, icon: Icon } = TEMPLATE_LABELS[key];
              const active = template === key;
              return (
                <button
                  key={key}
                  onClick={() => setTemplate(key as keyof typeof WA_TEMPLATES)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? `bg-${color}-600 text-white shadow-sm`
                      : `bg-white text-${color}-700 border border-${color}-200 hover:bg-${color}-50`
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <textarea
              value={template === "custom" ? customMsg : buildMessage()}
              onChange={(e) => { if (template === "custom") setCustomMsg(e.target.value); }}
              readOnly={template !== "custom"}
              rows={6}
              className={`w-full text-sm rounded-xl border p-3 resize-none font-mono leading-relaxed ${
                template === "custom"
                  ? "bg-white border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                  : "bg-white/70 border-green-200 text-gray-700 cursor-default"
              }`}
              dir="rtl"
            />
            <button
              onClick={copyMessage}
              className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
              title="نسخ الرسالة"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5 text-green-600" />
            <span>سيُرسل إلى: <span className="font-bold text-gray-700 dir-ltr">{intlPhone || "—"}</span></span>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sending ? "جاري الفتح..." : "فتح واتساب وإرسال"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-white text-gray-500 font-bold text-sm hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            سجل الإشعارات المرسلة
          </p>
          {logs === undefined ? (
            <div className="text-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto" /></div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">لم يُرسل أي إشعار بعد</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log: any) => {
                const tpl = TEMPLATE_LABELS[log.messageType] ?? { label: log.messageType, color: "gray", icon: Bell };
                return (
                  <div key={log._id} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold text-${tpl.color}-700 bg-${tpl.color}-50 px-2 py-0.5 rounded-full`}>
                        {tpl.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.sentAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{log.messageText}</p>
                    <p className="text-xs text-gray-400 mt-1">بواسطة: {log.sentByName}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── مكوّن تعيين السائق لحجز ── */
function AssignDriverCard({ booking, officeId }: { booking: any; officeId: any }) {
  const drivers       = useQuery(api.drivers.getByOffice);
  const buses         = useQuery(api.buses.getByOffice);
  const createAndLink = useMutation(api.trips.createAndLinkToBooking);
  const assignDriver  = useMutation(api.trips.assignDriver);
  const assignBus     = useMutation(api.trips.assignBus);

  const [open, setOpen]               = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedBusId, setSelectedBusId]       = useState<string>("");
  const [mode, setMode]               = useState<"driver" | "bus">("driver"); // اختيار السائق أو الحافلة
  const [loading, setLoading]         = useState(false);
  const [assigned, setAssigned]       = useState(false);

  const hasTrip = !!booking.tripId;

  const handleAssign = async () => {
    if (mode === "driver" && !selectedDriverId) { toast.error("اختر سائقاً أولاً"); return; }
    if (mode === "bus"    && !selectedBusId)    { toast.error("اختر حافلة أولاً");  return; }
    setLoading(true);
    try {
      const depDate = booking.package?.departureDate ?? new Date().toISOString().split("T")[0];

      if (!hasTrip) {
        // أنشئ رحلة جديدة واربطها بالحجز
        const result = await createAndLink({
          packageId:     booking.packageId,
          bookingId:     booking._id,
          busId:         selectedBusId ? selectedBusId as any : undefined,
          departureDate: depDate,
        });
        // عيّن السائق على الرحلة الجديدة
        if (selectedDriverId) {
          await assignDriver({ tripId: result.tripId, driverId: selectedDriverId as any });
        }
      } else {
        // رحلة موجودة — عيّن السائق أو الحافلة
        if (selectedDriverId) {
          await assignDriver({ tripId: booking.tripId, driverId: selectedDriverId as any });
        }
        if (selectedBusId) {
          await assignBus({ tripId: booking.tripId, busId: selectedBusId as any });
        }
      }

      setAssigned(true);
      toast.success("✅ تم تعيين السائق وإرسال إشعار له!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const sendViaWhatsApp = (driver: any) => {
    const msg = `السلام عليكم ${driver?.name ?? "السائق"} 🚌\n\nتم تعيينك لرحلة عمرة في المسار الذكي.\n\n📋 البرنامج: ${booking.package?.title ?? "رحلة عمرة"}\n📅 تاريخ الانطلاق: ${booking.package?.departureDate ?? ""}\n\n✅ يرجى فتح تطبيق المسار الذكي وقبول الرحلة من لوحة السائق.\n\nالمسار الذكي للعمرة`;
    const phone = (driver?.phone ?? "").replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "966" + phone.slice(1) : phone;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const selectedDriver = drivers?.find((d: any) => d._id === selectedDriverId);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
          assigned || hasTrip
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        }`}
      >
        <Bus className="w-4 h-4" />
        {assigned ? "✅ تم التعيين" : hasTrip ? "تغيير السائق" : "تعيين سائق"}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-3 bg-indigo-50 rounded-2xl p-4 border border-indigo-100 space-y-3">

          {/* اختيار طريقة التعيين */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("driver")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mode === "driver" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              👤 من قائمة السائقين
            </button>
            <button
              onClick={() => setMode("bus")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mode === "bus" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              🚌 من قائمة الحافلات
            </button>
          </div>

          {/* قائمة السائقين */}
          {mode === "driver" && (
            <>
              <p className="text-xs font-bold text-gray-700">اختر السائق:</p>
              {!drivers ? (
                <div className="text-center py-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>
              ) : drivers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا يوجد سائقون مرتبطون بمكتبك بعد</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drivers.map((drv: any) => (
                    <label
                      key={drv._id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedDriverId === drv._id
                          ? "border-indigo-500 bg-white shadow-sm"
                          : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`driver-${booking._id}`}
                        value={drv._id}
                        checked={selectedDriverId === drv._id}
                        onChange={() => setSelectedDriverId(drv._id)}
                        className="accent-indigo-600"
                      />
                      {drv.profileImageUrl ? (
                        <img src={drv.profileImageUrl} alt={drv.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-sm">{drv.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span dir="ltr">{drv.phone}</span>
                          {drv.plateNumber && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{drv.plateNumber}</span>}
                        </div>
                      </div>
                      {drv.isApproved && <span className="text-xs text-emerald-600 font-bold">✓ معتمد</span>}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {/* قائمة الحافلات */}
          {mode === "bus" && (
            <>
              <p className="text-xs font-bold text-gray-700">اختر الحافلة:</p>
              {!buses ? (
                <div className="text-center py-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>
              ) : buses.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا توجد حافلات مسجلة</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {buses.filter((b: any) => b.isActive !== false).map((bus: any) => (
                    <label
                      key={bus._id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedBusId === bus._id
                          ? "border-indigo-500 bg-white shadow-sm"
                          : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`bus-${booking._id}`}
                        value={bus._id}
                        checked={selectedBusId === bus._id}
                        onChange={() => setSelectedBusId(bus._id)}
                        className="accent-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-800 font-mono text-sm">{bus.plateNumber}</span>
                          <span className="text-xs text-gray-400">{bus.busType} • {bus.capacity} مقعد</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{bus.driverName}</span>
                          <span className="flex items-center gap-1 font-mono" dir="ltr"><Phone className="w-3 h-3" />{bus.driverPhone}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {/* زر التعيين */}
          {(selectedDriverId || selectedBusId) && (
            <button
              onClick={handleAssign}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري التعيين...</>
                : <><Bus className="w-4 h-4" />تعيين وإرسال إشعار للسائق</>
              }
            </button>
          )}

          {/* إرسال واتساب للسائق */}
          {selectedDriver && (
            <button
              onClick={() => sendViaWhatsApp(selectedDriver)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              إرسال رسالة واتساب للسائق
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Bookings tab ── */
function BookingsTab({ officeId, onSwitchToWhatsApp, navigate }: { officeId: any; onSwitchToWhatsApp: () => void; navigate: (p: Page) => void }) {
  const bookings     = useQuery(api.bookings.officeBookings, { officeId });
  const updateStatus = useMutation(api.bookings.updateStatus);
  const stats        = useQuery(api.whatsapp.getOfficeStats, { officeId });
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const changeStatus = async (id: any, status: string) => {
    try {
      await updateStatus({ bookingId: id, status });
      toast.success("تم تحديث حالة الحجز");
    } catch { toast.error("حدث خطأ"); }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!bookings) return <Spinner />;

  // ── تجميع الحجوزات حسب البرنامج (packageId) ──
  const grouped = bookings.reduce((acc: Record<string, any[]>, b: any) => {
    const key = b.packageId ?? "no-package";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {stats && (
        <div
          onClick={onSwitchToWhatsApp}
          className="bg-gradient-to-l from-green-700 to-green-600 rounded-2xl p-5 text-white flex items-center justify-between cursor-pointer hover:from-green-800 hover:to-green-700 transition-all group"
        >
          <div>
            <p className="text-green-200 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              مركز إشعارات واتساب
            </p>
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-green-200">
              <span>هذا الأسبوع: <span className="font-bold text-white">{stats.thisWeek}</span></span>
              {Object.entries(stats.byType).slice(0, 2).map(([type, count]) => (
                <span key={type}>{TEMPLATE_LABELS[type]?.label ?? type}: <span className="font-bold text-white">{count as number}</span></span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MessageCircle className="w-10 h-10 text-white/30 group-hover:text-white/60 transition-colors" />
            <span className="text-xs text-green-200 group-hover:text-white transition-colors">عرض المركز ←</span>
          </div>
        </div>
      )}

      {/* ── مفتاح طريقة العرض ── */}
      {bookings.length > 0 && (
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <span className="text-xs font-bold text-gray-500 ml-1">طريقة العرض:</span>
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "grouped"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            مجمّع حسب البرنامج
          </button>
          <button
            onClick={() => setViewMode("individual")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "individual"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            فردي (كل حجز)
          </button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CalendarCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لا توجد حجوزات بعد</p>
        </div>

      ) : viewMode === "grouped" ? (
        /* ══ عرض مجمّع حسب البرنامج ══ */
        <div className="space-y-4">
          {Object.entries(grouped).map(([pkgId, pkgBookings]) => {
            const firstBooking = pkgBookings[0];
            const pkgTitle = firstBooking?.package?.title ?? "برنامج غير محدد";
            const pkgDate  = firstBooking?.package?.departureDate ?? "";
            const confirmedBookings = pkgBookings.filter((b: any) => b.status === "confirmed" || b.status === "completed");
            const pendingCount  = pkgBookings.filter((b: any) => b.status === "pending").length;
            const confirmedCount = confirmedBookings.length;
            const cancelledCount = pkgBookings.filter((b: any) => b.status === "cancelled").length;
            const totalRevenue = confirmedBookings.reduce((s: number, b: any) => s + b.totalPrice, 0);
            const isExpanded = expandedGroups.has(pkgId);
            // هل هناك رحلة مرتبطة بأي حجز في هذه المجموعة؟
            const linkedTrip = pkgBookings.find((b: any) => b.tripId);

            return (
              <div key={pkgId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* ── رأس المجموعة ── */}
                <div className="bg-gradient-to-l from-indigo-50 to-white p-5 border-b border-indigo-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-indigo-700" />
                        </div>
                        <h3 className="font-black text-gray-800 text-base">{pkgTitle}</h3>
                        {linkedTrip && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            ✅ رحلة مُنشأة
                          </span>
                        )}
                      </div>
                      {pkgDate && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <CalendarCheck className="w-3 h-3" />
                          تاريخ الانطلاق: {pkgDate}
                        </p>
                      )}
                      {/* إحصائيات المجموعة */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                          {pkgBookings.length} حجز إجمالي
                        </span>
                        {confirmedCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            {confirmedCount} مؤكد
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                            {pendingCount} معلق
                          </span>
                        )}
                        {cancelledCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold">
                            {cancelledCount} ملغي
                          </span>
                        )}
                        {totalRevenue > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">
                            {totalRevenue.toLocaleString("ar-SA")} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                    {/* زر كشف الركاب */}
                    {pkgId !== "no-package" && (
                      <button
                        onClick={() => navigate({ name: "passenger-manifest", packageId: pkgId as any })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition-colors border border-purple-100 flex-shrink-0"
                      >
                        <Users className="w-3.5 h-3.5" />
                        كشف الركاب
                      </button>
                    )}
                  </div>

                  {/* ── زر تعيين السائق للرحلة بالكامل ── */}
                  {confirmedBookings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-black text-indigo-800">
                          تعيين سائق للرحلة بالكامل
                        </span>
                        <span className="text-xs text-indigo-500">
                          (سيُطبَّق على {confirmedBookings.length} معتمر)
                        </span>
                      </div>
                      <GroupAssignDriverCard
                        bookings={confirmedBookings}
                        officeId={officeId}
                        packageTitle={pkgTitle}
                      />
                    </div>
                  )}
                </div>

                {/* ── قائمة الحجوزات الفردية (قابلة للطي) ── */}
                <button
                  onClick={() => toggleGroup(pkgId)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    عرض الحجوزات الفردية ({pkgBookings.length})
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-50">
                    {pkgBookings.map((b: any) => {
                      const st = STATUS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
                      return (
                        <div key={b._id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{b.leadPassengerName}</div>
                              <div className="text-xs text-emerald-600 font-semibold">{b.bookingReference}</div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div><span className="text-gray-400">الجوال: </span><span className="font-semibold">{b.leadPassengerPhone}</span></div>
                            <div><span className="text-gray-400">المسافرون: </span><span className="font-semibold">{b.adultsCount} بالغ</span></div>
                            <div><span className="text-gray-400">الإجمالي: </span><span className="font-black text-emerald-700">{b.totalPrice.toLocaleString("ar-SA")} ر.س</span></div>
                          </div>
                          {b.status === "pending" && (
                            <div className="flex gap-2 mb-2">
                              <button onClick={() => changeStatus(b._id, "confirmed")} className="flex-1 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors">
                                تأكيد الحجز
                              </button>
                              <button onClick={() => changeStatus(b._id, "cancelled")} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors">
                                إلغاء
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate({ name: "booking-detail", bookingId: b._id })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              التذكرة
                            </button>
                          </div>
                          <WhatsAppCard booking={b} officeId={officeId} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      ) : (
        /* ══ عرض فردي (الطريقة القديمة) ══ */
        bookings.map((b: any) => {
          const st = STATUS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
          return (
            <div key={b._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-800">{b.leadPassengerName}</div>
                  <div className="text-sm text-gray-400">{b.package?.title}</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-0.5">{b.bookingReference}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div><div className="text-xs text-gray-400 mb-0.5">الجوال</div><div className="font-semibold">{b.leadPassengerPhone}</div></div>
                <div><div className="text-xs text-gray-400 mb-0.5">المسافرون</div><div className="font-semibold">{b.adultsCount} بالغ</div></div>
                <div><div className="text-xs text-gray-400 mb-0.5">الإجمالي</div><div className="font-black text-emerald-700">{b.totalPrice.toLocaleString("ar-SA")} ر.س</div></div>
              </div>
              {b.status === "pending" && (
                <div className="flex gap-2 mb-3">
                  <button onClick={() => changeStatus(b._id, "confirmed")} className="flex-1 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-200 transition-colors">
                    تأكيد الحجز
                  </button>
                  <button onClick={() => changeStatus(b._id, "cancelled")} className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
                    إلغاء
                  </button>
                </div>
              )}
              <div className="flex gap-2 mt-2 mb-1">
                <button
                  onClick={() => navigate({ name: "booking-detail", bookingId: b._id })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors border border-blue-100"
                >
                  <FileText className="w-3.5 h-3.5" />
                  التذكرة الإلكترونية
                </button>
                {b.packageId && (
                  <button
                    onClick={() => navigate({ name: "passenger-manifest", packageId: b.packageId })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition-colors border border-purple-100"
                  >
                    <Users className="w-3.5 h-3.5" />
                    كشف الركاب
                  </button>
                )}
              </div>
              {(b.status === "confirmed" || b.status === "completed") && (
                <AssignDriverCard booking={b} officeId={officeId} />
              )}
              <WhatsAppCard booking={b} officeId={officeId} />
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── مكوّن تعيين السائق للرحلة بالكامل (مجمّع) ── */
function GroupAssignDriverCard({ bookings, officeId, packageTitle }: { bookings: any[]; officeId: any; packageTitle: string }) {
  const drivers       = useQuery(api.drivers.getByOffice);
  const buses         = useQuery(api.buses.getByOffice);
  const createAndLink = useMutation(api.trips.createAndLinkToBooking);
  const assignDriver  = useMutation(api.trips.assignDriver);
  const assignBus     = useMutation(api.trips.assignBus);

  const [open, setOpen]                         = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedBusId, setSelectedBusId]       = useState<string>("");
  const [mode, setMode]                         = useState<"driver" | "bus">("driver");
  const [loading, setLoading]                   = useState(false);
  const [done, setDone]                         = useState(false);

  // هل هناك رحلة مشتركة بالفعل؟
  const existingTripId = bookings.find((b) => b.tripId)?.tripId ?? null;
  // السائق المعيّن حالياً (من أول حجز مرتبط برحلة)
  const currentDriverId = bookings.find((b) => b.tripId)?.trip?.driverId ?? null;

  const handleAssignAll = async () => {
    if (mode === "driver" && !selectedDriverId) { toast.error("اختر سائقاً أولاً"); return; }
    if (mode === "bus"    && !selectedBusId)    { toast.error("اختر حافلة أولاً");  return; }
    setLoading(true);
    try {
      const depDate = bookings[0]?.package?.departureDate ?? new Date().toISOString().split("T")[0];
      const pkgId   = bookings[0]?.packageId;

      let tripId = existingTripId;

      if (!tripId) {
        // أنشئ رحلة واحدة واربط أول حجز بها
        const result = await createAndLink({
          packageId:     pkgId,
          bookingId:     bookings[0]._id,
          busId:         selectedBusId ? selectedBusId as any : undefined,
          departureDate: depDate,
        });
        tripId = result.tripId;
      }

      // عيّن السائق على الرحلة
      if (selectedDriverId) {
        await assignDriver({ tripId, driverId: selectedDriverId as any });
      }
      if (selectedBusId && existingTripId) {
        await assignBus({ tripId, busId: selectedBusId as any });
      }

      setDone(true);
      setOpen(false);
      toast.success(`✅ تم تعيين السائق لجميع المعتمرين في "${packageTitle}" (${bookings.length} معتمر)`);
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const selectedDriver = drivers?.find((d: any) => d._id === selectedDriverId);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all w-full justify-center ${
          done || existingTripId
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
        }`}
      >
        <Bus className="w-4 h-4" />
        {done || existingTripId ? "✅ تم التعيين — تغيير السائق" : `تعيين سائق لـ ${bookings.length} معتمر دفعة واحدة`}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-indigo-50 rounded-2xl p-4 border border-indigo-100 space-y-3">
          {/* معلومة توضيحية */}
          <div className="bg-indigo-100 rounded-xl p-3 flex items-start gap-2">
            <Bus className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              بمجرد تعيين السائق، سيتم إرسال إشعار لجميع المعتمرين المؤكدين في هذا البرنامج ({bookings.length} معتمر) تلقائياً.
            </p>
          </div>

          {/* اختيار طريقة التعيين */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("driver")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mode === "driver" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              👤 من قائمة السائقين
            </button>
            <button
              onClick={() => setMode("bus")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mode === "bus" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              🚌 من قائمة الحافلات
            </button>
          </div>

          {/* قائمة السائقين */}
          {mode === "driver" && (
            <>
              <p className="text-xs font-bold text-gray-700">اختر السائق:</p>
              {!drivers ? (
                <div className="text-center py-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>
              ) : drivers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا يوجد سائقون مرتبطون بمكتبك بعد</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {drivers.map((drv: any) => (
                    <label
                      key={drv._id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedDriverId === drv._id
                          ? "border-indigo-500 bg-white shadow-sm"
                          : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="group-driver"
                        value={drv._id}
                        checked={selectedDriverId === drv._id}
                        onChange={() => setSelectedDriverId(drv._id)}
                        className="accent-indigo-600"
                      />
                      {drv.profileImageUrl ? (
                        <img src={drv.profileImageUrl} alt={drv.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-sm">{drv.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span dir="ltr">{drv.phone}</span>
                          {drv.plateNumber && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{drv.plateNumber}</span>}
                        </div>
                      </div>
                      {drv.isApproved && <span className="text-xs text-emerald-600 font-bold">✓ معتمد</span>}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {/* قائمة الحافلات */}
          {mode === "bus" && (
            <>
              <p className="text-xs font-bold text-gray-700">اختر الحافلة:</p>
              {!buses ? (
                <div className="text-center py-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>
              ) : buses.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">لا توجد حافلات مسجلة</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {buses.filter((b: any) => b.isActive !== false).map((bus: any) => (
                    <label
                      key={bus._id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedBusId === bus._id
                          ? "border-indigo-500 bg-white shadow-sm"
                          : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="group-bus"
                        value={bus._id}
                        checked={selectedBusId === bus._id}
                        onChange={() => setSelectedBusId(bus._id)}
                        className="accent-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-800 font-mono text-sm">{bus.plateNumber}</span>
                          <span className="text-xs text-gray-400">{bus.busType} • {bus.capacity} مقعد</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{bus.driverName}</span>
                          <span className="flex items-center gap-1 font-mono" dir="ltr"><Phone className="w-3 h-3" />{bus.driverPhone}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {/* زر التعيين الجماعي */}
          {(selectedDriverId || selectedBusId) && (
            <button
              onClick={handleAssignAll}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري التعيين...</>
                : <><Bus className="w-4 h-4" />تعيين السائق لجميع المعتمرين ({bookings.length})</>
              }
            </button>
          )}

          {/* إرسال واتساب للسائق */}
          {selectedDriver && (
            <button
              onClick={() => {
                const msg = `السلام عليكم ${selectedDriver.name} 🚌\n\nتم تعيينك لرحلة عمرة في المسار الذكي.\n\n📋 البرنامج: ${packageTitle}\n📅 تاريخ الانطلاق: ${bookings[0]?.package?.departureDate ?? ""}\n👥 عدد المعتمرين: ${bookings.length} معتمر\n\n✅ يرجى فتح تطبيق المسار الذكي وقبول الرحلة من لوحة السائق.\n\nالمسار الذكي للعمرة`;
                const phone = (selectedDriver.phone ?? "").replace(/\D/g, "");
                const intl = phone.startsWith("0") ? "966" + phone.slice(1) : phone;
                window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              إرسال رسالة واتساب للسائق
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── مركز إشعارات واتساب ── */
function WhatsAppCenterTab({ officeId }: { officeId: any }) {
  const stats   = useQuery(api.whatsapp.getOfficeStats, { officeId });
  const logs    = useQuery(api.whatsapp.getOfficeWhatsappLogs, { officeId, limit: 100 });
  const bookings = useQuery(api.bookings.officeBookings, { officeId });
  const [filterType, setFilterType] = useState("all");
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  const filteredLogs = (logs ?? []).filter((l: any) =>
    filterType === "all" ? true : l.messageType === filterType
  );

  const statCards = [
    { label: "إجمالي الإشعارات",    value: stats?.total ?? 0,     color: "green",  icon: MessageCircle },
    { label: "هذا الأسبوع",         value: stats?.thisWeek ?? 0,  color: "blue",   icon: Zap },
    { label: "تأكيدات الحجز",       value: stats?.byType?.confirmed ?? 0, color: "emerald", icon: CheckCheck },
    { label: "تذكيرات",             value: stats?.byType?.reminder ?? 0,  color: "amber",   icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-green-700" />
            </div>
            مركز إشعارات واتساب
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">إرسال وتتبع جميع رسائل واتساب للمعتمرين</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, icon: Icon }, i) => (
          <div key={i} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4`}>
            <div className={`w-8 h-8 rounded-xl bg-${color}-100 flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-700`} />
            </div>
            <div className={`text-2xl font-black text-${color}-800`}>{value}</div>
            <div className={`text-xs text-${color}-600 mt-0.5`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-600" />
          إرسال سريع لحجز
        </h3>
        {!bookings || bookings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">لا توجد حجوزات</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">اختر الحجز</label>
              <select
                value={activeBooking?._id ?? ""}
                onChange={(e) => {
                  const b = bookings.find((x: any) => x._id === e.target.value);
                  setActiveBooking(b ?? null);
                }}
                className={inp}
              >
                <option value="">— اختر حجزاً —</option>
                {bookings.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.bookingReference} — {b.leadPassengerName} ({b.leadPassengerPhone})
                  </option>
                ))}
              </select>
            </div>

            {activeBooking && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-black text-sm flex-shrink-0">
                    {activeBooking.leadPassengerName?.charAt(0) ?? "؟"}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{activeBooking.leadPassengerName}</div>
                    <div className="text-xs text-gray-500">{activeBooking.leadPassengerPhone} • {activeBooking.bookingReference}</div>
                  </div>
                  <span className={`mr-auto px-2.5 py-1 rounded-full text-xs font-bold ${STATUS[activeBooking.status]?.cls ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS[activeBooking.status]?.label ?? activeBooking.status}
                  </span>
                </div>
                <WhatsAppQuickSend booking={activeBooking} officeId={officeId} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            سجل الإشعارات المرسلة
            <span className="text-xs text-gray-400 font-normal">({filteredLogs.length})</span>
          </h3>
          <div className="flex gap-2 flex-wrap">
            {["all", ...Object.keys(TEMPLATE_LABELS)].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterType === type
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type === "all" ? `الكل (${logs?.length ?? 0})` : TEMPLATE_LABELS[type]?.label}
              </button>
            ))}
          </div>
        </div>

        {logs === undefined ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لم يُرسل أي إشعار بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredLogs.map((log: any) => {
              const tpl = TEMPLATE_LABELS[log.messageType] ?? { label: log.messageType, color: "gray", icon: Bell };
              const TplIcon = tpl.icon;
              return (
                <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-${tpl.color}-100 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <TplIcon className={`w-4 h-4 text-${tpl.color}-700`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-sm">{log.passengerName}</span>
                          <span className={`text-xs font-bold text-${tpl.color}-700 bg-${tpl.color}-50 px-2 py-0.5 rounded-full`}>
                            {tpl.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(log.sentAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {log.phone}
                        </span>
                        <span className="font-mono text-emerald-600">{log.bookingReference}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">{log.messageText}</p>
                    </div>
                    <a
                      href={`https://wa.me/${log.phone}?text=${encodeURIComponent(log.messageText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── إرسال سريع مدمج ── */
function WhatsAppQuickSend({ booking, officeId }: { booking: any; officeId: any }) {
  const [template, setTemplate] = useState<keyof typeof WA_TEMPLATES>("confirmed");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);
  const logNotification = useMutation(api.whatsapp.logNotification);

  const buildMessage = () => {
    const name  = booking.leadPassengerName ?? "";
    const ref   = booking.bookingReference ?? "";
    const pkg   = booking.package?.title ?? "";
    const price = booking.totalPrice?.toLocaleString("ar-SA") ?? "";
    if (template === "custom") return customMsg;
    return WA_TEMPLATES[template](name, ref, pkg, price);
  };

  const phone = (booking.leadPassengerPhone ?? "").replace(/\D/g, "");
  const intlPhone = phone.startsWith("0") ? "966" + phone.slice(1) : phone;

  const handleSend = async () => {
    const msg = buildMessage();
    if (!msg.trim()) { toast.error("الرسالة فارغة"); return; }
    if (!intlPhone) { toast.error("رقم الجوال غير متوفر"); return; }
    setSending(true);
    try {
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      await logNotification({ bookingId: booking._id, phone: intlPhone, messageType: template, messageText: msg });
      toast.success("تم فتح واتساب وتسجيل الإشعار ✅");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TEMPLATE_LABELS) as Array<keyof typeof TEMPLATE_LABELS>).map((key) => {
          const { label, color, icon: Icon } = TEMPLATE_LABELS[key];
          const active = template === key;
          return (
            <button
              key={key}
              onClick={() => setTemplate(key as keyof typeof WA_TEMPLATES)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                active ? `bg-${color}-600 text-white shadow-sm` : `bg-white text-${color}-700 border border-${color}-200 hover:bg-${color}-50`
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <textarea
          value={template === "custom" ? customMsg : buildMessage()}
          onChange={(e) => { if (template === "custom") setCustomMsg(e.target.value); }}
          readOnly={template !== "custom"}
          rows={5}
          className={`w-full text-xs rounded-xl border p-3 resize-none font-mono leading-relaxed ${
            template === "custom"
              ? "bg-white border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              : "bg-white/70 border-green-200 text-gray-700 cursor-default"
          }`}
          dir="rtl"
        />
        <button
          onClick={() => { navigator.clipboard.writeText(buildMessage()); toast.success("تم النسخ"); }}
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-500 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {sending ? "جاري الفتح..." : `إرسال إلى ${intlPhone || "—"}`}
      </button>
    </div>
  );
}

/* ── Add Package form ── */
function AddPackageForm({ officeId, onSuccess }: { officeId: any; onSuccess: () => void }) {
  const createPkg = useMutation(api.packages.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", duration: 10, price: 0, originalPrice: "",
    departureCity: "الرياض", departureDate: "", returnDate: "",
    availableSeats: 20, totalSeats: 20,
    hotelMecca: "", hotelMadinah: "", hotelStars: 3,
    packageType: "economy",
    includes: "تذاكر الطيران\nالفندق\nالمواصلات",
    excludes: "المصروف الشخصي",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPkg({
        officeId,
        title: form.title,
        description: form.description,
        duration: Number(form.duration),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        departureCity: form.departureCity,
        departureDate: form.departureDate,
        returnDate: form.returnDate,
        availableSeats: Number(form.availableSeats),
        totalSeats: Number(form.totalSeats),
        includes: form.includes.split("\n").filter(Boolean),
        excludes: form.excludes ? form.excludes.split("\n").filter(Boolean) : undefined,
        hotelMecca: form.hotelMecca,
        hotelMadinah: form.hotelMadinah || undefined,
        hotelStars: Number(form.hotelStars),
        packageType: form.packageType,
      });
      toast.success("تم إضافة البرنامج بنجاح");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <h2 className="text-xl font-black text-gray-800 mb-6">إضافة برنامج جديد</h2>
      <div className="space-y-4">
        <FormRow label="عنوان البرنامج *">
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={inp} placeholder="مثال: برنامج العمرة الاقتصادي 10 أيام" />
        </FormRow>
        <FormRow label="وصف البرنامج *">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required rows={3} className={`${inp} resize-none`} placeholder="وصف تفصيلي للبرنامج..." />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="نوع البرنامج">
            <select value={form.packageType} onChange={(e) => set("packageType", e.target.value)} className={inp}>
              <option value="economy">اقتصادي</option>
              <option value="luxury">فاخر</option>
              <option value="ramadan">رمضان</option>
              <option value="family">عائلي</option>
            </select>
          </FormRow>
          <FormRow label="مدينة الانطلاق">
            <select value={form.departureCity} onChange={(e) => set("departureCity", e.target.value)} className={inp}>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="السعر (ر.س) *">
            <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required min={0} className={inp} />
          </FormRow>
          <FormRow label="السعر الأصلي (اختياري)">
            <input type="number" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} min={0} className={inp} placeholder="للخصم" />
          </FormRow>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormRow label="المدة (أيام) *">
            <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} required min={1} className={inp} />
          </FormRow>
          <FormRow label="المقاعد المتاحة *">
            <input type="number" value={form.availableSeats} onChange={(e) => set("availableSeats", e.target.value)} required min={1} className={inp} />
          </FormRow>
          <FormRow label="إجمالي المقاعد *">
            <input type="number" value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)} required min={1} className={inp} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="تاريخ الانطلاق *">
            <input type="date" value={form.departureDate} onChange={(e) => set("departureDate", e.target.value)} required className={inp} />
          </FormRow>
          <FormRow label="تاريخ العودة *">
            <input type="date" value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} required className={inp} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="فندق مكة *">
            <input value={form.hotelMecca} onChange={(e) => set("hotelMecca", e.target.value)} required className={inp} placeholder="اسم الفندق" />
          </FormRow>
          <FormRow label="فندق المدينة">
            <input value={form.hotelMadinah} onChange={(e) => set("hotelMadinah", e.target.value)} className={inp} placeholder="اختياري" />
          </FormRow>
        </div>
        <FormRow label="تصنيف الفندق (نجوم)">
          <select value={form.hotelStars} onChange={(e) => set("hotelStars", e.target.value)} className={inp}>
            {[3,4,5].map((s) => <option key={s} value={s}>{s} نجوم</option>)}
          </select>
        </FormRow>
        <FormRow label="ما يشمله البرنامج (سطر لكل بند)">
          <textarea value={form.includes} onChange={(e) => set("includes", e.target.value)} rows={4} className={`${inp} resize-none`} />
        </FormRow>
        <FormRow label="ما لا يشمله البرنامج (سطر لكل بند)">
          <textarea value={form.excludes} onChange={(e) => set("excludes", e.target.value)} rows={3} className={`${inp} resize-none`} />
        </FormRow>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
        >
          {loading ? "جاري الإضافة..." : "إضافة البرنامج"}
        </button>
      </div>
    </form>
  );
}

/* ── Create Office form ── */
function CreateOfficeForm() {
  const create  = useMutation(api.offices.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", city: "الرياض", phone: "", email: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await create(form);
      toast.success("تم إنشاء المكتب بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">تسجيل مكتبك</h1>
          <p className="text-gray-500 text-sm mt-1">أضف مكتبك وابدأ في نشر برامج العمرة</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <FormRow label="اسم المكتب *">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inp} placeholder="مثال: مكتب النور للسياحة" />
          </FormRow>
          <FormRow label="وصف المكتب *">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required rows={3} className={`${inp} resize-none`} />
          </FormRow>
          <FormRow label="المدينة">
            <select value={form.city} onChange={(e) => set("city", e.target.value)} className={inp}>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="رقم الهاتف *">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required className={inp} placeholder="0112345678" />
          </FormRow>
          <FormRow label="البريد الإلكتروني *">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={inp} placeholder="office@example.com" />
          </FormRow>
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50" style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}>
            {loading ? "جاري التسجيل..." : "تسجيل المكتب"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Statements Tab ── */
function StatementsTab({ officeId, officeName }: { officeId: any; officeName: string }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const fromTs = dateFrom ? new Date(dateFrom).getTime() : undefined;
  const toTs   = dateTo   ? new Date(dateTo + "T23:59:59").getTime() : undefined;

  const data = useQuery(api.commissions.officeStatement, { officeId, dateFrom: fromTs, dateTo: toTs });

  const handlePrint = () => {
    if (!data) return;
    const { rows = [], summary } = data;
    const periodText = dateFrom || dateTo
      ? `الفترة: ${dateFrom || "—"} إلى ${dateTo || "—"}`
      : `جميع الفترات • ${new Date().toLocaleDateString("ar-SA")}`;
    const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const STATUS_PRINT: Record<string, { label: string; bg: string; color: string }> = {
      pending:   { label: "قيد المراجعة", bg: "#fef3c7", color: "#92400e" },
      confirmed: { label: "مؤكد",         bg: "#d1fae5", color: "#065f46" },
      cancelled: { label: "ملغي",         bg: "#fee2e2", color: "#dc2626" },
      completed: { label: "مكتمل",        bg: "#dbeafe", color: "#1d4ed8" },
    };

    const tableRows = rows.map((row: any, i: number) => {
      const bs = STATUS_PRINT[row.bookingStatus] ?? { label: row.bookingStatus, bg: "#f3f4f6", color: "#374151" };
      return `<tr>
        <td style="font-family:monospace;color:#059669;font-weight:900;font-size:10px">${row.bookingRef}</td>
        <td style="color:#6b7280;font-size:10px">${new Date(row.bookingDate).toLocaleDateString("ar-SA")}</td>
        <td style="font-weight:700">${row.passengerName}</td>
        <td style="color:#6b7280;font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${row.packageTitle}</td>
        <td style="font-weight:700;text-align:center">${row.bookingAmount.toLocaleString("ar-SA")} <span style="color:#9ca3af;font-size:9px">ر.س</span></td>
        <td style="color:#92400e;font-weight:700;text-align:center">${row.commissionAmount > 0 ? `${row.commissionAmount.toLocaleString("ar-SA")} <span style="color:#9ca3af;font-size:9px">ر.س (${row.commissionRate}%)</span>` : "<span style='color:#d1d5db'>—</span>"}</td>
        <td style="color:#065f46;font-weight:900;text-align:center">${row.netAmount.toLocaleString("ar-SA")} <span style="color:#9ca3af;font-size:9px">ر.س</span></td>
        <td style="text-align:center"><span style="background:${bs.bg};color:${bs.color};padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700">${bs.label}</span></td>
      </tr>`;
    }).join("");

    const summarySection = summary ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
        <div style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:900">${summary.totalRows}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:2px">إجمالي الحجوزات</div>
        </div>
        <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:900">${summary.totalBookingAmount.toLocaleString("ar-SA")}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:2px">إجمالي المبيعات (ر.س)</div>
        </div>
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:900">${summary.totalCommission.toLocaleString("ar-SA")}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:2px">إجمالي العمولات (ر.س)</div>
        </div>
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:900">${summary.totalNet.toLocaleString("ar-SA")}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:2px">صافي الربح (ر.س)</div>
        </div>
      </div>
      <div style="background:linear-gradient(135deg,#065f46,#047857);color:#fff;border-radius:10px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:10px;color:#a7f3d0;margin-bottom:4px">صافي ربحك بعد خصم العمولة</div>
          <div style="font-size:26px;font-weight:900">${summary.totalNet.toLocaleString("ar-SA")} <span style="font-size:16px;color:#6ee7b7">ر.س</span></div>
          <div style="font-size:10px;color:#a7f3d0;margin-top:6px">مكتملة: ${summary.completedCount} • مؤكدة: ${summary.confirmedCount} • عمولة مسوّاة: ${summary.settledNet.toLocaleString("ar-SA")} ر.س</div>
        </div>
      </div>` : "";

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>كشف حساب — ${officeName}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  @page{size:A4 landscape;margin:8mm 12mm;}
  html,body{width:100%;font-family:'Tajawal',Arial,sans-serif;font-size:11px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .wrap{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;}
  .hdr{background:linear-gradient(135deg,#065f46,#047857,#0f766e);color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;}
  .hdr-logo{height:40px;object-fit:contain;opacity:.9;mix-blend-mode:screen;}
  .hdr-brand{font-size:16px;font-weight:900;}
  .hdr-sub{font-size:9px;color:#a7f3d0;margin-top:2px;}
  .hdr-doc-title{font-size:14px;font-weight:900;text-align:left;}
  .hdr-doc-office{font-size:11px;color:#a7f3d0;text-align:left;margin-top:2px;}
  .hdr-doc-period{font-size:9px;color:#6ee7b7;text-align:left;margin-top:2px;}
  .body{padding:14px 18px;}
  table{width:100%;border-collapse:collapse;}
  thead tr{background:linear-gradient(90deg,#065f46,#047857);color:#fff;}
  th{padding:6px 8px;text-align:right;font-size:9px;font-weight:700;white-space:nowrap;}
  td{padding:5px 8px;font-size:10px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:middle;}
  tr:nth-child(even) td{background:#f9fafb;}
  tfoot td{background:#ecfdf5;border-top:2px solid #6ee7b7;font-weight:900;font-size:10px;}
  .footer{padding:8px 18px;border-top:1px dashed #e5e7eb;display:flex;justify-content:space-between;font-size:8px;color:#9ca3af;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <img src="${LOGO_URL}" class="hdr-logo" alt="المسار الذكي"/>
      <div>
        <div class="hdr-brand">المسار الذكي</div>
        <div class="hdr-sub">منصة حجز العمرة الذكية</div>
      </div>
    </div>
    <div>
      <div class="hdr-doc-title">كشف الحساب</div>
      <div class="hdr-doc-office">${officeName}</div>
      <div class="hdr-doc-period">${periodText}</div>
    </div>
  </div>
  <div class="body">
    ${summarySection}
    <table>
      <thead>
        <tr>
          <th>رقم الحجز</th><th>التاريخ</th><th>المسافر</th><th>البرنامج</th>
          <th style="text-align:center">إجمالي الحجز</th><th style="text-align:center">العمولة</th>
          <th style="text-align:center">صافي الربح</th><th style="text-align:center">الحالة</th>
        </tr>
      </thead>
      <tbody>${tableRows || `<tr><td colspan="8" style="text-align:center;padding:20px;color:#9ca3af">لا توجد بيانات</td></tr>`}</tbody>
      ${summary ? `<tfoot><tr>
        <td colspan="4" style="font-weight:900;color:#065f46">الإجمالي (${summary.totalRows} حجز)</td>
        <td style="text-align:center;font-weight:900">${summary.totalBookingAmount.toLocaleString("ar-SA")} ر.س</td>
        <td style="text-align:center;color:#92400e;font-weight:900">${summary.totalCommission.toLocaleString("ar-SA")} ر.س</td>
        <td style="text-align:center;color:#065f46;font-weight:900">${summary.totalNet.toLocaleString("ar-SA")} ر.س</td>
        <td></td>
      </tr></tfoot>` : ""}
    </table>
  </div>
  <div class="footer">
    <span>🕋 المسار الذكي للعمرة — وثيقة رسمية</span>
    <span>تاريخ الطباعة: ${printDate}</span>
    <span>جميع الحقوق محفوظة ©</span>
  </div>
</div>
</body>
</html>`;

    void printHtml(html, { width: "297mm", height: "210mm" });
    return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 2000);
    }, 800);
  };

  const clearFilters = () => { setDateFrom(""); setDateTo(""); };

  const COMM_STATUS: Record<string, { label: string; cls: string }> = {
    pending:       { label: "معلقة",   cls: "badge" },
    settled:       { label: "مسوّاة",  cls: "badge" },
    cancelled:     { label: "ملغية",   cls: "badge" },
    no_commission: { label: "—",       cls: "" },
  };

  if (data === undefined) return <Spinner />;

  const { rows = [], summary } = data ?? { rows: [], summary: null };
  const splitVat = (amount: number, rate = 15) => {
    const taxableAmount = Math.round((amount || 0) / (1 + rate / 100));
    return { taxableAmount, vatAmount: Math.max(0, Math.round((amount || 0) - taxableAmount)) };
  };
  const bookingGross = (row: any) => row.pilgrimTotalAmount ?? row.officeBaseAmount ?? row.bookingAmount ?? 0;
  const bookingPassengerCount = (row: any) => Math.max(1, Number(row.passengerCount ?? row.adultsCount ?? 1));
  const bookingPassengers = (row: any) => {
    const adults = Math.max(1, Number(row.adultsCount ?? 1));
    const children = Math.max(0, Number(row.childrenCount ?? 0));
    const total = Math.max(1, adults + children);
    const share = Math.round(bookingGross(row) / total);
    const passengers = [
      {
        name: row.passengerName,
        type: "بالغ",
        phone: row.passengerPhone ?? "—",
        idNumber: row.passengerIdNumber ?? "—",
        amount: share,
        note: "المعتمر الرئيسي",
      },
    ];
    for (let i = 2; i <= adults; i += 1) {
      passengers.push({ name: `معتمر بالغ ${i}`, type: "بالغ", phone: "—", idNumber: "—", amount: share, note: "ضمن نفس رقم الحجز" });
    }
    for (let i = 1; i <= children; i += 1) {
      passengers.push({ name: `طفل ${i}`, type: "طفل", phone: "—", idNumber: "—", amount: share, note: "ضمن نفس رقم الحجز" });
    }
    return passengers.slice(0, total);
  };
  const totalOfficeVatFallback = rows.reduce((sum: number, row: any) => {
    const gross = row.pilgrimTotalAmount ?? row.officeBaseAmount ?? row.bookingAmount ?? 0;
    return sum + splitVat(gross, row.taxRate ?? 15).vatAmount;
  }, 0);

  const handleOfficeTaxInvoice = (row: any) => {
    const gross = bookingGross(row);
    const tax = splitVat(gross, row.taxRate ?? 15);
    void printTaxInvoice({
      invoiceNo: row.officeInvoiceNo ?? `OFF-TAX-${row.bookingRef}`,
      title: "فاتورة ضريبية - خدمة المكتب",
      seller: { name: officeName, commercialRegister: row.officeCommercialRegister, city: "السعودية" },
      buyer: { name: row.passengerName, city: "السعودية" },
      bookingRef: row.bookingRef,
      passengerName: row.passengerName,
      passengerCount: row.passengerCount ?? row.adultsCount,
      packageTitle: row.packageTitle,
      invoiceDate: row.bookingDate,
      description: "إجمالي قيمة الحجز الكامل حسب رقم الحجز وعدد الركاب",
      grossAmount: gross,
      taxableAmount: tax.taxableAmount,
      vatAmount: tax.vatAmount,
      vatRate: row.taxRate ?? 15,
      notes: "هذه الفاتورة الضريبية مرتبطة بكشف حساب المكتب والحجز الموضح أعلاه.",
    });
  };
  const handlePassengerTaxInvoice = (row: any, passenger: any, index: number) => {
    const gross = passenger.amount ?? Math.round(bookingGross(row) / bookingPassengerCount(row));
    const tax = splitVat(gross, row.taxRate ?? 15);
    void printTaxInvoice({
      invoiceNo: `${row.officeInvoiceNo ?? `OFF-TAX-${row.bookingRef}`}-P${index + 1}`,
      title: "فاتورة ضريبية منفصلة - معتمر",
      seller: { name: officeName, commercialRegister: row.officeCommercialRegister, city: "السعودية" },
      buyer: { name: passenger.name, city: "السعودية" },
      bookingRef: row.bookingRef,
      passengerName: passenger.name,
      passengerCount: 1,
      packageTitle: row.packageTitle,
      invoiceDate: row.bookingDate,
      description: `حصة ${passenger.name} من إجمالي الحجز رقم ${row.bookingRef}`,
      grossAmount: gross,
      taxableAmount: tax.taxableAmount,
      vatAmount: tax.vatAmount,
      vatRate: row.taxRate ?? 15,
      notes: "فاتورة منفصلة للمعتمر داخل نفس رقم الحجز، مع إمكانية طباعة فاتورة مجمعة للحجز بالكامل.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            كشف الحساب
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">إيراداتك بعد خصم عمولة المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              showFilters ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            فلترة
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 text-sm">فلترة حسب التاريخ</h3>
            {(dateFrom || dateTo) && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
                <X className="w-3.5 h-3.5" /> مسح الفلتر
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">من تاريخ</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">إلى تاريخ</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inp} />
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 rounded-2xl p-5 mb-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="شعار المسار الذكي" className="h-14 w-auto object-contain rounded-xl bg-white/10 p-1" style={{ mixBlendMode: "screen" }} />
            <div>
              <div className="text-white font-black text-lg leading-tight">المسار الذكي</div>
              <div className="text-emerald-300 text-xs mt-0.5">منصة حجز العمرة الذكية</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-white font-black text-base">كشف الحساب</div>
            <div className="text-emerald-300 text-sm font-semibold mt-0.5">{officeName}</div>
            <div className="text-emerald-400 text-xs mt-1">
              {dateFrom || dateTo
                ? `الفترة: ${dateFrom || "—"} إلى ${dateTo || "—"}`
                : `جميع الفترات • ${new Date().toLocaleDateString("ar-SA")}`}
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { val: summary.totalRows,                                          lbl: "إجمالي الحجوزات",  from: "from-emerald-500", to: "to-emerald-700" },
              { val: summary.totalBookingAmount.toLocaleString("ar-SA") + " ر.س", lbl: "إجمالي المبيعات", from: "from-blue-500",    to: "to-blue-700" },
              { val: summary.totalCommission.toLocaleString("ar-SA") + " ر.س",   lbl: "إجمالي العمولات", from: "from-amber-500",   to: "to-amber-700" },
              { val: summary.totalNet.toLocaleString("ar-SA") + " ر.س",          lbl: "صافي الربح",      from: "from-purple-500",  to: "to-purple-700" },
              { val: totalOfficeVatFallback.toLocaleString("ar-SA") + " ر.س", lbl: "ضريبة فواتير المكتب", from: "from-slate-500", to: "to-slate-700" },
            ].map(({ val, lbl, from, to }, i) => (
              <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
                <div className="text-xl font-black leading-tight">{val}</div>
                <div className="text-white/75 text-xs mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 rounded-2xl p-6 text-white mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-emerald-200 text-sm font-semibold mb-1">صافي ربحك بعد خصم العمولة</p>
                <div className="text-4xl font-black">
                  {summary.totalNet.toLocaleString("ar-SA")}
                  <span className="text-2xl text-emerald-300 mr-1">ر.س</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                  <span className="text-emerald-200">مكتملة: <span className="font-bold text-white">{summary.completedCount}</span></span>
                  <span className="text-blue-300">مؤكدة: <span className="font-bold text-blue-200">{summary.confirmedCount}</span></span>
                  <span className="text-amber-300">عمولة مسوّاة: <span className="font-bold text-amber-200">{summary.settledNet.toLocaleString("ar-SA")} ر.س</span></span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">لا توجد بيانات للفترة المحددة</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-l from-emerald-900 to-emerald-700 text-white">
                    {["رقم الحجز", "التاريخ", "المسافر", "البرنامج", "إجمالي الحجز", "العمولة", "صافي الربح", "الحالة", "الفاتورة"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-right whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const bs = STATUS[row.bookingStatus] ?? { label: row.bookingStatus, cls: "bg-gray-100 text-gray-600" };
                    const isExpanded = expandedBookingId === row.bookingId;
                    const passengers = bookingPassengers(row);
                    return (
                      <Fragment key={row.bookingId}>
                      <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 text-xs font-mono text-emerald-700 font-bold whitespace-nowrap">
                          <button onClick={() => setExpandedBookingId(isExpanded ? null : row.bookingId)} className="underline decoration-dotted underline-offset-4 hover:text-emerald-900">
                            {row.bookingRef}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(row.bookingDate).toLocaleDateString("ar-SA")}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                          <div>{row.passengerName}</div>
                          <div className="text-xs text-gray-400 font-normal">{row.passengerCount ?? row.adultsCount} راكب داخل الحجز</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{row.packageTitle}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800 whitespace-nowrap">
                          {row.bookingAmount.toLocaleString("ar-SA")} <span className="text-xs text-gray-400">ر.س</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-amber-700 whitespace-nowrap">
                          {row.commissionAmount > 0
                            ? <>{row.commissionAmount.toLocaleString("ar-SA")} <span className="text-xs text-gray-400">ر.س ({row.commissionRate}%)</span></>
                            : <span className="text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-emerald-700 whitespace-nowrap">
                          {row.netAmount.toLocaleString("ar-SA")} <span className="text-xs text-gray-400">ر.س</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${bs.cls}`}>{bs.label}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleOfficeTaxInvoice(row)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100"
                          >
                            فاتورة ضريبية
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-emerald-50/40">
                          <td colSpan={9} className="px-5 py-4">
                            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <div>
                                  <div className="font-black text-gray-800 text-sm">تفاصيل المعتمرين داخل الحجز {row.bookingRef}</div>
                                  <div className="text-xs text-gray-400 mt-1">عدد المعتمرين: {bookingPassengerCount(row)} - إجمالي الحجز: {bookingGross(row).toLocaleString("ar-SA")} ر.س</div>
                                </div>
                                <button onClick={() => handleOfficeTaxInvoice(row)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                                  طباعة فاتورة مجمعة
                                </button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-50 text-gray-500">
                                      <th className="px-3 py-2 text-right">#</th>
                                      <th className="px-3 py-2 text-right">الاسم</th>
                                      <th className="px-3 py-2 text-right">النوع</th>
                                      <th className="px-3 py-2 text-right">الجوال</th>
                                      <th className="px-3 py-2 text-right">الهوية</th>
                                      <th className="px-3 py-2 text-right">الحصة التقديرية</th>
                                      <th className="px-3 py-2 text-right">ملاحظة</th>
                                      <th className="px-3 py-2 text-right">طباعة</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {passengers.map((p, pIndex) => (
                                      <tr key={`${row.bookingId}-${pIndex}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-400">{pIndex + 1}</td>
                                        <td className="px-3 py-2 font-bold text-gray-800">{p.name}</td>
                                        <td className="px-3 py-2 text-gray-600">{p.type}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.phone}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.idNumber}</td>
                                        <td className="px-3 py-2 font-bold text-gray-800">{p.amount.toLocaleString("ar-SA")} ر.س</td>
                                        <td className="px-3 py-2 text-gray-400">{p.note}</td>
                                        <td className="px-3 py-2">
                                          <button onClick={() => handlePassengerTaxInvoice(row, p, pIndex)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">
                                            فاتورة منفصلة
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
                {summary && (
                  <tfoot>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                      <td colSpan={4} className="px-4 py-3 text-sm font-black text-emerald-800">الإجمالي ({summary.totalRows} حجز)</td>
                      <td className="px-4 py-3 text-sm font-black text-gray-800">{summary.totalBookingAmount.toLocaleString("ar-SA")} ر.س</td>
                      <td className="px-4 py-3 text-sm font-black text-amber-700">{summary.totalCommission.toLocaleString("ar-SA")} ر.س</td>
                      <td className="px-4 py-3 text-sm font-black text-emerald-700">{summary.totalNet.toLocaleString("ar-SA")} ر.س</td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// تبويب سجل الإيميل في لوحة المكتب
// ══════════════════════════════════════════════════════════
const EMAIL_TYPE_LABELS: Record<string, { label: string; color: string; Icon: any }> = {
  otp:               { label: "رمز التحقق OTP",    color: "bg-purple-100 text-purple-700",  Icon: Key },
  booking_confirmed: { label: "تأكيد الحجز",       color: "bg-emerald-100 text-emerald-700", Icon: CheckCheck },
  booking_cancelled: { label: "إلغاء الحجز",       color: "bg-red-100 text-red-600",         Icon: XCircle },
  payment_confirmed: { label: "تأكيد الدفع",       color: "bg-blue-100 text-blue-700",       Icon: CheckCircle },
  password_reset:    { label: "إعادة كلمة المرور", color: "bg-amber-100 text-amber-700",     Icon: ShieldCheck },
  ticket:            { label: "تذكرة الحجز",       color: "bg-teal-100 text-teal-700",       Icon: Mail },
  welcome:           { label: "ترحيب",              color: "bg-green-100 text-green-700",     Icon: CheckCircle },
  trip_reminder:     { label: "تذكير الرحلة",      color: "bg-orange-100 text-orange-700",   Icon: Bell },
};

const EMAIL_STATUS_MAP: Record<string, { label: string; cls: string; Icon: any }> = {
  sent:    { label: "تم الإرسال", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCheck },
  failed:  { label: "فشل",        cls: "bg-red-100 text-red-600",         Icon: XCircle },
  pending: { label: "معلق",       cls: "bg-amber-100 text-amber-700",     Icon: Clock },
};

function OfficeEmailTab({ officeId }: { officeId: Id<"offices"> }) {
  const stats      = useQuery(api.email.getOfficeEmailStats, { officeId });
  const logs       = useQuery(api.email.getOfficeLogs, { officeId, limit: 100 });
  const resendTicket = useAction(api.emailActions.resendTicket);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (bookingId: Id<"bookings">, bookingRef: string) => {
    setResendingId(bookingId);
    try {
      const result = await resendTicket({ bookingId });
      if (result.success) {
        toast.success(`✅ تم إعادة إرسال تذكرة ${bookingRef}`);
      } else {
        toast.error(result.error ?? "فشل إعادة الإرسال");
      }
    } catch {
      toast.error("فشل إعادة إرسال التذكرة");
    } finally {
      setResendingId(null);
    }
  };

  if (stats === undefined || logs === undefined) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black">سجل إيميلات عملائك</h2>
            <p className="text-blue-200 text-sm">جميع الإيميلات المرسلة لمعتمري مكتبك</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "إجمالي المرسل",  value: stats.total,            bg: "bg-white/10" },
              { label: "تم بنجاح",        value: stats.sent,             bg: "bg-emerald-500/30" },
              { label: "فشل الإرسال",     value: stats.failed,           bg: "bg-red-500/30" },
              { label: "نسبة النجاح",     value: `${stats.successRate}%`, bg: "bg-blue-500/30" },
            ].map(({ label, value, bg }, i) => (
              <div key={i} className={`${bg} rounded-xl p-3 text-center`}>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-white/70 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && Object.keys(stats.byType).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            توزيع الإيميلات حسب النوع
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(stats.byType).map(([type, count]) => {
              const info = EMAIL_TYPE_LABELS[type] ?? { label: type, color: "bg-gray-100 text-gray-600", Icon: Mail };
              return (
                <div key={type} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${info.color}`}>
                  <info.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-semibold truncate">{info.label}</span>
                  <span className="font-black text-sm mr-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            سجل الإيميلات ({logs.length})
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-blue-200" />
            </div>
            <p className="text-gray-500 font-semibold">لا توجد سجلات إيميل بعد</p>
            <p className="text-gray-300 text-sm mt-1">ستظهر هنا عند تأكيد أول حجز</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-l from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">البريد المستلم</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">نوع الإيميل</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">رقم الحجز</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: any, i: number) => {
                  const typeInfo   = EMAIL_TYPE_LABELS[log.emailType] ?? { label: log.emailType, color: "bg-gray-100 text-gray-600", Icon: Mail };
                  const statusInfo = EMAIL_STATUS_MAP[log.status] ?? { label: log.status, cls: "bg-gray-100 text-gray-600", Icon: Clock };
                  const canResend  = log.bookingId && (log.emailType === "ticket" || log.emailType === "booking_confirmed");
                  return (
                    <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700">{log.recipientEmail}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${typeInfo.color}`}>
                          <typeInfo.Icon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.bookingRef ? (
                          <span className="font-mono text-xs text-emerald-700 font-bold">{log.bookingRef}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.cls}`}>
                          <statusInfo.Icon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log._creationTime).toLocaleString("ar-SA", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {canResend ? (
                          <button
                            onClick={() => handleResend(log.bookingId, log.bookingRef ?? "")}
                            disabled={resendingId === log.bookingId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {resendingId === log.bookingId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            إعادة إرسال
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats && stats.total === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">لا توجد سجلات إيميل بعد</h4>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              ستظهر الإيميلات هنا تلقائياً عند تأكيد الحجوزات وإرسال التذاكر للمعتمرين.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   تبويب التقييمات في لوحة المكتب
══════════════════════════════════════════════════════════ */
function OfficeReviewsTab({ officeId }: { officeId: any }) {
  const reviews = useQuery(api.reviews.getByOffice, { officeId });
  const [filterStars, setFilterStars] = useState<number | null>(null);

  if (reviews === undefined) return <Spinner />;

  const filtered = filterStars
    ? reviews.filter((r: any) => r.rating === filterStars)
    : reviews;

  const avg =
    reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      : 0;

  // توزيع النجوم
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? Math.round(
            (reviews.filter((r: any) => r.rating === star).length /
              reviews.length) *
              100
          )
        : 0,
  }));

  const starColor = (n: number) =>
    n >= 4 ? "text-amber-400" : n === 3 ? "text-amber-300" : "text-gray-300";

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div>
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber-600" />
          </div>
          تقييمات مكتبك
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          آراء المعتمرين في برامجك وخدماتك
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-amber-200" />
          </div>
          <h3 className="text-gray-600 font-bold mb-1">لا توجد تقييمات بعد</h3>
          <p className="text-gray-400 text-sm">
            ستظهر هنا تقييمات المعتمرين بعد إكمال رحلاتهم
          </p>
        </div>
      ) : (
        <>
          {/* بطاقة الإحصائيات */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* المتوسط الكبير */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 min-w-[140px]">
                <div className="text-5xl font-black text-amber-600">
                  {avg.toFixed(1)}
                </div>
                <div className="flex gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= Math.round(avg)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-amber-600 font-semibold mt-1">
                  {reviews.length} تقييم
                </div>
              </div>

              {/* توزيع النجوم */}
              <div className="flex-1 space-y-2 w-full">
                {dist.map(({ star, count, pct }) => (
                  <button
                    key={star}
                    onClick={() =>
                      setFilterStars(filterStars === star ? null : star)
                    }
                    className={`w-full flex items-center gap-3 group transition-all rounded-xl px-2 py-1 ${
                      filterStars === star
                        ? "bg-amber-50 ring-1 ring-amber-300"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-16 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-700">
                        {star}
                      </span>
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-left flex-shrink-0">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filterStars && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  تصفية:{" "}
                  <span className="font-bold text-amber-600">
                    {filterStars} نجوم
                  </span>
                </span>
                <button
                  onClick={() => setFilterStars(null)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> إلغاء التصفية
                </button>
              </div>
            )}
          </div>

          {/* قائمة التقييمات */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">
                  لا توجد تقييمات بهذا التصنيف
                </p>
              </div>
            ) : (
              filtered.map((review: any) => (
                <div
                  key={review._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* أفاتار المستخدم */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {(review.userName ?? "م").charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">
                          {review.userName ?? "معتمر"}
                        </div>
                        {review.packageTitle && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {review.packageTitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* النجوم */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review._creationTime).toLocaleDateString(
                          "ar-SA",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                      {review.comment}
                    </p>
                  )}

                  {/* تقييمات فرعية */}
                  {(review.serviceRating ||
                    review.transportRating ||
                    review.hotelRating) && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {[
                        { label: "الخدمة", val: review.serviceRating },
                        { label: "المواصلات", val: review.transportRating },
                        { label: "الفندق", val: review.hotelRating },
                      ]
                        .filter((x) => x.val)
                        .map(({ label, val }) => (
                          <div
                            key={label}
                            className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-3 py-1.5"
                          >
                            <span className="text-xs text-gray-500">
                              {label}:
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= val
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-gray-200 fill-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-amber-700">
                              {val}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   تبويب إدارة الرحلات — مع تعيين السائق ومتابعة التتبع
══════════════════════════════════════════════════════════ */
function TripsManagementTab({ officeId, navigate }: { officeId: any; navigate: (p: Page) => void }) {
  const trips   = useQuery(api.trips.getByOffice);
  const drivers = useQuery(api.drivers.getByOffice);
  const assignDriver = useMutation(api.trips.assignDriver);
  const updateStatus = useMutation(api.trips.updateStatus);

  const [assigningTripId, setAssigningTripId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [loadingAssign, setLoadingAssign] = useState(false);

  const TRIP_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
    scheduled:       { label: "مجدولة",           cls: "bg-gray-100 text-gray-600",    icon: "📅" },
    driver_assigned: { label: "سائق معيّن",        cls: "bg-amber-100 text-amber-700",  icon: "🚌" },
    driver_accepted: { label: "السائق قبل",        cls: "bg-blue-100 text-blue-700",    icon: "✅" },
    in_progress:     { label: "جارية",             cls: "bg-green-100 text-green-700",  icon: "🟢" },
    completed:       { label: "مكتملة",            cls: "bg-emerald-100 text-emerald-700", icon: "🏁" },
    cancelled:       { label: "ملغاة",             cls: "bg-red-100 text-red-600",      icon: "❌" },
  };

  const handleAssignDriver = async (tripId: Id<"trips">) => {
    if (!selectedDriverId) { toast.error("اختر سائقاً أولاً"); return; }
    setLoadingAssign(true);
    try {
      await assignDriver({ tripId, driverId: selectedDriverId as any });
      toast.success("✅ تم تعيين السائق وإرسال إشعار له!");
      setAssigningTripId(null);
      setSelectedDriverId("");
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setLoadingAssign(false);
    }
  };

  const sendWhatsAppToDriver = (driver: any, trip: any) => {
    const msg = `السلام عليكم ${driver?.name ?? "السائق"} 🚌\n\nتم تعيينك لرحلة عمرة في المسار الذكي.\n\n📋 البرنامج: ${trip.package?.title ?? "رحلة عمرة"}\n📅 تاريخ الانطلاق: ${trip.departureDate}\n\n✅ يرجى فتح تطبيق المسار الذكي وقبول الرحلة من لوحة السائق.\n\nالمسار الذكي للعمرة`;
    const phone = (driver?.phone ?? "").replace(/\D/g, "");
    const intl = phone.startsWith("0") ? "966" + phone.slice(1) : phone;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!trips) return <Spinner />;

  const activeTrips    = trips.filter((t: any) => t.status === "in_progress");
  const pendingTrips   = trips.filter((t: any) => ["scheduled", "driver_assigned", "driver_accepted"].includes(t.status));
  const completedTrips = trips.filter((t: any) => ["completed", "cancelled"].includes(t.status));

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "جارية الآن",  value: activeTrips.length,    color: "text-green-600",   bg: "bg-green-50",   icon: "🟢" },
          { label: "قيد التجهيز", value: pendingTrips.length,   color: "text-amber-600",   bg: "bg-amber-50",   icon: "⏳" },
          { label: "مكتملة",      value: completedTrips.length, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✅" },
          { label: "السائقون",    value: (drivers ?? []).length, color: "text-blue-600",    bg: "bg-blue-50",    icon: "👤" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* الرحلات الجارية */}
      {activeTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            الرحلات الجارية الآن
          </h2>
          <div className="grid gap-4">
            {activeTrips.map((trip: any) => (
              <TripManagementCard
                key={trip._id}
                trip={trip}
                statusInfo={TRIP_STATUS[trip.status] ?? { label: trip.status, cls: "bg-gray-100 text-gray-600", icon: "📍" }}
                drivers={drivers ?? []}
                assigningTripId={assigningTripId}
                selectedDriverId={selectedDriverId}
                loadingAssign={loadingAssign}
                onOpenAssign={(id) => { setAssigningTripId(id); setSelectedDriverId(""); }}
                onCloseAssign={() => setAssigningTripId(null)}
                onSelectDriver={setSelectedDriverId}
                onAssign={handleAssignDriver}
                onSendWhatsApp={sendWhatsAppToDriver}
                onViewTracking={() => navigate({ name: "trip-tracking", tripId: trip._id })}
                onUpdateStatus={async (status) => {
                  try {
                    await updateStatus({ tripId: trip._id, status });
                    toast.success("تم تحديث الحالة");
                  } catch (e: any) { toast.error(e.message); }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* الرحلات القادمة */}
      {pendingTrips.length > 0 && (
        <div>
          <h2 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            الرحلات القادمة
          </h2>
          <div className="grid gap-4">
            {pendingTrips.map((trip: any) => (
              <TripManagementCard
                key={trip._id}
                trip={trip}
                statusInfo={TRIP_STATUS[trip.status] ?? { label: trip.status, cls: "bg-gray-100 text-gray-600", icon: "📍" }}
                drivers={drivers ?? []}
                assigningTripId={assigningTripId}
                selectedDriverId={selectedDriverId}
                loadingAssign={loadingAssign}
                onOpenAssign={(id) => { setAssigningTripId(id); setSelectedDriverId(""); }}
                onCloseAssign={() => setAssigningTripId(null)}
                onSelectDriver={setSelectedDriverId}
                onAssign={handleAssignDriver}
                onSendWhatsApp={sendWhatsAppToDriver}
                onViewTracking={() => navigate({ name: "trip-tracking", tripId: trip._id })}
                onUpdateStatus={async (status) => {
                  try {
                    await updateStatus({ tripId: trip._id, status });
                    toast.success("تم تحديث الحالة");
                  } catch (e: any) { toast.error(e.message); }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-400 mb-1">لا توجد رحلات بعد</h3>
          <p className="text-sm text-gray-300">ستظهر الرحلات هنا عند إنشائها من صفحة الحجوزات</p>
        </div>
      )}
    </div>
  );
}

function TripManagementCard({
  trip, statusInfo, drivers, assigningTripId, selectedDriverId, loadingAssign,
  onOpenAssign, onCloseAssign, onSelectDriver, onAssign, onSendWhatsApp, onViewTracking, onUpdateStatus
}: {
  trip: any; statusInfo: any; drivers: any[];
  assigningTripId: string | null; selectedDriverId: string; loadingAssign: boolean;
  onOpenAssign: (id: string) => void; onCloseAssign: () => void;
  onSelectDriver: (id: string) => void; onAssign: (id: Id<"trips">) => void;
  onSendWhatsApp: (driver: any, trip: any) => void;
  onViewTracking: () => void; onUpdateStatus: (s: string) => void;
}) {
  const isAssigning = assigningTripId === trip._id;
  const assignedDriver = trip.driverId ? drivers.find((d: any) => d._id === trip.driverId) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* رأس البطاقة */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusInfo.cls}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
              {trip.status === "in_progress" && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  مباشر
                </div>
              )}
            </div>
            <h3 className="font-black text-gray-800">{trip.package?.title ?? "رحلة"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">📅 {trip.departureDate} • 👥 {trip.bookingCount ?? 0} راكب</p>
          </div>
          {/* زر التتبع */}
          {["in_progress", "driver_accepted"].includes(trip.status) && (
            <button
              onClick={onViewTracking}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
            >
              <MapPin className="w-3.5 h-3.5" />
              تتبع
            </button>
          )}
        </div>
      </div>

      {/* بيانات السائق المعيّن */}
      {assignedDriver && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {assignedDriver.profileImageUrl ? (
              <img src={assignedDriver.profileImageUrl} alt={assignedDriver.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-700" />
              </div>
            )}
            <div>
              <p className="text-sm font-black text-gray-800">{assignedDriver.name}</p>
              <p className="text-xs text-gray-500">{assignedDriver.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              trip.driverStatus === "accepted" ? "bg-green-100 text-green-700" :
              trip.driverStatus === "rejected" ? "bg-red-100 text-red-600" :
              "bg-amber-100 text-amber-700"
            }`}>
              {trip.driverStatus === "accepted" ? "✅ قبل" :
               trip.driverStatus === "rejected" ? "❌ رفض" : "⏳ انتظار"}
            </span>
            <button
              onClick={() => onSendWhatsApp(assignedDriver, trip)}
              className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className="p-4 flex flex-wrap gap-2">
        {/* تعيين/تغيير السائق */}
        {!["completed", "cancelled"].includes(trip.status) && (
          <button
            onClick={() => isAssigning ? onCloseAssign() : onOpenAssign(trip._id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
          >
            <User className="w-3.5 h-3.5" />
            {assignedDriver ? "تغيير السائق" : "تعيين سائق"}
            {isAssigning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {/* تحديث الحالة */}
        {trip.status !== "completed" && trip.status !== "cancelled" && (
          <>
            {trip.status !== "in_progress" && (
              <button
                onClick={() => onUpdateStatus("in_progress")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors border border-green-100"
              >
                <Play className="w-3.5 h-3.5" />
                بدء الرحلة
              </button>
            )}
            <button
              onClick={() => onUpdateStatus("completed")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              إنهاء
            </button>
          </>
        )}

        {/* زر مشاركة رابط التتبع للعائلة */}
        {trip.shareToken && ["driver_assigned","driver_accepted","in_progress"].includes(trip.status) && (
          <button
            onClick={() => {
              const url = `${window.location.origin}?track=${trip.shareToken}`;
              if (navigator.share) {
                navigator.share({ title: "تتبع رحلة العمرة", url });
              } else {
                navigator.clipboard.writeText(url);
                // toast handled by parent
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-100"
          >
            <Globe className="w-3.5 h-3.5" />
            رابط للعائلة
          </button>
        )}
      </div>

      {/* نموذج تعيين السائق */}
      {isAssigning && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-xs font-bold text-gray-700">اختر السائق:</p>
          {drivers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">لا يوجد سائقون مرتبطون بمكتبك</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {drivers.map((drv: any) => (
                <label
                  key={drv._id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                    selectedDriverId === drv._id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-100 bg-gray-50 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name={`trip-driver-${trip._id}`}
                    value={drv._id}
                    checked={selectedDriverId === drv._id}
                    onChange={() => onSelectDriver(drv._id)}
                    className="accent-indigo-600"
                  />
                  {drv.profileImageUrl ? (
                    <img src={drv.profileImageUrl} alt={drv.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm">{drv.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{drv.phone}</p>
                  </div>
                  {drv.isApproved && <span className="text-xs text-emerald-600 font-bold">✓</span>}
                </label>
              ))}
            </div>
          )}
          {selectedDriverId && (
            <button
              onClick={() => onAssign(trip._id)}
              disabled={loadingAssign}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loadingAssign
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري التعيين...</>
                : <><User className="w-4 h-4" />تعيين وإرسال إشعار</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */
const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>;
}
