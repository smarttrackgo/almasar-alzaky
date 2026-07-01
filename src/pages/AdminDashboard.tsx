import { Fragment, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import WhatsAppTab from "../components/admin/WhatsAppTab";
import EmailTab from "../components/admin/EmailTab";
import WalletTab from "../components/admin/WalletTab";
import SMSTab from "../components/admin/SMSTab";
import { printTaxInvoice } from "../lib/taxInvoice";
import { printHtml } from "../lib/printDocument";
import {
  CreditCard,
  LayoutDashboard, Building2, CalendarCheck, Users,
  BadgeCheck, Trash2, ShieldCheck, ShieldOff,
  TrendingUp, Package, Banknote, CheckCircle2,
  Edit3, Save, X, Upload, FileText, Hash, StickyNote,
  ChevronDown, ChevronUp, ImagePlus, Settings,
  Phone, Mail, MapPin, Globe, MessageSquare,
  Type, AlignLeft, Image as ImageIcon,
  Megaphone, Plus, ToggleLeft, ToggleRight,
  Loader2, Percent, DollarSign, Clock, CheckCircle,
  RefreshCw, AlertCircle, BookOpen, Filter, ArrowDownCircle,
  Download, Search, Calendar, ChevronLeft, ChevronRight,
  Headphones, Send, MessageCircle, CheckCheck, Circle,
  UserCircle, XCircle, RotateCcw,
  Bot, Sparkles, Brain, Zap, HelpCircle, Star, RotateCw,
  Smartphone, Wallet,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";
const paymentLogoDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const MADA_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64"><rect width="160" height="64" rx="16" fill="#0A2240"/><text x="80" y="41" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800" fill="#00B4D8">mada</text></svg>`);
const STC_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 64"><rect width="170" height="64" rx="16" fill="#6A0DAD"/><text x="85" y="40" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">STC Pay</text></svg>`);
const APPLE_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 64"><rect width="180" height="64" rx="16" fill="#000000"/><text x="90" y="40" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700" fill="#FFFFFF">Apple Pay</text></svg>`);
const GOOGLE_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="16" fill="#FFFFFF" stroke="#DADCE0" stroke-width="2"/><text x="95" y="40" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700" fill="#5F6368">Google Pay</text></svg>`);
const TABBY_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64"><rect width="160" height="64" rx="18" fill="#3BE8B0"/><text x="80" y="41" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800" fill="#12211C">tabby</text></svg>`);
const TAMARA_PAYMENT_LOGO = paymentLogoDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 64"><rect width="180" height="64" rx="18" fill="#F7E8FF"/><circle cx="34" cy="32" r="15" fill="#09B982"/><text x="104" y="40" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="800" fill="#1F2937">tamara</text></svg>`);

type Tab = "overview" | "offices" | "bookings" | "users" | "settings" | "announcements" | "commissions" | "statements" | "support" | "ai" | "whatsapp" | "email" | "wallet" | "reviews" | "sms";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "معلق",   cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "مؤكد",   cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغي",   cls: "bg-red-100 text-red-600" },
  completed: { label: "مكتمل", cls: "bg-blue-100 text-blue-700" },
};

export default function AdminDashboard({ navigate }: { navigate: (p: Page) => void }) {
  const user  = useQuery(api.auth.loggedInUser);
  const stats = useQuery(api.admin.getStats);
  const [tab, setTab] = useState<Tab>("overview");
  const tabsRef = useRef<HTMLDivElement>(null);

  if (user === undefined || stats === undefined) return <Spinner />;
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldOff className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-700">غير مصرح بالوصول</h2>
          <button onClick={() => navigate({ name: "home" })} className="mt-4 text-emerald-600 hover:underline text-sm">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; Icon: any }[] = [
    { key: "overview",      label: "نظرة عامة",    Icon: LayoutDashboard },
    { key: "offices",       label: "المكاتب",      Icon: Building2 },
    { key: "bookings",      label: "الحجوزات",     Icon: CalendarCheck },
    { key: "users",         label: "المستخدمون",   Icon: Users },
    { key: "commissions",   label: "العمولات",        Icon: Percent },
    { key: "statements",    label: "كشوفات الحساب",  Icon: BookOpen },
    { key: "support",       label: "الدعم والتواصل",  Icon: Headphones },
    { key: "announcements", label: "الإعلانات",       Icon: Megaphone },
    { key: "ai",            label: "مساعد AI",         Icon: Bot },
    { key: "whatsapp",      label: "واتساب API",        Icon: Smartphone },
    { key: "sms",           label: "SMS",                Icon: Phone },
    { key: "email",         label: "سجل الإيميل",       Icon: Mail },
    { key: "wallet",        label: "المحفظة والاسترداد", Icon: Wallet },
    { key: "reviews",       label: "التقييمات",           Icon: Star },
    { key: "settings",      label: "إعدادات التطبيق", Icon: Settings },
  ];

  const scrollTabs = (direction: "left" | "right") => {
    const element = tabsRef.current;
    if (!element) return;
    const amount = Math.min(560, Math.max(300, element.clientWidth * 0.6));
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-950 to-emerald-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-5">
          <img src={LOGO} alt="logo" className="h-14 w-auto object-contain" style={{ mixBlendMode: "screen" }} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">لوحة تحكم الإدارة</h1>
              <span className="bg-amber-400 text-emerald-900 text-xs font-black px-2.5 py-1 rounded-full">ADMIN</span>
            </div>
            <p className="text-emerald-200 text-sm mt-0.5">إدارة شاملة لتطبيق المسار الذكي</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95" dir="rtl">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              aria-label="تحريك التبويبات يمين"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div ref={tabsRef} className="admin-tabs-scroll min-w-0 flex-1 overflow-x-auto scroll-smooth">
              <div className="flex w-max items-stretch gap-2 px-1">
                {TABS.map(({ key, label, Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      onClick={() => setTab(key)}
                      className={`group flex min-h-[82px] min-w-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-center transition-all sm:min-w-[112px] ${
                        active
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-400/70 dark:bg-emerald-500/15 dark:text-emerald-100"
                          : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-500/10"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                          active
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:bg-emerald-500 dark:shadow-none"
                            : "bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="block max-w-[88px] truncate text-[11px] font-black leading-4 sm:max-w-[104px] sm:text-xs">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollTabs("left")}
              aria-label="تحريك التبويبات شمال"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === "overview"      && stats && <OverviewTab stats={stats} />}
        {tab === "offices"       && <OfficesTab />}
        {tab === "bookings"      && <BookingsTab />}
        {tab === "users"         && <UsersTab />}
        {tab === "commissions"   && <AdminCommissionsTab />}
        {tab === "statements"    && <AdminStatementsTab />}
        {tab === "support"       && <AdminSupportTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "ai"            && <AISettingsTab />}
        {tab === "whatsapp"      && <WhatsAppTab />}
        {tab === "sms"           && <SMSTab />}
        {tab === "email"         && <EmailTab />}
        {tab === "wallet"        && <WalletTab />}
        {tab === "reviews"       && <AdminReviewsTab />}
        {tab === "settings"      && <AppSettingsTab />}
      </div>
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ stats }: { stats: any }) {
  const cards = [
    { label: "إجمالي المكاتب",    value: stats.totalOffices,    sub: `${stats.verifiedOffices} موثق`,       from: "from-emerald-500", to: "to-emerald-700", Icon: Building2 },
    { label: "إجمالي البرامج",    value: stats.totalPackages,   sub: `${stats.activePackages} نشط`,         from: "from-blue-500",    to: "to-blue-700",    Icon: Package },
    { label: "إجمالي الحجوزات",   value: stats.totalBookings,   sub: `${stats.pendingBookings} معلق`,       from: "from-amber-500",   to: "to-amber-700",   Icon: CalendarCheck },
    { label: "المستخدمون",        value: stats.totalUsers,      sub: "مسجل في المنصة",                      from: "from-purple-500",  to: "to-purple-700",  Icon: Users },
    { label: "الإيرادات الكلية",  value: `${stats.totalRevenue.toLocaleString("ar-SA")} ر.س`, sub: "إجمالي المبيعات", from: "from-rose-500", to: "to-rose-700", Icon: Banknote },
    { label: "حجوزات مؤكدة",     value: stats.confirmedBookings, sub: `${stats.cancelledBookings} ملغي`,   from: "from-teal-500",    to: "to-teal-700",    Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, from, to, Icon }, i) => (
          <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white anim-fade-up`} style={{ animationDelay: `${i * 0.08}s` }}>
            <Icon className="w-6 h-6 text-white/60 mb-3" strokeWidth={1.5} />
            <div className="text-2xl font-black">{value}</div>
            <div className="text-white/80 text-xs mt-0.5">{label}</div>
            <div className="text-white/50 text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          ملخص الأداء
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "معدل التأكيد", value: stats.totalBookings ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) + "%" : "0%", color: "text-emerald-600" },
            { label: "معدل الإلغاء", value: stats.totalBookings ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) + "%" : "0%", color: "text-red-500" },
            { label: "نسبة التوثيق", value: stats.totalOffices ? Math.round((stats.verifiedOffices / stats.totalOffices) * 100) + "%" : "0%", color: "text-blue-600" },
          ].map((m, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className={`text-3xl font-black ${m.color}`}>{m.value}</div>
              <div className="text-gray-500 text-xs mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   تبويب التقييمات - لوحة الأدمن
══════════════════════════════════════════════════════════ */
function AdminReviewsTab() {
  const stats   = useQuery(api.reviews.adminStats);
  const reviews = useQuery(api.reviews.getAllForAdmin);
  const remove  = useMutation(api.reviews.remove);
  const [filter, setFilter] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (reviewId: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
    setDeleting(reviewId);
    try {
      await remove({ reviewId });
      toast.success("تم حذف التقييم");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = reviews
    ? (filter ? reviews.filter((r: any) => r.rating === filter) : reviews)
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
            <Star className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-white/80 text-sm">إجمالي التقييمات</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
            <Star className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
            <div className="text-3xl font-black">{stats.average}</div>
            <div className="text-white/80 text-sm">متوسط التقييم</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-3 text-sm">توزيع النجوم</h3>
            <div className="space-y-1.5">
              {stats.distribution.map(({ star, count }: any) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{star}★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: stats.total ? `${(count / stats.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-5 text-left">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* فلتر النجوم */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">تصفية:</span>
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === null ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            الكل
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? null : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                filter === s ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s} <Star className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* قائمة التقييمات */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            التقييمات ({filtered.length})
          </h2>
        </div>

        {reviews === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">لا توجد تقييمات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r: any) => (
              <div key={r._id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* أفاتار */}
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm flex-shrink-0">
                      {(r.userName ?? "م").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-800 text-sm">{r.userName ?? "معتمر"}</span>
                        {/* النجوم */}
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(r._creationTime).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                      {/* البرنامج والمكتب */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {r.packageTitle && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                            📦 {r.packageTitle}
                          </span>
                        )}
                        {r.officeName && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            🏢 {r.officeName}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  </div>
                  {/* زر الحذف */}
                  <button
                    onClick={() => handleDelete(r._id)}
                    disabled={deleting === r._id}
                    className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="حذف التقييم"
                  >
                    {deleting === r._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── App Settings Tab ── */
function AppSettingsTab() {
  const settings      = useQuery(api.appSettings.getAll);
  const upsert        = useMutation(api.appSettings.upsert);
  const upsertImage   = useMutation(api.appSettings.upsertImage);
  const genUpload     = useMutation(api.appSettings.generateUploadUrl);
  const [form, setForm]     = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [imgPreviews, setImgPreviews] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // تهيئة الفورم من الإعدادات المحفوظة
  const getValue = (key: string) => {
    if (form[key] !== undefined) return form[key];
    return settings?.find((s: any) => s.key === key)?.value ?? "";
  };

  const handleSave = async (key: string, type: string) => {
    setSaving(key);
    try {
      let storageId: any = undefined;
      const file = fileRefs.current[key]?.files?.[0];
      if (type === "image" && file) {
        const uploadUrl = await genUpload();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const json = await res.json();
        storageId = json.storageId;
        // استخدام upsertImage لجلب URL الصحيح من Convex Storage
        await upsertImage({ key, storageId });
      } else {
        await upsert({ key, value: getValue(key) });
      }
      toast.success("✅ تم حفظ الإعداد بنجاح");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(null);
    }
  };

  const handleImageChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgPreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
  };

  if (!settings) return <Spinner />;

  // تجميع الإعدادات في مجموعات
  const groups = [
    {
      title: "هوية التطبيق",
      icon: <Globe className="w-5 h-5 text-emerald-600" />,
      color: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      keys: ["app_name", "app_tagline", "logo_url"],
    },
    {
      title: "محتوى الصفحة الرئيسية",
      icon: <Type className="w-5 h-5 text-blue-600" />,
      color: "from-blue-50 to-indigo-50",
      border: "border-blue-200",
      keys: ["hero_title", "hero_subtitle"],
    },
    {
      title: "فيديو الخلفية",
      icon: <Globe className="w-5 h-5 text-sky-600" />,
      color: "from-sky-50 to-cyan-50",
      border: "border-sky-200",
      keys: ["hero_video_url", "hero_video_brightness"],
    },
    {
      title: "الألوان الرئيسية",
      icon: <Sparkles className="w-5 h-5 text-rose-500" />,
      color: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      keys: ["color_primary", "color_secondary", "color_accent"],
    },
    {
      title: "شاشة البداية (Splash Screen)",
      icon: <ImageIcon className="w-5 h-5 text-violet-600" />,
      color: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      keys: ["splash_logo_url", "splash_video_url", "splash_title", "splash_subtitle"],
    },
    {
      title: "الوجهات المقدسة",
      icon: <ImagePlus className="w-5 h-5 text-emerald-600" />,
      color: "from-emerald-50 to-teal-50",
      border: "border-emerald-300",
      keys: [
        "kaaba_image_url", "kaaba_title", "kaaba_subtitle",
        "madinah_image_url", "madinah_title", "madinah_subtitle",
      ],
    },
    {
      title: "الإحصائيات (قسم الأرقام)",
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      color: "from-blue-50 to-indigo-50",
      border: "border-blue-200",
      keys: ["stats_packages", "stats_offices", "stats_pilgrims", "stats_rating"],
    },
    {
      title: "قسم 'لماذا نحن'",
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      color: "from-purple-50 to-violet-50",
      border: "border-purple-200",
      keys: ["why_title", "why_subtitle"],
    },
    {
      title: "قسم الدعوة للعمل (CTA)",
      icon: <Megaphone className="w-5 h-5 text-rose-500" />,
      color: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      keys: ["cta_title", "cta_subtitle", "cta_image_url"],
    },
    {
      title: "صور الأقسام والمشاركة",
      icon: <ImagePlus className="w-5 h-5 text-orange-500" />,
      color: "from-orange-50 to-amber-50",
      border: "border-orange-200",
      keys: ["about_image_url", "features_image_url", "og_image_url"],
    },
    {
      title: "معلومات التواصل",
      icon: <Phone className="w-5 h-5 text-amber-600" />,
      color: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      keys: ["contact_phone", "contact_email", "contact_address", "whatsapp"],
    },
    {
      title: "وسائل التواصل الاجتماعي",
      icon: <Globe className="w-5 h-5 text-purple-600" />,
      color: "from-purple-50 to-pink-50",
      border: "border-purple-200",
      keys: ["facebook", "instagram", "twitter", "tiktok"],
    },
    {
      title: "نص الفوتر",
      icon: <AlignLeft className="w-5 h-5 text-gray-600" />,
      color: "from-gray-50 to-slate-50",
      border: "border-gray-200",
      keys: ["footer_text"],
    },
  ];

  const settingsMap: Record<string, any> = {};
  for (const s of settings) settingsMap[s.key] = s;

  const ICONS: Record<string, React.ReactNode> = {
    app_name:        <Globe className="w-4 h-4 text-gray-400" />,
    app_tagline:     <Type className="w-4 h-4 text-gray-400" />,
    logo_url:        <ImageIcon className="w-4 h-4 text-gray-400" />,
    contact_phone:   <Phone className="w-4 h-4 text-gray-400" />,
    contact_email:   <Mail className="w-4 h-4 text-gray-400" />,
    contact_address: <MapPin className="w-4 h-4 text-gray-400" />,
    whatsapp:        <MessageSquare className="w-4 h-4 text-gray-400" />,
    facebook:        <Globe className="w-4 h-4 text-blue-500" />,
    instagram:       <Globe className="w-4 h-4 text-pink-500" />,
    twitter:         <Globe className="w-4 h-4 text-gray-800" />,
    tiktok:          <Globe className="w-4 h-4 text-gray-800" />,
    hero_title:           <Type className="w-4 h-4 text-gray-400" />,
    hero_subtitle:        <AlignLeft className="w-4 h-4 text-gray-400" />,
    hero_video_url:       <Globe className="w-4 h-4 text-gray-400" />,
    hero_video_brightness:<Zap className="w-4 h-4 text-gray-400" />,
    color_primary:        <Sparkles className="w-4 h-4 text-gray-400" />,
    color_secondary:      <Sparkles className="w-4 h-4 text-gray-400" />,
    color_accent:         <Sparkles className="w-4 h-4 text-gray-400" />,
    footer_text:          <AlignLeft className="w-4 h-4 text-gray-400" />,
    // شاشة البداية
    splash_logo_url:      <ImageIcon className="w-4 h-4 text-violet-400" />,
    splash_video_url:     <Globe className="w-4 h-4 text-violet-400" />,
    splash_title:         <Type className="w-4 h-4 text-violet-400" />,
    splash_subtitle:      <AlignLeft className="w-4 h-4 text-violet-400" />,
    // صور الأقسام
    about_image_url:      <ImagePlus className="w-4 h-4 text-orange-400" />,
    features_image_url:   <ImagePlus className="w-4 h-4 text-orange-400" />,
    cta_image_url:        <ImagePlus className="w-4 h-4 text-orange-400" />,
    og_image_url:         <ImagePlus className="w-4 h-4 text-orange-400" />,
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800">إعدادات التطبيق</h2>
          <p className="text-gray-500 text-sm mt-0.5">تحكم في كل محتوى وبيانات التطبيق من هنا</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          {settings.length} إعداد
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.title} className={`bg-gradient-to-br ${group.color} border ${group.border} rounded-2xl p-5`}>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            {group.icon}
            {group.title}
          </h3>
          <div className="space-y-4">
            {group.keys.map((key) => {
              const s = settingsMap[key];
              if (!s) return null;
              const type = s.type ?? "text";
              const currentVal = getValue(key);
              const isSaving = saving === key;

              return (
                <div key={key} className="bg-white rounded-xl p-4 border border-white shadow-sm">
                  <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                    {ICONS[key]}
                    {s.label}
                  </label>

                  {type === "image" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {(imgPreviews[key] || currentVal) ? (
                            <img src={imgPreviews[key] || currentVal} alt={s.label} className="w-full h-full object-contain" />
                          ) : (
                            <ImagePlus className="w-7 h-7 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-2">PNG أو JPG أو SVG، الحجم الأقصى 2MB</p>
                          <input ref={(el) => { fileRefs.current[key] = el; }} type="file" accept="image/*" onChange={(e) => handleImageChange(key, e)} className="hidden" id={`file-${key}`} />
                          <label htmlFor={`file-${key}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            {imgPreviews[key] ? "تغيير الصورة" : "رفع صورة"}
                          </label>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">أو أدخل رابط الصورة مباشرة:</p>
                        <input value={currentVal} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder="https://..." className={inp} />
                      </div>
                    </div>
                  ) : type === "color" ? (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={currentVal || "#065f46"}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5 bg-white"
                        />
                      </div>
                      <input
                        value={currentVal}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder="#065f46"
                        className={`${inp} flex-1 font-mono`}
                      />
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: currentVal || "#065f46" }}
                      />
                    </div>
                  ) : type === "textarea" ? (
                    <textarea value={currentVal} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={3} className={`${inp} resize-none`} />
                  ) : (
                    <input value={currentVal} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inp} />
                  )}

                  <button onClick={() => handleSave(key, type)} disabled={isSaving} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-semibold text-xs hover:shadow-md disabled:opacity-50 transition-all">
                    {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</> : <><Save className="w-3.5 h-3.5" />حفظ</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ══ قسم إعدادات الدفع ══ */}
      <PaymentSettingsSection getValue={getValue} upsert={upsert} />
    </div>
  );
}

/* ── قسم إعدادات الدفع ── */
function PaymentSettingsSection({
  getValue,
  upsert,
}: {
  getValue: (k: string) => string;
  upsert: any;
}) {
  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all";
  const [saving, setSaving] = useState<string | null>(null);
  const [localVals, setLocalVals] = useState<Record<string, string>>({});
  const [imgPreviews, setImgPreviews] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const genUpload    = useMutation(api.appSettings.generateUploadUrl);
  const upsertImage  = useMutation(api.appSettings.upsertImage);

  const getVal = (key: string) => localVals[key] ?? getValue(key);
  const setVal = (key: string, val: string) => setLocalVals((p) => ({ ...p, [key]: val }));

  const paymentMode = getVal("payment_mode") || "test";
  const isLive = paymentMode === "live";

  const handleSave = async (key: string, value?: string) => {
    const val = value ?? getVal(key);
    setSaving(key);
    try {
      await upsert({ key, value: val });
      toast.success("✅ تم الحفظ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(null);
    }
  };

  const paymentMethods = [
    {
      key: "payment_method_mada",
      label: "مدى",
      desc: "بطاقة مدى المصرفية",
      logo: (
        <svg viewBox="0 0 60 24" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="24" rx="4" fill="#1A1A2E"/>
          <text x="8" y="17" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#00B4D8">mada</text>
        </svg>
      ),
    },
    {
      key: "payment_method_stc",
      label: "STC Pay",
      desc: "محفظة STC Pay",
      logo: (
        <svg viewBox="0 0 70 24" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="70" height="24" rx="4" fill="#6A0DAD"/>
          <text x="8" y="17" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white">STC Pay</text>
        </svg>
      ),
    },
    {
      key: "payment_method_apple",
      label: "Apple Pay",
      desc: "Apple Pay",
      logo: (
        <svg viewBox="0 0 70 24" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="70" height="24" rx="4" fill="#000000"/>
          <path d="M14 7.5C14.8 6.5 15.3 5.2 15.1 4C13.9 4.1 12.5 4.8 11.7 5.8C10.9 6.7 10.3 8 10.5 9.2C11.8 9.3 13.1 8.5 14 7.5Z" fill="white"/>
          <path d="M15.1 9.5C13.3 9.4 11.8 10.5 10.9 10.5C10 10.5 8.7 9.6 7.2 9.6C5.3 9.6 3.5 10.6 2.5 12.3C0.5 15.7 2 20.8 4 23.1C4.9 24.2 6 25.5 7.5 25.4C8.9 25.4 9.5 24.6 11.2 24.6C12.9 24.6 13.4 25.4 14.9 25.4C16.4 25.4 17.4 24.2 18.3 23.1C19.3 21.8 19.7 20.6 19.7 20.5C19.7 20.5 17 19.5 17 16.5C17 13.9 19.1 12.7 19.2 12.6C17.9 10.7 15.9 9.5 15.1 9.5Z" fill="white" transform="scale(0.7) translate(4, -2)"/>
          <text x="22" y="16" fontFamily="Arial" fontWeight="500" fontSize="10" fill="white">Apple Pay</text>
        </svg>
      ),
    },
    {
      key: "payment_method_google",
      label: "Google Pay",
      desc: "Google Pay",
      logo: (
        <svg viewBox="0 0 80 24" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="24" rx="4" fill="#F8F9FA" stroke="#DADCE0" strokeWidth="1"/>
          <text x="8" y="16" fontFamily="Arial" fontSize="10" fontWeight="500">
            <tspan fill="#4285F4">G</tspan>
            <tspan fill="#EA4335">o</tspan>
            <tspan fill="#FBBC05">o</tspan>
            <tspan fill="#4285F4">g</tspan>
            <tspan fill="#34A853">l</tspan>
            <tspan fill="#EA4335">e</tspan>
            <tspan fill="#5F6368"> Pay</tspan>
          </text>
        </svg>
      ),
    },
    {
      key: "payment_method_tabby",
      label: "Tabby",
      desc: "الدفع الآجل / التقسيط",
      logo: (
        <img src={TABBY_PAYMENT_LOGO} alt="Tabby" className="h-6 w-auto" />
      ),
    },
    {
      key: "payment_method_tamara",
      label: "Tamara",
      desc: "الدفع الآجل / التقسيط",
      logo: (
        <img src={TAMARA_PAYMENT_LOGO} alt="Tamara" className="h-6 w-auto" />
      ),
    },
    {
      key: "payment_method_bank",
      label: "تحويل بنكي",
      desc: "تحويل بنكي مباشر",
      logo: (
        <svg viewBox="0 0 80 24" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="24" rx="4" fill="#1B4332"/>
          <path d="M8 16V11M12 16V9M16 16V12M20 16V10" stroke="#52B788" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 17H22" stroke="#52B788" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 5L6 9H22L14 5Z" fill="#52B788"/>
          <text x="26" y="16" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">تحويل بنكي</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-600" />
          إعدادات الدفع
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
          isLive ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
          {isLive ? "وضع Live — حقيقي" : "وضع Test — تجريبي"}
        </div>
      </div>

      {/* وضع الدفع */}
      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-violet-500" />
          وضع الدفع
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: "test", label: "Test — تجريبي", desc: "للاختبار فقط، لا تُسحب أموال حقيقية", activeColor: "border-amber-400 bg-amber-50" },
            { val: "live", label: "Live — حقيقي",  desc: "وضع الإنتاج، المعاملات حقيقية",        activeColor: "border-emerald-500 bg-emerald-50" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => { setVal("payment_mode", opt.val); handleSave("payment_mode", opt.val); }}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                paymentMode === opt.val ? opt.activeColor : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-800 text-sm">{opt.label}</span>
                {paymentMode === opt.val && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {isLive && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">أنت في وضع Live — جميع المعاملات حقيقية. تأكد من صحة بيانات الحساب البنكي.</p>
          </div>
        )}
      </div>

      {/* البيانات البنكية */}
      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
          <Banknote className="w-4 h-4 text-violet-500" />
          بيانات الحساب البنكي (للتحويل المباشر)
        </label>
        <div className="space-y-3">
          {[
            { key: "payment_bank_name",    label: "اسم البنك",              placeholder: "مثال: البنك الأهلي السعودي", ltr: false },
            { key: "payment_account_name", label: "اسم صاحب الحساب",        placeholder: "الاسم كما في البنك",         ltr: false },
            { key: "payment_account_num",  label: "رقم الحساب",             placeholder: "رقم الحساب البنكي",          ltr: true  },
            { key: "payment_iban",         label: "رقم الآيبان (IBAN)",     placeholder: "SA00 0000 0000 0000 0000 0000", ltr: true },
          ].map(({ key, label, placeholder, ltr }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <div className="flex gap-2">
                <input
                  value={getVal(key)}
                  onChange={(e) => setVal(key, e.target.value)}
                  placeholder={placeholder}
                  dir={ltr ? "ltr" : "rtl"}
                  className={`${inp} flex-1`}
                />
                <button
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  className="px-3 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                >
                  {saving === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  حفظ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* طرق الدفع المتاحة */}
      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-violet-500" />
          طرق الدفع المتاحة للمعتمر
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map(({ key, label, logo, desc }) => {
            const enabled = getVal(key) !== "false";
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                enabled ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50 opacity-60"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{logo}</div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newVal = enabled ? "false" : "true";
                    setVal(key, newVal);
                    handleSave(key, newVal);
                  }}
                  disabled={saving === key}
                  className={`relative w-12 h-6 rounded-full transition-all disabled:opacity-50 flex-shrink-0 ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">💡 الطرق المفعّلة ستظهر للمعتمر في صفحة الدفع</p>
      </div>

      {/* صور طرق الدفع */}
      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-violet-500" />
          صور طرق الدفع
        </label>
        <p className="text-xs text-gray-400 mb-4">ارفع صورة مخصصة لكل طريقة دفع — تظهر فوراً للمعتمرين في صفحة الدفع</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "payment_img_mada",   label: "مدى",           fallback: MADA_PAYMENT_LOGO },
            { key: "payment_img_stc",    label: "STC Pay",       fallback: STC_PAYMENT_LOGO },
            { key: "payment_img_apple",  label: "Apple Pay",     fallback: APPLE_PAYMENT_LOGO },
            { key: "payment_img_google", label: "Google Pay",    fallback: GOOGLE_PAYMENT_LOGO },
            { key: "payment_img_tabby",  label: "Tabby",         fallback: TABBY_PAYMENT_LOGO },
            { key: "payment_img_tamara", label: "Tamara",        fallback: TAMARA_PAYMENT_LOGO },
            { key: "payment_img_bank",   label: "تحويل بنكي",   fallback: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png" },
          ].map(({ key, label, fallback }) => {
            const currentUrl = imgPreviews[key] || getValue(key) || fallback;
            const isUploading = saving === key;
            return (
              <div key={key} className="border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-violet-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">{label}</span>
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
                </div>
                {/* معاينة الصورة */}
                <div className="w-full h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden border border-gray-100">
                  {currentUrl ? (
                    <img
                      src={currentUrl}
                      alt={label}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                {/* زر الرفع */}
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[key] = el; }}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // معاينة فورية
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setImgPreviews((p) => ({ ...p, [key]: ev.target?.result as string }));
                    };
                    reader.readAsDataURL(file);
                    // رفع الصورة
                    setSaving(key);
                    try {
                      const uploadUrl = await genUpload();
                      const res = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                      });
                      const { storageId } = await res.json();
                      const imgUrl = await upsertImage({ key, storageId });
                      setImgPreviews((p) => ({ ...p, [key]: imgUrl ?? "" }));
                      toast.success(`✅ تم رفع صورة ${label}`);
                    } catch (err) {
                      toast.error("فشل رفع الصورة");
                      setImgPreviews((p) => { const n = { ...p }; delete n[key]; return n; });
                    } finally {
                      setSaving(null);
                      if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
                    }
                  }}
                />
                <button
                  onClick={() => fileRefs.current[key]?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? "جاري الرفع..." : "تغيير الصورة"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">💡 الصور المرفوعة تُخزَّن في Convex Storage وتظهر فوراً للمعتمرين</p>
      </div>

      {/* تعليمات الدفع */}
      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-violet-500" />
          ربط بوابات الدفع الإلكتروني
        </label>
        <p className="text-xs text-gray-400 mb-4">
          عند حفظ Checkout URL سيتم تحويل المعتمر للبوابة مع bookingRef وamount وcurrency وtransactionId. مفاتيح Secret تظل محفوظة في الإعدادات ولا تظهر للمعتمر.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: "payment_tabby_checkout_url", label: "Tabby Checkout URL", placeholder: "https://..." },
            { key: "payment_tamara_checkout_url", label: "Tamara Checkout URL", placeholder: "https://..." },
            { key: "payment_tabby_public_key", label: "Tabby Public Key", placeholder: "pk_..." },
            { key: "payment_tamara_public_key", label: "Tamara Public Key", placeholder: "public key" },
            { key: "payment_tabby_secret_key", label: "Tabby Secret Key", placeholder: "secret key", secret: true },
            { key: "payment_tamara_secret_key", label: "Tamara Secret Key", placeholder: "secret key", secret: true },
            { key: "payment_return_url", label: "Payment Return URL", placeholder: "https://almasaralzaky.com/..." },
            { key: "payment_webhook_url", label: "Payment Webhook URL", placeholder: "https://.../webhook" },
          ].map(({ key, label, placeholder, secret }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <div className="flex gap-2">
                <input
                  value={getVal(key)}
                  onChange={(e) => setVal(key, e.target.value)}
                  placeholder={placeholder}
                  type={secret ? "password" : "text"}
                  dir="ltr"
                  className={`${inp} flex-1`}
                />
                <button
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  className="px-3 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                >
                  {saving === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  حفظ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
        <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
          <StickyNote className="w-4 h-4 text-violet-500" />
          تعليمات الدفع (تظهر للمعتمر في صفحة الدفع)
        </label>
        <textarea
          value={getVal("payment_instructions")}
          onChange={(e) => setVal("payment_instructions", e.target.value)}
          rows={3}
          placeholder="مثال: يرجى التواصل مع المكتب بعد إتمام التحويل البنكي لتأكيد الحجز..."
          className={`${inp} resize-none`}
        />
        <button
          onClick={() => handleSave("payment_instructions")}
          disabled={saving === "payment_instructions"}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-semibold text-xs hover:shadow-md disabled:opacity-50 transition-all"
        >
          {saving === "payment_instructions"
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</>
            : <><Save className="w-3.5 h-3.5" />حفظ التعليمات</>
          }
        </button>
      </div>
    </div>
  );
}

/* ── Announcements Tab ── */
function AnnouncementsTab() {
  const announcements  = useQuery(api.announcements.getAll);
  const createAnn      = useMutation(api.announcements.create);
  const toggleAnn      = useMutation(api.announcements.toggle);
  const deleteAnn      = useMutation(api.announcements.remove);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", type: "info", isActive: true,
    imageUrl: "", linkUrl: "", priority: 0,
  });
  const [saving, setSaving] = useState(false);

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setSaving(true);
    try {
      await createAnn({
        title: form.title,
        content: form.content,
        type: form.type,
        imageUrl: form.imageUrl || undefined,
        linkUrl: form.linkUrl || undefined,
        priority: form.priority,
      });
      toast.success("✅ تم إنشاء الإعلان");
      setShowForm(false);
      setForm({ title: "", content: "", type: "info", isActive: true, imageUrl: "", linkUrl: "", priority: 0 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: any) => {
    try {
      await toggleAnn({ announcementId: id });
      toast.success("تم تغيير حالة الإعلان");
    } catch { toast.error("حدث خطأ"); }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    try {
      await deleteAnn({ announcementId: id });
      toast.success("تم حذف الإعلان");
    } catch { toast.error("حدث خطأ"); }
  };

  const TYPE_COLORS: Record<string, string> = {
    info:    "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    promo:   "bg-purple-100 text-purple-700",
  };
  const TYPE_LABELS: Record<string, string> = {
    info: "معلومة", warning: "تحذير", success: "نجاح", promo: "عرض",
  };

  if (!announcements) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">الإعلانات ({announcements.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إعلان جديد
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-600" />
            إنشاء إعلان جديد
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">العنوان *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="عنوان الإعلان" className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">النوع</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inp}>
                <option value="info">معلومة</option>
                <option value="warning">تحذير</option>
                <option value="success">نجاح</option>
                <option value="promo">عرض ترويجي</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">المحتوى *</label>
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3} placeholder="نص الإعلان..." className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رابط الصورة (اختياري)</label>
              <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رابط الإجراء (اختياري)</label>
              <input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." className={inp} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm font-medium text-gray-700">نشر الإعلان فوراً</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "جاري الحفظ..." : "نشر الإعلان"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <Empty icon={<Megaphone className="w-12 h-12 text-gray-200" />} text="لا توجد إعلانات" />
      ) : announcements.map((a: any) => (
        <div key={a._id} className={`bg-white rounded-2xl shadow-sm border p-5 ${a.isActive ? "border-emerald-100" : "border-gray-100 opacity-70"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-800">{a.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPE_LABELS[a.type] ?? a.type}
                </span>
                {a.isActive ? (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">نشط</span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">موقوف</span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{a.content}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleToggle(a._id)}
                className={`p-2 rounded-lg transition-colors ${a.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                title={a.isActive ? "إيقاف" : "تفعيل"}
              >
                {a.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button onClick={() => handleDelete(a._id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Offices tab ── */
function OfficesTab() {
  const offices       = useQuery(api.admin.getAllOffices);
  const verifyOffice  = useMutation(api.admin.verifyOffice);
  const deleteOffice  = useMutation(api.admin.deleteOffice);
  const updateOffice  = useMutation(api.admin.adminUpdateOffice);
  const genUploadUrl  = useMutation(api.admin.generateLogoUploadUrl);
  const createOffice  = useMutation(api.admin.adminCreateOffice);

  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [editingId,  setEditingId]    = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState<any>({});
  const [saving, setSaving]           = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // نموذج إنشاء مكتب جديد
  const [newOfficeForm, setNewOfficeForm] = useState({
    name: "", city: "", phone: "", email: "",
    description: "", licenseNumber: "", commercialRegister: "",
    ownerEmail: "", isVerified: false,
  });
  const [creatingOffice, setCreatingOffice] = useState(false);

  const handleCreateOffice = async () => {
    if (!newOfficeForm.name || !newOfficeForm.city || !newOfficeForm.phone || !newOfficeForm.email) {
      toast.error("يرجى تعبئة الحقول المطلوبة: الاسم، المدينة، الجوال، البريد الإلكتروني");
      return;
    }
    setCreatingOffice(true);
    try {
      await createOffice({
        name: newOfficeForm.name,
        city: newOfficeForm.city,
        phone: newOfficeForm.phone,
        email: newOfficeForm.email,
        description: newOfficeForm.description || undefined,
        licenseNumber: newOfficeForm.licenseNumber || undefined,
        commercialRegister: newOfficeForm.commercialRegister || undefined,
        ownerEmail: newOfficeForm.ownerEmail || undefined,
        isVerified: newOfficeForm.isVerified,
      });
      toast.success("✅ تم إنشاء المكتب بنجاح");
      setShowCreate(false);
      setNewOfficeForm({ name: "", city: "", phone: "", email: "", description: "", licenseNumber: "", commercialRegister: "", ownerEmail: "", isVerified: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setCreatingOffice(false);
    }
  };

  const handleVerify = async (id: any, current: boolean) => {
    try {
      await verifyOffice({ officeId: id, isVerified: !current });
      toast.success(!current ? "✅ تم توثيق المكتب" : "تم إلغاء توثيق المكتب");
    } catch { toast.error("حدث خطأ"); }
  };

  const handleDelete = async (id: any, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف مكتب "${name}"؟`)) return;
    try {
      await deleteOffice({ officeId: id });
      toast.success("تم حذف المكتب");
    } catch { toast.error("حدث خطأ"); }
  };

  const startEdit = (o: any) => {
    setEditingId(o._id);
    setExpandedId(o._id);
    setForm({
      name: o.name ?? "",
      description: o.description ?? "",
      city: o.city ?? "",
      phone: o.phone ?? "",
      email: o.email ?? "",
      licenseNumber: o.licenseNumber ?? "",
      commercialRegister: o.commercialRegister ?? "",
      adminNotes: o.adminNotes ?? "",
    });
    setLogoPreview(o.logoUrl ?? null);
    setLogoFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (officeId: string) => {
    setSaving(true);
    try {
      let logoStorageId: any = undefined;
      if (logoFile) {
        const uploadUrl = await genUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        const { storageId } = await res.json();
        logoStorageId = storageId;
      }
      await updateOffice({
        officeId: officeId as any,
        ...form,
        ...(logoStorageId ? { logoStorageId } : {}),
      });
      toast.success("✅ تم حفظ بيانات المكتب بنجاح");
      setEditingId(null);
      setLogoFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (!offices) return <Spinner />;

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <h2 className="text-xl font-black text-gray-800">إدارة المكاتب</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {offices.length} مكتب • {offices.filter((o: any) => o.isVerified).length} موثق
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold text-sm hover:shadow-lg transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          إضافة مكتب جديد
        </button>
      </div>

      {/* نموذج إنشاء مكتب جديد */}
      {showCreate && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">إضافة مكتب جديد</h3>
              <p className="text-gray-500 text-xs">سيتم إنشاء المكتب مباشرة في المنصة</p>
            </div>
          </div>

          {/* الحقول الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "اسم المكتب *",         key: "name",        placeholder: "اسم المكتب" },
              { label: "المدينة *",             key: "city",        placeholder: "الرياض، جدة، مكة..." },
              { label: "رقم الجوال *",          key: "phone",       placeholder: "05xxxxxxxx" },
              { label: "البريد الإلكتروني *",   key: "email",       placeholder: "office@example.com" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
                <input
                  value={(newOfficeForm as any)[key]}
                  onChange={(e) => setNewOfficeForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inp}
                />
              </div>
            ))}
          </div>

          {/* الوثائق الرسمية */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-3">
            <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> الوثائق الرسمية (اختياري)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رقم الترخيص</label>
                <input
                  value={newOfficeForm.licenseNumber}
                  onChange={(e) => setNewOfficeForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                  placeholder="LIC-2024-XXXXX"
                  className={inp}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">السجل التجاري</label>
                <input
                  value={newOfficeForm.commercialRegister}
                  onChange={(e) => setNewOfficeForm((f) => ({ ...f, commercialRegister: e.target.value }))}
                  placeholder="1010XXXXXX"
                  className={inp}
                />
              </div>
            </div>
          </div>

          {/* ربط بمستخدم موجود */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <label className="text-xs font-bold text-blue-700 mb-1.5 block flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5" /> ربط بحساب مستخدم موجود (اختياري)
            </label>
            <input
              value={newOfficeForm.ownerEmail}
              onChange={(e) => setNewOfficeForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              placeholder="بريد المستخدم المسجل في المنصة..."
              className={`${inp} bg-white`}
            />
            <p className="text-xs text-blue-600 mt-1.5">إذا أدخلت بريداً إلكترونياً لمستخدم مسجل، سيتم ربطه كمالك للمكتب تلقائياً</p>
          </div>

          {/* وصف المكتب */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">وصف المكتب (اختياري)</label>
            <textarea
              value={newOfficeForm.description}
              onChange={(e) => setNewOfficeForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="وصف مختصر عن المكتب وخدماته..."
              className={`${inp} resize-none`}
            />
          </div>

          {/* توثيق فوري */}
          <label className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-emerald-100">
            <input
              type="checkbox"
              checked={newOfficeForm.isVerified}
              onChange={(e) => setNewOfficeForm((f) => ({ ...f, isVerified: e.target.checked }))}
              className="w-4 h-4 accent-emerald-600"
            />
            <div>
              <span className="text-sm font-bold text-gray-700">توثيق المكتب فوراً</span>
              <p className="text-xs text-gray-400">سيظهر شارة "موثق" على المكتب مباشرة</p>
            </div>
          </label>

          {/* أزرار */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreateOffice}
              disabled={creatingOffice}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {creatingOffice
                ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإنشاء...</>
                : <><Building2 className="w-4 h-4" />إنشاء المكتب</>
              }
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {offices.length === 0 ? (
        <Empty icon={<Building2 className="w-12 h-12 text-gray-200" />} text="لا توجد مكاتب مسجلة" />
      ) : offices.map((o: any) => {
        const isExpanded = expandedId === o._id;
        const isEditing  = editingId  === o._id;

        return (
          <div key={o._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {o.logoUrl ? (
                      <img src={o.logoUrl} alt={o.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-700 font-black text-xl">{o.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">{o.name}</span>
                      {o.isVerified && (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          <BadgeCheck className="w-3 h-3" /> موثق
                        </span>
                      )}
                      {o.isActive === false && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">معطل</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{o.city} • {o.phone}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">{o.packageCount} برنامج</span>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">{o.bookingCount} حجز</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleVerify(o._id, o.isVerified)} className={`p-2 rounded-lg text-xs font-bold transition-colors ${o.isVerified ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {o.isVerified ? <BadgeCheck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </button>
                  <button onClick={() => isEditing ? cancelEdit() : startEdit(o)} className={`p-2 rounded-lg transition-colors ${isEditing ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setExpandedId(isExpanded && !isEditing ? null : o._id)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(o._id, o.name)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                {!isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "البريد الإلكتروني", value: o.email, icon: "📧" },
                      { label: "رقم الترخيص",       value: o.licenseNumber || "غير محدد", icon: "📄" },
                      { label: "السجل التجاري",      value: o.commercialRegister || "غير محدد", icon: "#️⃣" },
                      { label: "التقييم",            value: o.rating ? `${o.rating} ⭐` : "لا يوجد", icon: "⭐" },
                      { label: "عدد التقييمات",      value: `${o.reviewCount ?? 0} تقييم`, icon: "💬" },
                      { label: "الوصف",              value: o.description, icon: "📝" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{icon} {label}</div>
                        <div className="font-semibold text-gray-700 text-xs leading-relaxed">{value}</div>
                      </div>
                    ))}
                    {o.adminNotes && (
                      <div className="col-span-2 md:col-span-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="text-xs text-amber-600 mb-1 font-semibold">📌 ملاحظات الأدمن</div>
                        <div className="text-sm text-amber-800">{o.adminNotes}</div>
                      </div>
                    )}
                    <div className="col-span-2 md:col-span-3">
                      <button onClick={() => startEdit(o)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
                        <Edit3 className="w-4 h-4" /> تعديل بيانات المكتب
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-600" />
                      تعديل بيانات المكتب
                    </h3>
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                          ) : (
                            <ImagePlus className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-sm mb-1">شعار المكتب</p>
                          <p className="text-xs text-gray-400 mb-3">PNG أو JPG، الحجم الأقصى 2MB</p>
                          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-200">
                            <Upload className="w-4 h-4" />
                            {logoPreview ? "تغيير الشعار" : "رفع الشعار"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "اسم المكتب *",       key: "name",        placeholder: "اسم المكتب" },
                        { label: "المدينة *",           key: "city",        placeholder: "الرياض، جدة..." },
                        { label: "رقم الجوال *",        key: "phone",       placeholder: "05xxxxxxxx" },
                        { label: "البريد الإلكتروني *", key: "email",       placeholder: "office@example.com" },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
                          <input value={form[key] ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inp} />
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-4">
                      <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" /> الوثائق الرسمية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رقم الترخيص</label>
                          <input value={form.licenseNumber ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, licenseNumber: e.target.value }))} placeholder="LIC-2024-XXXXX" className={inp} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">السجل التجاري</label>
                          <input value={form.commercialRegister ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, commercialRegister: e.target.value }))} placeholder="1010XXXXXX" className={inp} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">وصف المكتب</label>
                      <textarea value={form.description ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} className={`${inp} resize-none`} />
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <label className="text-xs font-semibold text-blue-700 mb-1.5 block flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5" /> ملاحظات الأدمن (داخلية)
                      </label>
                      <textarea value={form.adminNotes ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, adminNotes: e.target.value }))} rows={2} className={`${inp} resize-none bg-white`} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleSave(o._id)} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                        {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                      </button>
                      <button onClick={cancelEdit} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Bookings tab ── */
function BookingsTab() {
  const bookings    = useQuery(api.admin.getAllBookings);
  const allUsers    = useQuery(api.admin.getAllUsers);
  const allPackages = useQuery(api.packages.list, {});
  const adminCreate = useMutation(api.bookings.adminCreateBooking);
  const updateStatus = useMutation(api.admin.adminUpdateBookingStatus);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [searchQ, setSearchQ]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const [form, setForm] = useState({
    userId: "",
    packageId: "",
    adultsCount: 1,
    childrenCount: 0,
    leadPassengerName: "",
    leadPassengerPhone: "",
    leadPassengerIdNumber: "",
    notes: "",
    status: "confirmed",
  });

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  // حساب السعر التقديري
  const selectedPkg = (allPackages as any[])?.find((p: any) => p._id === form.packageId);
  const estimatedPrice = selectedPkg
    ? selectedPkg.price * form.adultsCount + selectedPkg.price * 0.5 * form.childrenCount
    : 0;

  const handleCreate = async () => {
    if (!form.userId || !form.packageId || !form.leadPassengerName || !form.leadPassengerPhone || !form.leadPassengerIdNumber) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      const result = await adminCreate({
        packageId: form.packageId as any,
        userId: form.userId as any,
        adultsCount: form.adultsCount,
        childrenCount: form.childrenCount > 0 ? form.childrenCount : undefined,
        leadPassengerName: form.leadPassengerName,
        leadPassengerPhone: form.leadPassengerPhone,
        leadPassengerIdNumber: form.leadPassengerIdNumber,
        notes: form.notes || undefined,
        status: form.status,
      }) as any;
      toast.success(`✅ تم إنشاء الحجز بنجاح! رقم الحجز: ${result.bookingRef}`);
      setShowForm(false);
      setForm({ userId: "", packageId: "", adultsCount: 1, childrenCount: 0, leadPassengerName: "", leadPassengerPhone: "", leadPassengerIdNumber: "", notes: "", status: "confirmed" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (bookingId: any, newStatus: string) => {
    try {
      await updateStatus({ bookingId, status: newStatus });
      toast.success("✅ تم تحديث حالة الحجز");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  // فلترة الحجوزات
  const filtered = (bookings ?? []).filter((b: any) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      b.leadPassengerName?.toLowerCase().includes(q) ||
      b.bookingReference?.toLowerCase().includes(q) ||
      b.leadPassengerPhone?.includes(q) ||
      b.package?.title?.toLowerCase().includes(q) ||
      b.office?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (!bookings) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800">إدارة الحجوزات</h2>
          <p className="text-gray-500 text-sm mt-0.5">{bookings.length} حجز إجمالاً</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold text-sm hover:shadow-lg transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          إنشاء حجز جديد
        </button>
      </div>

      {/* نموذج إنشاء حجز */}
      {showForm && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">إنشاء حجز جديد</h3>
              <p className="text-gray-500 text-xs">سيتم إرسال إشعار بالتذكرة للمعتمر تلقائياً</p>
            </div>
          </div>

          {/* اختيار المعتمر والبرنامج */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> المعتمر *
              </label>
              <select
                value={form.userId}
                onChange={(e) => {
                  const u = (allUsers as any[])?.find((u: any) => u._id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    userId: e.target.value,
                    leadPassengerName: u?.name ?? f.leadPassengerName,
                    leadPassengerPhone: u?.phone ?? f.leadPassengerPhone,
                    leadPassengerIdNumber: u?.idNumber ?? f.leadPassengerIdNumber,
                  }));
                }}
                className={inp}
              >
                <option value="">-- اختر المعتمر --</option>
                {(allUsers as any[])?.filter((u: any) => !u.isAdmin && !u.isOfficeOwner).map((u: any) => (
                  <option key={u._id} value={u._id}>
                    {u.name ?? "بدون اسم"} — {u.email ?? u.phone ?? u._id.slice(-6)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> البرنامج *
              </label>
              <select
                value={form.packageId}
                onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                className={inp}
              >
                <option value="">-- اختر البرنامج --</option>
                {(allPackages as any[])?.filter((p: any) => p.isActive !== false && p.availableSeats > 0).map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.title} — {p.price.toLocaleString("ar-SA")} ر.س — {p.availableSeats} مقعد متاح
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* معلومات المسافر الرئيسي */}
          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-4">
            <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-emerald-600" />
              بيانات المسافر الرئيسي
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">الاسم الكامل *</label>
                <input
                  value={form.leadPassengerName}
                  onChange={(e) => setForm((f) => ({ ...f, leadPassengerName: e.target.value }))}
                  placeholder="اسم المسافر"
                  className={inp}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رقم الجوال *</label>
                <input
                  value={form.leadPassengerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, leadPassengerPhone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  className={inp}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">رقم الهوية / الجواز *</label>
                <input
                  value={form.leadPassengerIdNumber}
                  onChange={(e) => setForm((f) => ({ ...f, leadPassengerIdNumber: e.target.value }))}
                  placeholder="1xxxxxxxxx"
                  className={inp}
                />
              </div>
            </div>
          </div>

          {/* عدد المسافرين والحالة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">عدد البالغين *</label>
              <input
                type="number"
                min={1}
                max={selectedPkg?.availableSeats ?? 20}
                value={form.adultsCount}
                onChange={(e) => setForm((f) => ({ ...f, adultsCount: parseInt(e.target.value) || 1 }))}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">عدد الأطفال</label>
              <input
                type="number"
                min={0}
                value={form.childrenCount}
                onChange={(e) => setForm((f) => ({ ...f, childrenCount: parseInt(e.target.value) || 0 }))}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">حالة الحجز</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inp}
              >
                <option value="confirmed">مؤكد</option>
                <option value="pending">معلق</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">السعر الإجمالي</label>
              <div className="px-3 py-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-700 text-center">
                {estimatedPrice > 0 ? `${estimatedPrice.toLocaleString("ar-SA")} ر.س` : "—"}
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">ملاحظات (اختياري)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="أي ملاحظات إضافية..."
              className={`${inp} resize-none`}
            />
          </div>

          {/* معلومات البرنامج المختار */}
          {selectedPkg && (
            <div className="bg-white rounded-xl p-4 border border-blue-100 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm">{selectedPkg.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {selectedPkg.departureCity} • {selectedPkg.departureDate} → {selectedPkg.returnDate}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedPkg.price.toLocaleString("ar-SA")} ر.س / شخص
                  </span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedPkg.availableSeats} مقعد متاح
                  </span>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedPkg.duration} يوم
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* أزرار */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />جاري الإنشاء...</>
              ) : (
                <><CalendarCheck className="w-4 h-4" />إنشاء الحجز وإرسال التذكرة</>
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* فلاتر البحث */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="بحث بالاسم أو رقم الحجز أو الجوال..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  filterStatus === s
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? `الكل (${bookings.length})` :
                 s === "pending" ? `معلق (${bookings.filter((b: any) => b.status === "pending").length})` :
                 s === "confirmed" ? `مؤكد (${bookings.filter((b: any) => b.status === "confirmed").length})` :
                 s === "completed" ? `مكتمل (${bookings.filter((b: any) => b.status === "completed").length})` :
                 `ملغي (${bookings.filter((b: any) => b.status === "cancelled").length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* قائمة الحجوزات */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Empty icon={<CalendarCheck className="w-12 h-12 text-gray-200" />} text="لا توجد حجوزات" />
        ) : filtered.map((b: any) => {
          const st = STATUS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
          const isExpanded = expandedId === b._id;
          return (
            <div key={b._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-gray-800">{b.leadPassengerName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="text-xs text-emerald-600 font-bold font-mono">{b.bookingReference}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.package?.title} • {b.office?.name}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-black text-emerald-700 text-sm">{b.totalPrice.toLocaleString("ar-SA")} ر.س</div>
                      <div className="text-xs text-gray-400">{b.adultsCount} بالغ{b.childrenCount ? ` + ${b.childrenCount} طفل` : ""}</div>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : b._id)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3">
                  <InfoCell label="المكتب"    value={b.office?.name ?? "-"} />
                  <InfoCell label="الجوال"    value={b.leadPassengerPhone} />
                  <InfoCell label="رقم الهوية" value={b.leadPassengerIdNumber} />
                  <InfoCell label="تاريخ الإنشاء" value={new Date(b._creationTime).toLocaleDateString("ar-SA")} />
                </div>
              </div>

              {/* تفاصيل موسّعة */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4">
                  {/* تغيير الحالة */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 block flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      تغيير حالة الحجز
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["pending", "confirmed", "completed", "cancelled"].map((s) => {
                        const sInfo = STATUS[s] ?? { label: s, cls: "" };
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(b._id, s)}
                            disabled={b.status === s}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              b.status === s
                                ? `${sInfo.cls} ring-2 ring-offset-1 ring-current opacity-100 cursor-default`
                                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700"
                            }`}
                          >
                            {sInfo.label}
                            {b.status === s && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* تفاصيل إضافية */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-gray-400 mb-0.5">البرنامج</div>
                      <div className="font-semibold text-gray-700">{b.package?.title ?? "-"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-gray-400 mb-0.5">تاريخ الانطلاق</div>
                      <div className="font-semibold text-gray-700">{b.package?.departureDate ?? "-"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-gray-400 mb-0.5">المدينة</div>
                      <div className="font-semibold text-gray-700">{b.package?.departureCity ?? "-"}</div>
                    </div>
                    {b.commissionRate && (
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <div className="text-emerald-600 mb-0.5">العمولة ({b.commissionRate}%)</div>
                        <div className="font-black text-emerald-700">{b.commissionAmount?.toLocaleString("ar-SA")} ر.س</div>
                      </div>
                    )}
                    {b.netAmount && (
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="text-blue-600 mb-0.5">صافي المكتب</div>
                        <div className="font-black text-blue-700">{b.netAmount?.toLocaleString("ar-SA")} ر.س</div>
                      </div>
                    )}
                    {b.notes && (
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 col-span-2 md:col-span-1">
                        <div className="text-amber-600 mb-0.5">ملاحظات</div>
                        <div className="font-semibold text-amber-800">{b.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* بيانات المستخدم */}
                  {b.user && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black flex-shrink-0">
                        {(b.user.name ?? b.user.email ?? "؟").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{b.user.name ?? "بدون اسم"}</div>
                        <div className="text-xs text-gray-400">{b.user.email ?? b.user.phone ?? "-"}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   تبويب المستخدمين - لوحة متقدمة مع 4 أقسام منفصلة
══════════════════════════════════════════════════════════ */
type UserSubTab = "all" | "pilgrims" | "offices" | "drivers" | "admins";

function UsersTab() {
  const [subTab, setSubTab] = useState<UserSubTab>("all");

  const SUB_TABS: { key: UserSubTab; label: string; emoji: string; color: string; activeColor: string }[] = [
    { key: "all",      label: "الكل",       emoji: "👥", color: "bg-gray-100 text-gray-700",       activeColor: "bg-gray-800 text-white" },
    { key: "pilgrims", label: "المعتمرون",  emoji: "🕋", color: "bg-emerald-100 text-emerald-700", activeColor: "bg-emerald-600 text-white" },
    { key: "offices",  label: "المكاتب",    emoji: "🏢", color: "bg-blue-100 text-blue-700",       activeColor: "bg-blue-600 text-white" },
    { key: "drivers",  label: "السائقون",   emoji: "🚌", color: "bg-amber-100 text-amber-700",     activeColor: "bg-amber-600 text-white" },
    { key: "admins",   label: "المشرفون",   emoji: "🛡️", color: "bg-purple-100 text-purple-700",   activeColor: "bg-purple-600 text-white" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800">إدارة المستخدمين</h2>
          <p className="text-gray-500 text-sm mt-0.5">إدارة شاملة لجميع أنواع الحسابات</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map(({ key, label, emoji, color, activeColor }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              subTab === key ? activeColor + " shadow-md" : color + " hover:opacity-80"
            }`}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* المحتوى حسب التبويب */}
      {subTab === "all"      && <AllUsersPanel />}
      {subTab === "pilgrims" && <PilgrimsPanel />}
      {subTab === "offices"  && <OfficeUsersPanel />}
      {subTab === "drivers"  && <DriversPanel />}
      {subTab === "admins"   && <AdminsPanel />}
    </div>
  );
}

/* ── مكوّن مشترك: بطاقة مستخدم ── */
function UserCard({
  u,
  badge,
  extraInfo,
  onToggleAdmin,
  onToggleActive,
  onDelete,
  onEdit,
  isDeleting,
}: {
  u: any;
  badge?: React.ReactNode;
  extraInfo?: React.ReactNode;
  onToggleAdmin?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isDeleting?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = u.isActive !== false;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${!isActive ? "border-red-100 opacity-80" : "border-gray-100"}`}>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* معلومات المستخدم */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${
              u.isAdmin ? "bg-purple-100 text-purple-700" :
              u.accountType === "office" ? "bg-blue-100 text-blue-700" :
              u.accountType === "driver" ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {(u.name ?? u.email ?? "؟").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800 text-sm">{u.name ?? "بدون اسم"}</span>
                {!isActive && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">معطّل</span>}
                {badge}
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5">{u.email ?? u.phone ?? "-"}</div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {u.isAdmin && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> مشرف
                  </span>
                )}
                {u.accountType && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    u.accountType === "pilgrim" ? "bg-emerald-100 text-emerald-700" :
                    u.accountType === "office"  ? "bg-blue-100 text-blue-700" :
                    u.accountType === "driver"  ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.accountType === "pilgrim" ? "🕋 معتمر" :
                     u.accountType === "office"  ? "🏢 مكتب" :
                     u.accountType === "driver"  ? "🚌 سائق" : u.accountType}
                  </span>
                )}
                {u.city && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{u.city}</span>}
              </div>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {onEdit && (
              <button onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold border border-emerald-200"
                title="تعديل">
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تعديل</span>
              </button>
            )}
            {onToggleActive && (
              <button onClick={onToggleActive}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold border ${
                  isActive
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
                title={isActive ? "تعطيل الحساب" : "تفعيل الحساب"}>
                {isActive
                  ? <><ToggleRight className="w-3.5 h-3.5" /><span className="hidden sm:inline">تعطيل</span></>
                  : <><ToggleLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">تفعيل</span></>
                }
              </button>
            )}
            {onToggleAdmin && (
              <button onClick={onToggleAdmin}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold border ${
                  u.isAdmin
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                }`}
                title={u.isAdmin ? "إلغاء المشرف" : "منح مشرف"}>
                {u.isAdmin
                  ? <><ShieldOff className="w-3.5 h-3.5" /><span className="hidden sm:inline">إلغاء مشرف</span></>
                  : <><ShieldCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">مشرف</span></>
                }
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onDelete && (
              <button onClick={onDelete} disabled={isDeleting || u.isAdmin}
                title={u.isAdmin ? "لا يمكن حذف المشرف" : "حذف الحساب نهائياً مع جميع بياناته"}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold border border-red-200 disabled:opacity-30 disabled:cursor-not-allowed">
                {isDeleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">جارٍ الحذف...</span></>
                  : <><Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">حذف نهائي</span></>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* تفاصيل موسّعة */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { label: "البريد الإلكتروني", value: u.email ?? "غير محدد", icon: "📧" },
              { label: "رقم الجوال",        value: u.phone ?? "غير محدد", icon: "📱" },
              { label: "المدينة",            value: u.city ?? "غير محدد",  icon: "📍" },
              { label: "رقم الهوية",         value: u.idNumber ?? "غير محدد", icon: "🪪" },
              { label: "رصيد المحفظة",       value: u.walletBalance ? `${u.walletBalance.toLocaleString("ar-SA")} ر.س` : "0 ر.س", icon: "💰" },
              { label: "تاريخ التسجيل",      value: new Date(u._creationTime).toLocaleDateString("ar-SA"), icon: "📅" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-gray-400 mb-0.5">{icon} {label}</div>
                <div className="font-semibold text-gray-700 truncate">{value}</div>
              </div>
            ))}
          </div>
          {extraInfo}
        </div>
      )}
    </div>
  );
}

/* ── مكوّن تعديل المستخدم ── */
function EditUserModal({ u, onClose }: { u: any; onClose: () => void }) {
  const updateUser    = useMutation(api.admin.adminUpdateUser);
  const setAccountType = useMutation(api.admin.adminSetAccountType);
  const [form, setForm] = useState({
    name: u.name ?? "",
    phone: u.phone ?? "",
    city: u.city ?? "",
    isAdmin: u.isAdmin ?? false,
    isActive: u.isActive !== false,
    accountType: u.accountType ?? "",
  });
  const [saving, setSaving] = useState(false);

  const PERMISSIONS = [
    { key: "manage_packages", label: "إدارة البرامج" },
    { key: "manage_bookings", label: "إدارة الحجوزات" },
    { key: "manage_users",    label: "إدارة المستخدمين" },
    { key: "view_reports",    label: "عرض التقارير" },
    { key: "manage_payments", label: "إدارة المدفوعات" },
    { key: "send_whatsapp",   label: "إرسال واتساب" },
  ];

  const [perms, setPerms] = useState<string[]>(u.customPermissions ?? []);

  const togglePerm = (key: string) => {
    setPerms((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        userId: u._id,
        name: form.name || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        isAdmin: form.isAdmin,
        isActive: form.isActive,
        accountType: form.accountType || undefined,
        customPermissions: perms,
      });
      toast.success("✅ تم تحديث بيانات المستخدم");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-800 text-lg">تعديل بيانات المستخدم</h3>
            <p className="text-gray-400 text-xs mt-0.5">{u.email ?? u.phone}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* البيانات الأساسية */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "الاسم الكامل", key: "name", placeholder: "اسم المستخدم" },
              { label: "رقم الجوال",   key: "phone", placeholder: "05xxxxxxxx" },
              { label: "المدينة",       key: "city",  placeholder: "الرياض، جدة..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inp}
                />
              </div>
            ))}
          </div>

          {/* نوع الحساب */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">نوع الحساب</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "pilgrim", label: "🕋 معتمر",  color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                { val: "office",  label: "🏢 مكتب",   color: "border-blue-400 bg-blue-50 text-blue-700" },
                { val: "driver",  label: "🚌 سائق",   color: "border-amber-400 bg-amber-50 text-amber-700" },
                { val: "",        label: "👤 عادي",   color: "border-gray-400 bg-gray-50 text-gray-700" },
              ].map(({ val, label, color }) => (
                <button
                  key={val}
                  onClick={() => setForm((f) => ({ ...f, accountType: val }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    form.accountType === val ? color : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* الصلاحيات */}
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <h4 className="font-bold text-purple-800 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> الصلاحيات المخصصة
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer bg-white rounded-xl p-2.5 border border-purple-100 hover:border-purple-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={perms.includes(key)}
                    onChange={() => togglePerm(key)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* حالة الحساب */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer bg-amber-50 rounded-xl p-3 border border-amber-100">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                className="w-4 h-4 accent-amber-600"
              />
              <div>
                <span className="text-sm font-bold text-amber-800">مشرف</span>
                <p className="text-xs text-amber-600">صلاحيات كاملة</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-emerald-600"
              />
              <div>
                <span className="text-sm font-bold text-emerald-800">حساب نشط</span>
                <p className="text-xs text-emerald-600">يمكنه تسجيل الدخول</p>
              </div>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</> : <><Save className="w-4 h-4" />حفظ التعديلات</>}
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── لوحة: جميع المستخدمين ── */
function AllUsersPanel() {
  const users        = useQuery(api.admin.getAllUsers);
  const setAdmin     = useMutation(api.admin.setUserAdmin);
  const deleteUser   = useMutation(api.admin.deleteUser);
  const toggleActive = useMutation(api.admin.toggleUserActive);
  const [searchQ, setSearchQ]     = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!users) return <Spinner />;

  const filtered = users.filter((u: any) => {
    const q = searchQ.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.phone ?? "").includes(q);
  });

  const stats = {
    total: users.length,
    pilgrims: users.filter((u: any) => u.accountType === "pilgrim").length,
    offices:  users.filter((u: any) => u.accountType === "office").length,
    drivers:  users.filter((u: any) => u.accountType === "driver").length,
    admins:   users.filter((u: any) => u.isAdmin).length,
    inactive: users.filter((u: any) => u.isActive === false).length,
  };

  return (
    <div className="space-y-4">
      {/* إحصائيات */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "الكل",       value: stats.total,    color: "from-gray-500 to-gray-700" },
          { label: "معتمرون",    value: stats.pilgrims, color: "from-emerald-500 to-emerald-700" },
          { label: "مكاتب",      value: stats.offices,  color: "from-blue-500 to-blue-700" },
          { label: "سائقون",     value: stats.drivers,  color: "from-amber-500 to-amber-700" },
          { label: "مشرفون",     value: stats.admins,   color: "from-purple-500 to-purple-700" },
          { label: "معطّلون",    value: stats.inactive, color: "from-red-500 to-red-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-3 text-white text-center`}>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-white/70 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* بحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          placeholder="بحث بالاسم أو البريد أو الجوال..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
        {searchQ && <button onClick={() => setSearchQ("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <Empty icon={<Users className="w-12 h-12 text-gray-200" />} text="لا يوجد مستخدمون" />
      ) : filtered.map((u: any) => (
        <UserCard
          key={u._id}
          u={u}
          isDeleting={deletingId === u._id}
          onEdit={() => setEditingUser(u)}
          onToggleActive={async () => {
            try {
              await toggleActive({ userId: u._id, isActive: u.isActive === false });
              toast.success(u.isActive === false ? "✅ تم تفعيل الحساب" : "تم تعطيل الحساب");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
          }}
          onToggleAdmin={async () => {
            if (!confirm(`${u.isAdmin ? "إلغاء" : "منح"} صلاحيات المشرف لـ ${u.email}؟`)) return;
            try {
              await setAdmin({ userId: u._id, isAdmin: !u.isAdmin });
              toast.success(u.isAdmin ? "تم إلغاء صلاحيات المشرف" : "✅ تم منح صلاحيات المشرف");
            } catch { toast.error("حدث خطأ"); }
          }}
          onDelete={async () => {
            if (!confirm(`⚠️ تحذير: سيتم حذف حساب "${u.name ?? u.email}" نهائياً مع جميع بياناته (الحجوزات، المدفوعات، المحفظة، المحادثات). هل أنت متأكد؟`)) return;
            setDeletingId(u._id);
            try {
              await deleteUser({ userId: u._id });
              toast.success("✅ تم حذف الحساب وجميع بياناته نهائياً");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
            finally { setDeletingId(null); }
          }}
        />
      ))}

      {editingUser && <EditUserModal u={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

/* ── لوحة: المعتمرون ── */
function PilgrimsPanel() {
  const pilgrims     = useQuery(api.admin.getPilgrimUsers);
  const deleteUser   = useMutation(api.admin.deleteUser);
  const toggleActive = useMutation(api.admin.toggleUserActive);
  const [searchQ, setSearchQ]       = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!pilgrims) return <Spinner />;

  const filtered = pilgrims.filter((u: any) => {
    const q = searchQ.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">🕋</div>
          <div>
            <h3 className="font-black text-gray-800">المعتمرون</h3>
            <p className="text-gray-500 text-sm">{pilgrims.length} معتمر مسجل</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-black text-emerald-700">{pilgrims.reduce((s: number, u: any) => s + (u.bookingCount ?? 0), 0)}</div>
            <div className="text-xs text-emerald-600">إجمالي الحجوزات</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-black text-blue-700">{pilgrims.reduce((s: number, u: any) => s + (u.walletBalance ?? 0), 0).toLocaleString("ar-SA")}</div>
            <div className="text-xs text-blue-600">إجمالي المحافظ (ر.س)</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          placeholder="بحث في المعتمرين..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<span className="text-5xl">🕋</span>} text="لا يوجد معتمرون" />
      ) : filtered.map((u: any) => (
        <UserCard
          key={u._id}
          u={u}
          badge={
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {u.bookingCount ?? 0} حجز
            </span>
          }
          extraInfo={
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-gray-400 mb-0.5">💰 رصيد المحفظة</div>
                <div className="font-black text-emerald-700">{(u.walletBalance ?? 0).toLocaleString("ar-SA")} ر.س</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-gray-400 mb-0.5">📦 عدد الحجوزات</div>
                <div className="font-black text-blue-700">{u.bookingCount ?? 0} حجز</div>
              </div>
            </div>
          }
          isDeleting={deletingId === u._id}
          onEdit={() => setEditingUser(u)}
          onToggleActive={async () => {
            try {
              await toggleActive({ userId: u._id, isActive: u.isActive === false });
              toast.success(u.isActive === false ? "✅ تم تفعيل الحساب" : "تم تعطيل الحساب");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
          }}
          onDelete={async () => {
            if (!confirm(`⚠️ تحذير: سيتم حذف حساب "${u.name ?? u.email}" نهائياً مع جميع بياناته (الحجوزات، المدفوعات، المحفظة، المحادثات). هل أنت متأكد؟`)) return;
            setDeletingId(u._id);
            try {
              await deleteUser({ userId: u._id });
              toast.success("✅ تم حذف الحساب وجميع بياناته نهائياً");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
            finally { setDeletingId(null); }
          }}
        />
      ))}

      {editingUser && <EditUserModal u={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

/* ── لوحة: مستخدمو المكاتب ── */
function OfficeUsersPanel() {
  const users        = useQuery(api.admin.getUsersByType, { accountType: "office" });
  const deleteUser   = useMutation(api.admin.deleteUser);
  const toggleActive = useMutation(api.admin.toggleUserActive);
  const [searchQ, setSearchQ]       = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!users) return <Spinner />;

  const filtered = users.filter((u: any) => {
    const q = searchQ.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🏢</div>
        <div>
          <h3 className="font-black text-gray-800">مستخدمو المكاتب</h3>
          <p className="text-gray-500 text-sm">{users.length} مستخدم مرتبط بمكتب</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          placeholder="بحث في مستخدمي المكاتب..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<Building2 className="w-12 h-12 text-gray-200" />} text="لا يوجد مستخدمو مكاتب" />
      ) : filtered.map((u: any) => (
        <UserCard
          key={u._id}
          u={u}
          isDeleting={deletingId === u._id}
          onEdit={() => setEditingUser(u)}
          onToggleActive={async () => {
            try {
              await toggleActive({ userId: u._id, isActive: u.isActive === false });
              toast.success(u.isActive === false ? "✅ تم تفعيل الحساب" : "تم تعطيل الحساب");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
          }}
          onDelete={async () => {
            if (!confirm(`⚠️ تحذير: سيتم حذف حساب "${u.name ?? u.email}" نهائياً مع جميع بياناته (الحجوزات، المدفوعات، المحفظة، المحادثات). هل أنت متأكد؟`)) return;
            setDeletingId(u._id);
            try {
              await deleteUser({ userId: u._id });
              toast.success("✅ تم حذف الحساب وجميع بياناته نهائياً");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
            finally { setDeletingId(null); }
          }}
        />
      ))}

      {editingUser && <EditUserModal u={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

/* ── لوحة: السائقون ── */
function DriversPanel() {
  const drivers        = useQuery(api.admin.getDriverUsers);
  const deleteUser     = useMutation(api.admin.deleteUser);
  const toggleActive   = useMutation(api.admin.toggleUserActive);
  const approveDriver  = useMutation(api.drivers.adminApprove);
  const [searchQ, setSearchQ]         = useState("");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!drivers) return <Spinner />;

  const filtered = drivers.filter((u: any) => {
    const q = searchQ.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  const approved = drivers.filter((u: any) => u.driverRecord?.isApproved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🚌</div>
          <div>
            <h3 className="font-black text-gray-800">السائقون</h3>
            <p className="text-gray-500 text-sm">{drivers.length} سائق مسجل • {approved} معتمد</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-black text-amber-700">{approved}</div>
            <div className="text-xs text-amber-600">سائق معتمد</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-black text-red-700">{drivers.length - approved}</div>
            <div className="text-xs text-red-600">بانتظار الاعتماد</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          placeholder="بحث في السائقين..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all" />
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<span className="text-5xl">🚌</span>} text="لا يوجد سائقون" />
      ) : filtered.map((u: any) => (
        <UserCard
          key={u._id}
          u={u}
          badge={
            u.driverRecord?.isApproved
              ? <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" /> معتمد</span>
              : <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">بانتظار الاعتماد</span>
          }
          extraInfo={
            u.driverRecord && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: "رقم الجوال", value: u.driverRecord.phone ?? "غير محدد", icon: "📱" },
                    { label: "الجنسية",    value: u.driverRecord.nationality ?? "غير محدد", icon: "🌍" },
                    { label: "رقم الهوية", value: u.driverRecord.idNumber ?? "غير محدد", icon: "🪪" },
                    { label: "رقم اللوحة", value: u.driverRecord.plateNumber ?? "غير محدد", icon: "🚌" },
                    { label: "نوع الحافلة", value: u.driverRecord.busType ?? "غير محدد", icon: "🚍" },
                    { label: "السعة",       value: u.driverRecord.busCapacity ? `${u.driverRecord.busCapacity} راكب` : "غير محدد", icon: "👥" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-gray-400 mb-0.5">{icon} {label}</div>
                      <div className="font-semibold text-gray-700 truncate">{value}</div>
                    </div>
                  ))}
                </div>
                {/* ── زر الاعتماد ── */}
                <div className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${
                  u.driverRecord.isApproved
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      u.driverRecord.isApproved ? "bg-emerald-100" : "bg-amber-100"
                    }`}>
                      {u.driverRecord.isApproved ? "✅" : "⏳"}
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${u.driverRecord.isApproved ? "text-emerald-800" : "text-amber-800"}`}>
                        {u.driverRecord.isApproved ? "السائق معتمد" : "بانتظار الاعتماد"}
                      </div>
                      <div className={`text-xs ${u.driverRecord.isApproved ? "text-emerald-600" : "text-amber-600"}`}>
                        {u.driverRecord.isApproved
                          ? "يمكن للسائق استقبال الرحلات"
                          : "لم يتم اعتماد السائق بعد"}
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={approvingId === u.driverRecord._id}
                    onClick={async () => {
                      setApprovingId(u.driverRecord._id);
                      try {
                        await approveDriver({
                          driverId: u.driverRecord._id,
                          approved: !u.driverRecord.isApproved,
                        });
                        toast.success(
                          u.driverRecord.isApproved
                            ? "تم إلغاء اعتماد السائق"
                            : "✅ تم اعتماد السائق بنجاح!"
                        );
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "حدث خطأ");
                      } finally {
                        setApprovingId(null);
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-sm ${
                      u.driverRecord.isApproved
                        ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                    }`}
                  >
                    {approvingId === u.driverRecord._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : u.driverRecord.isApproved ? (
                      <><ShieldOff className="w-4 h-4" />إلغاء الاعتماد</>
                    ) : (
                      <><BadgeCheck className="w-4 h-4" />اعتماد السائق</>
                    )}
                  </button>
                </div>
              </div>
            )
          }
          isDeleting={deletingId === u._id}
          onEdit={() => setEditingUser(u)}
          onToggleActive={async () => {
            try {
              await toggleActive({ userId: u._id, isActive: u.isActive === false });
              toast.success(u.isActive === false ? "✅ تم تفعيل الحساب" : "تم تعطيل الحساب");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
          }}
          onDelete={async () => {
            if (!confirm(`⚠️ تحذير: سيتم حذف حساب "${u.name ?? u.email}" نهائياً مع جميع بياناته (الحجوزات، المدفوعات، المحفظة، المحادثات). هل أنت متأكد؟`)) return;
            setDeletingId(u._id);
            try {
              await deleteUser({ userId: u._id });
              toast.success("✅ تم حذف الحساب وجميع بياناته نهائياً");
            } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
            finally { setDeletingId(null); }
          }}
        />
      ))}

      {editingUser && <EditUserModal u={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

/* ── لوحة: المشرفون ── */
function AdminsPanel() {
  const users    = useQuery(api.admin.getAllUsers);
  const setAdmin = useMutation(api.admin.setUserAdmin);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!users) return <Spinner />;

  const admins = users.filter((u: any) => u.isAdmin);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>
        <div>
          <h3 className="font-black text-gray-800">المشرفون</h3>
          <p className="text-gray-500 text-sm">{admins.length} مشرف في المنصة</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          المشرفون لديهم صلاحيات كاملة على المنصة. لا يمكن حذف حساب مشرف مباشرة — قم بإلغاء صلاحياته أولاً.
        </p>
      </div>

      {admins.length === 0 ? (
        <Empty icon={<ShieldCheck className="w-12 h-12 text-gray-200" />} text="لا يوجد مشرفون" />
      ) : admins.map((u: any) => (
        <UserCard
          key={u._id}
          u={u}
          badge={
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> مشرف رئيسي
            </span>
          }
          onEdit={() => setEditingUser(u)}
          onToggleAdmin={async () => {
            if (!confirm(`إلغاء صلاحيات المشرف لـ ${u.email}؟`)) return;
            try {
              await setAdmin({ userId: u._id, isAdmin: false });
              toast.success("تم إلغاء صلاحيات المشرف");
            } catch { toast.error("حدث خطأ"); }
          }}
        />
      ))}

      {editingUser && <EditUserModal u={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

/* ── Admin Commissions Tab ── */
function AdminCommissionsTab() {
  const commStats      = useQuery(api.commissions.adminStats);
  const commList       = useQuery(api.commissions.adminList);
  const offices        = useQuery(api.admin.getAllOffices);
  const defaultRate    = useQuery(api.commissions.getDefaultRate);
  const defaultPassengerRateRaw = useQuery(api.appSettings.get, { key: "passenger_commission_rate" });
  const settle         = useMutation(api.commissions.settle);
  const settleAll      = useMutation(api.commissions.settleAllForOffice);
  const updateDefault  = useMutation(api.commissions.updateDefaultRate);
  const updateOffice   = useMutation(api.commissions.updateOfficeRate);
  const updateDefaultPassenger = useMutation(api.appSettings.upsert);
  const syncComm       = useMutation(api.commissions.syncAllCommissions);

  const [newDefaultRate, setNewDefaultRate] = useState<string>("");
  const [newDefaultPassengerRate, setNewDefaultPassengerRate] = useState<string>("");
  const [officeRates, setOfficeRates]       = useState<Record<string, string>>({});
  const [officePassengerRates, setOfficePassengerRates] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate]         = useState(false);
  const [filterStatus, setFilterStatus]    = useState<string>("all");
  const [syncing, setSyncing]              = useState(false);

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";
  const defaultPassengerRate = defaultPassengerRateRaw === undefined
    ? undefined
    : Number.parseFloat(defaultPassengerRateRaw ?? "0") || 0;

  const COMM_STATUS: Record<string, { label: string; cls: string }> = {
    pending:   { label: "معلقة",  cls: "bg-amber-100 text-amber-700" },
    settled:   { label: "مسوّاة", cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "ملغاة",  cls: "bg-red-100 text-red-600" },
  };

  const handleSettle = async (id: any) => {
    try {
      await settle({ commissionId: id });
      toast.success("✅ تم تسوية العمولة");
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
  };

  const handleSettleAll = async (officeId: any, officeName: string) => {
    if (!confirm(`تسوية جميع العمولات المعلقة لمكتب "${officeName}"؟`)) return;
    try {
      const count = await settleAll({ officeId });
      toast.success(`✅ تم تسوية ${count} عمولة`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
  };

  const handleSaveDefaultRate = async () => {
    const rate = parseFloat(newDefaultRate);
    if (isNaN(rate)) { toast.error("أدخل نسبة صحيحة"); return; }
    setSavingRate(true);
    try {
      await updateDefault({ rate });
      toast.success("✅ تم تحديث النسبة الافتراضية");
      setNewDefaultRate("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setSavingRate(false); }
  };

  const handleSaveOfficeRate = async (officeId: any, officeName: string) => {
    const val = officeRates[officeId];
    const rate = val === "" ? undefined : parseFloat(val);
    if (rate !== undefined && isNaN(rate)) { toast.error("أدخل نسبة صحيحة"); return; }
    try {
      await updateOffice({ officeId, rate });
      toast.success(`✅ تم تحديث نسبة مكتب "${officeName}"`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
  };

  const handleSaveDefaultPassengerRate = async () => {
    const rate = parseFloat(newDefaultPassengerRate);
    if (isNaN(rate)) { toast.error("أدخل نسبة مصاريف تشغيل صحيحة"); return; }
    setSavingRate(true);
    try {
      await updateDefaultPassenger({ key: "passenger_commission_rate", value: String(rate) });
      toast.success("✅ تم تحديث نسبة مصاريف التشغيل الافتراضية للمعتمر");
      setNewDefaultPassengerRate("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setSavingRate(false); }
  };

  const handleSaveOfficePassengerRate = async (officeId: any, officeName: string) => {
    const val = officePassengerRates[officeId];
    const rate = val === "" ? undefined : parseFloat(val);
    if (rate !== undefined && isNaN(rate)) { toast.error("أدخل نسبة مصاريف تشغيل صحيحة"); return; }
    try {
      toast.error(`حفظ نسبة المعتمر الخاصة بمكتب "${officeName}" يحتاج تفعيل تحديث قاعدة البيانات أولا`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "حدث خطأ"); }
  };

  const filtered = commList?.filter((c: any) =>
    filterStatus === "all" ? true : c.status === filterStatus
  ) ?? [];

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncComm({});
      const r = result as { created: number; updated: number; total: number };
      if (r.created === 0 && r.updated === 0) {
        toast.success("✅ جميع العمولات محدّثة بالفعل، لا يوجد شيء جديد");
      } else {
        toast.success(`✅ تمت المزامنة: أُنشئت ${r.created} عمولة جديدة، وحُدِّثت ${r.updated} عمولة`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء المزامنة");
    } finally {
      setSyncing(false);
    }
  };

  if (!commStats || !commList || !offices) return <Spinner />;

  return (
    <div className="space-y-6">

      {/* ── بانر المزامنة ── */}
      {false && (
      <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-sm">مزامنة سجل العمولات</h3>
            <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
              إذا كان السجل فارغاً أو ناقصاً، اضغط "مزامنة الآن" لإنشاء عمولات لجميع الحجوزات الموجودة تلقائياً.
              يمكن تشغيلها أكثر من مرة بأمان — لن تُكرَّر العمولات الموجودة.
            </p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-60 transition-all shadow-md shadow-amber-200 whitespace-nowrap flex-shrink-0"
        >
          {syncing
            ? <><Loader2 className="w-4 h-4 animate-spin" />جاري المزامنة...</>
            : <><RefreshCw className="w-4 h-4" />مزامنة الآن</>
          }
        </button>
      </div>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العمولات",   value: commStats.totalCommission,  from: "from-emerald-500", to: "to-emerald-700", Icon: Percent,      suffix: "ر.س" },
          { label: "عمولات معلقة",      value: commStats.pendingAmount,    from: "from-amber-500",   to: "to-amber-700",   Icon: Clock,        suffix: "ر.س" },
          { label: "عمولات مسوّاة",     value: commStats.settledAmount,    from: "from-blue-500",    to: "to-blue-700",    Icon: CheckCircle,  suffix: "ر.س" },
          { label: "حجم المبيعات الكلي", value: commStats.totalBookingVol, from: "from-purple-500",  to: "to-purple-700",  Icon: DollarSign,   suffix: "ر.س" },
        ].map(({ label, value, from, to, Icon, suffix }, i) => (
          <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
            <Icon className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
            <div className="text-xl font-black">{value.toLocaleString("ar-SA")}</div>
            <div className="text-white/70 text-xs mt-0.5">{label}</div>
            <div className="text-white/50 text-xs">{suffix}</div>
          </div>
        ))}
      </div>

      {/* إعداد النسبة الافتراضية */}
      <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5 text-emerald-600" />
          النسبة الافتراضية للعمولة
        </h3>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl px-6 py-3 border-2 border-emerald-200 text-center">
            <div className="text-3xl font-black text-emerald-700">{defaultRate ?? "—"}%</div>
            <div className="text-xs text-gray-400 mt-0.5">النسبة الحالية</div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <input
              type="number"
              value={newDefaultRate}
              onChange={(e) => setNewDefaultRate(e.target.value)}
              placeholder="أدخل النسبة الجديدة (0-50)"
              min={0} max={50} step={0.5}
              className={inp}
            />
            <button
              onClick={handleSaveDefaultRate}
              disabled={savingRate || !newDefaultRate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {savingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </button>
          </div>
        </div>
      </div>

      {/* نسب المكاتب */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-black text-amber-800 text-sm">نسبة مصاريف التشغيل والخدمات على المعتمر</h3>
                <p className="text-xs text-amber-700 mt-1">تضاف على سعر المكتب وتظهر للمعتمر كجزء من الإجمالي.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 font-black">{defaultPassengerRate ?? "—"}%</div>
                <input
                  type="number"
                  value={newDefaultPassengerRate}
                  onChange={(e) => setNewDefaultPassengerRate(e.target.value)}
                  placeholder="0-50"
                  min={0} max={50} step={0.5}
                  className="w-24 px-2 py-2 rounded-lg border-2 border-amber-200 text-sm focus:outline-none focus:border-amber-500 text-center"
                />
                <button
                  onClick={handleSaveDefaultPassengerRate}
                  disabled={savingRate || !newDefaultPassengerRate}
                  className="px-3 py-2 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 disabled:opacity-50"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            نسب عمولة المكاتب
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">اتركها فارغة لاستخدام النسبة الافتراضية ({defaultRate}%)</p>
        </div>
        <div className="divide-y divide-gray-50">
          {(offices ?? []).map((o: any) => (
            <div key={o._id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-black flex-shrink-0">
                {o.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm truncate">{o.name}</div>
                <div className="text-xs text-gray-400">{o.city}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {o.commissionRate !== undefined ? (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{o.commissionRate}% خاص</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">افتراضي {defaultRate}%</span>
                  )}
                </div>
                <input
                  type="number"
                  value={officeRates[o._id] ?? ""}
                  onChange={(e) => setOfficeRates((r) => ({ ...r, [o._id]: e.target.value }))}
                  placeholder={`${defaultRate}%`}
                  min={0} max={50} step={0.5}
                  className="w-24 px-2 py-1.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 text-center"
                />
                <button
                  onClick={() => handleSaveOfficeRate(o._id, o.name)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors"
                >
                  حفظ
                </button>
                {o.commissionRate !== undefined && (
                  <button
                    title="إعادة للافتراضي"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setOfficeRates((r) => ({ ...r, [o._id]: "" }));
                      updateOffice({ officeId: o._id, rate: undefined })
                        .then(() => toast.success(`✅ تم إعادة مكتب "${o.name}" للنسبة الافتراضية`))
                        .catch((e: any) => toast.error(e.message));
                    }}
                  >
                    إعادة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قائمة العمولات */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            تقسيم النسب لكل مكتب
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">الأخضر يخصم من سعر المكتب، والذهبي يضاف للمعتمر كمصاريف تشغيل وخدمات.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {(offices ?? []).map((o: any) => (
            <div key={`split-${o._id}`} className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div>
                <div className="font-bold text-gray-800 text-sm">{o.name}</div>
                <div className="text-xs text-gray-400">{o.city}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                  المكتب: {o.commissionRate !== undefined ? `${o.commissionRate}% خاص` : `${defaultRate}% افتراضي`}
                </span>
                <input
                  type="number"
                  value={officeRates[o._id] ?? ""}
                  onChange={(e) => setOfficeRates((r) => ({ ...r, [o._id]: e.target.value }))}
                  placeholder={`${defaultRate}%`}
                  min={0} max={50} step={0.5}
                  className="w-24 px-2 py-1.5 rounded-lg border-2 border-emerald-200 text-sm focus:outline-none focus:border-emerald-500 text-center"
                />
                <button onClick={() => handleSaveOfficeRate(o._id, o.name)} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200">
                  حفظ المكتب
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                  المعتمر: {o.passengerCommissionRate !== undefined ? `${o.passengerCommissionRate}% خاص` : `${defaultPassengerRate ?? 0}% افتراضي`}
                </span>
                <input
                  type="number"
                  value={officePassengerRates[o._id] ?? ""}
                  onChange={(e) => setOfficePassengerRates((r) => ({ ...r, [o._id]: e.target.value }))}
                  placeholder={`${defaultPassengerRate ?? 0}%`}
                  min={0} max={50} step={0.5}
                  className="w-24 px-2 py-1.5 rounded-lg border-2 border-amber-200 text-sm focus:outline-none focus:border-amber-500 text-center"
                />
                <button onClick={() => handleSaveOfficePassengerRate(o._id, o.name)} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs hover:bg-amber-200">
                  حفظ المعتمر
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-600" />
            سجل العمولات ({filtered.length})
          </h3>
          <div className="flex items-center gap-2">
            {["all", "pending", "settled", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "الكل" : s === "pending" ? "معلقة" : s === "settled" ? "مسوّاة" : "ملغاة"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Percent className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد عمولات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((c: any) => {
              const st = COMM_STATUS[c.status] ?? { label: c.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={c._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-gray-800 text-sm">{c.office?.name ?? "—"}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c._creationTime).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">قيمة الحجز</div>
                          <div className="font-bold text-gray-800">{c.bookingAmount.toLocaleString("ar-SA")} ر.س</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">النسبة</div>
                          <div className="font-bold text-gray-700">{c.commissionRate}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">العمولة</div>
                          <div className="font-black text-emerald-700">{c.commissionAmount.toLocaleString("ar-SA")} ر.س</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">صافي المكتب</div>
                          <div className="font-bold text-blue-700">{c.netAmount.toLocaleString("ar-SA")} ر.س</div>
                        </div>
                      </div>
                    </div>
                    {c.status === "pending" && (
                      <button
                        onClick={() => handleSettle(c._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors flex-shrink-0"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        تسوية
                      </button>
                    )}
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

/* ── Helpers ── */
function InfoCell({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-gray-400 mb-0.5">{label}</div>
      <div className={`${bold ? "font-black text-emerald-700" : "font-semibold text-gray-700"}`}>{value}</div>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="mx-auto mb-3 w-fit">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

/* ── Admin Statements Tab ── */
function AdminStatementsTab() {
  const offices = useQuery(api.admin.getAllOffices);
  const bookings = useQuery(api.admin.getAllBookings);

  const [filterOffice, setFilterOffice] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom]         = useState<string>("");
  const [dateTo,   setDateTo]           = useState<string>("");
  const [printMode, setPrintMode]       = useState<"statement" | "platform_invoices" | "office_invoices">("statement");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const dfMs     = dateFrom ? new Date(dateFrom).getTime() : undefined;
  const dtMs     = dateTo   ? new Date(dateTo).setHours(23, 59, 59, 999) : undefined;

  const COMM_STATUS: Record<string, { label: string; cls: string }> = {
    pending:       { label: "معلقة",       cls: "bg-amber-100 text-amber-700" },
    settled:       { label: "مسوّاة",      cls: "bg-emerald-100 text-emerald-700" },
    cancelled:     { label: "ملغاة",       cls: "bg-red-100 text-red-600" },
    no_commission: { label: "بدون عمولة", cls: "bg-gray-100 text-gray-500" },
  };

  const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
    pending:   { label: "معلق",   cls: "bg-amber-100 text-amber-700" },
    confirmed: { label: "مؤكد",   cls: "bg-blue-100 text-blue-700" },
    completed: { label: "مكتمل", cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "ملغي",   cls: "bg-red-100 text-red-600" },
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  const splitVat = (amount: number, rate = 15) => {
    const taxableAmount = Math.round((amount || 0) / (1 + rate / 100));
    return { taxableAmount, vatAmount: Math.max(0, Math.round((amount || 0) - taxableAmount)) };
  };
  const rows = (bookings ?? [])
    .map((b: any) => {
      const officeBaseAmount = b.officeBaseAmount ?? b.totalPrice ?? 0;
      const passengerFeeAmount = b.passengerFeeAmount ?? Math.max(0, (b.totalPrice ?? 0) - officeBaseAmount);
      const commissionAmount = b.commissionAmount ?? 0;
      const commissionRate = b.commissionRate ?? 0;
      const platformRevenue = b.platformRevenue ?? (passengerFeeAmount + commissionAmount);
      const netAmount = b.netAmount ?? Math.max(0, officeBaseAmount - commissionAmount);
      const commissionStatus = b.status === "cancelled"
        ? "cancelled"
        : commissionAmount > 0
          ? ((b as any).commissionStatus ?? "pending")
          : "no_commission";
      const officeTax = splitVat(b.totalPrice ?? officeBaseAmount, 15);
      const platformTax = splitVat(platformRevenue, 15);

      return {
        bookingId: b._id,
        bookingRef: b.bookingReference,
        bookingDate: b._creationTime,
        bookingStatus: b.status,
        passengerName: b.leadPassengerName,
        passengerPhone: b.leadPassengerPhone,
        passengerIdNumber: b.leadPassengerIdNumber,
        adultsCount: b.adultsCount,
        childrenCount: b.childrenCount ?? 0,
        passengerCount: (b.adultsCount ?? 1) + (b.childrenCount ?? 0),
        officeName: b.office?.name ?? "—",
        officeId: b.officeId,
        packageTitle: b.package?.title ?? "—",
        bookingAmount: officeBaseAmount,
        officeBaseAmount,
        passengerFeeRate: b.passengerFeeRate ?? 0,
        passengerFeeAmount,
        pilgrimTotalAmount: b.totalPrice ?? officeBaseAmount,
        platformRevenue,
        taxRate: 15,
        officeTaxableAmount: officeTax.taxableAmount,
        officeVatAmount: officeTax.vatAmount,
        platformTaxableAmount: platformTax.taxableAmount,
        platformVatAmount: platformTax.vatAmount,
        platformInvoiceNo: `MSR-TAX-${b.bookingReference}`,
        officeInvoiceNo: `OFF-TAX-${b.bookingReference}`,
        officeCommercialRegister: b.office?.commercialRegister,
        commissionRate,
        commissionAmount,
        netAmount,
        commissionStatus,
        settledAt: (b as any).settledAt,
      };
    })
    .filter((r: any) => (filterOffice === "all" ? true : r.officeId === filterOffice))
    .filter((r: any) => (dfMs ? r.bookingDate >= dfMs : true))
    .filter((r: any) => (dtMs ? r.bookingDate <= dtMs : true))
    .filter((r: any) => (filterStatus === "all" ? r.bookingStatus !== "cancelled" : r.commissionStatus === filterStatus));
  const summary = bookings === undefined
    ? undefined
    : {
        totalRows: rows.length,
        totalBookingAmount: rows.reduce((s: number, r: any) => s + (r.bookingAmount ?? 0), 0),
        totalPilgrimAmount: rows.reduce((s: number, r: any) => s + (r.pilgrimTotalAmount ?? r.bookingAmount ?? 0), 0),
        totalPassengerFees: rows.reduce((s: number, r: any) => s + (r.passengerFeeAmount ?? 0), 0),
        totalCommission: rows.reduce((s: number, r: any) => s + (r.commissionAmount ?? 0), 0),
        totalPlatformRevenue: rows.reduce((s: number, r: any) => s + (r.platformRevenue ?? r.commissionAmount ?? 0), 0),
        totalOfficeVat: rows.reduce((s: number, r: any) => s + (r.officeVatAmount ?? 0), 0),
        totalPlatformVat: rows.reduce((s: number, r: any) => s + (r.platformVatAmount ?? 0), 0),
        totalVat: rows.reduce((s: number, r: any) => s + (r.officeVatAmount ?? 0) + (r.platformVatAmount ?? 0), 0),
        totalNet: rows.reduce((s: number, r: any) => s + (r.netAmount ?? 0), 0),
        settledCommission: rows.filter((r: any) => r.commissionStatus === "settled").reduce((s: number, r: any) => s + (r.commissionAmount ?? 0), 0),
        pendingCommission: rows.filter((r: any) => r.commissionStatus === "pending").reduce((s: number, r: any) => s + (r.commissionAmount ?? 0), 0),
      };
  const bookingGross = (r: any) => r.pilgrimTotalAmount ?? r.officeBaseAmount ?? r.bookingAmount ?? 0;
  const bookingPassengerCount = (r: any) => Math.max(1, Number(r.passengerCount ?? r.adultsCount ?? 1));
  const bookingPassengers = (r: any) => {
    const adults = Math.max(1, Number(r.adultsCount ?? 1));
    const children = Math.max(0, Number(r.childrenCount ?? 0));
    const total = Math.max(1, adults + children);
    const share = Math.round(bookingGross(r) / total);
    const passengers = [
      {
        name: r.passengerName,
        type: "بالغ",
        phone: r.passengerPhone ?? "—",
        idNumber: r.passengerIdNumber ?? "—",
        amount: share,
        note: "المعتمر الرئيسي",
      },
    ];
    for (let i = 2; i <= adults; i += 1) {
      passengers.push({
        name: `معتمر بالغ ${i}`,
        type: "بالغ",
        phone: "—",
        idNumber: "—",
        amount: share,
        note: "ضمن نفس رقم الحجز",
      });
    }
    for (let i = 1; i <= children; i += 1) {
      passengers.push({
        name: `طفل ${i}`,
        type: "طفل",
        phone: "—",
        idNumber: "—",
        amount: share,
        note: "ضمن نفس رقم الحجز",
      });
    }
    return passengers.slice(0, total);
  };
  const totalVatFallback = rows.reduce((sum: number, r: any) => {
    const officeGross = r.pilgrimTotalAmount ?? r.officeBaseAmount ?? r.bookingAmount ?? 0;
    const platformGross = r.platformRevenue ?? r.commissionAmount ?? 0;
    return sum + splitVat(officeGross, r.taxRate ?? 15).vatAmount + (r.platformVatAmount ?? splitVat(platformGross, r.taxRate ?? 15).vatAmount);
  }, 0);

  const handlePlatformTaxInvoice = (r: any) => {
    const gross = r.platformRevenue ?? r.commissionAmount ?? 0;
    const tax = splitVat(gross, r.taxRate ?? 15);
    void printTaxInvoice({
      invoiceNo: r.platformInvoiceNo ?? `MSR-TAX-${r.bookingRef}`,
      title: "فاتورة ضريبية - إيراد المنصة",
      seller: { name: "المسار الذكي", taxNumber: "يضاف من إعدادات المنصة", commercialRegister: "يضاف من إعدادات المنصة", city: "السعودية" },
      buyer: { name: r.officeName, commercialRegister: r.officeCommercialRegister, city: "السعودية" },
      bookingRef: r.bookingRef,
      passengerName: r.passengerName,
      passengerCount: r.passengerCount ?? r.adultsCount,
      packageTitle: r.packageTitle,
      invoiceDate: r.bookingDate,
      description: "عمولة المنصة ومصاريف التشغيل والخدمات المرتبطة بالحجز",
      grossAmount: gross,
      taxableAmount: r.platformTaxableAmount ?? tax.taxableAmount,
      vatAmount: r.platformVatAmount ?? tax.vatAmount,
      vatRate: r.taxRate ?? 15,
      notes: "هذه الفاتورة تخص إيراد المنصة من الحجز وتظهر ضمن كشف حساب المنصة.",
    });
  };

  const handleOfficeTaxInvoice = (r: any) => {
    const gross = bookingGross(r);
    const tax = splitVat(gross, r.taxRate ?? 15);
    void printTaxInvoice({
      invoiceNo: r.officeInvoiceNo ?? `OFF-TAX-${r.bookingRef}`,
      title: "فاتورة ضريبية - خدمة المكتب",
      seller: { name: r.officeName, commercialRegister: r.officeCommercialRegister, city: "السعودية" },
      buyer: { name: r.passengerName, city: "السعودية" },
      bookingRef: r.bookingRef,
      passengerName: r.passengerName,
      passengerCount: r.passengerCount ?? r.adultsCount,
      packageTitle: r.packageTitle,
      invoiceDate: r.bookingDate,
      description: "إجمالي قيمة الحجز الكامل حسب رقم الحجز وعدد الركاب",
      grossAmount: gross,
      taxableAmount: tax.taxableAmount,
      vatAmount: tax.vatAmount,
      vatRate: r.taxRate ?? 15,
      notes: "هذه الفاتورة تخص قيمة خدمة المكتب للمعتمر وترتبط بنفس سطر كشف الحساب.",
    });
  };
  const moneyPrint = (value: number) => `${Math.round(Number(value) || 0).toLocaleString("ar-SA")} ر.س`;
  const safePrint = (value: unknown) =>
    String(value ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  const printDate = () => new Date().toLocaleString("ar-SA");
  const selectedOfficeName = () => filterOffice === "all" ? "جميع المكاتب" : (offices?.find((office: any) => office._id === filterOffice)?.name ?? "مكتب محدد");
  const selectedStatusName = () => filterStatus === "all" ? "كل الحالات" : (COMM_STATUS[filterStatus]?.label ?? filterStatus);
  const dateRangeLabel = () => {
    if (dateFrom && dateTo) return `من ${new Date(dateFrom).toLocaleDateString("ar-SA")} إلى ${new Date(dateTo).toLocaleDateString("ar-SA")}`;
    if (dateFrom) return `من ${new Date(dateFrom).toLocaleDateString("ar-SA")}`;
    if (dateTo) return `حتى ${new Date(dateTo).toLocaleDateString("ar-SA")}`;
    return "كل الفترات";
  };

  const buildStatementPrintHtml = () => {
    const totals = rows.reduce((acc: any, r: any) => {
      acc.bookingAmount += r.bookingAmount ?? bookingGross(r);
      acc.platformRevenue += r.platformRevenue ?? r.commissionAmount ?? 0;
      acc.commissionAmount += r.commissionAmount ?? 0;
      acc.netAmount += r.netAmount ?? 0;
      acc.vatAmount += splitVat(bookingGross(r), r.taxRate ?? 15).vatAmount + (r.platformVatAmount ?? splitVat(r.platformRevenue ?? r.commissionAmount ?? 0, r.taxRate ?? 15).vatAmount);
      return acc;
    }, { bookingAmount: 0, platformRevenue: 0, commissionAmount: 0, netAmount: 0, vatAmount: 0 });

    const tableRows = rows.map((r: any, index: number) => {
      const status = COMM_STATUS[r.commissionStatus]?.label ?? r.commissionStatus ?? "-";
      return `
        <tr>
          <td>${index + 1}</td>
          <td class="mono">${safePrint(r.bookingRef)}</td>
          <td>${safePrint(r.officeName)}</td>
          <td>${safePrint(r.passengerName)}</td>
          <td>${bookingPassengerCount(r).toLocaleString("ar-SA")}</td>
          <td>${safePrint(r.packageTitle)}</td>
          <td>${new Date(r.bookingDate).toLocaleDateString("ar-SA")}</td>
          <td class="num">${moneyPrint(r.bookingAmount ?? bookingGross(r))}</td>
          <td class="num">${moneyPrint(r.platformRevenue ?? r.commissionAmount ?? 0)}</td>
          <td class="num">${moneyPrint(r.commissionAmount ?? 0)}</td>
          <td class="num">${moneyPrint(r.netAmount ?? 0)}</td>
          <td>${safePrint(status)}</td>
        </tr>`;
    }).join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>كشف حساب المنصة</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{box-sizing:border-box}
  body{margin:0;background:#f3f4f6;font-family:Tajawal,Arial,sans-serif;color:#111827}
  .sheet{width:281mm;margin:0 auto;background:#fff;border:1px solid #d1d5db;min-height:190mm}
  .header{background:#064e3b;color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{height:48px;width:48px;object-fit:contain;border-radius:12px;background:#ffffff1f;padding:4px}
  .brand-title{font-size:18px;font-weight:900}
  .brand-sub{font-size:11px;color:#d1fae5;margin-top:3px}
  .title{text-align:left}
  .title h1{margin:0;font-size:20px}
  .title p{margin:5px 0 0;color:#d1fae5;font-size:11px}
  .body{padding:14px 16px}
  .filters{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
  .chip{border:1px solid #d1fae5;background:#ecfdf5;border-radius:10px;padding:8px 10px;font-size:11px}
  .chip span{display:block;color:#047857;font-weight:800;margin-bottom:2px}
  .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:9px 10px;background:#f9fafb}
  .card .label{font-size:10px;color:#6b7280;font-weight:800}
  .card .value{font-size:15px;color:#064e3b;font-weight:900;margin-top:3px}
  table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb}
  th{background:#065f46;color:#fff;padding:8px 7px;font-size:10px;text-align:right;white-space:nowrap}
  td{padding:7px;font-size:10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  tbody tr:nth-child(even){background:#f9fafb}
  .num{text-align:left;font-weight:900;white-space:nowrap}
  .mono{font-family:Consolas,monospace;font-weight:900;color:#065f46}
  .footer{display:flex;justify-content:space-between;gap:12px;color:#6b7280;font-size:9px;border-top:1px solid #e5e7eb;margin-top:12px;padding-top:10px}
  @media print{body{background:#fff}.sheet{border:none;width:auto;min-height:auto}}
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <img src="${LOGO}" class="logo" />
        <div>
          <div class="brand-title">المسار الذكي</div>
          <div class="brand-sub">منصة حجز العمرة والنقل</div>
        </div>
      </div>
      <div class="title">
        <h1>كشف حساب المنصة</h1>
        <p>تقرير مالي حسب الفلاتر المختارة</p>
      </div>
    </div>
    <div class="body">
      <div class="filters">
        <div class="chip"><span>المكتب</span>${safePrint(selectedOfficeName())}</div>
        <div class="chip"><span>حالة العمولة</span>${safePrint(selectedStatusName())}</div>
        <div class="chip"><span>الفترة</span>${safePrint(dateRangeLabel())}</div>
        <div class="chip"><span>تاريخ الطباعة</span>${printDate()}</div>
      </div>
      <div class="cards">
        <div class="card"><div class="label">عدد الحجوزات</div><div class="value">${rows.length.toLocaleString("ar-SA")}</div></div>
        <div class="card"><div class="label">إجمالي الحجوزات</div><div class="value">${moneyPrint(totals.bookingAmount)}</div></div>
        <div class="card"><div class="label">إيراد المنصة</div><div class="value">${moneyPrint(totals.platformRevenue)}</div></div>
        <div class="card"><div class="label">ضريبة القيمة المضافة</div><div class="value">${moneyPrint(totals.vatAmount)}</div></div>
        <div class="card"><div class="label">صافي المكاتب</div><div class="value">${moneyPrint(totals.netAmount)}</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th><th>رقم الحجز</th><th>المكتب</th><th>المعتمر</th><th>العدد</th><th>البرنامج</th><th>التاريخ</th>
            <th>قيمة الحجز</th><th>إيراد المنصة</th><th>العمولة</th><th>صافي المكتب</th><th>الحالة</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        <span>المسار الذكي - كشف حساب المنصة</span>
        <span>العملة: ريال سعودي</span>
        <span>تم إنشاء التقرير آليا من لوحة الإدارة</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const buildInvoiceBatchPrintHtml = (kind: "platform_invoices" | "office_invoices") => {
    const isPlatform = kind === "platform_invoices";
    const pages = rows.map((r: any, index: number) => {
      const gross = isPlatform ? (r.platformRevenue ?? r.commissionAmount ?? 0) : bookingGross(r);
      const tax = splitVat(gross, r.taxRate ?? 15);
      const invoiceNo = isPlatform ? (r.platformInvoiceNo ?? `MSR-TAX-${r.bookingRef}`) : (r.officeInvoiceNo ?? `OFF-TAX-${r.bookingRef}`);
      const sellerName = isPlatform ? "المسار الذكي" : r.officeName;
      const sellerRegister = isPlatform ? "يضاف من إعدادات المنصة" : r.officeCommercialRegister;
      const buyerName = isPlatform ? r.officeName : r.passengerName;
      const title = isPlatform ? "فاتورة ضريبية - إيراد المنصة" : "فاتورة ضريبية - المكتب";
      const description = isPlatform ? "عمولة المنصة ومصاريف التشغيل والخدمات المرتبطة بالحجز" : "قيمة خدمة المكتب للحجز الكامل حسب رقم الحجز وعدد الركاب";
      const taxableAmount = isPlatform ? (r.platformTaxableAmount ?? tax.taxableAmount) : tax.taxableAmount;
      const vatAmount = isPlatform ? (r.platformVatAmount ?? tax.vatAmount) : tax.vatAmount;

      return `
        <section class="invoice">
          <div class="inv-header">
            <div class="brand">
              <img src="${LOGO}" class="logo" />
              <div>
                <div class="brand-title">المسار الذكي</div>
                <div class="brand-sub">منصة حجز العمرة والنقل</div>
              </div>
            </div>
            <div class="inv-title">
              <h1>${title}</h1>
              <p>${safePrint(invoiceNo)}</p>
            </div>
          </div>
          <div class="inv-body">
            <div class="meta">
              <div class="box">
                <h2>بيانات المورد</h2>
                <div class="line"><span>الاسم</span><strong>${safePrint(sellerName)}</strong></div>
                <div class="line"><span>السجل التجاري</span><strong>${safePrint(sellerRegister)}</strong></div>
                <div class="line"><span>الدولة</span><strong>السعودية</strong></div>
              </div>
              <div class="box">
                <h2>بيانات العميل</h2>
                <div class="line"><span>الاسم</span><strong>${safePrint(buyerName)}</strong></div>
                <div class="line"><span>رقم الحجز</span><strong class="mono">${safePrint(r.bookingRef)}</strong></div>
                <div class="line"><span>عدد الركاب</span><strong>${bookingPassengerCount(r).toLocaleString("ar-SA")}</strong></div>
              </div>
              <div class="box">
                <h2>بيانات الفاتورة</h2>
                <div class="line"><span>التاريخ</span><strong>${new Date(r.bookingDate).toLocaleDateString("ar-SA")}</strong></div>
                <div class="line"><span>نسبة الضريبة</span><strong>${safePrint(r.taxRate ?? 15)}%</strong></div>
                <div class="line"><span>الترتيب</span><strong>${index + 1} / ${rows.length}</strong></div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>الوصف</th><th>قبل الضريبة</th><th>ضريبة القيمة المضافة</th><th>الإجمالي شامل الضريبة</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${safePrint(description)}</strong>
                    <small>${safePrint(r.packageTitle)}</small>
                  </td>
                  <td class="num">${moneyPrint(taxableAmount)}</td>
                  <td class="num">${moneyPrint(vatAmount)}</td>
                  <td class="num">${moneyPrint(gross)}</td>
                </tr>
              </tbody>
            </table>
            <div class="totals">
              <div><span>الإجمالي قبل الضريبة</span><strong>${moneyPrint(taxableAmount)}</strong></div>
              <div><span>ضريبة القيمة المضافة ${safePrint(r.taxRate ?? 15)}%</span><strong>${moneyPrint(vatAmount)}</strong></div>
              <div><span>الإجمالي شامل الضريبة</span><strong>${moneyPrint(gross)}</strong></div>
            </div>
            <div class="note">هذه الفاتورة مرتبطة بكشف حساب المنصة ورقم الحجز ${safePrint(r.bookingRef)}، والمبالغ بالريال السعودي.</div>
            <div class="inv-footer">
              <span>تاريخ الطباعة: ${printDate()}</span>
              <span>${isPlatform ? "فاتورة المنصة" : "فاتورة المكتب"}</span>
              <span>المسار الذكي</span>
            </div>
          </div>
        </section>`;
    }).join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${isPlatform ? "فواتير المنصة" : "فواتير المكاتب"}</title>
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;background:#f3f4f6;font-family:Tajawal,Arial,sans-serif;color:#111827}
  .invoice{width:190mm;min-height:277mm;margin:0 auto 12mm;background:#fff;border:1px solid #d1d5db;page-break-after:always}
  .invoice:last-child{page-break-after:auto;margin-bottom:0}
  .inv-header{background:#064e3b;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{height:46px;width:46px;object-fit:contain;border-radius:12px;background:#ffffff1f;padding:4px}
  .brand-title{font-size:18px;font-weight:900}
  .brand-sub{font-size:11px;color:#d1fae5;margin-top:3px}
  .inv-title{text-align:left}
  .inv-title h1{margin:0;font-size:18px}
  .inv-title p{margin:5px 0 0;color:#fef3c7;font-size:11px;font-family:Consolas,monospace}
  .inv-body{padding:18px 22px}
  .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
  .box{border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;padding:11px}
  .box h2{margin:0 0 8px;font-size:12px;color:#065f46}
  .line{display:flex;justify-content:space-between;gap:10px;font-size:11px;padding:4px 0;border-bottom:1px dashed #e5e7eb}
  .line:last-child{border-bottom:none}
  .line span{color:#6b7280;font-weight:800}
  .line strong{text-align:left}
  .mono{font-family:Consolas,monospace;color:#065f46}
  table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-top:12px}
  th{background:#065f46;color:#fff;padding:10px;font-size:11px;text-align:right}
  td{padding:11px;font-size:11px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  td small{display:block;color:#6b7280;margin-top:4px;line-height:1.7}
  .num{text-align:center;font-weight:900;white-space:nowrap}
  .totals{width:84mm;margin-right:auto;margin-top:14px;border:1px solid #d1fae5;border-radius:12px;overflow:hidden}
  .totals div{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;font-size:12px;border-bottom:1px solid #d1fae5}
  .totals div:last-child{border-bottom:none;background:#ecfdf5;color:#065f46;font-weight:900;font-size:14px}
  .note{margin-top:16px;border:1px dashed #d1d5db;border-radius:12px;padding:11px;color:#6b7280;font-size:10px;line-height:1.8}
  .inv-footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:9px}
  @media print{body{background:#fff}.invoice{border:none;margin:0;width:auto;min-height:auto}}
</style>
</head>
<body>${pages}</body>
</html>`;
  };

  const handlePrintByFilter = () => {
    if (bookings === undefined) {
      toast.error("البيانات ما زالت قيد التحميل");
      return;
    }
    if (rows.length === 0) {
      toast.error("لا توجد بيانات للطباعة حسب الفلتر الحالي");
      return;
    }
    const html = printMode === "statement" ? buildStatementPrintHtml() : buildInvoiceBatchPrintHtml(printMode);
    void printHtml(html, { width: printMode === "statement" ? "297mm" : "210mm", height: "297mm" });
  };

  const handlePassengerTaxInvoice = (r: any, passenger: any, index: number) => {
    const gross = passenger.amount ?? Math.round(bookingGross(r) / bookingPassengerCount(r));
    const tax = splitVat(gross, r.taxRate ?? 15);
    void printTaxInvoice({
      invoiceNo: `${r.officeInvoiceNo ?? `OFF-TAX-${r.bookingRef}`}-P${index + 1}`,
      title: "فاتورة ضريبية منفصلة - معتمر",
      seller: { name: r.officeName, commercialRegister: r.officeCommercialRegister, city: "السعودية" },
      buyer: { name: passenger.name, city: "السعودية" },
      bookingRef: r.bookingRef,
      passengerName: passenger.name,
      passengerCount: 1,
      packageTitle: r.packageTitle,
      invoiceDate: r.bookingDate,
      description: `حصة ${passenger.name} من إجمالي الحجز رقم ${r.bookingRef}`,
      grossAmount: gross,
      taxableAmount: tax.taxableAmount,
      vatAmount: tax.vatAmount,
      vatRate: r.taxRate ?? 15,
      notes: "فاتورة منفصلة للمعتمر داخل نفس رقم الحجز، مع بقاء الفاتورة المجمعة متاحة للحجز بالكامل.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            كشوفات الحساب
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">تفاصيل جميع الحجوزات مع العمولات والصافي لكل مكتب</p>
        </div>
      </div>

      {/* فلاتر البحث */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          فلترة الكشف
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* فلتر المكتب */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">المكتب</label>
            <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} className={inp}>
              <option value="all">جميع المكاتب</option>
              {offices?.map((o: any) => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>
          {/* فلتر حالة العمولة */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">حالة العمولة</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inp}>
              <option value="all">الكل</option>
              <option value="pending">معلقة</option>
              <option value="settled">مسوّاة</option>
              <option value="no_commission">بدون عمولة</option>
            </select>
          </div>
          {/* من تاريخ */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inp} />
          </div>
          {/* إلى تاريخ */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inp} />
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="min-w-[220px] flex-1">
              <label className="text-xs font-semibold text-emerald-800 mb-1.5 block">نوع الطباعة</label>
              <select value={printMode} onChange={(e) => setPrintMode(e.target.value as typeof printMode)} className={inp}>
                <option value="statement">كشف حساب المنصة حسب الفلتر</option>
                <option value="platform_invoices">فواتير ضريبية للمنصة</option>
                <option value="office_invoices">فواتير ضريبية للمكاتب</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handlePrintByFilter}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-black hover:bg-emerald-800 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة حسب الفلتر
            </button>
          </div>
          <div className="mt-3 text-xs text-emerald-800/80">
            الطباعة تعتمد على المكتب والحالة والفترة المختارة بالأعلى، والفواتير تطبع بشعار المنصة وألوانها الرسمية.
          </div>
        </div>
        {(filterOffice !== "all" || filterStatus !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => { setFilterOffice("all"); setFilterStatus("all"); setDateFrom(""); setDateTo(""); }}
            className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> مسح الفلاتر
          </button>
        )}
      </div>

      {/* بطاقات الملخص المالي */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "عدد الحجوزات",     value: summary.totalRows,                                                    from: "from-gray-500",    to: "to-gray-700",    Icon: CalendarCheck, suffix: "" },
            { label: "إجمالي المبيعات",  value: summary.totalBookingAmount.toLocaleString("ar-SA"),                   from: "from-blue-500",    to: "to-blue-700",    Icon: Banknote,      suffix: "ر.س" },
            { label: "إجمالي العمولات",  value: summary.totalCommission.toLocaleString("ar-SA"),                      from: "from-amber-500",   to: "to-amber-700",   Icon: Percent,       suffix: "ر.س" },
            { label: "عمولات مسوّاة",    value: summary.settledCommission.toLocaleString("ar-SA"),                    from: "from-emerald-500", to: "to-emerald-700", Icon: CheckCircle,   suffix: "ر.س" },
            { label: "صافي المكاتب",     value: summary.totalNet.toLocaleString("ar-SA"),                             from: "from-purple-500",  to: "to-purple-700",  Icon: DollarSign,    suffix: "ر.س" },
          ].map(({ label, value, from, to, Icon, suffix }, i) => (
            <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-4 text-white`}>
              <Icon className="w-5 h-5 text-white/60 mb-2" strokeWidth={1.5} />
              <div className="text-lg font-black leading-tight">{value}</div>
              <div className="text-white/70 text-xs mt-0.5">{label}</div>
              {suffix && <div className="text-white/50 text-xs">{suffix}</div>}
            </div>
          ))}
        </div>
      )}

      {/* جدول الكشف */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            تفاصيل الكشف ({rows.length} حجز)
          </h3>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-gray-100">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <div className="text-xs font-bold text-blue-500 mb-1">إجمالي ما دفعه المعتمرون</div>
              <div className="text-2xl font-black text-blue-800">{(summary.totalPilgrimAmount ?? summary.totalBookingAmount).toLocaleString("ar-SA")} ر.س</div>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="text-xs font-bold text-amber-600 mb-1">مصاريف تشغيل وخدمات المعتمرين</div>
              <div className="text-2xl font-black text-amber-800">{(summary.totalPassengerFees ?? 0).toLocaleString("ar-SA")} ر.س</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="text-xs font-bold text-emerald-600 mb-1">إجمالي إيراد المنصة</div>
              <div className="text-2xl font-black text-emerald-800">{(summary.totalPlatformRevenue ?? summary.totalCommission).toLocaleString("ar-SA")} ر.س</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 md:col-span-3">
              <div className="text-xs font-bold text-slate-600 mb-1">ضريبة القيمة المضافة المرتبطة بالكشف</div>
              <div className="text-2xl font-black text-slate-800">{totalVatFallback.toLocaleString("ar-SA")} ر.س</div>
              <div className="text-xs text-slate-400 mt-1">تشمل ضريبة فواتير المكاتب وضريبة فواتير إيراد المنصة</div>
            </div>
          </div>
        )}

        {bookings === undefined ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">لا توجد بيانات للفترة المحددة</p>
            <p className="text-gray-300 text-sm mt-1">جرّب تغيير الفلاتر أو توسيع نطاق التاريخ</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-l from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">رقم الحجز</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">المكتب</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">المسافر</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">البرنامج</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">حالة الحجز</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">قيمة الحجز</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">نسبة العمولة</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-emerald-700 whitespace-nowrap">العمولة</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 whitespace-nowrap">صافي المكتب</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">حالة العمولة</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 whitespace-nowrap">الفواتير الضريبية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r: any, i: number) => {
                    const bst  = BOOKING_STATUS[r.bookingStatus] ?? { label: r.bookingStatus, cls: "bg-gray-100 text-gray-600" };
                    const cst  = COMM_STATUS[r.commissionStatus] ?? { label: r.commissionStatus, cls: "bg-gray-100 text-gray-600" };
                    const isExpanded = expandedBookingId === r.bookingId;
                    const passengers = bookingPassengers(r);
                    return (
                      <Fragment key={r.bookingId}>
                      <tr className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedBookingId(isExpanded ? null : r.bookingId)}
                            className="font-mono text-xs text-emerald-700 font-bold underline decoration-dotted underline-offset-4 hover:text-emerald-900"
                          >
                            {r.bookingRef}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800 text-xs">{r.officeName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800 text-xs">{r.passengerName}</div>
                          <div className="text-gray-400 text-xs">{r.passengerCount ?? r.adultsCount} راكب داخل الحجز</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600 text-xs line-clamp-1 max-w-[120px] block">{r.packageTitle}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(r.bookingDate).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bst.cls}`}>{bst.label}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800 text-sm whitespace-nowrap">
                          {r.bookingAmount.toLocaleString("ar-SA")} ر.س
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                            {r.commissionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-emerald-700 text-sm whitespace-nowrap">
                          {r.commissionAmount.toLocaleString("ar-SA")} ر.س
                        </td>
                        <td className="px-4 py-3 font-black text-blue-700 text-sm whitespace-nowrap">
                          {r.netAmount.toLocaleString("ar-SA")} ر.س
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cst.cls}`}>{cst.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button onClick={() => handlePlatformTaxInvoice(r)} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
                              المنصة
                            </button>
                            <button onClick={() => handleOfficeTaxInvoice(r)} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">
                              المكتب
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-emerald-50/40">
                          <td colSpan={13} className="px-5 py-4">
                            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <div>
                                  <div className="font-black text-gray-800 text-sm">تفاصيل المعتمرين داخل الحجز {r.bookingRef}</div>
                                  <div className="text-xs text-gray-400 mt-1">عدد المعتمرين: {bookingPassengerCount(r)} - إجمالي الحجز: {bookingGross(r).toLocaleString("ar-SA")} ر.س</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleOfficeTaxInvoice(r)} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">
                                    طباعة فاتورة مجمعة
                                  </button>
                                  <button onClick={() => handlePlatformTaxInvoice(r)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                                    فاتورة المنصة
                                  </button>
                                </div>
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
                                      <tr key={`${r.bookingId}-${pIndex}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-400">{pIndex + 1}</td>
                                        <td className="px-3 py-2 font-bold text-gray-800">{p.name}</td>
                                        <td className="px-3 py-2 text-gray-600">{p.type}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.phone}</td>
                                        <td className="px-3 py-2 text-gray-500">{p.idNumber}</td>
                                        <td className="px-3 py-2 font-bold text-gray-800">{p.amount.toLocaleString("ar-SA")} ر.س</td>
                                        <td className="px-3 py-2 text-gray-400">{p.note}</td>
                                        <td className="px-3 py-2">
                                          <button onClick={() => handlePassengerTaxInvoice(r, p, pIndex)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">
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
                {/* صف الإجماليات */}
                {summary && (
                  <tfoot>
                    <tr className="bg-gradient-to-l from-emerald-50 to-teal-50 border-t-2 border-emerald-200">
                      <td colSpan={7} className="px-4 py-3 font-black text-emerald-800 text-sm">
                        الإجمالي ({summary.totalRows} حجز)
                      </td>
                      <td className="px-4 py-3 font-black text-gray-900 text-sm whitespace-nowrap">
                        {summary.totalBookingAmount.toLocaleString("ar-SA")} ر.س
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 font-black text-emerald-700 text-sm whitespace-nowrap">
                        {summary.totalCommission.toLocaleString("ar-SA")} ر.س
                      </td>
                      <td className="px-4 py-3 font-black text-blue-700 text-sm whitespace-nowrap">
                        {summary.totalNet.toLocaleString("ar-SA")} ر.س
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {rows.map((r: any, i: number) => {
                const bst = BOOKING_STATUS[r.bookingStatus] ?? { label: r.bookingStatus, cls: "bg-gray-100 text-gray-600" };
                const cst = COMM_STATUS[r.commissionStatus] ?? { label: r.commissionStatus, cls: "bg-gray-100 text-gray-600" };
                const isExpanded = expandedBookingId === r.bookingId;
                const passengers = bookingPassengers(r);
                return (
                  <div key={r.bookingId} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button onClick={() => setExpandedBookingId(isExpanded ? null : r.bookingId)} className="font-mono text-xs text-emerald-700 font-bold underline decoration-dotted underline-offset-4">
                          {r.bookingRef}
                        </button>
                        <div className="font-bold text-gray-800 text-sm mt-0.5">{r.passengerName}</div>
                        <div className="text-xs text-gray-400">{bookingPassengerCount(r)} راكب داخل الحجز</div>
                        <div className="text-xs text-gray-400">{r.officeName} • {new Date(r.bookingDate).toLocaleDateString("ar-SA")}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bst.cls}`}>{bst.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cst.cls}`}>{cst.label}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-0.5">قيمة الحجز</div>
                        <div className="font-bold text-gray-800 text-xs">{r.bookingAmount.toLocaleString("ar-SA")}</div>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <div className="text-xs text-gray-400 mb-0.5">العمولة ({r.commissionRate}%)</div>
                        <div className="font-black text-emerald-700 text-xs">{r.commissionAmount.toLocaleString("ar-SA")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-0.5">صافي المكتب</div>
                        <div className="font-black text-blue-700 text-xs">{r.netAmount.toLocaleString("ar-SA")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePlatformTaxInvoice(r)} className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                        فاتورة المنصة
                      </button>
                      <button onClick={() => handleOfficeTaxInvoice(r)} className="flex-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
                        فاتورة المكتب
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black text-gray-800 text-sm">تفاصيل المعتمرين</div>
                          <button onClick={() => handleOfficeTaxInvoice(r)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
                            فاتورة مجمعة
                          </button>
                        </div>
                        {passengers.map((p, pIndex) => (
                          <div key={`${r.bookingId}-mobile-${pIndex}`} className="rounded-xl bg-white border border-gray-100 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-gray-800 text-sm">{pIndex + 1}. {p.name}</div>
                                <div className="text-xs text-gray-400">{p.type} - {p.note}</div>
                                <div className="text-xs text-gray-400 mt-1">الجوال: {p.phone} - الهوية: {p.idNumber}</div>
                              </div>
                              <div className="text-left">
                                <div className="font-black text-gray-800 text-sm">{p.amount.toLocaleString("ar-SA")} ر.س</div>
                                <button onClick={() => handlePassengerTaxInvoice(r, p, pIndex)} className="mt-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                                  فاتورة منفصلة
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ملخص مالي تفصيلي */}
      {summary && rows.length > 0 && (
        <div className="bg-gradient-to-l from-emerald-900 to-emerald-700 rounded-2xl p-6 text-white">
          <h3 className="font-black text-lg mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-300" />
            الملخص المالي للكشف
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "إجمالي المبيعات",    value: summary.totalBookingAmount,  color: "text-white",         bg: "bg-white/10" },
              { label: "إجمالي العمولات",    value: summary.totalCommission,     color: "text-amber-300",     bg: "bg-amber-500/20" },
              { label: "عمولات مسوّاة",      value: summary.settledCommission,   color: "text-emerald-300",   bg: "bg-emerald-500/20" },
              { label: "عمولات معلقة",       value: summary.pendingCommission,   color: "text-orange-300",    bg: "bg-orange-500/20" },
              { label: "صافي المكاتب الكلي", value: summary.totalNet,            color: "text-blue-300",      bg: "bg-blue-500/20" },
              { label: "عدد الحجوزات",       value: summary.totalRows,           color: "text-purple-300",    bg: "bg-purple-500/20", isCount: true },
            ].map(({ label, value, color, bg, isCount }, i) => (
              <div key={i} className={`${bg} rounded-xl p-4`}>
                <div className={`text-2xl font-black ${color}`}>
                  {isCount ? value : `${(value as number).toLocaleString("ar-SA")} ر.س`}
                </div>
                <div className="text-white/70 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Admin Support Tab ── */
function AdminSupportTab() {
  const chats       = useQuery(api.support.getAllChats);
  const stats       = useQuery(api.support.getSupportStats);
  const sendMsg     = useMutation(api.support.sendMessage);
  const closeChat   = useMutation(api.support.closeChat);
  const reopenChat  = useMutation(api.support.reopenChat);
  const markRead    = useMutation(api.support.markAsRead);

  const [selectedChatId, setSelectedChatId] = useState<Id<"supportChats"> | null>(null);
  const [msgText, setMsgText]               = useState("");
  const [sending, setSending]               = useState(false);
  const [filter, setFilter]                 = useState<"all" | "open" | "closed">("open");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.support.getMessages,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // تمرير تلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // تعليم كمقروء عند فتح محادثة
  useEffect(() => {
    if (selectedChatId) {
      markRead({ chatId: selectedChatId }).catch(() => {});
    }
  }, [selectedChatId, messages?.length]);

  const filteredChats = (chats ?? []).filter((c) =>
    filter === "all" ? true : c.status === filter
  );

  const selectedChat = (chats ?? []).find((c) => c._id === selectedChatId);

  const handleSend = async () => {
    if (!msgText.trim() || !selectedChatId) return;
    setSending(true);
    try {
      await sendMsg({ chatId: selectedChatId, text: msgText.trim() });
      setMsgText("");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (chatId: Id<"supportChats">) => {
    try {
      await closeChat({ chatId });
      toast.success("تم إغلاق المحادثة");
    } catch { toast.error("حدث خطأ"); }
  };

  const handleReopen = async (chatId: Id<"supportChats">) => {
    try {
      await reopenChat({ chatId });
      toast.success("تم إعادة فتح المحادثة");
    } catch { toast.error("حدث خطأ"); }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي المحادثات", value: stats.total,  from: "from-blue-500",    to: "to-blue-700",    Icon: MessageCircle },
            { label: "محادثات مفتوحة",   value: stats.open,   from: "from-emerald-500", to: "to-emerald-700", Icon: Circle },
            { label: "محادثات مغلقة",    value: stats.closed, from: "from-gray-500",    to: "to-gray-700",    Icon: XCircle },
            { label: "رسائل غير مقروءة", value: stats.unread, from: "from-red-500",     to: "to-red-700",     Icon: Headphones },
          ].map(({ label, value, from, to, Icon }, i) => (
            <div key={i} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
              <Icon className="w-6 h-6 text-white/60 mb-2" strokeWidth={1.5} />
              <div className="text-3xl font-black">{value}</div>
              <div className="text-white/80 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* واجهة المحادثات */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">

          {/* قائمة المحادثات */}
          <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col">
            {/* رأس القائمة */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Headphones className="w-4 h-4 text-emerald-600" />
                محادثات الدعم
              </h3>
              <div className="flex gap-1">
                {(["open", "closed", "all"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      filter === f
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {f === "open" ? "مفتوحة" : f === "closed" ? "مغلقة" : "الكل"}
                  </button>
                ))}
              </div>
            </div>

            {/* قائمة */}
            <div className="flex-1 overflow-y-auto">
              {chats === undefined ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">لا توجد محادثات</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => setSelectedChatId(chat._id as Id<"supportChats">)}
                    className={`w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedChatId === chat._id ? "bg-emerald-50 border-r-2 border-r-emerald-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <UserCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 text-sm truncate">{chat.userName}</span>
                          {(chat.unreadByAdmin ?? 0) > 0 && (
                            <span className="bg-red-500 text-white text-xs font-black rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                              {chat.unreadByAdmin}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{chat.lastMessage ?? "لا توجد رسائل بعد"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          chat.status === "open"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {chat.status === "open" ? "مفتوح" : "مغلق"}
                        </span>
                        {chat.lastMessageAt && (
                          <span className="text-xs text-gray-300">{formatTime(chat.lastMessageAt)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* منطقة المحادثة */}
          <div className="flex-1 flex flex-col">
            {!selectedChatId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-10 h-10 text-emerald-300" />
                  </div>
                  <h3 className="text-gray-500 font-semibold">اختر محادثة للرد</h3>
                  <p className="text-gray-300 text-sm mt-1">اضغط على أي محادثة من القائمة</p>
                </div>
              </div>
            ) : (
              <>
                {/* رأس المحادثة */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{selectedChat?.userName ?? "مستخدم"}</div>
                      <div className="text-xs text-gray-400">{selectedChat?.userEmail ?? ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      selectedChat?.status === "open"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {selectedChat?.status === "open" ? "مفتوح" : "مغلق"}
                    </span>
                    {selectedChat?.status === "open" ? (
                      <button
                        onClick={() => handleClose(selectedChatId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        إغلاق
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopen(selectedChatId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        إعادة فتح
                      </button>
                    )}
                  </div>
                </div>

                {/* الرسائل */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {messages === undefined ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">لا توجد رسائل بعد</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${msg.isAdmin ? "order-2" : ""}`}>
                          {msg.isAdmin && (
                            <div className="flex items-center gap-1 mb-1 ms-1">
                              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-xs text-gray-400 font-semibold">الإدارة</span>
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.isAdmin
                              ? "bg-white border border-gray-200 text-gray-800 rounded-tr-sm shadow-sm"
                              : "bg-emerald-600 text-white rounded-tl-sm shadow-sm"
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${msg.isAdmin ? "justify-start ms-1" : "justify-end me-1"}`}>
                            <span className="text-xs text-gray-300">
                              {new Date(msg.sentAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!msg.isAdmin && (
                              msg.isRead
                                ? <CheckCheck className="w-3 h-3 text-emerald-400" />
                                : <CheckCheck className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* حقل الإرسال */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  {selectedChat?.status === "closed" ? (
                    <div className="text-center py-3">
                      <p className="text-gray-400 text-sm">هذه المحادثة مغلقة</p>
                      <button
                        onClick={() => handleReopen(selectedChatId)}
                        className="mt-2 text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-1 mx-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        إعادة فتح المحادثة
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-3">
                      <textarea
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="اكتب ردك هنا... (Enter للإرسال)"
                        rows={2}
                        className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        dir="rtl"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!msgText.trim() || sending}
                        className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        {sending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== AI Settings Tab ====================
function AISettingsTab() {
  const settings = useQuery(api.aiSettings.getAll);
  const quickQuestions = useQuery(api.aiSettings.getQuickQuestions);
  const recommendations = useQuery(api.aiSettings.getRecommendations);
  const upsert = useMutation(api.aiSettings.upsert);
  const resetToDefault = useMutation(api.aiSettings.resetToDefault);

  // System Prompt
  const [systemPrompt, setSystemPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);

  // Welcome Message
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [editingWelcome, setEditingWelcome] = useState(false);

  // Personality
  const [personality, setPersonality] = useState("");
  const [editingPersonality, setEditingPersonality] = useState(false);

  // Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [editingKnowledge, setEditingKnowledge] = useState(false);

  // Quick Questions
  const [newQuestion, setNewQuestion] = useState("");
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);
  const [editingQText, setEditingQText] = useState("");

  // Recommendations
  const [newRecTitle, setNewRecTitle] = useState("");
  const [newRecText, setNewRecText] = useState("");
  const [editingRecIndex, setEditingRecIndex] = useState<number | null>(null);
  const [editingRecTitle, setEditingRecTitle] = useState("");
  const [editingRecText, setEditingRecText] = useState("");

  // Max Response Length
  const [maxLength, setMaxLength] = useState("200");
  const [editingMaxLength, setEditingMaxLength] = useState(false);

  // Sync state from DB
  useEffect(() => {
    if (settings) {
      setSystemPrompt(settings.system_prompt ?? "");
      setWelcomeMsg(settings.welcome_message ?? "");
      setPersonality(settings.ai_personality ?? "");
      setKnowledgeBase(settings.knowledge_base ?? "");
      setMaxLength(settings.max_response_length ?? "200");
    }
  }, [settings]);

  const save = async (key: string, value: string, label: string) => {
    try {
      await upsert({ key, value });
      toast.success(`تم حفظ ${label} بنجاح ✅`);
    } catch (e) {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  const reset = async (key: string, label: string) => {
    try {
      await resetToDefault({ key });
      toast.success(`تم إعادة تعيين ${label} للقيمة الافتراضية`);
    } catch (e) {
      toast.error("حدث خطأ");
    }
  };

  // Quick Questions handlers
  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    const current = quickQuestions ?? [];
    const updated = [...current, newQuestion.trim()];
    await save("quick_questions", JSON.stringify(updated), "الأسئلة السريعة");
    setNewQuestion("");
  };

  const deleteQuestion = async (idx: number) => {
    const current = quickQuestions ?? [];
    const updated = current.filter((_, i) => i !== idx);
    await save("quick_questions", JSON.stringify(updated), "الأسئلة السريعة");
  };

  const saveEditQuestion = async (idx: number) => {
    if (!editingQText.trim()) return;
    const current = quickQuestions ?? [];
    const updated = current.map((q, i) => (i === idx ? editingQText.trim() : q));
    await save("quick_questions", JSON.stringify(updated), "الأسئلة السريعة");
    setEditingQIndex(null);
    setEditingQText("");
  };

  // Recommendations handlers
  const addRecommendation = async () => {
    if (!newRecTitle.trim() || !newRecText.trim()) return;
    const current = recommendations ?? [];
    const updated = [...current, { title: newRecTitle.trim(), text: newRecText.trim() }];
    await save("recommendations", JSON.stringify(updated), "التوصيات");
    setNewRecTitle("");
    setNewRecText("");
  };

  const deleteRecommendation = async (idx: number) => {
    const current = recommendations ?? [];
    const updated = current.filter((_, i) => i !== idx);
    await save("recommendations", JSON.stringify(updated), "التوصيات");
  };

  const saveEditRecommendation = async (idx: number) => {
    if (!editingRecTitle.trim() || !editingRecText.trim()) return;
    const current = recommendations ?? [];
    const updated = current.map((r, i) =>
      i === idx ? { title: editingRecTitle.trim(), text: editingRecText.trim() } : r
    );
    await save("recommendations", JSON.stringify(updated), "التوصيات");
    setEditingRecIndex(null);
  };

  if (!settings) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black">إعدادات المساعد الذكي</h2>
            <p className="text-purple-200 text-sm">تحكم كامل في شخصية وسلوك ومعرفة المساعد</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <HelpCircle className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">{quickQuestions?.length ?? 0}</div>
            <div className="text-xs text-purple-200">سؤال سريع</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Star className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">{recommendations?.length ?? 0}</div>
            <div className="text-xs text-purple-200">توصية</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">{maxLength}</div>
            <div className="text-xs text-purple-200">حد الرد</div>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">الأوامر الأساسية للمساعد</h3>
              <p className="text-xs text-gray-500">يحدد شخصية ومهام المساعد الذكي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reset("system_prompt", "الأوامر الأساسية")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3 h-3" /> إعادة تعيين
            </button>
            {!editingPrompt ? (
              <button
                onClick={() => setEditingPrompt(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPrompt(false)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-3 h-3" /> إلغاء
                </button>
                <button
                  onClick={async () => { await save("system_prompt", systemPrompt, "الأوامر الأساسية"); setEditingPrompt(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <Save className="w-3 h-3" /> حفظ
                </button>
              </div>
            )}
          </div>
        </div>
        {editingPrompt ? (
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono"
            dir="rtl"
          />
        ) : (
          <pre className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100">
            {systemPrompt}
          </pre>
        )}
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">رسالة الترحيب</h3>
              <p className="text-xs text-gray-500">أول رسالة يراها المستخدم عند فتح المساعد</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reset("welcome_message", "رسالة الترحيب")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3 h-3" /> إعادة تعيين
            </button>
            {!editingWelcome ? (
              <button
                onClick={() => setEditingWelcome(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingWelcome(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <X className="w-3 h-3" /> إلغاء
                </button>
                <button
                  onClick={async () => { await save("welcome_message", welcomeMsg, "رسالة الترحيب"); setEditingWelcome(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  <Save className="w-3 h-3" /> حفظ
                </button>
              </div>
            )}
          </div>
        </div>
        {editingWelcome ? (
          <textarea
            value={welcomeMsg}
            onChange={(e) => setWelcomeMsg(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"
            dir="rtl"
          />
        ) : (
          <pre className="bg-emerald-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed border border-emerald-100">
            {welcomeMsg}
          </pre>
        )}
      </div>

      {/* Personality + Max Length */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personality */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">شخصية المساعد</h3>
                <p className="text-xs text-gray-500">أسلوب التحدث والتعامل</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => reset("ai_personality", "الشخصية")} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {!editingPersonality ? (
                <button onClick={() => setEditingPersonality(true)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setEditingPersonality(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { await save("ai_personality", personality, "الشخصية"); setEditingPersonality(false); }} className="p-1.5 text-white bg-amber-500 rounded-lg hover:bg-amber-600"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
          {editingPersonality ? (
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none"
              dir="rtl"
            />
          ) : (
            <p className="bg-amber-50 rounded-xl p-3 text-sm text-gray-700 border border-amber-100 leading-relaxed">{personality}</p>
          )}
        </div>

        {/* Max Response Length */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlignLeft className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">حد طول الرد</h3>
                <p className="text-xs text-gray-500">الحد الأقصى لعدد الكلمات في كل رد</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => reset("max_response_length", "حد الرد")} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {!editingMaxLength ? (
                <button onClick={() => setEditingMaxLength(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setEditingMaxLength(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { await save("max_response_length", maxLength, "حد الرد"); setEditingMaxLength(false); }} className="p-1.5 text-white bg-blue-500 rounded-lg hover:bg-blue-600"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
          {editingMaxLength ? (
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
              min={50}
              max={1000}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              dir="ltr"
            />
          ) : (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
              <span className="text-3xl font-black text-blue-600">{maxLength}</span>
              <p className="text-xs text-gray-500 mt-1">كلمة كحد أقصى</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {["100", "200", "300", "500"].map((v) => (
              <button
                key={v}
                onClick={() => setMaxLength(v)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${maxLength === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Knowledge Base */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">قاعدة المعرفة</h3>
              <p className="text-xs text-gray-500">المعلومات التي يستند إليها المساعد في إجاباته</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => reset("knowledge_base", "قاعدة المعرفة")} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RotateCw className="w-3 h-3" /> إعادة تعيين
            </button>
            {!editingKnowledge ? (
              <button onClick={() => setEditingKnowledge(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                <Edit3 className="w-3 h-3" /> تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingKnowledge(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <X className="w-3 h-3" /> إلغاء
                </button>
                <button onClick={async () => { await save("knowledge_base", knowledgeBase, "قاعدة المعرفة"); setEditingKnowledge(false); }} className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-teal-600 rounded-lg hover:bg-teal-700">
                  <Save className="w-3 h-3" /> حفظ
                </button>
              </div>
            )}
          </div>
        </div>
        {editingKnowledge ? (
          <textarea
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border-2 border-teal-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none font-mono"
            dir="rtl"
          />
        ) : (
          <pre className="bg-teal-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed border border-teal-100 max-h-64 overflow-y-auto">
            {knowledgeBase}
          </pre>
        )}
      </div>

      {/* Quick Questions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">الأسئلة السريعة</h3>
            <p className="text-xs text-gray-500">تظهر كأزرار سريعة في واجهة المساعد</p>
          </div>
        </div>

        {/* Add new question */}
        <div className="flex gap-2 mb-4">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
            placeholder="اكتب سؤالاً جديداً..."
            className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
            dir="rtl"
          />
          <button
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>

        {/* Questions list */}
        <div className="space-y-2">
          {(quickQuestions ?? []).map((q, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <span className="w-6 h-6 bg-purple-200 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                {idx + 1}
              </span>
              {editingQIndex === idx ? (
                <>
                  <input
                    value={editingQText}
                    onChange={(e) => setEditingQText(e.target.value)}
                    className="flex-1 px-3 py-1.5 border-2 border-purple-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                    dir="rtl"
                    autoFocus
                  />
                  <button onClick={() => saveEditQuestion(idx)} className="p-1.5 text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingQIndex(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">{q}</span>
                  <button onClick={() => { setEditingQIndex(idx); setEditingQText(q); }} className="p-1.5 text-purple-500 hover:bg-purple-100 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteQuestion(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {(quickQuestions ?? []).length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              لا توجد أسئلة سريعة بعد
            </div>
          )}
        </div>
        <button
          onClick={() => reset("quick_questions", "الأسئلة السريعة")}
          className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <RotateCw className="w-3 h-3" /> إعادة تعيين للأسئلة الافتراضية
        </button>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">التوصيات الذكية</h3>
            <p className="text-xs text-gray-500">توصيات يقدمها المساعد بناءً على نوع المعتمر</p>
          </div>
        </div>

        {/* Add new recommendation */}
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 mb-4">
          <p className="text-xs font-medium text-rose-700 mb-3">إضافة توصية جديدة</p>
          <div className="flex gap-2 mb-2">
            <input
              value={newRecTitle}
              onChange={(e) => setNewRecTitle(e.target.value)}
              placeholder="العنوان (مثال: للعائلات)"
              className="flex-1 px-3 py-2 border-2 border-rose-200 rounded-lg text-sm focus:outline-none focus:border-rose-400"
              dir="rtl"
            />
          </div>
          <div className="flex gap-2">
            <input
              value={newRecText}
              onChange={(e) => setNewRecText(e.target.value)}
              placeholder="نص التوصية..."
              className="flex-1 px-3 py-2 border-2 border-rose-200 rounded-lg text-sm focus:outline-none focus:border-rose-400"
              dir="rtl"
            />
            <button
              onClick={addRecommendation}
              disabled={!newRecTitle.trim() || !newRecText.trim()}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
        </div>

        {/* Recommendations list */}
        <div className="space-y-3">
          {(recommendations ?? []).map((rec, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              {editingRecIndex === idx ? (
                <div className="space-y-2">
                  <input
                    value={editingRecTitle}
                    onChange={(e) => setEditingRecTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-rose-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 font-bold"
                    dir="rtl"
                    placeholder="العنوان"
                  />
                  <input
                    value={editingRecText}
                    onChange={(e) => setEditingRecText(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-rose-300 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                    dir="rtl"
                    placeholder="النص"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingRecIndex(null)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
                    <button onClick={() => saveEditRecommendation(idx)} className="px-3 py-1.5 text-xs text-white bg-rose-600 rounded-lg hover:bg-rose-700">حفظ</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full mb-1">{rec.title}</span>
                    <p className="text-sm text-gray-600">{rec.text}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingRecIndex(idx); setEditingRecTitle(rec.title); setEditingRecText(rec.text); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteRecommendation(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(recommendations ?? []).length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
              لا توجد توصيات بعد
            </div>
          )}
        </div>
        <button
          onClick={() => reset("recommendations", "التوصيات")}
          className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <RotateCw className="w-3 h-3" /> إعادة تعيين للتوصيات الافتراضية
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div>;
}
